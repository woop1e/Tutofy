import apiClient from './client.js';

export const assignmentsAPI = {
  createAssignment: async (assignmentData) => {
    const response = await apiClient.post('/assignments', assignmentData);
    return response.data;
  },

  getAssignmentById: async (id) => {
    const response = await apiClient.get(`/assignments/${id}`);
    return response.data;
  },

  getCourseAssignments: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}/assignments`);
    return response.data;
  },

  updateAssignment: async (id, assignmentData) => {
    const response = await apiClient.put(`/assignments/${id}`, assignmentData);
    return response.data;
  },

  deleteAssignment: async (id) => {
    const response = await apiClient.delete(`/assignments/${id}`);
    return response.data;
  },
};