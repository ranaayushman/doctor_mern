/**
 * Prescription Model
 * Stores prescription data and medical documents/files
 * Related to appointments and used for file sharing
 */

const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    // References
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment ID is required'],
      unique: true,
      index: true,
    },
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

    // Prescription Details
    medicines: [
      {
        name: {
          type: String,
          required: true,
        },
        dosage: {
          type: String, // e.g., "500mg"
          required: true,
        },
        frequency: {
          type: String, // e.g., "Twice daily"
          required: true,
        },
        duration: {
          type: String, // e.g., "7 days"
          required: true,
        },
        instructions: String, // e.g., "Take with food"
      },
    ],

    // Diagnosis and Notes
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
    },
    treatmentPlan: String,
    doctorNotes: String,

    // Attached Files/Reports
    attachments: [
      {
        filename: String,
        originalName: String,
        fileType: {
          type: String,
          enum: ['PDF', 'Image', 'Document', 'Report', 'Lab Test', 'Scan', 'Other'],
        },
        fileUrl: String, // Cloud storage URL or local path
        fileSize: Number, // in bytes
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        uploadedBy: {
          type: String,
          enum: ['Doctor', 'Patient'],
        },
      },
    ],

    // Validity
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: Date, // Prescriptions usually valid for 3-6 months

    // Status
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Invalid'],
      default: 'Active',
    },

    // Lab Tests Recommended
    recommendedTests: [
      {
        testName: String,
        testType: String, // e.g., "Blood Test", "CT Scan"
        urgency: {
          type: String,
          enum: ['Normal', 'Urgent'],
          default: 'Normal',
        },
      },
    ],

    // Follow-up Instructions
    followUpDays: Number, // Follow-up appointment after N days
    nextCheckupDate: Date,

    // Allergies
    patientAllergies: [String], // Important for medication safety

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

// Index for finding active prescriptions
prescriptionSchema.index({ patientId: 1, status: 1 });
prescriptionSchema.index({ doctorId: 1, issuedDate: -1 });

// Method to check if prescription is expired
prescriptionSchema.methods.isExpired = function () {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

// Update status based on expiry date on save
prescriptionSchema.pre('save', function () {
  if (this.isExpired()) {
    this.status = 'Expired';
  }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
