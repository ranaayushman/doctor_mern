/**
 * Appointment Model
 * Manages appointment bookings between patients and doctors
 */

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    // References
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
      index: true,
    },

    // Appointment Details
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    startTime: {
      type: String, // HH:mm format
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String, // HH:mm format
      required: [true, 'End time is required'],
    },

    // Consultation Type
    consultationType: {
      type: String,
      enum: ['in-person', 'video', 'phone'],
      default: 'in-person',
      required: true,
    },

    // Consultation Mode (for online consultations)
    consultationMode: {
      type: String,
      enum: ['video-call', 'chat', 'phone-call'],
      default: 'video-call',
    },

    // Chief Complaint/Reason for Visit
    chiefComplaint: {
      type: String,
      required: [true, 'Chief complaint is required'],
    },
    medicalHistory: String, // Relevant medical history

    // Appointment Status
    status: {
      type: String,
      enum: ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled', 'No-Show'],
      default: 'Scheduled',
      index: true,
    },

    // Cancellation Details
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ['Patient', 'Doctor', 'Admin'],
    },
    cancellationDate: Date,

    // Rescheduling
    previousAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },

    // Consultation Fee
    consultationFee: {
      type: Number,
      required: true,
    },

    // Payment Status (bypassed - no payment required)
    isPaid: {
      type: Boolean,
      default: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Completed',
    },

    // Video Consultation Link (if applicable)
    videoCallLink: String,
    videoCallPassword: String,

    // Prescription and Documents
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null,
    },

    // Doctor's Notes
    doctorNotes: String,
    diagnosis: String,
    treatmentPlan: String,

    // Follow-up
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,

    // Ratings and Review (after appointment)
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: String,
    ratedAt: Date,

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

// Indexes for common queries
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, isPaid: 1 });

// Validate that endTime is after startTime
appointmentSchema.pre('save', function () {
  if (this.startTime >= this.endTime) {
    throw new Error('End time must be after start time');
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
