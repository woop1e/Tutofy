import apiClient from './client.js';

// file_type values: 'assignment' (student file), 'course_material' (tutor), 'user_document' (certificates etc.)
export const mediaAPI = {
  uploadFile: async (file, courseId, fileType = 'course_material') => {
    const form = new FormData();
    form.append('file', file);
    if (courseId) form.append('course_id', courseId);
    form.append('file_type', String(fileType));
    const response = await apiClient.post('/media/upload', form, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  },

  getDownloadURL: async (id) => {
    const response = await apiClient.get(`/media/${id}/download`);
    return response.data;
  },

  downloadMedia: async (id) => {
    const response = await apiClient.get(`/media/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteMedia: async (id) => {
    const response = await apiClient.delete(`/media/${id}`);
    return response.data;
  },
};