const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const TimeSlot = require('../models/TimeSlot');
const Prescription = require('../models/Prescription');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// ============ SYSTEM DASHBOARD ============
// Get overall system statistics and metrics
exports.getDashboardStats = asyncHandler(async (req, res) => {
  // Verify admin role
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  const stats = await Promise.all([
    // User statistics
    User.countDocuments(),
    User.countDocuments({ role: 'patient' }),
    User.countDocuments({ role: 'doctor' }),
    User.countDocuments({ isActive: true }),

    // Appointment statistics
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'Confirmed' }),
    Appointment.countDocuments({ status: 'Completed' }),
    Appointment.countDocuments({ status: 'Cancelled' }),

    // Prescription statistics
    Prescription.countDocuments(),

    // TimeSlot statistics
    TimeSlot.countDocuments({ isBooked: true }),
    TimeSlot.countDocuments({ isBooked: false })
  ]);

  const totalUsers = stats[0];
  const patientCount = stats[1];
  const doctorCount = stats[2];
  const activeUsers = stats[3];
  
  const totalAppointments = stats[4];
  const confirmedAppointments = stats[5];
  const completedAppointments = stats[6];
  const cancelledAppointments = stats[7];
  
  const totalPrescriptions = stats[8];
  
  const bookedSlots = stats[9];
  const availableSlots = stats[10];

  return sendSuccess(res, 200, 'Dashboard statistics retrieved', {
    users: {
      total: totalUsers,
      patients: patientCount,
      doctors: doctorCount,
      active: activeUsers,
      inactive: totalUsers - activeUsers
    },
    appointments: {
      total: totalAppointments,
      confirmed: confirmedAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      completionRate: totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(2) : 0
    },
    prescriptions: {
      total: totalPrescriptions
    },
    timeSlots: {
      booked: bookedSlots,
      available: availableSlots,
      total: bookedSlots + availableSlots
    }
  });
});

// ============ USER MANAGEMENT ============

// Get all users with pagination and filtering
exports.getAllUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  const { role, isActive, sortBy = '-createdAt', page = 1, limit = 20, search } = req.query;

  // Build query
  const query = {};
  if (role && ['patient', 'doctor', 'admin'].includes(role)) {
    query.role = role;
  }
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const users = await User.find(query)
    .select('-password')
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await User.countDocuments(query);

  return sendSuccess(res, 200, 'Users retrieved', {
    users: users.map(u => ({
      userId: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt
    })),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// Get specific user details
exports.getUserDetails = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  const { userId } = req.params;

  const user = await User.findById(userId).select('-password');
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  // Get user-related statistics
  let stats = {};

  if (user.role === 'patient') {
    const appointmentCount = await Appointment.countDocuments({ patientId: userId });
    const completedAppointments = await Appointment.countDocuments({ 
      patientId: userId, 
      status: 'Completed' 
    });
    const totalSpent = await Appointment.aggregate([
      { $match: { patientId: require('mongoose').Types.ObjectId(userId), status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$consultationFee' } } }
    ]);

    stats = {
      appointments: appointmentCount,
      completedAppointments,
      totalSpent: totalSpent[0]?.total || 0
    };
  } else if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ userId });
    if (doctor) {
      stats = {
        specialization: doctor.specialization,
        experience: doctor.experience,
        consultationFee: doctor.consultationFee,
        rating: doctor.rating,
        reviews: doctor.reviews.length,
        totalAppointments: doctor.totalAppointments,
      totalEarnings: await Appointment.aggregate([
          { $match: { doctorId: require('mongoose').Types.ObjectId(userId), status: 'Completed' } },
          { $group: { _id: null, total: { $sum: '$consultationFee' } } }
        ])
      };
    }
  }

  return sendSuccess(res, 200, 'User details retrieved', {
    user: {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      address: user.address,
      isActive: user.isActive,
      createdAt: user.createdAt,
      ...stats
    }
  });
});

// Activate/Deactivate user
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  const { userId } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return sendError(res, 400, 'isActive must be boolean');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive },
    { new: true }
  ).select('-password');

  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  return sendSuccess(res, 200, `User ${isActive ? 'activated' : 'deactivated'}`, {
    userId: user._id,
    isActive: user.isActive
  });
});

