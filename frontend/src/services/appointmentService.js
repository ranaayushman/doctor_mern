// src/services/appointmentService.js
import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const appointmentService = {
  create: (data) => api.post(API_ENDPOINTS.APPOINTMENTS.CREATE, data),
  getMyAppointments: (params) => api.get(API_ENDPOINTS.APPOINTMENTS.GET_MY, { params }),
  getDoctorAppointments: (params) => api.get(API_ENDPOINTS.APPOINTMENTS.GET_DOCTOR, { params }),
  getById: (id) => api.get(API_ENDPOINTS.APPOINTMENTS.GET_ONE(id)),
  cancel: (id, data) => api.patch(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), data),
  reschedule: (id, data) => api.patch(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), data),
  updateStatus: (id, data) => api.patch(API_ENDPOINTS.APPOINTMENTS.UPDATE_STATUS(id), data),
  getAvailableSlots: (doctorId, date) => api.get(API_ENDPOINTS.APPOINTMENTS.AVAILABLE_SLOTS(doctorId), { params: { date } })
};

export const timeSlotService = {
  create: (data) => api.post(API_ENDPOINTS.TIMESLOTS.CREATE, data),
  getByDoctor: (doctorId) => api.get(API_ENDPOINTS.TIMESLOTS.GET_BY_DOCTOR(doctorId)),
  update: (id, data) => api.patch(API_ENDPOINTS.TIMESLOTS.UPDATE(id), data),
  delete: (id) => api.delete(API_ENDPOINTS.TIMESLOTS.DELETE(id))
};
