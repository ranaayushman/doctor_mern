/**
 * Doctor Management Controller
 * Handles listing, searching, and viewing doctor information
 */

const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET ALL DOCTORS (with pagination and filters)
 * GET /api/doctors
 * Query parameters: page, limit, specialization, city, sortBy, order
 */
const getAllDoctors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, specialization, city, sortBy = 'createdAt', order = 'desc' } = req.query;

  // Only get approved doctors
  const filter = {
    isApproved: true,
    isActive: true,
  };

  // Add specialization filter if provided
  if (specialization) {
    filter.specialization = specialization;
  }

  // Add city filter if provided
  if (city) {
    filter['clinic.city'] = city;
  }

  // Calculate pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  // Build sort object
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj = { [sortBy]: sortOrder };

  // Fetch doctors
  const doctors = await Doctor.find(filter)
    .select('-password -bankDetails')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  // Get total count for pagination
  const total = await Doctor.countDocuments(filter);

  sendPaginated(res, 200, 'Doctors retrieved successfully', doctors, total, pageNum, pageLimit);
});

/**
 * GET DOCTOR BY ID
 * GET /api/doctors/:id
 * Retrieves detailed information about a specific doctor
 */
const getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find doctor (only approved doctors visible)
  const doctor = await Doctor.findOne({
    _id: id,
    isApproved: true,
    isActive: true,
  }).select('-password -bankDetails');

  if (!doctor) {
    return sendError(res, 404, 'Doctor not found or inactive');
  }

  // Get doctor's average rating and appointment count
  const stats = await Appointment.aggregate([
    {
      $match: {
        doctorId: doctor._id,
        status: 'Completed',
      },
    },
    {
      $group: {
        _id: '$doctorId',
        avgRating: { $avg: '$rating' },
        totalRatings: { $sum: { $cond: ['$rating', 1, 0] } },
        totalAppointments: { $sum: 1 },
      },
    },
  ]);

  // Enhance doctor data with stats
  const doctorData = doctor.toObject();
  if (stats.length > 0) {
    doctorData.averageRating = stats[0].avgRating || 0;
    doctorData.totalRatings = stats[0].totalRatings || 0;
    doctorData.totalAppointments = stats[0].totalAppointments || 0;
  }

  sendSuccess(res, 200, 'Doctor retrieved successfully', {
    doctor: doctorData,
  });
});

/**
 * SEARCH DOCTORS BY SPECIALIZATION
 * GET /api/doctors/search/specialization/:specialization
 * Returns doctors with specific specialization
 */
const getDoctorsBySpecialization = asyncHandler(async (req, res) => {
  const { specialization } = req.params;
  const { page = 1, limit = 10, city, sortBy = 'averageRating', order = 'desc' } = req.query;

  // Validate specialization
  const validSpecializations = [
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
  ];

  if (!validSpecializations.includes(specialization)) {
    return sendError(res, 400, `Invalid specialization. Valid options: ${validSpecializations.join(', ')}`);
  }

  // Build filter
  const filter = {
    specialization,
    isApproved: true,
    isActive: true,
  };

  if (city) {
    filter['clinic.city'] = city;
  }

  // Calculate pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  // Build sort object
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj = { [sortBy]: sortOrder };

  // Fetch doctors
  const doctors = await Doctor.find(filter)
    .select('-password -bankDetails')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  // Get total count
  const total = await Doctor.countDocuments(filter);

  sendPaginated(
    res,
    200,
    `${specialization} doctors retrieved successfully`,
    doctors,
    total,
    pageNum,
    pageLimit
  );
});

/**
 * SEARCH DOCTORS BY CITY
 * GET /api/doctors/search/city/:city
 * Returns doctors practicing in a specific city
 */
