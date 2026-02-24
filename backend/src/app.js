/**
 * Express App Configuration
 * Central setup for middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound, asyncHandler } = require('./middleware/errorHandler');

const app = express();

// ============= SECURITY MIDDLEWARE =============

// Set security HTTP headers
app.use(helmet());

// CORS Configuration - allow all origins
app.use(cors());

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all routes
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 requests per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many login attempts, please try again later.',
});

// ============= BODY PARSER MIDDLEWARE =============

// Parse incoming JSON request bodies
app.use(express.json({ limit: '10kb' }));

// Parse incoming URL-encoded request bodies
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// ============= LOGGING MIDDLEWARE =============

// Morgan logger for HTTP requests
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============= HEALTH CHECK ROUTE =============

/**
 * Health Check Endpoint
 * Used to verify server is running
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ============= API ROUTES =============

/**
 * Authentication Routes
 * User and Doctor login/register
 */
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));

/**
 * Doctor Routes
 * Search, list, and manage doctors
 */
app.use('/api/doctors', require('./routes/doctorRoutes'));

/**
 * Appointment Routes
 * Book, reschedule, cancel appointments
 */
app.use('/api/appointments', require('./routes/appointmentRoutes'));

/**
 * TimeSlot Routes
 * Manage doctor availability
 */
app.use('/api/timeslots', require('./routes/timeSlotRoutes'));

/**
 * Prescription Routes
 * Medical prescriptions and documents
 */
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));

/**
 * User Profile Routes
 * Patient profile management
 */
app.use('/api/profile', require('./routes/profileRoutes'));

// ============= ERROR HANDLING =============

// 404 Handler - Must be before error handler
app.use(notFound);

// Global Error Handler - Must be last
app.use(errorHandler);

module.exports = app;