// ============ DOCTOR MANAGEMENT ============

// Get all doctors with performance metrics
exports.getAllDoctors = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  const { specialization, minRating, sortBy = '-rating', page = 1, limit = 20 } = req.query;

  // Build query
  const query = {};
  if (specialization) {
    query.specialization = { $regex: specialization, $options: 'i' };
  }
  if (minRating) {
    query.rating = { $gte: parseFloat(minRating) };
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const doctors = await Doctor.find(query)
    .populate('userId', 'firstName lastName email phone')
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await Doctor.countDocuments(query);

  return sendSuccess(res, 200, 'Doctors retrieved', {
    doctors: doctors.map(d => ({
      doctorId: d._id,
      userId: d.userId._id,
      name: `${d.userId.firstName} ${d.userId.lastName}`,
      email: d.userId.email,
      specialization: d.specialization,
      experience: d.experience,
      consultationFee: d.consultationFee,
      rating: d.rating,
      totalReviews: d.reviews.length,
      totalAppointments: d.totalAppointments,
      isActive: d.userId.isActive
    })),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

// Get doctor performance analytics
exports.getDoctorAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  const { doctorId } = req.params;

  const doctor = await Doctor.findById(doctorId)
    .populate('userId', 'firstName lastName email');
  
  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  // Get appointment statistics
  const appointmentStats = await Appointment.aggregate([
    { $match: { doctorId: require('mongoose').Types.ObjectId(doctorId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
        },
        confirmed: {
          $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
        }
      }
    }
  ]);

  // Get earnings from completed appointments
  const earningsStats = await Appointment.aggregate([
    { $match: { doctorId: require('mongoose').Types.ObjectId(doctorId), status: 'Completed' } },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$consultationFee' },
        completedAppointments: { $sum: 1 }
      }
    }
  ]);

  // Get prescription statistics
  const prescriptionStats = await Prescription.countDocuments({ 
    doctorId: require('mongoose').Types.ObjectId(doctorId) 
  });

  const appointments = appointmentStats[0] || {};
  const earnings = earningsStats[0] || {};

  return sendSuccess(res, 200, 'Doctor analytics retrieved', {
    doctor: {
      doctorId: doctor._id,
      name: `${doctor.userId.firstName} ${doctor.userId.lastName}`,
      specialization: doctor.specialization,
      experience: doctor.experience,
      rating: doctor.rating,
      totalReviews: doctor.reviews.length
    },
    appointments: {
      total: appointments.total || 0,
      completed: appointments.completed || 0,
      confirmed: appointments.confirmed || 0,
      cancelled: appointments.cancelled || 0,
      completionRate: appointments.total ? ((appointments.completed / appointments.total) * 100).toFixed(2) : 0
    },
    earnings: {
      totalEarnings: earnings.totalEarnings || 0,
      completedAppointments: earnings.completedAppointments || 0,
      averagePerAppointment: (earnings.totalEarnings || 0) / (earnings.completedAppointments || 1)
    },
    prescriptions: prescriptionStats
  });
});

// ============ APPOINTMENT ANALYTICS ============

// Get appointment statistics and trends
exports.getAppointmentAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  const { dateFrom, dateTo } = req.query;

  // Build date filter
  const dateFilter = {};
  if (dateFrom) {
    dateFilter.$gte = new Date(dateFrom);
  }
  if (dateTo) {
    if (!dateFilter.$gte) dateFilter.$gte = new Date('2024-01-01');
    dateFilter.$lte = new Date(dateTo);
  }

  const matchStage = dateFrom || dateTo ? { date: dateFilter } : {};

  const stats = await Appointment.aggregate([
    dateFrom || dateTo ? { $match: matchStage } : { $match: {} },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        confirmed: {
          $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        }
      }
    }
  ]);

  // Daily appointments trend (last 30 days)
  const dailyTrend = await Appointment.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const stat = stats[0] || {};

  return sendSuccess(res, 200, 'Appointment analytics retrieved', {
    summary: {
      total: stat.total || 0,
      confirmed: stat.confirmed || 0,
      completed: stat.completed || 0,
      cancelled: stat.cancelled || 0,
      pending: stat.pending || 0,
      completionRate: stat.total ? ((stat.completed / stat.total) * 100).toFixed(2) : 0,
      cancellationRate: stat.total ? ((stat.cancelled / stat.total) * 100).toFixed(2) : 0
    },
    dailyTrend: dailyTrend.map(d => ({
      date: d._id,
      appointments: d.count
    }))
  });
});