const getDoctorsByCity = asyncHandler(async (req, res) => {
  const { city } = req.params;
  const { page = 1, limit = 10, specialization, sortBy = 'averageRating', order = 'desc' } = req.query;

  // Build filter
  const filter = {
    'clinic.city': city,
    isApproved: true,
    isActive: true,
  };

  if (specialization) {
    filter.specialization = specialization;
  }

  // Calculate pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  // Build sort object
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj = { [sortBy]: sortOrder };

  // Fetch doctors
  const doctors = await Doctor.find(filter)
    .select('-password -bankDetails')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  // Get total count
  const total = await Doctor.countDocuments(filter);

  sendPaginated(
    res,
    200,
    `Doctors in ${city} retrieved successfully`,
    doctors,
    total,
    pageNum,
    pageLimit
  );
});

/**
 * GET TOP RATED DOCTORS
 * GET /api/doctors/top-rated
 * Returns doctors sorted by rating
 */
const getTopRatedDoctors = asyncHandler(async (req, res) => {
  const { limit = 10, specialization, city } = req.query;

  // Build filter
  const filter = {
    isApproved: true,
    isActive: true,
    averageRating: { $gt: 0 }, // Only doctors with ratings
  };

  if (specialization) {
    filter.specialization = specialization;
  }

  if (city) {
    filter['clinic.city'] = city;
  }

  const pageLimit = parseInt(limit, 10) || 10;

  // Fetch top-rated doctors
  const doctors = await Doctor.find(filter)
    .select('-password -bankDetails')
    .sort({ averageRating: -1, totalRatings: -1 })
    .limit(pageLimit);

  sendSuccess(res, 200, 'Top rated doctors retrieved successfully', {
    doctors,
    count: doctors.length,
  });
});

/**
 * SEARCH DOCTORS BY NAME
 * GET /api/doctors/search/name/:name
 * Search doctors by first or last name
 */
const searchDoctorsByName = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate name
  if (!name || name.length < 2) {
    return sendError(res, 400, 'Search term must be at least 2 characters');
  }

  // Create regex for case-insensitive search
  const searchRegex = new RegExp(name, 'i');

  // Build filter
  const filter = {
    $or: [{ firstName: searchRegex }, { lastName: searchRegex }],
    isApproved: true,
    isActive: true,
  };

  // Calculate pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  // Fetch doctors
  const doctors = await Doctor.find(filter)
    .select('-password -bankDetails')
    .skip(skip)
    .limit(pageLimit);

  // Get total count
  const total = await Doctor.countDocuments(filter);

  sendPaginated(res, 200, 'Doctors found', doctors, total, pageNum, pageLimit);
});

/**
 * GET AVAILABLE SPECIALIZATIONS
 * GET /api/doctors/specializations
 * Returns list of all specializations with doctor count
 */
