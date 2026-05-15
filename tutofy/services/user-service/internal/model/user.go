package model

type User struct {
	ID    string
	Email string
	Name  string
	Role  string
}

type TutorProfile struct {
	ID               string
	Name             string
	Email            string
	Bio              string
	Age              int32
	Location         string
	PhotoURL         string
	Subjects         string // JSON-encoded []string
	ExperienceYears  int32
	Certificates     string // JSON-encoded []string
	Status           string // pending | approved | rejected
	Phone            string
	TeachingLanguage string
	StudentLevel     string // beginner | intermediate | advanced | all
	LessonType       string // individual | group | both
	HourlyPrice      int32
	Education        string
	AvailableDays    string // JSON-encoded []string
	AvailableTimeStart string
	AvailableTimeEnd   string
	Timezone         string
}
