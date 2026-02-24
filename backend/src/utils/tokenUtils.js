/**
 * Token Utility Functions
 * Helper functions for JWT token generation and verification
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token
 * @param {string} userId - User/Doctor ID
 * @param {string} role - User role (patient, doctor, admin)
 * @returns {object} Token object with access and refresh tokens
 */
const generateTokens = (userId, role = 'patient') => {
  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    {
      id: userId,
      role: role,
      type: 'access',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );

  // Generate refresh token (long-lived)
  const refreshToken = jwt.sign(
    {
      id: userId,
      role: role,
      type: 'refresh',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRE || '7d',
  };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} secret - Secret key (optional, uses JWT_SECRET by default)
 * @returns {object} Decoded token payload
 */
const verifyToken = (token, secret = null) => {
  const secretKey = secret || process.env.JWT_SECRET;
  
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Decode JWT token without verification
 * Useful for getting token info without validation
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired, false otherwise
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded.exp) return false;
    
    // exp is in seconds, Date.now() is in milliseconds
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration timestamp
 * @param {string} token - JWT token
 * @returns {number} Expiration timestamp in milliseconds
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch (error) {
    return null;
  }
};

/**
 * Get remaining time until token expiration
 * @param {string} token - JWT token
 * @returns {number} Remaining time in milliseconds
 */
const getTokenTimeRemaining = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded.exp) return null;
    
    const expirationTime = decoded.exp * 1000;
    const remaining = expirationTime - Date.now();
    
    return remaining > 0 ? remaining : null;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateTokens,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  getTokenTimeRemaining,
};
