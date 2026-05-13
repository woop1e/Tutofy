package handler

import (
	"context"
	"net/http"
	"sync"

	"course-service/proto/coursepb"
	"review-service/proto/reviewpb"
	"user-service/proto/userpb"
)

// TutorPublicProfileHandler aggregates user profile + published courses + rating.
type TutorPublicProfileHandler struct {
	userClient   userpb.UserServiceClient
	courseClient coursepb.CourseServiceClient
	reviewClient reviewpb.ReviewServiceClient
}

func NewTutorPublicProfileHandler(
	u userpb.UserServiceClient,
	c coursepb.CourseServiceClient,
	r reviewpb.ReviewServiceClient,
) *TutorPublicProfileHandler {
	return &TutorPublicProfileHandler{userClient: u, courseClient: c, reviewClient: r}
}

type tutorPublicProfile struct {
	Profile     *userpb.TutorProfileResponse `json:"profile"`
	Courses     []*coursepb.CourseResponse   `json:"courses"`
	AvgRating   float64                      `json:"avg_rating"`
	ReviewCount int64                        `json:"review_count"`
}

type tutorCard struct {
	*userpb.TutorProfileResponse
	AvgRating   float64 `json:"avg_rating"`
	ReviewCount int64   `json:"review_count"`
	MinPrice    float64 `json:"min_price"`
}

func (h *TutorPublicProfileHandler) GetTutorPublicProfile(w http.ResponseWriter, r *http.Request) {
	tutorID := r.PathValue("id")
	if tutorID == "" {
		jsonResp(w, http.StatusBadRequest, map[string]string{"error": "tutor id is required"})
		return
	}

	ctx := context.Background() // public endpoint

	profile, err := h.userClient.GetTutorProfile(ctx, &userpb.GetTutorProfileRequest{TutorId: tutorID})
	if err != nil {
		errResp(w, err)
		return
	}

	coursesResp, err := h.courseClient.SearchCourses(ctx, &coursepb.SearchCoursesRequest{TutorId: tutorID, Limit: 50})
	courses := []*coursepb.CourseResponse{}
	if err == nil && coursesResp != nil {
		courses = coursesResp.GetCourses()
	}

	// Aggregate rating across all published courses.
	avgRating, reviewCount := h.aggregateRating(ctx, courses)

	jsonResp(w, http.StatusOK, &tutorPublicProfile{
		Profile:     profile,
		Courses:     courses,
		AvgRating:   avgRating,
		ReviewCount: reviewCount,
	})
}

func (h *TutorPublicProfileHandler) SearchTutors(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	minRating := parseFloat64(q.Get("min_rating"))

	resp, err := h.userClient.SearchTutors(tokenCtx(r), &userpb.SearchTutorsRequest{
		Subject:  q.Get("subject"),
		Location: q.Get("location"),
		MinAge:   parseInt32(q.Get("min_age")),
		MaxAge:   parseInt32(q.Get("max_age")),
		Limit:    parseInt32(q.Get("limit")),
		Offset:   parseInt32(q.Get("offset")),
	})
	if err != nil {
		errResp(w, err)
		return
	}

	tutors := resp.GetTutors()
	ctx := tokenCtx(r)

	minPrice := parseFloat64(q.Get("min_price"))
	maxPrice := parseFloat64(q.Get("max_price"))

	// Enrich each tutor with rating and min_price in parallel.
	cards := make([]*tutorCard, len(tutors))
	var wg sync.WaitGroup
	for i, t := range tutors {
		wg.Add(1)
		go func(idx int, profile *userpb.TutorProfileResponse) {
			defer wg.Done()
			coursesResp, e := h.courseClient.SearchCourses(ctx, &coursepb.SearchCoursesRequest{TutorId: profile.GetId(), Limit: 50})
			var avg float64
			var count int64
			var minP float64
			if e == nil && coursesResp != nil {
				courses := coursesResp.GetCourses()
				avg, count = h.aggregateRating(ctx, courses)
				for _, c := range courses {
					p := c.GetPrice()
					if minP == 0 || p < minP {
						minP = p
					}
				}
			}
			cards[idx] = &tutorCard{TutorProfileResponse: profile, AvgRating: avg, ReviewCount: count, MinPrice: minP}
		}(i, t)
	}
	wg.Wait()

	// Apply filters: min_rating, min_price, max_price.
	filtered := cards[:0]
	for _, c := range cards {
		if minRating > 0 && c.AvgRating < minRating {
			continue
		}
		if minPrice > 0 && c.MinPrice < minPrice {
			continue
		}
		if maxPrice > 0 && c.MinPrice > maxPrice {
			continue
		}
		filtered = append(filtered, c)
	}
	cards = filtered

	jsonResp(w, http.StatusOK, map[string]any{"tutors": cards})
}

func (h *TutorPublicProfileHandler) SearchCourses(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	resp, err := h.courseClient.SearchCourses(tokenCtx(r), &coursepb.SearchCoursesRequest{
		TutorId:    q.Get("tutor_id"),
		Tag:        q.Get("tag"),
		CourseType: q.Get("course_type"),
	})
	if err != nil {
		errResp(w, err)
		return
	}
	jsonResp(w, http.StatusOK, resp)
}

// aggregateRating computes overall avg_rating and total review_count across courses.
func (h *TutorPublicProfileHandler) aggregateRating(ctx context.Context, courses []*coursepb.CourseResponse) (float64, int64) {
	if len(courses) == 0 {
		return 0, 0
	}
	type result struct {
		avg   float64
		count int64
	}
	results := make([]result, len(courses))
	var wg sync.WaitGroup
	for i, c := range courses {
		wg.Add(1)
		go func(idx int, courseID string) {
			defer wg.Done()
			r, err := h.reviewClient.GetCourseRating(ctx, &reviewpb.GetCourseRatingRequest{CourseId: courseID})
			if err == nil && r != nil {
				results[idx] = result{avg: r.GetAverage(), count: r.GetCount()}
			}
		}(i, c.GetId())
	}
	wg.Wait()

	var totalWeighted float64
	var totalCount int64
	for _, res := range results {
		totalWeighted += res.avg * float64(res.count)
		totalCount += res.count
	}
	if totalCount == 0 {
		return 0, 0
	}
	return totalWeighted / float64(totalCount), totalCount
}
