import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Course API calls
export const courseAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// Note API calls
export const noteAPI = {
  getAll: () => api.get('/notes'),
  getByCourse: (courseId) => api.get(`/courses/${courseId}/notes`),
  getById: (id) => api.get(`/notes/${id}`),
  create: (courseId, data, file) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.body) formData.append('body', data.body);
    if (file) formData.append('pdf', file);
    
    return api.post(`/courses/${courseId}/notes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  summarize: (id) => api.post(`/notes/${id}/summarize`),
  getPDF: (filename) => `${API_BASE_URL}/pdf/${filename}`,
};

export default api;
