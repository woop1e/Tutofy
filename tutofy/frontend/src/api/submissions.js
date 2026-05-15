import apiClient from './client.js';

export const submissionsAPI = {
  submitAssignment: async ({ assignment_id, content, file_id }) => {
    const response = await apiClient.post('/submissions', { assignment_id, content, file_id });
    return response.data;
  },

  getMySubmission: async (assignmentId) => {
    const response = await apiClient.get(`/submissions/${assignmentId}/me`);
    return response.data;
  },

  getSubmission: async (assignmentId, studentId) => {
    const response = await apiClient.get(`/submissions/${assignmentId}/${studentId}`);
    return response.data;
  },

  getAssignmentSubmissions: async (assignmentId) => {
    const response = await apiClient.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },
};