const getSpecializations = asyncHandler(async (req, res) => {
  const specializations = await Doctor.aggregate([
    {
      $match: {
        isApproved: true,
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$specialization',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  sendSuccess(res, 200, 'Specializations retrieved successfully', {
    specializations: specializations.map(s => ({
      name: s._id,
      count: s.count,
    })),
  });
});

/**
 * GET DOCTORS BY CONSULTATION FEE RANGE
 * GET /api/doctors/filter/fee
 * Returns doctors within specified fee range
 */
const getDoctorsByFeeRange = asyncHandler(async (req, res) => {
  const { minFee = 0, maxFee = 10000, page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  const minPrice = parseInt(minFee, 10);
  const maxPrice = parseInt(maxFee, 10);

  // Validate fee range
  if (minPrice < 0 || maxPrice < minPrice) {
    return sendError(res, 400, 'Invalid fee range');
  }

  // Build filter
  const filter = {
    consultationFee: { $gte: minPrice, $lte: maxPrice },
    isApproved: true,
    isActive: true,
  };

  // Fetch doctors
  const doctors = await Doctor.find(filter)
    .select('-password -bankDetails')
    .sort({ consultationFee: 1 })
    .skip(skip)
    .limit(pageLimit);

  // Get total count
  const total = await Doctor.countDocuments(filter);

  sendPaginated(res, 200, 'Doctors within fee range retrieved', doctors, total, pageNum, pageLimit);
});

/**
 * GET DOCTOR AVAILABILITY
 * GET /api/doctors/:id/availability
 * Returns doctor's availability for next 7 days
 */
const getDoctorAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { days = 7 } = req.query;

  const doctor = await Doctor.findOne({
    _id: id,
    isApproved: true,
    isActive: true,
  }).select('workingHours slotDuration');

  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  // Generate availability for next N days
  const availability = [];
  const numDays = parseInt(days, 10);

  for (let i = 0; i < numDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const daySchedule = doctor.workingHours[dayName];

    if (daySchedule && daySchedule.isAvailable) {
      availability.push({
        date: date.toISOString().split('T')[0],
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        startTime: daySchedule.startTime,
        endTime: daySchedule.endTime,
        isAvailable: true,
      });
    } else {
      availability.push({
        date: date.toISOString().split('T')[0],
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        isAvailable: false,
      });
    }
  }

  sendSuccess(res, 200, 'Doctor availability retrieved', {
    doctorId: id,
    slotDuration: doctor.slotDuration || 30,
    availability,
  });
});

/**
 * GET DOCTOR REVIEWS/RATINGS
 * GET /api/doctors/:id/reviews
 * Returns patient reviews and ratings for a doctor
 */
const getDoctorReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check if doctor exists
  const doctor = await Doctor.findOne({
    _id: id,
    isApproved: true,
    isActive: true,
  }).select('_id');

  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  // Get reviews from completed appointments
  const reviews = await Appointment.find({
    doctorId: id,
    status: 'Completed',
    rating: { $exists: true, $ne: null },
  })
    .select('rating review ratedAt patientId')
    .populate('patientId', 'firstName lastName')
    .sort({ ratedAt: -1 })
    .skip(skip)
    .limit(pageLimit);

  // Get total count
  const total = await Appointment.countDocuments({
    doctorId: id,
    status: 'Completed',
    rating: { $exists: true, $ne: null },
  });

  // Calculate average rating
  const ratingStats = await Appointment.aggregate([
    {
      $match: {
        doctorId: doctor._id,
        status: 'Completed',
        rating: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  sendPaginated(
    res,
    200,
    'Doctor reviews retrieved successfully',
    reviews.map(review => ({
      rating: review.rating,
      review: review.review,
      ratedAt: review.ratedAt,
      patient: {
        firstName: review.patientId?.firstName || 'Anonymous',
        lastName: review.patientId?.lastName || '',
      },
    })),
    total,
    pageNum,
    pageLimit
  );
});

/**
 * GET ALL CITIES WITH DOCTORS
 * GET /api/doctors/cities
 * Returns list of cities where doctors are available
 */
const getCitiesWithDoctors = asyncHandler(async (req, res) => {
  const cities = await Doctor.aggregate([
    {
      $match: {
        isApproved: true,
        isActive: true,
        'clinic.city': { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: '$clinic.city',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  sendSuccess(res, 200, 'Cities retrieved successfully', {
    cities: cities.map(c => ({
      city: c._id,
      doctorCount: c.count,
    })),
  });
});

/**
 * SEARCH DOCTORS (general search)
 * GET /api/doctors/search
 * Query: specialization, minRating, search, page, limit
 */
const searchDoctors = asyncHandler(async (req, res) => {
  const { specialization, minRating, search, page = 1, limit = 10 } = req.query;

  const filter = {
    isApproved: true,
    isActive: true,
  };

  if (specialization) {
    filter.specialization = { $regex: specialization, $options: 'i' };
  }

  if (minRating && parseFloat(minRating) > 0) {
    filter.rating = { $gte: parseFloat(minRating) };
  }

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  const doctors = await Doctor.find(filter)
    .select('-password -bankDetails')
    .sort({ rating: -1, createdAt: -1 })
    .skip(skip)
    .limit(pageLimit);

  const total = await Doctor.countDocuments(filter);

  sendPaginated(res, 200, 'Doctors search results', doctors, total, pageNum, pageLimit);
});

module.exports = {
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
};
