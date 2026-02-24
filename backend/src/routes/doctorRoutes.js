/**
 * Doctor Routes
 * List, search, and manage doctor profiles
 */

const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  getDoctorsBySpecialization,
  getDoctorsByCity,
  getTopRatedDoctors,
  searchDoctorsByName,
  searchDoctors,
  getSpecializations,
  getDoctorsByFeeRange,
  getDoctorAvailability,
  getDoctorReviews,
  getCitiesWithDoctors,
} = require('../controllers/doctorController');

/**
 * GET ALL DOCTORS
 * GET /api/doctors
 * Query: page, limit, specialization, city, sortBy, order
 */
router.get('/', getAllDoctors);

/**
 * GET AVAILABLE SPECIALIZATIONS
 * GET /api/doctors/specializations
 * Returns list of all specializations with doctor count
 */
router.get('/specializations', getSpecializations);

/**
 * GET ALL CITIES WITH DOCTORS
 * GET /api/doctors/cities
 * Returns list of cities where doctors are available
 */
router.get('/cities', getCitiesWithDoctors);

/**
 * GET TOP RATED DOCTORS
 * GET /api/doctors/top-rated
 * Query: limit, specialization, city
 */
router.get('/top-rated', getTopRatedDoctors);

/**
 * SEARCH DOCTORS (general)
 * GET /api/doctors/search
 * Query: specialization, minRating, search, page, limit
 */
router.get('/search', searchDoctors);

/**
 * GET DOCTORS BY FEE RANGE
 * GET /api/doctors/filter/fee
 * Query: minFee, maxFee, page, limit
 */
router.get('/filter/fee', getDoctorsByFeeRange);

/**
 * SEARCH DOCTORS BY SPECIALIZATION
 * GET /api/doctors/search/specialization/:specialization
 * Query: page, limit, city, sortBy, order
 */
router.get('/search/specialization/:specialization', getDoctorsBySpecialization);

/**
 * SEARCH DOCTORS BY CITY
 * GET /api/doctors/search/city/:city
 * Query: page, limit, specialization, sortBy, order
 */
router.get('/search/city/:city', getDoctorsByCity);

/**
 * SEARCH DOCTORS BY NAME
 * GET /api/doctors/search/name/:name
 * Query: page, limit
 */
router.get('/search/name/:name', searchDoctorsByName);

/**
 * GET DOCTOR BY ID
 * GET /api/doctors/:id
 * Detailed information about specific doctor
 */
router.get('/:id', getDoctorById);

/**
 * GET DOCTOR AVAILABILITY
 * GET /api/doctors/:id/availability
 * Query: days (default: 7)
 */
router.get('/:id/availability', getDoctorAvailability);

/**
 * GET DOCTOR REVIEWS/RATINGS
 * GET /api/doctors/:id/reviews
 * Query: page, limit
 */
router.get('/:id/reviews', getDoctorReviews);

module.exports = router;
