// src/services/appointmentService.js
import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const appointmentService = {
  // Canonical names
  create: (data) => api.post(API_ENDPOINTS.APPOINTMENTS.CREATE, data),
  createAppointment: (data) => api.post(API_ENDPOINTS.APPOINTMENTS.CREATE, data),
  getMyAppointments: (params) => api.get(API_ENDPOINTS.APPOINTMENTS.GET_MY, { params }),
  getPatientAppointments: (params) => api.get(API_ENDPOINTS.APPOINTMENTS.GET_MY, { params }),
  getDoctorAppointments: (params) => api.get(API_ENDPOINTS.APPOINTMENTS.GET_DOCTOR, { params }),
  getById: (id) => api.get(API_ENDPOINTS.APPOINTMENTS.GET_ONE(id)),
  // cancel and reschedule use PUT
  cancel: (id, data) => api.put(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), data),
  cancelAppointment: (id, data) => api.put(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), data),
  reschedule: (id, data) => api.put(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), data),
  rescheduleAppointment: (id, data) => api.put(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), data),
  updateStatus: (id, data) => api.patch(API_ENDPOINTS.APPOINTMENTS.UPDATE_STATUS(id), data),
  getStats: () => api.get(API_ENDPOINTS.APPOINTMENTS.STATS)
};

export const timeSlotService = {
  create: (data) => api.post(API_ENDPOINTS.TIMESLOTS.CREATE, data),
  getAvailable: (doctorId, date) =>
    api.get(API_ENDPOINTS.TIMESLOTS.GET_AVAILABLE(doctorId), { params: date ? { date } : {} }),
  getAllForDoctor: (doctorId) => api.get(API_ENDPOINTS.TIMESLOTS.GET_ALL_FOR_DOCTOR(doctorId)),
  getStats: (doctorId) => api.get(API_ENDPOINTS.TIMESLOTS.GET_STATS(doctorId)),
  update: (id, data) => api.put(API_ENDPOINTS.TIMESLOTS.UPDATE(id), data),
  delete: (id) => api.delete(API_ENDPOINTS.TIMESLOTS.DELETE(id)),
  cancel: (id) => api.post(API_ENDPOINTS.TIMESLOTS.CANCEL(id)),
  bulkDelete: (ids) => api.post(API_ENDPOINTS.TIMESLOTS.BULK_DELETE, { slotIds: ids })
};
