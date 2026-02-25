/**
 * Appointment Controller
 * Handles appointment booking, rescheduling, cancellation
 * Implements double-booking prevention
 */

const Appointment = require('../models/Appointment');
const TimeSlot = require('../models/TimeSlot');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * BOOK APPOINTMENT
 * POST /api/appointments
 * 
 * Critical: Implements double-booking prevention
 * 
 * Prevention strategy:
 * 1. Check if time slot exists and is available
 * 2. Use database transaction for atomic operation
 * 3. Unique index on (doctorId, date, startTime) in TimeSlot model
 */
const bookAppointment = asyncHandler(async (req, res) => {
  const patientId = req.userId;
  const {
    doctorId,
    appointmentDate,
    startTime,
    endTime,
    timeSlotId,
    consultationType,
    chiefComplaint,
    medicalHistory,
  } = req.body;

  // Validate doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  if (!doctor.isApproved) {
    return sendError(res, 400, 'Doctor is not approved to accept appointments');
  }

  // Validate patient exists
  const patient = await User.findById(patientId);
  if (!patient) {
    return sendError(res, 404, 'Patient not found');
  }

  // ============= DOUBLE-BOOKING PREVENTION LOGIC =============

  // STEP 1: Check if slot exists and is not booked
  // Prefer looking up by timeSlotId (avoids timezone date-matching issues).
  // Fall back to date-range + time search if no ID supplied.
  let existingSlot;
  if (timeSlotId) {
    existingSlot = await TimeSlot.findOne({
      _id: timeSlotId,
      doctorId,
      isBooked: false,
      isCancelled: false,
    });
  } else {
    // Date-range search: treat appointmentDate as a local calendar day
    const dayStart = new Date(appointmentDate + 'T00:00:00');
    const dayEnd   = new Date(appointmentDate + 'T23:59:59.999');
    existingSlot = await TimeSlot.findOne({
      doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      startTime,
      endTime,
      isBooked: false,
      isCancelled: false,
    });
  }

  if (!existingSlot) {
    return sendError(
      res,
      400,
      'This time slot is not available. Please select another time.'
    );
  }

  // STEP 2: Check if patient already has a confirmed appointment at this time
  const conflictingAppointment = await Appointment.findOne({
    patientId,
    appointmentDate: new Date(appointmentDate),
    startTime,
    status: { $nin: ['Cancelled', 'No-Show'] }, // Exclude cancelled/no-show
  });

  if (conflictingAppointment) {
    return sendError(res, 400, 'You already have an appointment at this time');
  }

  // STEP 3: Double-check that no other appointment is booking same slot simultaneously
  // This uses MongoDB's atomic operation
  const updatedSlot = await TimeSlot.findOneAndUpdate(
    {
      _id: existingSlot._id,
      isBooked: false, // Ensure still available
      isCancelled: false,
    },
    {
      isBooked: true,
    },
    { new: true, runValidators: true }
  );

  // If slot was already booked by another request, null is returned
  if (!updatedSlot) {
    return sendError(
      res,
      400,
      'This slot was just booked by another user. Please select another time.'
    );
  }

  // ============= APPOINTMENT CREATION =============

  // Create the appointment
  const appointment = new Appointment({
    patientId,
    doctorId,
    appointmentDate: new Date(appointmentDate),
    startTime,
    endTime,
    consultationType: consultationType || 'in-person',
    chiefComplaint,
    medicalHistory: medicalHistory || '',
    status: 'Confirmed',
    isPaid: true,
    paymentStatus: 'Completed',
    consultationFee: doctor.consultationFee,
  });

  await appointment.save();

  // Link appointment to time slot
  updatedSlot.appointmentId = appointment._id;
  updatedSlot.patientId = patientId;
  await updatedSlot.save();

  sendSuccess(res, 201, 'Appointment booked successfully', {
    appointment: {
      _id: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      consultationType: appointment.consultationType,
      status: appointment.status,
      consultationFee: appointment.consultationFee,
      createdAt: appointment.createdAt,
    },
    message: 'Your appointment has been confirmed',
  });
});

/**
 * GET PATIENT APPOINTMENTS
 * GET /api/appointments
 * 
 * Get all appointments for authenticated patient
 */
const getPatientAppointments = asyncHandler(async (req, res) => {
  const patientId = req.userId;
  const { status, page = 1, limit = 10, sortBy = 'appointmentDate', order = 'desc' } = req.query;

  // Build filter
  const filter = { patientId };

  if (status && status !== 'all') {
    filter.status = status;
  }

  // Pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  // Sort
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj = { [sortBy]: sortOrder };

  // Fetch appointments
  const appointments = await Appointment.find(filter)
    .populate('doctorId', 'firstName lastName specialization clinic.name')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  const total = await Appointment.countDocuments(filter);

  sendPaginated(
    res,
    200,
    'Patient appointments retrieved successfully',
    appointments,
    total,
    pageNum,
    pageLimit
  );
});

