/**
 * Payment Model
 * Tracks all payment transactions for appointments
 * Integrates with Razorpay payment gateway
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
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

    // Amount Details
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
    },

    // Razorpay Details
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay order ID is required'],
    },
    razorpaySignature: {
      type: String,
      default: null,
    },

    // Payment Method
    paymentMethod: {
      type: String,
      enum: ['Card', 'Netbanking', 'Wallet', 'UPI', 'EMI'],
      default: null,
    },

    // Payment Status
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
      default: 'Pending',
      index: true,
    },

    // Transaction Details
    transactionId: String,
    transactionDate: Date,

    // Refund Details
    refundId: String,
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ['None', 'Pending', 'Completed', 'Failed'],
      default: 'None',
    },
    refundDate: Date,
    refundReason: String,

    // Invoice Details
    invoiceNumber: String,
    invoiceUrl: String, // PDF link
    invoiceGeneratedAt: Date,

    // Error Handling
    failureReason: String, // If payment fails
    failureMessage: String,
    attemptCount: {
      type: Number,
      default: 1,
    },

    // Additional Information
    utrNumber: String, // Unique Transaction Reference
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

// Index for payment status and date queries
paymentSchema.index({ status: 1, transactionDate: -1 });
paymentSchema.index({ razorpayOrderId: 1 });

// Method to format amount in paise (for Razorpay)
paymentSchema.methods.getAmountInPaise = function () {
  return this.amount * 100;
};

module.exports = mongoose.model('Payment', paymentSchema);
