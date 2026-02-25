// src/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default API_BASE_URL;

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile'
  },
  
  // Doctor Auth
  DOCTOR: {
    REGISTER: '/doctor-auth/register',
    LOGIN: '/doctor-auth/login',
    PROFILE: '/doctor-auth/profile',
    UPDATE_PROFILE: '/doctor-auth/profile'
  },
  
  // Doctor Management
  DOCTORS: {
    GET_ALL: '/doctors',
    SEARCH: '/doctors/search',
    SPECIALIZATIONS: '/doctors/specializations',
    SEARCH_BY_SPEC: (spec) => `/doctors/search/specialization/${spec}`,
    GET_ONE: (id) => `/doctors/${id}`,
    AVAILABILITY: (id) => `/doctors/${id}/availability`,
    REVIEWS: (id) => `/doctors/${id}/reviews`,
    ADD_REVIEW: (id) => `/doctors/${id}/reviews`
  },
  
  // Appointments
  APPOINTMENTS: {
    CREATE: '/appointments',
    GET_MY: '/appointments',
    GET_DOCTOR: '/appointments/doctor/appointments',
    GET_ONE: (id) => `/appointments/${id}`,
    CANCEL: (id) => `/appointments/${id}/cancel`,
    RESCHEDULE: (id) => `/appointments/${id}/reschedule`,
    UPDATE_STATUS: (id) => `/appointments/${id}/status`,
    STATS: '/appointments/stats'
  },
  
  // Time Slots
  TIMESLOTS: {
    CREATE: '/timeslots',
    GET_AVAILABLE: (doctorId) => `/timeslots/${doctorId}`,
    GET_ALL_FOR_DOCTOR: (doctorId) => `/timeslots/${doctorId}/all`,
    GET_STATS: (doctorId) => `/timeslots/${doctorId}/stats`,
    UPDATE: (id) => `/timeslots/${id}`,
    DELETE: (id) => `/timeslots/${id}`,
    CANCEL: (id) => `/timeslots/${id}/cancel`,
    BULK_DELETE: '/timeslots/bulk-delete'
  },
  
  // Prescriptions
  PRESCRIPTIONS: {
    CREATE: '/prescriptions',
    GET_ALL: '/prescriptions',
    GET_ONE: (id) => `/prescriptions/${id}`,
    UPDATE: (id) => `/prescriptions/${id}`,
    DELETE: (id) => `/prescriptions/${id}`,
    UPLOAD_ATTACHMENT: (id) => `/prescriptions/${id}/attachment`,
    GET_ATTACHMENTS: (id) => `/prescriptions/${id}/attachments`,
    DELETE_ATTACHMENT: (id, attachmentId) => `/prescriptions/${id}/attachment/${attachmentId}`,
    DOWNLOAD: (id) => `/prescriptions/${id}/download`
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard/stats',
    USERS: {
      GET_ALL: '/admin/users',
      GET_ONE: (id) => `/admin/users/${id}`,
      TOGGLE_STATUS: (id) => `/admin/users/${id}/status`
    },
    DOCTORS: {
      GET_ALL: '/admin/doctors',
      ANALYTICS: (id) => `/admin/doctors/${id}/analytics`
    },
    ANALYTICS: {
      APPOINTMENTS: '/admin/analytics/appointments',
      PRESCRIPTIONS: '/admin/analytics/prescriptions'
    },
    SYSTEM: {
      HEALTH: '/admin/system/health',
      ALERTS: '/admin/system/alerts'
    },
    REPORTS: {
      DAILY: '/admin/reports/daily'
    }
  }
};