/**
 * GET DOCTOR APPOINTMENTS
 * GET /api/appointments/doctor/:doctorId
 * 
 * Get all appointments for authenticated doctor
 */
const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, sortBy = 'appointmentDate', order = 'desc' } = req.query;

  const filter = { doctorId: req.userId };

  if (status && status !== 'all') {
    filter.status = status;
  }

  // Pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  // Sort
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj = { [sortBy]: sortOrder };

  // Fetch appointments
  const appointments = await Appointment.find(filter)
    .populate('patientId', 'firstName lastName email phone')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit);

  const total = await Appointment.countDocuments(filter);

  sendPaginated(
    res,
    200,
    'Doctor appointments retrieved successfully',
    appointments,
    total,
    pageNum,
    pageLimit
  );
});

/**
 * GET APPOINTMENT BY ID
 * GET /api/appointments/:id
 */
const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = await Appointment.findById(id)
    .populate('patientId', 'firstName lastName email phone medicalHistory')
    .populate('doctorId', 'firstName lastName specialization clinic consultationFee');

  if (!appointment) {
    return sendError(res, 404, 'Appointment not found');
  }

  sendSuccess(res, 200, 'Appointment retrieved successfully', { appointment });
});

/**
 * RESCHEDULE APPOINTMENT
 * PUT /api/appointments/:id/reschedule
 * 
 * Changes appointment to new date/time
 * Frees old slot, books new slot with double-booking prevention
 */
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientId = req.userId;
  const { newAppointmentDate, newStartTime, newEndTime } = req.body;

  // Find existing appointment
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return sendError(res, 404, 'Appointment not found');
  }

  // Verify ownership
  if (appointment.patientId.toString() !== patientId) {
    return sendError(res, 403, 'You can only reschedule your own appointments');
  }

  // Check if appointment can be rescheduled
  const nonReschedulableStatuses = ['Completed', 'Cancelled', 'No-Show'];
  if (nonReschedulableStatuses.includes(appointment.status)) {
    return sendError(res, 400, `Cannot reschedule ${appointment.status} appointments`);
  }

  // ============= NEW SLOT BOOKING WITH PREVENTION =============

  // STEP 1: Check if new slot exists and is available
  const newSlot = await TimeSlot.findOne({
    doctorId: appointment.doctorId,
    date: new Date(newAppointmentDate),
    startTime: newStartTime,
    endTime: newEndTime,
    isBooked: false,
    isCancelled: false,
  });

  if (!newSlot) {
    return sendError(res, 400, 'New time slot is not available');
  }

  // STEP 2: Atomically book new slot
  const updatedNewSlot = await TimeSlot.findOneAndUpdate(
    {
      _id: newSlot._id,
      isBooked: false,
      isCancelled: false,
    },
    {
      isBooked: true,
      appointmentId: appointment._id,
      patientId,
    },
    { new: true }
  );

  if (!updatedNewSlot) {
    return sendError(res, 400, 'New slot was just booked. Please select another time.');
  }

  // ============= FREE OLD SLOT =============

  await TimeSlot.findOneAndUpdate(
    {
      doctorId: appointment.doctorId,
      date: appointment.appointmentDate,
      startTime: appointment.startTime,
    },
    {
      isBooked: false,
      appointmentId: null,
      patientId: null,
    }
  );

  // ============= UPDATE APPOINTMENT =============

  const oldAppointmentDate = appointment.appointmentDate;
  const oldStartTime = appointment.startTime;

  appointment.appointmentDate = new Date(newAppointmentDate);
  appointment.startTime = newStartTime;
  appointment.endTime = newEndTime;
  appointment.previousAppointmentId = id; // Track rescheduling history
  appointment.status = 'Rescheduled';

  await appointment.save();

  sendSuccess(res, 200, 'Appointment rescheduled successfully', {
    appointment: {
      _id: appointment._id,
      oldDate: oldAppointmentDate,
      oldTime: oldStartTime,
      newDate: appointment.appointmentDate,
      newTime: appointment.startTime,
      status: appointment.status,
    },
  });
});

/**
 * CANCEL APPOINTMENT
 * PUT /api/appointments/:id/cancel
 * 
 * Cancels appointment and frees up time slot
 */
