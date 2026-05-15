import apiClient from './client.js';

export const messagingAPI = {
  sendMessage: async (messageData) => {
    const response = await apiClient.post('/messages', messageData);
    return response.data;
  },

  getConversations: async () => {
    const response = await apiClient.get('/conversations');
    return response.data;
  },

  getConversationMessages: async (userId) => {
    const response = await apiClient.get(`/conversations/${userId}`);
    return response.data;
  },

  getMyStudents: async () => {
    const response = await apiClient.get('/my-students');
    return response.data;
  },

  getMyTutors: async () => {
    const response = await apiClient.get('/my-tutors');
    return response.data;
  },

  getMyCoursemates: async () => {
    const response = await apiClient.get('/my-coursemates');
    return response.data;
  },
};