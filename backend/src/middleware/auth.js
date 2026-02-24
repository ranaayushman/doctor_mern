/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

/**
 * Middleware to verify JWT token from request headers
 * Required: Authorization header with Bearer token
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided. Please login.',
      });
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Authorization: Bearer <token>',
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded user info to request
    req.user = decoded;
    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message,
    });
  }
};

/**
 * Middleware to check if user is authenticated
 * Wrapper around verifyToken for route protection
 */
const protect = verifyToken;

/**
 * Middleware to verify if the user is a patient/user
 * Must be called after verifyToken
 */
const protectPatient = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (req.userRole !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can access this resource',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      error: error.message,
    });
  }
};

/**
 * Middleware to verify if the user is a doctor
 * Must be called after verifyToken
 */
const protectDoctor = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (req.userRole !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can access this resource',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      error: error.message,
    });
  }
};

/**
 * Middleware to verify if the user is an admin
 * Must be called after verifyToken
 */
const protectAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this resource',
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      error: error.message,
    });
  }
};

/**
 * Utility function to generate JWT token
 * Called during login/signup
 * 
 * @param {string} userId - User or Doctor ID
 * @param {string} role - User role (patient, doctor, admin)
 * @returns {string} JWT token
 */
const generateToken = (userId, role = 'patient') => {
  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * Utility function to generate refresh token (optional)
 * Can be used for better security in production
 */
const generateRefreshToken = (userId, role = 'patient') => {
  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    process.env.JWT_SECRET + '_refresh',
    {
      expiresIn: '30d',
    }
  );
};

module.exports = {
  protect,
  verifyToken,
  protectPatient,
  protectDoctor,
  protectAdmin,
  generateToken,
  generateRefreshToken,
};
