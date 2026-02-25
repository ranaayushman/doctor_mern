/**
 * TimeSlot Controller
 * Manages doctor availability and time slot scheduling
 * Implements double-booking prevention
 */

const TimeSlot = require('../models/TimeSlot');
const Doctor = require('../models/Doctor');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * CREATE TIME SLOTS FOR DOCTOR
 * POST /api/timeslots
 * 
 * Admin/Doctor creates availability slots
 * Bulk creation for convenience
 */
const createTimeSlots = asyncHandler(async (req, res) => {
  // doctorId from body (admin use) or from auth token (doctor use)
  const doctorId = req.body.doctorId || req.userId;
  const { date, dates, startTime, endTime, slotDuration = 30 } = req.body;

  // Support both single date and dates array
  const datesToProcess = dates && Array.isArray(dates) && dates.length > 0
    ? dates
    : date ? [date] : [];

  if (datesToProcess.length === 0) {
    return sendError(res, 400, 'At least one date is required');
  }

  // Validate doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  // Validate times
  if (startTime >= endTime) {
    return sendError(res, 400, 'End time must be after start time');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allCreatedSlots = [];

  for (const rawDate of datesToProcess) {
    const slotDate = new Date(rawDate);
    if (slotDate < today) continue; // skip past dates

  try {
    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startDate = new Date(slotDate);
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(slotDate);
    endDate.setHours(endHour, endMin, 0, 0);

    const createdSlots = [];
    let currentTime = new Date(startDate);

    // Generate slots with specified duration
    while (currentTime < endDate) {
      const slotStart = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const nextTime = new Date(currentTime);
      nextTime.setMinutes(nextTime.getMinutes() + slotDuration);

      const slotEnd = nextTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      // Check if slot already exists (prevents duplicates)
      const existingSlot = await TimeSlot.findOne({
        doctorId,
        date: slotDate,
        startTime: slotStart,
      });

      if (!existingSlot) {
        const newSlot = new TimeSlot({
          doctorId,
          date: slotDate,
          startTime: slotStart,
          endTime: slotEnd,
          isBooked: false,
          isCancelled: false,
        });

        await newSlot.save();
        createdSlots.push(newSlot);
      }

      currentTime = nextTime;
    }
    allCreatedSlots.push(...createdSlots);
  } catch (error) {
    if (error.code !== 11000) throw error;
    // skip duplicate key errors
  }
  }

  sendSuccess(res, 201, `${allCreatedSlots.length} time slots created successfully`, {
    slots: allCreatedSlots,
    count: allCreatedSlots.length,
  });
});

/**
 * GET AVAILABLE SLOTS FOR DOCTOR
 * GET /api/timeslots/:doctorId
 * 
 * Get all available (not booked) slots for a doctor
 * Filters by date range
 */
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { fromDate, toDate, date, page = 1, limit = 50 } = req.query;

  // Validate doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  // Build filter
  const filter = {
    doctorId,
    isBooked: false,
    isCancelled: false,
  };

  // Support ?date=YYYY-MM-DD (single day) or ?fromDate=...&toDate=...
  const resolvedFrom = fromDate || date;
  const resolvedTo = toDate || date;

  if (resolvedFrom || resolvedTo) {
    filter.date = {};
    if (resolvedFrom) {
      const d = new Date(resolvedFrom);
      d.setHours(0, 0, 0, 0);
      filter.date.$gte = d;
    }
    if (resolvedTo) {
      const d = new Date(resolvedTo);
      d.setHours(23, 59, 59, 999);
      filter.date.$lte = d;
    }
  } else {
    // Default: next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    filter.date = { $gte: today, $lte: sevenDaysLater };
  }

  // Pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * pageLimit;

  const slots = await TimeSlot.find(filter)
    .sort({ date: 1, startTime: 1 })
    .skip(skip)
    .limit(pageLimit);

  const total = await TimeSlot.countDocuments(filter);

  sendPaginated(
    res,
    200,
    'Available slots retrieved successfully',
    slots,
    total,
    pageNum,
    pageLimit
  );
});

/**
 * GET ALL SLOTS FOR DOCTOR (including booked)
 * GET /api/timeslots/doctor/:doctorId/all
 * 
 * Admin/Doctor view: see all slots including booked ones
 */
const getAllSlotsForDoctor = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { fromDate, toDate, page = 1, limit = 20, status = 'all' } = req.query;

  // Validate doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  // Build filter
  const filter = { doctorId };

  // Filter by status
  if (status === 'available') {
    filter.isBooked = false;
    filter.isCancelled = false;
  } else if (status === 'booked') {
    filter.isBooked = true;
  } else if (status === 'cancelled') {
    filter.isCancelled = true;
  }

  // Add date range filter
  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) {
      filter.date.$gte = new Date(fromDate);
    }
    if (toDate) {
      filter.date.$lte = new Date(toDate);
    }
  }

  // Pagination
  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * pageLimit;

  // Fetch slots
  const slots = await TimeSlot.find(filter)
    .sort({ date: 1, startTime: 1 })
    .skip(skip)
    .limit(pageLimit)
    .populate('appointmentId', 'patientId status');

  const total = await TimeSlot.countDocuments(filter);

  sendPaginated(res, 200, 'All slots retrieved successfully', slots, total, pageNum, pageLimit);
});

