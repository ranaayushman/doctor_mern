// src/services/adminService.js
import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const adminService = {
  getDashboard: () => api.get(API_ENDPOINTS.ADMIN.DASHBOARD),
  
  users: {
    getAll: (params) => api.get(API_ENDPOINTS.ADMIN.USERS.GET_ALL, { params }),
    getById: (id) => api.get(API_ENDPOINTS.ADMIN.USERS.GET_ONE(id)),
    toggleStatus: (id, data) => api.patch(API_ENDPOINTS.ADMIN.USERS.TOGGLE_STATUS(id), data)
  },
  
  doctors: {
    getAll: (params) => api.get(API_ENDPOINTS.ADMIN.DOCTORS.GET_ALL, { params }),
    getAnalytics: (id) => api.get(API_ENDPOINTS.ADMIN.DOCTORS.ANALYTICS(id))
  },
  
  analytics: {
    appointments: (params) => api.get(API_ENDPOINTS.ADMIN.ANALYTICS.APPOINTMENTS, { params }),
    prescriptions: () => api.get(API_ENDPOINTS.ADMIN.ANALYTICS.PRESCRIPTIONS)
  },
  
  system: {
    health: () => api.get(API_ENDPOINTS.ADMIN.SYSTEM.HEALTH),
    alerts: () => api.get(API_ENDPOINTS.ADMIN.SYSTEM.ALERTS)
  },
  
  reports: {
    daily: () => api.get(API_ENDPOINTS.ADMIN.REPORTS.DAILY)
  }
};
