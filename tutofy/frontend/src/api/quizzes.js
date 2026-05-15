import apiClient from './client.js';

export const quizzesAPI = {
  createQuiz: async (quizData) => {
    const response = await apiClient.post('/quizzes', quizData);
    return response.data;
  },

  addQuestion: async (quizId, questionData) => {
    const response = await apiClient.post(`/quizzes/${quizId}/questions`, questionData);
    return response.data;
  },

  addOption: async (questionId, optionData) => {
    const response = await apiClient.post(`/questions/${questionId}/options`, optionData);
    return response.data;
  },

  deleteQuiz: async (id) => {
    const response = await apiClient.delete(`/quizzes/${id}`);
    return response.data;
  },

  getCourseQuizzes: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}/quizzes`);
    return response.data;
  },

  getQuizForAttempt: async (quizId) => {
    const response = await apiClient.get(`/quizzes/${quizId}`);
    return response.data;
  },

  startQuizAttempt: async (quizId) => {
    const response = await apiClient.post(`/quizzes/${quizId}/attempts`);
    return response.data;
  },

  submitQuizAttempt: async (attemptId, answers) => {
    const response = await apiClient.post(`/attempts/${attemptId}/submit`, { answers });
    return response.data;
  },

  getQuizResult: async (attemptId) => {
    const response = await apiClient.get(`/attempts/${attemptId}/result`);
    return response.data;
  },

  getMyAttempts: async (quizId) => {
    const response = await apiClient.get(`/quizzes/${quizId}/my-attempts`);
    return response.data?.attempts_used ?? 0;
  },
};