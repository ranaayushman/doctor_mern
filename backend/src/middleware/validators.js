/**
 * Input Validation Middleware
 * Reusable validation rules for common fields
 */

const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  
  next();
};

// ============= PATIENT/USER VALIDATORS =============

/**
 * Validator for user registration
 */
const validateUserRegister = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain letters and numbers'),
  
  body('phone')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
  
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Invalid gender'),
  
  handleValidationErrors,
];

/**
 * Validator for user login
 */
const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors,
];

// ============= DOCTOR VALIDATORS =============

/**
 * Validator for doctor registration
 */
const validateDoctorRegister = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('phone')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
  
  body('specialization')
    .notEmpty()
    .withMessage('Specialization is required')
    .isIn([
      'General Practitioner',
      'Cardiologist',
      'Dermatologist',
      'Endocrinologist',
      'Gastroenterologist',
      'Neurologist',
      'Pediatrician',
      'Psychiatrist',
      'Orthopedist',
      'Otolaryngologist',
      'Pulmonologist',
      'Urologist',
      'Ophthalmologist',
      'Gynecologist',
      'Dentist',
      'Other',
    ])
    .withMessage('Invalid specialization'),
  
  body('licenseNumber')
    .trim()
    .notEmpty()
    .withMessage('License number is required'),
  
  body('yearsOfExperience')
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a non-negative number'),
  
  body('consultationFee')
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number'),
  
  handleValidationErrors,
];

/**
 * Validator for doctor login
 */
const validateDoctorLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors,
];

// ============= APPOINTMENT VALIDATORS =============

/**
 * Validator for appointment booking
 */
const validateAppointmentBooking = [
  body('doctorId')
    .trim()
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  
  body('appointmentDate')
    .notEmpty()
    .withMessage('Appointment date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('startTime')
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),
  
  body('endTime')
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format'),
  
  body('consultationType')
    .isIn(['Online', 'In-Person', 'Phone'])
    .withMessage('Invalid consultation type'),
  
  body('chiefComplaint')
    .trim()
    .notEmpty()
    .withMessage('Chief complaint is required')
    .isLength({ min: 5 })
    .withMessage('Chief complaint must be at least 5 characters'),
  
  handleValidationErrors,
];

// ============= TIME SLOT VALIDATORS =============

/**
 * Validator for creating time slots
 */
const validateTimeSlotCreation = [
  body('doctorId')
    .trim()
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('startTime')
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),
  
  body('endTime')
    .trim()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format'),
  
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegister,
  validateUserLogin,
  validateDoctorRegister,
  validateDoctorLogin,
  validateAppointmentBooking,
  validateTimeSlotCreation,
};
