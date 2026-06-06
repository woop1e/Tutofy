import apiClient from './client.js';

export const parentAPI = {
  inviteParent: async (parentEmail) => {
    const res = await apiClient.post('/parent/invite', { parent_email: parentEmail });
    return res.data;
  },

  getInviteInfo: async (token) => {
    const res = await apiClient.get('/parent/invite/info', { params: { token } });
    return res.data;
  },

  acceptInvite: async (token) => {
    const res = await apiClient.post('/parent/invite/accept', { token });
    return res.data;
  },

  getMyParents: async () => {
    const res = await apiClient.get('/parent/my-parents');
    return res.data;
  },

  getMyChildren: async () => {
    const res = await apiClient.get('/parent/my-children');
    return res.data;
  },

  removeLink: async (linkId) => {
    const res = await apiClient.delete(`/parent/links/${linkId}`);
    return res.data;
  },

  getChildOverview: async (studentId) => {
    const res = await apiClient.get(`/parent/children/${studentId}/overview`);
    return res.data;
  },
};
