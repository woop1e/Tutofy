import apiClient from './client.js';

export const usersAPI = {
  getAllUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  searchTutors: async (params = {}) => {
    const response = await apiClient.get('/marketplace/tutors', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  updateTutorProfile: async (id, data) => {
    const response = await apiClient.put(`/users/${id}/profile`, data);
    return response.data;
  },

  getTutorProfile: async (id) => {
    const response = await apiClient.get(`/users/${id}/tutor-profile`);
    return response.data;
  },

  getPendingTutors: async () => {
    const response = await apiClient.get('/admin/pending-tutors');
    return response.data;
  },

  approveTutor: async (id) => {
    const response = await apiClient.patch(`/users/${id}/approve`);
    return response.data;
  },

  rejectTutor: async (id) => {
    const response = await apiClient.patch(`/users/${id}/reject`);
    return response.data;
  },

  // Tutor-scoped student profile (backend filters to tutor's data only)
  getStudentProfile: async (studentId) => {
    const response = await apiClient.get(`/tutor/students/${studentId}/profile`);
    return response.data;
  },
};
