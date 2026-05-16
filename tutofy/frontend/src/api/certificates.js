import apiClient from './client.js';

export const certificatesAPI = {
  issueCertificate: async (studentId, courseId) => {
    const response = await apiClient.post('/certificates', { student_id: studentId, course_id: courseId });
    return response.data;
  },

  getUserCertificates: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/certificates`);
    return response.data;
  },

  getCertificate: async (studentId, courseId) => {
    const response = await apiClient.get(`/certificates/${studentId}/${courseId}`);
    return response.data;
  },
};