// ============ PRESCRIPTION ANALYTICS ============

// Get prescription statistics
exports.getPrescriptionAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  const stats = await Prescription.aggregate([
    {
      $group: {
        _id: null,
        totalPrescriptions: { $sum: 1 },
        activePrescriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
        },
        expiredPrescriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'Expired'] }, 1, 0] }
        },
        completedPrescriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        prescriptionsWithAttachments: {
          $sum: { $cond: [{ $gt: [{ $size: '$attachments' }, 0] }, 1, 0] }
        },
        totalAttachments: {
          $sum: { $size: '$attachments' }
        },
        totalMedicines: {
          $sum: { $size: '$medicines' }
        }
      }
    }
  ]);

  // Top prescribed medicines
  const topMedicines = await Prescription.aggregate([
    { $unwind: '$medicines' },
    {
      $group: {
        _id: '$medicines.name',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const stat = stats[0] || {};

  return sendSuccess(res, 200, 'Prescription analytics retrieved', {
    summary: {
      totalPrescriptions: stat.totalPrescriptions || 0,
      activePrescriptions: stat.activePrescriptions || 0,
      expiredPrescriptions: stat.expiredPrescriptions || 0,
      completedPrescriptions: stat.completedPrescriptions || 0,
      prescriptionsWithAttachments: stat.prescriptionsWithAttachments || 0,
      totalAttachments: stat.totalAttachments || 0,
      avgMedicinesPerPrescription: stat.totalPrescriptions ? 
        (stat.totalMedicines / stat.totalPrescriptions).toFixed(2) : 0
    },
    topMedicines: topMedicines.map(m => ({
      medicineName: m._id,
      prescriptionCount: m.count
    }))
  });
});

// ============ SYSTEM HEALTH & MONITORING ============

// Get system health status
exports.getSystemHealth = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  // Database connectivity check
  let dbStatus = 'healthy';
  try {
    await User.findOne().limit(1);
  } catch (error) {
    dbStatus = 'unhealthy';
  }

  // Get data consistency metrics
  const consistencyStats = await Promise.all([
    User.countDocuments(),
    Doctor.countDocuments(),
    Appointment.countDocuments(),
    Prescription.countDocuments()
  ]);

  return sendSuccess(res, 200, 'System health retrieved', {
    status: 'operational',
    database: {
      status: dbStatus,
      collections: {
        users: consistencyStats[0],
        doctors: consistencyStats[1],
        appointments: consistencyStats[2],
        prescriptions: consistencyStats[3]
      }
    },
    timestamp: new Date()
  });
});

// Get pending actions/alerts
exports.getSystemAlerts = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  const alerts = [];

  // Check for inactive doctors
  const inactiveDoctors = await Doctor.countDocuments({ 'userId.isActive': false });

  if (inactiveDoctors > 0) {
    alerts.push({
      type: 'info',
      message: `${inactiveDoctors} inactive doctors in system`,
      severity: 'low'
    });
  }

  return sendSuccess(res, 200, 'System alerts retrieved', {
    alertCount: alerts.length,
    alerts: alerts
  });
});

// ============ REPORTS ============

// Generate daily report
exports.generateDailyReport = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Admin access required');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointmentStats = await Appointment.aggregate([
    {
      $match: {
        date: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
        }
      }
    }
  ]);

  const userStats = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  return sendSuccess(res, 200, 'Daily report generated', {
    date: today.toISOString().split('T')[0],
    appointments: appointmentStats[0] || {},
    newUsers: Object.fromEntries(userStats.map(u => [u._id, u.count]))
  });
});
