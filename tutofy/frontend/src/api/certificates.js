import apiClient from './client.js';

export const certificatesAPI = {
  issueCertificate: async (studentId, courseId) => {
    const response = await apiClient.post('/certificates', { student_id: studentId, course_id: courseId });
    return response.data;
  },

  requestCertificate: async (courseId) => {
    const response = await apiClient.post('/certificates/request', { course_id: courseId });
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

  approveCertificate: async (certId) => {
    const response = await apiClient.patch(`/certificates/${certId}/approve`);
    return response.data;
  },

  rejectCertificate: async (certId) => {
    const response = await apiClient.patch(`/certificates/${certId}/reject`);
    return response.data;
  },

  getPendingCertificates: async () => {
    const response = await apiClient.get('/tutor/certificate-requests');
    return response.data;
  },
};
