/**
 * Response Formatter Utility
 * Standardized response format for all API endpoints
 */

/**
 * Send success response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {object} data - Response data
 */
const sendSuccess = (res, statusCode = 200, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    data: data || {},
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send error response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {array} errors - Array of error details
 */
const sendError = (res, statusCode = 500, message, errors = []) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send paginated response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {array} data - Array of data items
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 */
const sendPaginated = (res, statusCode = 200, message, data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
};
