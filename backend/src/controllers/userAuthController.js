/**
 * User Authentication Controller
 * Handles patient/user registration and login
 */

const User = require('../models/User');
const { generateTokens } = require('../utils/tokenUtils');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * USER REGISTRATION
 * POST /api/auth/register
 * 
 * Creates a new patient account
 * Validates input, checks for duplicates, hashes password, generates JWT
 */
const registerUser = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
  } = req.body;

  // Check if user already exists with this email
  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    return sendError(res, 400, 'Email already registered. Please login or use another email.');
  }

  // Check if phone number is already registered
  let phoneUser = await User.findOne({ phone });
  if (phoneUser) {
    return sendError(res, 400, 'Phone number already registered.');
  }

  // Create new user
  user = new User({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password, // Will be hashed by pre-save middleware
    phone,
    dateOfBirth,
    gender,
    bloodGroup: bloodGroup || 'Unknown',
    address: address || {},
    emailVerified: false,
    isActive: true,
  });

  // Save user (password will be hashed in pre-save hook)
  await user.save();

  // Generate tokens
  const tokens = generateTokens(user._id, 'patient');

  // Get user data without password
  const userData = user.toJSON();

  // Send success response
  sendSuccess(res, 201, 'Registration successful', {
    user: userData,
    tokens,
  });
});

/**
 * USER LOGIN
 * POST /api/auth/login
 * 
 * Authenticates a patient and returns JWT token
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return sendError(res, 400, 'Email and password are required');
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password' // Explicitly select password field
  );

  // Check if user exists
  if (!user) {
    return sendError(res, 401, 'Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    return sendError(res, 403, 'Your account has been deactivated. Contact support.');
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return sendError(res, 401, 'Invalid email or password');
  }

  // Generate tokens
  const tokens = generateTokens(user._id, 'patient');

  // Get user data without password
  const userData = user.toJSON();

  // Send success response
  sendSuccess(res, 200, 'Login successful', {
    user: userData,
    tokens,
  });
});

/**
 * GET CURRENT USER
 * GET /api/auth/me
 * 
 * Returns the authenticated user's information
 * Requires: Valid JWT token
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  sendSuccess(res, 200, 'User retrieved successfully', {
    user: user.toJSON(),
  });
});

/**
 * LOGOUT USER
 * POST /api/auth/logout
 * 
 * Logs out user (client-side implementation)
 * In production, you might invalidate tokens on server
 */
const logoutUser = asyncHandler(async (req, res) => {
  // Client should remove token from localStorage/cookie
  sendSuccess(res, 200, 'Logout successful', {
    message: 'Token removed from client. Please clear your local storage.',
  });
});

/**
 * UPDATE USER PROFILE
 * PUT /api/auth/profile
 * 
 * Updates user profile information
 * Requires: Valid JWT token
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  const {
    firstName,
    lastName,
    phone,
    gender,
    dateOfBirth,
    bloodGroup,
    address,
    emergencyContact,
  } = req.body;

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  // Check if new phone is already taken by another user
  if (phone && phone !== user.phone) {
    const existingPhone = await User.findOne({
      phone,
      _id: { $ne: userId },
    });
    if (existingPhone) {
      return sendError(res, 400, 'Phone number already in use by another user');
    }
  }

  // Update allowed fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;
  if (gender) user.gender = gender;
  if (dateOfBirth) user.dateOfBirth = dateOfBirth;
  if (bloodGroup) user.bloodGroup = bloodGroup;
  if (address) user.address = { ...user.address, ...address };
  if (emergencyContact) {
    user.emergencyContact = { ...user.emergencyContact, ...emergencyContact };
  }

  // Save updated user
  await user.save();

  sendSuccess(res, 200, 'Profile updated successfully', {
    user: user.toJSON(),
  });
});

/**
 * CHANGE PASSWORD
 * POST /api/auth/change-password
 * 
 * Changes user password
 * Requires: Valid JWT token, old password verification
 */
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.userId;
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

  // Find user with password field
  const user = await User.findById(userId).select('+password');
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  // Verify old password
  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    return sendError(res, 401, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccess(res, 200, 'Password changed successfully', {
    message: 'Please login with your new password',
  });
});

/**
 * FORGOT PASSWORD
 * POST /api/auth/forgot-password
 * 
 * Initiates password reset process
 * Sends reset link to email
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 400, 'Email is required');
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if email exists for security
    return sendSuccess(res, 200, 'If email exists, reset link sent to inbox', {});
  }

  // TODO: Generate reset token and send email
  // This would typically use a token library and email service

  sendSuccess(res, 200, 'If email exists, reset link sent to inbox', {
    message: 'Check your email for password reset instructions',
  });
});

/**
 * VERIFY EMAIL
 * POST /api/auth/verify-email
 * 
 * Marks email as verified
 * Typically called with token from email link
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  user.emailVerified = true;
  await user.save();

  sendSuccess(res, 200, 'Email verified successfully', { user });
});

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateUserProfile,
  changePassword,
  forgotPassword,
  verifyEmail,
};
