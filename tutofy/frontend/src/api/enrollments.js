import apiClient from './client.js';

export const enrollmentsAPI = {
  enrollInCourse: async (courseId) => {
    const response = await apiClient.post('/enrollments', { course_id: courseId });
    return response.data;
  },

  unenrollFromCourse: async (userId, courseId) => {
    const response = await apiClient.delete('/enrollments', {
      data: { user_id: userId, course_id: courseId }
    });
    return response.data;
  },

  getUserEnrollments: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/enrollments`);
    return response.data;
  },

  getCourseEnrollments: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}/enrollments`);
    return response.data;
  },

  getEnrollmentCount: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}/enrollment-count`);
    return response.data.count || 0;
  },
};