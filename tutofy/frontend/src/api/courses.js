import apiClient from './client.js';

export const coursesAPI = {
  createCourse: async (courseData) => {
    const response = await apiClient.post('/courses', courseData);
    return response.data;
  },

  getAllCourses: async () => {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  getCourseById: async (id) => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },

  updateCourse: async (id, courseData) => {
    const response = await apiClient.put(`/courses/${id}`, courseData);
    return response.data;
  },

  publishCourse: async (id) => {
    const response = await apiClient.patch(`/courses/${id}/publish`);
    return response.data;
  },

  completeCourse: async (id) => {
    const response = await apiClient.patch(`/courses/${id}/complete`);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await apiClient.delete(`/courses/${id}`);
    return response.data;
  },

  searchCourses: async (params = {}) => {
    const response = await apiClient.get('/marketplace/courses', { params });
    return response.data;
  },
};