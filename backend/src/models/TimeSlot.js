/**
 * TimeSlot Model
 * Manages time slot availability for doctors
 * Prevents double booking by tracking which slots are booked
 */

const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    // Doctor Reference
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
      index: true,
    },

    // Date and Time
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String, // HH:mm format, e.g., "09:00"
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String, // HH:mm format
      required: [true, 'End time is required'],
    },

    // Status
    isBooked: {
      type: Boolean,
      default: false,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },

    // Appointment Reference (if booked)
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },

    // Patient Reference (if booked)
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Notes
    notes: String,

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to prevent double booking
// Ensures only one slot per doctor per date-time combination
timeSlotSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });

// Index for finding available slots
timeSlotSchema.index({ doctorId: 1, isBooked: 1, isCancelled: 1 });

// Validate that endTime is after startTime
timeSlotSchema.pre('save', function () {
  if (this.startTime >= this.endTime) {
    throw new Error('End time must be after start time');
  }
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
