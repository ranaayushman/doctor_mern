/**
 * Doctor Authentication Controller
 * Handles doctor registration and login
 */

const Doctor = require('../models/Doctor');
const { generateTokens } = require('../utils/tokenUtils');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * DOCTOR REGISTRATION
 * POST /api/auth/doctor/register
 * 
 * Creates a new doctor account
 * Requires: License verification and admin approval
 */
const registerDoctor = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    specialization,
    licenseNumber,
    yearsOfExperience,
    consultationFee,
    qualifications,
    clinic,
    languages,
  } = req.body;

  // Check if doctor already exists with this email
  let doctor = await Doctor.findOne({ email: email.toLowerCase() });
  if (doctor) {
    return sendError(res, 400, 'Email already registered. Please login or use another email.');
  }

  // Check if license number is already registered
  let licenseDoctor = await Doctor.findOne({ licenseNumber });
  if (licenseDoctor) {
    return sendError(
      res,
      400,
      'This license number is already registered. Contact support if this is your license.'
    );
  }

  // Create new doctor account
  doctor = new Doctor({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password, // Will be hashed by pre-save middleware
    phone,
    specialization,
    licenseNumber,
    yearsOfExperience,
    consultationFee,
    qualifications: qualifications || [],
    clinic: clinic || {},
    languages: languages || [],
    isActive: true,
    isApproved: false, // Requires admin approval
    licenseVerified: false,
  });

  // Save doctor (password will be hashed in pre-save hook)
  await doctor.save();

  // Generate tokens (even though not approved yet)
  const tokens = generateTokens(doctor._id, 'doctor');

  // Get doctor data
  const doctorData = { ...doctor.toJSON(), role: 'doctor' };

  sendSuccess(res, 201, 'Registration successful. Awaiting admin approval.', {
    user: doctorData,
    tokens,
    message: 'Your account has been created. Admin approval is required before you can accept appointments.',
  });
});

/**
 * DOCTOR LOGIN
 * POST /api/auth/doctor/login
 * 
 * Authenticates a doctor and returns JWT token
 */
const loginDoctor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return sendError(res, 400, 'Email and password are required');
  }

  // Find doctor by email
  const doctor = await Doctor.findOne({
    email: email.toLowerCase(),
  }).select('+password');

  // Check if doctor exists
  if (!doctor) {
    return sendError(res, 401, 'Invalid email or password');
  }

  // Check if account is active
  if (!doctor.isActive) {
    return sendError(res, 403, 'Your account has been deactivated. Contact support.');
  }

  // Verify password
  const isPasswordCorrect = await doctor.comparePassword(password);
  if (!isPasswordCorrect) {
    return sendError(res, 401, 'Invalid email or password');
  }

  // Check if approved by admin
  if (!doctor.isApproved) {
    return sendError(
      res,
      403,
      'Your account is pending admin approval. You will receive an email once approved.'
    );
  }

  // Generate tokens
  const tokens = generateTokens(doctor._id, 'doctor');

  // Get doctor data
  const doctorData = { ...doctor.toJSON(), role: 'doctor' };

  sendSuccess(res, 200, 'Login successful', {
    user: doctorData,
    tokens,
  });
});

/**
 * GET DOCTOR PROFILE
 * GET /api/auth/doctor/me
 * 
 * Returns the authenticated doctor's information
 * Requires: Valid JWT token (doctor)
 */
const getDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.userId);

  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  sendSuccess(res, 200, 'Doctor profile retrieved successfully', {
    doctor: doctor.toJSON(),
  });
});

/**
 * UPDATE DOCTOR PROFILE
 * PUT /api/auth/doctor/profile
 * 
 * Updates doctor profile information
 * Requires: Valid JWT token (doctor)
 */
const updateDoctorProfile = asyncHandler(async (req, res) => {
  const doctorId = req.userId;

  const {
    bio,
    qualifications,
    clinic,
    consultationFee,
    languages,
    workingHours,
    slotDuration,
    bankDetails,
    profilePicture,
  } = req.body;

  // Find doctor
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  // Update allowed fields
  if (bio) doctor.bio = bio;
  if (qualifications) doctor.qualifications = qualifications;
  if (clinic) doctor.clinic = { ...doctor.clinic, ...clinic };
  if (consultationFee) doctor.consultationFee = consultationFee;
  if (languages) doctor.languages = languages;
  if (workingHours) doctor.workingHours = { ...doctor.workingHours, ...workingHours };
  if (slotDuration) doctor.slotDuration = slotDuration;
  if (bankDetails) {
    // Only doctor themselves can update bank details
    doctor.bankDetails = { ...doctor.bankDetails, ...bankDetails };
  }
  if (profilePicture) doctor.profilePicture = profilePicture;

  // Save updated doctor
  await doctor.save();

  sendSuccess(res, 200, 'Profile updated successfully', {
    doctor: doctor.toJSON(),
  });
});

/**
 * GET DOCTOR STATS
 * GET /api/auth/doctor/stats
 * 
 * Returns doctor's appointment and rating statistics
 * Requires: Valid JWT token (doctor)
 */
const getDoctorStats = asyncHandler(async (req, res) => {
  const doctorId = req.userId;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  const stats = {
    totalAppointments: doctor.totalAppointments || 0,
    averageRating: doctor.averageRating || 0,
    totalRatings: doctor.totalRatings || 0,
    consultationFee: doctor.consultationFee,
    yearsOfExperience: doctor.yearsOfExperience,
    isApproved: doctor.isApproved,
    licenseVerified: doctor.licenseVerified,
  };

  sendSuccess(res, 200, 'Doctor stats retrieved successfully', stats);
});

/**
 * CHANGE DOCTOR PASSWORD
 * POST /api/auth/doctor/change-password
 * 
 * Changes doctor password
 * Requires: Valid JWT token, old password verification
 */
const changeDoctorPassword = asyncHandler(async (req, res) => {
  const doctorId = req.userId;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Validate input
  if (!oldPassword || !newPassword || !confirmPassword) {
    return sendError(res, 400, 'All password fields are required');
  }

  if (newPassword !== confirmPassword) {
    return sendError(res, 400, 'New passwords do not match');
  }

  if (newPassword.length < 6) {
    return sendError(res, 400, 'New password must be at least 6 characters');
  }

  // Find doctor with password field
  const doctor = await Doctor.findById(doctorId).select('+password');
  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  // Verify old password
  const isPasswordCorrect = await doctor.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    return sendError(res, 401, 'Current password is incorrect');
  }

  // Update password
  doctor.password = newPassword;
  await doctor.save();

  sendSuccess(res, 200, 'Password changed successfully', {
    message: 'Please login with your new password',
  });
});

/**
 * LOGOUT DOCTOR
 * POST /api/auth/doctor/logout
 * 
 * Logs out doctor (client-side implementation)
 */
const logoutDoctor = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Logout successful', {
    message: 'Token removed from client. Please clear your local storage.',
  });
});

module.exports = {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorStats,
  changeDoctorPassword,
  logoutDoctor,
};