/**
 * GET SLOT BY ID
 * GET /api/timeslots/:id
 */
const getSlotById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const slot = await TimeSlot.findById(id).populate('appointmentId patientId doctorId');

  if (!slot) {
    return sendError(res, 404, 'Time slot not found');
  }

  sendSuccess(res, 200, 'Slot retrieved successfully', { slot });
});

/**
 * UPDATE TIME SLOT
 * PUT /api/timeslots/:id
 * 
 * Update slot details (can only update if not booked)
 */
const updateTimeSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startTime, endTime, notes } = req.body;

  const slot = await TimeSlot.findById(id);

  if (!slot) {
    return sendError(res, 404, 'Time slot not found');
  }

  // Cannot update if already booked
  if (slot.isBooked) {
    return sendError(res, 400, 'Cannot update a booked time slot');
  }

  // Update fields
  if (startTime) slot.startTime = startTime;
  if (endTime) slot.endTime = endTime;
  if (notes !== undefined) slot.notes = notes;

  // Validate times
  if (slot.startTime >= slot.endTime) {
    return sendError(res, 400, 'End time must be after start time');
  }

  await slot.save();

  sendSuccess(res, 200, 'Time slot updated successfully', { slot });
});

/**
 * CANCEL TIME SLOT
 * POST /api/timeslots/:id/cancel
 * 
 * Mark slot as cancelled (doctor unavailable on that time)
 */
const cancelTimeSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const slot = await TimeSlot.findById(id);

  if (!slot) {
    return sendError(res, 404, 'Time slot not found');
  }

  // Cannot cancel if already booked
  if (slot.isBooked) {
    return sendError(res, 400, 'Cannot cancel a booked time slot. Cancel the appointment instead.');
  }

  // Cancel the slot
  slot.isCancelled = true;
  if (reason) slot.notes = `Cancelled: ${reason}`;

  await slot.save();

  sendSuccess(res, 200, 'Time slot cancelled successfully', { slot });
});

/**
 * DELETE TIME SLOT
 * DELETE /api/timeslots/:id
 * 
 * Permanently delete slot (only if not booked)
 */
const deleteTimeSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const slot = await TimeSlot.findById(id);

  if (!slot) {
    return sendError(res, 404, 'Time slot not found');
  }

  // Cannot delete if booked
  if (slot.isBooked) {
    return sendError(res, 400, 'Cannot delete a booked time slot');
  }

  await TimeSlot.findByIdAndDelete(id);

  sendSuccess(res, 200, 'Time slot deleted successfully', { slotId: id });
});

/**
 * BULK DELETE SLOTS
 * POST /api/timeslots/bulk-delete
 * 
 * Delete multiple slots at once
 */
const bulkDeleteSlots = asyncHandler(async (req, res) => {
  const { doctorId, fromDate, toDate } = req.body;

  if (!doctorId || !fromDate || !toDate) {
    return sendError(res, 400, 'doctorId, fromDate, and toDate are required');
  }

  // Check if any slots are booked in this range
  const bookedSlots = await TimeSlot.countDocuments({
    doctorId,
    date: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    },
    isBooked: true,
  });

  if (bookedSlots > 0) {
    return sendError(
      res,
      400,
      `Cannot delete ${bookedSlots} booked slot(s) in this date range. Cancel appointments first.`
    );
  }

  // Delete slots
  const result = await TimeSlot.deleteMany({
    doctorId,
    date: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    },
    isBooked: false,
  });

  sendSuccess(res, 200, `${result.deletedCount} slots deleted successfully`, {
    deletedCount: result.deletedCount,
  });
});

/**
 * GET SLOT STATISTICS
 * GET /api/timeslots/:doctorId/stats
 * 
 * Get availability statistics for doctor
 */
const getSlotStats = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  // Validate doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return sendError(res, 404, 'Doctor not found');
  }

  const stats = await TimeSlot.aggregate([
    {
      $match: { doctorId: require('mongoose').Types.ObjectId(doctorId) },
    },
    {
      $group: {
        _id: null,
        totalSlots: { $sum: 1 },
        bookedSlots: {
          $sum: { $cond: ['$isBooked', 1, 0] },
        },
        availableSlots: {
          $sum: { $cond: [{ $and: [{ $not: '$isBooked' }, { $not: '$isCancelled' }] }, 1, 0] },
        },
        cancelledSlots: {
          $sum: { $cond: ['$isCancelled', 1, 0] },
        },
      },
    },
  ]);

  const statData = stats.length > 0 ? stats[0] : {
    totalSlots: 0,
    bookedSlots: 0,
    availableSlots: 0,
    cancelledSlots: 0,
  };

  sendSuccess(res, 200, 'Slot statistics retrieved successfully', statData);
});

module.exports = {
  createTimeSlots,
  getAvailableSlots,
  getAllSlotsForDoctor,
  getSlotById,
  updateTimeSlot,
  cancelTimeSlot,
  deleteTimeSlot,
  bulkDeleteSlots,
  getSlotStats,
};
