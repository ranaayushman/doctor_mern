// src/services/doctorService.js
import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const doctorService = {
  getAll: (params) => api.get(API_ENDPOINTS.DOCTORS.GET_ALL, { params }),
  search: (params) => api.get(API_ENDPOINTS.DOCTORS.SEARCH, { params }),
  getById: (id) => api.get(API_ENDPOINTS.DOCTORS.GET_ONE(id)),
  getAvailability: (id, date) => api.get(API_ENDPOINTS.DOCTORS.AVAILABILITY(id), { params: { date } }),
  getReviews: (id) => api.get(API_ENDPOINTS.DOCTORS.REVIEWS(id)),
  addReview: (id, data) => api.post(API_ENDPOINTS.DOCTORS.ADD_REVIEW(id), data)
};
