/**
 * Authentication Routes
 * User and Doctor registration and login endpoints
 */

const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateUserProfile,
  changePassword,
  forgotPassword,
  verifyEmail,
} = require('../controllers/userAuthController');
const {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorStats,
  changeDoctorPassword,
  logoutDoctor,
} = require('../controllers/doctorAuthController');
const { protect, protectPatient, protectDoctor } = require('../middleware/auth');
const {
  validateUserRegister,
  validateUserLogin,
  validateDoctorRegister,
  validateDoctorLogin,
} = require('../middleware/validators');

// ============= PATIENT/USER ROUTES =============

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', validateUserRegister, registerUser);

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', validateUserLogin, loginUser);

/**
 * Get Current User
 * GET /api/auth/me
 * Requires: Authentication
 */
router.get('/me', protect, protectPatient, getCurrentUser);

/**
 * Update User Profile
 * PUT /api/auth/profile
 * Requires: Authentication
 */
router.put('/profile', protect, protectPatient, updateUserProfile);

/**
 * Change User Password
 * POST /api/auth/change-password
 * Requires: Authentication
 */
router.post('/change-password', protect, protectPatient, changePassword);

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', forgotPassword);

/**
 * Verify Email
 * POST /api/auth/verify-email
 * Requires: Authentication
 */
router.post('/verify-email', protect, protectPatient, verifyEmail);

/**
 * User Logout
 * POST /api/auth/logout
 * Requires: Authentication
 */
router.post('/logout', protect, protectPatient, logoutUser);

// ============= DOCTOR ROUTES =============

/**
 * Doctor Registration
 * POST /api/auth/doctor/register
 */
router.post('/doctor/register', validateDoctorRegister, registerDoctor);

/**
 * Doctor Login
 * POST /api/auth/doctor/login
 */
router.post('/doctor/login', validateDoctorLogin, loginDoctor);

/**
 * Get Doctor Profile
 * GET /api/auth/doctor/me
 * Requires: Authentication (Doctor)
 */
router.get('/doctor/me', protect, protectDoctor, getDoctorProfile);

/**
 * Update Doctor Profile
 * PUT /api/auth/doctor/profile
 * Requires: Authentication (Doctor)
 */
router.put('/doctor/profile', protect, protectDoctor, updateDoctorProfile);

/**
 * Get Doctor Stats
 * GET /api/auth/doctor/stats
 * Requires: Authentication (Doctor)
 */
router.get('/doctor/stats', protect, protectDoctor, getDoctorStats);

/**
 * Change Doctor Password
 * POST /api/auth/doctor/change-password
 * Requires: Authentication (Doctor)
 */
router.post('/doctor/change-password', protect, protectDoctor, changeDoctorPassword);

/**
 * Doctor Logout
 * POST /api/auth/doctor/logout
 * Requires: Authentication (Doctor)
 */
router.post('/doctor/logout', protect, protectDoctor, logoutDoctor);

module.exports = router;
