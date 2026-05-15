import apiClient from './client.js';

export const gradingAPI = {
  submitGrade: async (gradeData) => {
    const response = await apiClient.post('/grades', gradeData);
    return response.data;
  },

  getStudentGrades: async (studentId) => {
    const response = await apiClient.get(`/students/${studentId}/grades`);
    return response.data;
  },

  getAssignmentGrades: async (assignmentId) => {
    const response = await apiClient.get(`/assignments/${assignmentId}/grades`);
    return response.data;
  },
};