// src/services/prescriptionService.js
import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const prescriptionService = {
  create: (data) => api.post(API_ENDPOINTS.PRESCRIPTIONS.CREATE, data),
  getAll: (params) => api.get(API_ENDPOINTS.PRESCRIPTIONS.GET_ALL, { params }),
  getById: (id) => api.get(API_ENDPOINTS.PRESCRIPTIONS.GET_ONE(id)),
  update: (id, data) => api.patch(API_ENDPOINTS.PRESCRIPTIONS.UPDATE(id), data),
  delete: (id) => api.delete(API_ENDPOINTS.PRESCRIPTIONS.DELETE(id)),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(API_ENDPOINTS.PRESCRIPTIONS.UPLOAD_ATTACHMENT(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getAttachments: (id) => api.get(API_ENDPOINTS.PRESCRIPTIONS.GET_ATTACHMENTS(id)),
  deleteAttachment: (id, attachmentId) => api.delete(API_ENDPOINTS.PRESCRIPTIONS.DELETE_ATTACHMENT(id, attachmentId)),
  download: (id) => api.get(API_ENDPOINTS.PRESCRIPTIONS.DOWNLOAD(id), { responseType: 'blob' })
};
