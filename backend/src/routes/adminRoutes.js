const express = require('express');
const { protect, protectAdmin } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  getAllDoctors,
  getDoctorAnalytics,
  getAppointmentAnalytics,
  getPrescriptionAnalytics,
  getSystemHealth,
  getSystemAlerts,
  generateDailyReport
} = require('../controllers/adminController');

const router = express.Router();

// ============ MIDDLEWARE ============
// All admin routes require authentication and admin role
router.use(protect);
router.use(protectAdmin);

// ============ DASHBOARD ============

// Get dashboard statistics
router.get('/dashboard/stats', getDashboardStats);

// ============ USER MANAGEMENT ============

// Get all users
router.get('/users', getAllUsers);

// Get specific user details
router.get('/users/:userId', getUserDetails);

// Activate/Deactivate user
router.patch('/users/:userId/status', toggleUserStatus);

// ============ DOCTOR MANAGEMENT ============

// Get all doctors
router.get('/doctors', getAllDoctors);

// Get doctor performance analytics
router.get('/doctors/:doctorId/analytics', getDoctorAnalytics);

// ============ ANALYTICS ============

// Get appointment analytics
router.get('/analytics/appointments', getAppointmentAnalytics);

// Get prescription analytics
router.get('/analytics/prescriptions', getPrescriptionAnalytics);

// ============ SYSTEM MONITORING ============

// Get system health status
router.get('/system/health', getSystemHealth);

// Get system alerts
router.get('/system/alerts', getSystemAlerts);

// ============ REPORTS ============

// Generate daily report
router.get('/reports/daily', generateDailyReport);

module.exports = router;
