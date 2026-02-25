/**
 * Doctor Model
 * Stores doctor information, qualifications, and registration details
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema(
  {
    // Basic Information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
      minlength: 6,
    },

    // Professional Information
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      enum: [
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
      ],
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
    },
    licenseVerified: {
      type: Boolean,
      default: false,
    },

    // Qualifications
    qualifications: [
      {
        degree: String, // e.g., MBBS, MD, DM
        institution: String,
        yearOfCompletion: Number,
      },
    ],

    // Experience
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },

    // Medical Registration
    medicalRegistration: {
      number: String,
      authority: String, // e.g., Medical Council
      registrationDate: Date,
    },

    // Address Information
    clinic: {
      name: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      phone: String,
    },

    // Consultation Fee
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative'],
    },

    // Working Hours
    workingHours: {
      monday: {
        startTime: String, // HH:mm format
        endTime: String,
        isAvailable: Boolean,
      },
      tuesday: {
        startTime: String,
        endTime: String,
        isAvailable: Boolean,
      },
      wednesday: {
        startTime: String,
        endTime: String,
        isAvailable: Boolean,
      },
      thursday: {
        startTime: String,
        endTime: String,
        isAvailable: Boolean,
      },
      friday: {
        startTime: String,
        endTime: String,
        isAvailable: Boolean,
      },
      saturday: {
        startTime: String,
        endTime: String,
        isAvailable: Boolean,
      },
      sunday: {
        startTime: String,
        endTime: String,
        isAvailable: Boolean,
      },
    },

    // Appointment Slot Duration (in minutes)
    slotDuration: {
      type: Number,
      default: 30, // Default 30 minutes
      enum: [15, 30, 45, 60],
    },

    // Profile
    profilePicture: String,
    bio: String,
    languages: [String], // Languages spoken

    // Ratings and Reviews
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    totalAppointments: {
      type: Number,
      default: 0,
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false, // Admin approval needed
    },
    approvalDate: Date,

    // Bank Details for Payments
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
    },

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

// Indexes for faster queries
doctorSchema.index({ email: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ city: '2dsphere' }); // For geospatial queries

// Hash password before saving
doctorSchema.pre('save', async function () {
  // Only hash if password is new or modified
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Virtual field for full name
doctorSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Method to get full name
doctorSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

// Method to compare passwords
doctorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive fields from response
doctorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.bankDetails;
  return obj;
};

module.exports = mongoose.model('Doctor', doctorSchema);
