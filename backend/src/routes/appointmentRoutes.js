/**
 * Appointment Routes
 * Book, reschedule, and manage appointments
 */

const express = require('express');
const {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  addAppointmentReview,
  getAppointmentStats,
} = require('../controllers/appointmentController');
const { protect, protectPatient, protectDoctor } = require('../middleware/auth');
const { validateAppointmentBooking } = require('../middleware/validators');

const router = express.Router();

// PATIENT ROUTES - Book and manage own appointments
router.post('/', protect, protectPatient, validateAppointmentBooking, bookAppointment);
router.get('/', protect, protectPatient, getPatientAppointments);
router.get('/my-appointments', protect, protectPatient, getPatientAppointments); // alias
router.get('/stats', protect, getAppointmentStats);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/reschedule', protect, protectPatient, rescheduleAppointment);
router.put('/:id/cancel', protect, cancelAppointment);
router.post('/:id/review', protect, protectPatient, addAppointmentReview);

// DOCTOR ROUTES - View and manage own appointments
router.get('/doctor/appointments', protect, protectDoctor, getDoctorAppointments);
router.get('/doctor-appointments', protect, protectDoctor, getDoctorAppointments); // alias
router.put('/:id/status', protect, protectDoctor, updateAppointmentStatus);

module.exports = router;
