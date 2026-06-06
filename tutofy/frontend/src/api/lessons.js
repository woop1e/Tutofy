import apiClient from './client.js';

export const lessonsAPI = {
  createLesson: async (lessonData) => {
    const response = await apiClient.post('/lessons', lessonData);
    return response.data;
  },

  // Book a 1-on-1 individual lesson with a tutor (course_id omitted / null).
  bookLesson: async ({ tutor_id, student_id, title, scheduled_at, duration_minutes = 60, price = 0 }) => {
    const response = await apiClient.post('/lessons', {
      tutor_id,
      student_id,
      title,
      scheduled_at,
      duration_minutes,
      price,
      status: 1,
    });
    return response.data;
  },

  getLessonById: async (id) => {
    const response = await apiClient.get(`/lessons/${id}`);
    return response.data;
  },

  getCourseLessons: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}/lessons`);
    return response.data;
  },

  getLessonDescriptions: async (courseId) => {
    const response = await apiClient.get(`/courses/${courseId}/lesson-descriptions`);
    return response.data;
  },

  // Get individual (non-course) lessons for the authenticated student
  getStudentLessons: async (_studentId) => {
    const response = await apiClient.get('/my-lessons');
    return response.data;
  },

  // Get all individual lessons booked with the authenticated tutor
  getTutorIndividualLessons: async () => {
    const response = await apiClient.get('/tutor/individual-lessons');
    return response.data;
  },

  // Get booked hour-slots for a tutor (public, no auth needed)
  getTutorBookedSlots: async (tutorId) => {
    const response = await apiClient.get(`/tutors/${tutorId}/booked-slots`);
    return response.data;
  },

  updateLessonStatus: async (id, status) => {
    const response = await apiClient.patch(`/lessons/${id}/status`, { status });
    return response.data;
  },

  deleteLesson: async (id) => {
    const response = await apiClient.delete(`/lessons/${id}`);
    return response.data;
  },

  getSchedule: async (from, to) => {
    const response = await apiClient.get('/schedule', { params: { from, to } });
    return response.data;
  },

  setMeetingLink: async (id, videoLink) => {
    const response = await apiClient.patch(`/lessons/${id}/meeting-link`, { video_link: videoLink });
    return response.data;
  },

  // Book a 1-on-1 individual lesson — calls the dedicated booking endpoint.
  bookIndividualLesson: async ({ tutor_id, title, scheduled_at, duration_minutes = 60, price = 0 }) => {
    const response = await apiClient.post('/book-lesson', {
      tutor_id,
      title,
      scheduled_at,
      duration_minutes,
      price,
    });
    return response.data;
  },

  confirmLesson: async (id) => {
    const response = await apiClient.patch(`/lessons/${id}/confirm`);
    return response.data;
  },

  declineLesson: async (id) => {
    const response = await apiClient.patch(`/lessons/${id}/decline`);
    return response.data;
  },

  payForLesson: async (id, amount = 0) => {
    const response = await apiClient.post(`/lessons/${id}/pay`, { amount });
    return response.data;
  },

  getAttendance: async (lessonId) => {
    const response = await apiClient.get(`/lessons/${lessonId}/attendance`);
    return response.data;
  },

  markAttendance: async (lessonId, records) => {
    const response = await apiClient.post(`/lessons/${lessonId}/attendance`, { records });
    return response.data;
  },
  rateLesson: async (lessonId, rating) => {
    const response = await apiClient.post(`/lessons/${lessonId}/rate`, { rating });
    return response.data;
  },
};