const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const { reason, cancelledBy } = req.body;

  // Find appointment
  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return sendError(res, 404, 'Appointment not found');
  }

  // Verify authorization
  const isPatient = appointment.patientId.toString() === userId;
  const isDoctor = appointment.doctorId.toString() === userId;

  if (!isPatient && !isDoctor) {
    return sendError(res, 403, 'You are not authorized to cancel this appointment');
  }

  // Cannot cancel already cancelled/completed appointments
  if (['Cancelled', 'Completed'].includes(appointment.status)) {
    return sendError(
      res,
      400,
      `Cannot cancel ${appointment.status} appointments`
    );
  }

  // Cancel appointment
  appointment.status = 'Cancelled';
  appointment.cancellationReason = reason || 'No reason provided';
  appointment.cancelledBy = isPatient ? 'Patient' : 'Doctor';
  appointment.cancellationDate = new Date();

  await appointment.save();

  // ============= FREE UP TIME SLOT =============

  await TimeSlot.findOneAndUpdate(
    {
      doctorId: appointment.doctorId,
      date: appointment.appointmentDate,
      startTime: appointment.startTime,
      appointmentId: appointment._id,
    },
    {
      isBooked: false,
      appointmentId: null,
      patientId: null,
    }
  );

  sendSuccess(res, 200, 'Appointment cancelled successfully', {
    appointmentId: appointment._id,
  });
});

/**
 * UPDATE APPOINTMENT STATUS (Doctor only)
 * PUT /api/appointments/:id/status
 * 
 * Doctor updates appointment status (In Progress, Completed, etc.)
 */
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctorId = req.userId;
  const { status, doctorNotes, diagnosis } = req.body;

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return sendError(res, 404, 'Appointment not found');
  }

  // Verify doctor ownership
  if (appointment.doctorId.toString() !== doctorId) {
    return sendError(res, 403, 'Only the assigned doctor can update appointment status');
  }

  // Validate status transition
  const validStatuses = ['Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No-Show'];
  if (!validStatuses.includes(status)) {
    return sendError(res, 400, `Invalid status. Valid options: ${validStatuses.join(', ')}`);
  }

  // Update fields
  appointment.status = status;
  if (doctorNotes) appointment.doctorNotes = doctorNotes;
  if (diagnosis) appointment.diagnosis = diagnosis;

  await appointment.save();

  sendSuccess(res, 200, 'Appointment status updated successfully', { appointment });
});

/**
 * ADD APPOINTMENT REVIEW & RATING
 * POST /api/appointments/:id/review
 * 
 * Patient rates and reviews completed appointment
 */
const addAppointmentReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientId = req.userId;
  const { rating, review } = req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return sendError(res, 400, 'Rating must be between 1 and 5');
  }

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return sendError(res, 404, 'Appointment not found');
  }

  // Verify ownership
  if (appointment.patientId.toString() !== patientId) {
    return sendError(res, 403, 'You can only rate your own appointments');
  }

  // Can only rate completed appointments
  if (appointment.status !== 'Completed') {
    return sendError(res, 400, 'Can only rate completed appointments');
  }

  // Add rating
  appointment.rating = rating;
  appointment.review = review || '';
  appointment.ratedAt = new Date();

  await appointment.save();

  // TODO: Update doctor's average rating in Doctor model

  sendSuccess(res, 200, 'Review added successfully', {
    appointment: {
      _id: appointment._id,
      rating: appointment.rating,
      review: appointment.review,
      ratedAt: appointment.ratedAt,
    },
  });
});

/**
 * GET APPOINTMENT STATISTICS
 * GET /api/appointments/stats
 * 
 * Get statistics about appointments (for patient or doctor)
 */
const getAppointmentStats = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const userRole = req.userRole;

  const filter = userRole === 'patient' ? { patientId: userId } : { doctorId: userId };

  const stats = await Appointment.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: null,
        totalAppointments: { $sum: 1 },
        completedAppointments: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
        },
        cancelledAppointments: {
          $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] },
        },
        upcomingAppointments: {
          $sum: {
            $cond: [
              { $in: ['$status', ['Scheduled', 'Confirmed', 'In Progress']] },
              1,
              0,
            ],
          },
        },
        totalPaid: {
          $sum: { $cond: ['$isPaid', '$consultationFee', 0] },
        },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  const statData = stats.length > 0 ? stats[0] : {
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    upcomingAppointments: 0,
    totalPaid: 0,
    averageRating: 0,
  };

  sendSuccess(res, 200, 'Appointment statistics retrieved', statData);
});

module.exports = {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  addAppointmentReview,
  getAppointmentStats,
};
