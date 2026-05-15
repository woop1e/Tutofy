import apiClient from './client.js';

export const certificatesAPI = {
  getUserCertificates: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/certificates`);
    return response.data;
  },

  getCertificate: async (studentId, courseId) => {
    const response = await apiClient.get(`/certificates/${studentId}/${courseId}`);
    return response.data;
  },
};