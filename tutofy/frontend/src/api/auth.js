import apiClient from './client.js';

export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email) => {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  getGoogleStatus: async () => {
    const response = await apiClient.get('/auth/google/status');
    return response.data;
  },

  exchangeGoogleCode: async (code, userId) => {
    const response = await apiClient.post('/auth/google/exchange', { code, user_id: userId });
    return response.data;
  },

  generateMeetLink: async (title, scheduledAt, durationMinutes) => {
    const response = await apiClient.post('/calendar/meet-link', {
      title,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes || 60,
    });
    return response.data;
  },
};
