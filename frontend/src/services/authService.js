// src/services/authService.js
import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const authService = {
  register: (data) => api.post(API_ENDPOINTS.AUTH.REGISTER, data),
  login: (email, password) => api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password }),
  getProfile: () => api.get(API_ENDPOINTS.AUTH.PROFILE),
  updateProfile: (data) => api.patch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data)
};

export const doctorAuthService = {
  register: (data) => api.post(API_ENDPOINTS.DOCTOR.REGISTER, data),
  login: (email, password) => api.post(API_ENDPOINTS.DOCTOR.LOGIN, { email, password }),
  getProfile: () => api.get(API_ENDPOINTS.DOCTOR.PROFILE),
  updateProfile: (data) => api.patch(API_ENDPOINTS.DOCTOR.UPDATE_PROFILE, data)
};
