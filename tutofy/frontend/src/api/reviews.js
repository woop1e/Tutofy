import apiClient from './client.js';

export const reviewsAPI = {
  submitReview: async (reviewData) => {
    const response = await apiClient.post('/reviews', reviewData);
    return response.data;
  },

  getCourseReviews: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}/reviews`);
    return response.data;
  },

  getCourseRating: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}/rating`);
    return response.data;
  },
};