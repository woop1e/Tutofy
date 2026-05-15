import apiClient from './client.js';

export const paymentsAPI = {
  createPayment: async (paymentData) => {
    const response = await apiClient.post('/payments', paymentData);
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  },

  getUserPayments: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/payments`);
    return response.data;
  },

  completePayment: async (id) => {
    const response = await apiClient.patch(`/payments/${id}/complete`);
    return response.data;
  },

  failPayment: async (id) => {
    const response = await apiClient.patch(`/payments/${id}/fail`);
    return response.data;
  },
};