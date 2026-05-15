import apiClient from './client.js';

export const progressAPI = {
  getStudentCourseProgress: async (studentId, courseId) => {
    const response = await apiClient.get(`/progress/${studentId}/${courseId}`);
    return response.data;
  },

  getCourseProgress: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}/progress`);
    return response.data;
  },
};