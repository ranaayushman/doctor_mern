/**
 * Error Handling Middleware
 * Centralized error handling for all routes
 */

/**
 * Custom Error class for consistent error responses
 */
class APIError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * Must be used as the last middleware in Express app
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error('❌ Error:', err);

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.value}`;
    error = new APIError(400, message);
  }

  // Mongoose Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = new APIError(400, message);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = new APIError(400, message);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new APIError(401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new APIError(401, 'Token expired');
  }

  // Default error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    errors: error.errors || [],
  });
};

/**
 * Middleware for handling 404 routes
 */
const notFound = (req, res, next) => {
  const error = new APIError(
    404,
    `Route not found: ${req.originalUrl}`
  );
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  APIError,
  errorHandler,
  notFound,
  asyncHandler,
};
