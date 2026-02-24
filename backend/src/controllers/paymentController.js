/**
 * Payment Controller
 * Handles payment processing with Razorpay integration
 * Payment verification, invoice generation, refunds
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateInvoicePDF } = require('../utils/invoiceGenerator');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * CREATE RAZORPAY ORDER
 * POST /api/payments/create-order
 * 
 * Creates Razorpay order for appointment payment
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;
  const patientId = req.userId;

  // Validate appointment exists
  const appointment = await Appointment.findById(appointmentId)
    .populate('doctorId', 'consultationFee firstName lastName')
    .populate('patientId', 'email phone firstName lastName');

  if (!appointment) {
    return sendError(res, 404, 'Appointment not found');
  }

  // Verify patient owns this appointment
  if (appointment.patientId._id.toString() !== patientId) {
    return sendError(res, 403, 'You can only pay for your own appointments');
  }

  // Check if already paid
  if (appointment.isPaid) {
    return sendError(res, 400, 'This appointment is already paid');
  }

  // Check if payment already exists
  let payment = await Payment.findOne({ appointmentId, status: 'Pending' });

  if (payment) {
    // Return existing pending order
    return sendSuccess(res, 200, 'Razorpay order retrieved', {
      orderId: payment.razorpayOrderId,
      amount: payment.amount,
      currency: payment.currency,
    });
  }

  // ============= CREATE NEW ORDER =============

  const amount = appointment.consultationFee;
  const amountInPaise = amount * 100; // Convert to paise for Razorpay

  try {
    // Create order with Razorpay
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${appointmentId}_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
      notes: {
        appointmentId: appointmentId,
        patientName: appointment.patientId.firstName + ' ' + appointment.patientId.lastName,
        doctorName: appointment.doctorId.firstName + ' ' + appointment.doctorId.lastName,
        consultationType: appointment.consultationType,
      },
    });

    // Create payment record in database
    payment = new Payment({
      appointmentId,
      patientId,
      doctorId: appointment.doctorId._id,
      amount,
      currency: 'INR',
      razorpayOrderId: razorpayOrder.id,
      status: 'Pending',
      attemptCount: 1,
    });

    await payment.save();

    // Return order details to frontend
    sendSuccess(res, 201, 'Razorpay order created successfully', {
      orderId: razorpayOrder.id,
      amount: amount,
      currency: 'INR',
      patientEmail: appointment.patientId.email,
      patientPhone: appointment.patientId.phone,
      doctorName: `${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: `${appointment.startTime} - ${appointment.endTime}`,
      keyId: process.env.RAZORPAY_KEY_ID, // For frontend Razorpay integration
    });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    return sendError(res, 500, 'Failed to create payment order', error.message);
  }
});

/**
 * VERIFY PAYMENT
 * POST /api/payments/verify
 * 
 * Verify payment from Razorpay webhook or frontend
 * CRITICAL: Verify Razorpay signature to prevent fraud
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  // ============= SIGNATURE VERIFICATION =============
  // CRITICAL SECURITY: Verify signature to ensure payment is from Razorpay
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const computedSignature = hmac.digest('hex');

  if (computedSignature !== razorpaySignature) {
    return sendError(
      res,
      400,
      'Payment verification failed! Signature mismatch - potential fraud attempt'
    );
  }

  // ============= UPDATE PAYMENT RECORD =============

  // Find payment by order ID
  const payment = await Payment.findOne({ razorpayOrderId });

  if (!payment) {
    return sendError(res, 404, 'Payment record not found');
  }

  if (payment.status === 'Completed') {
    return sendSuccess(res, 200, 'Payment already verified', {
      paymentId: payment._id,
      status: 'Completed',
    });
  }

  try {
    // Fetch payment details from Razorpay to double-check
    const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);

    // Verify amount matches
    if (razorpayPayment.amount !== payment.amount * 100) {
      throw new Error('Amount mismatch');
    }

    // Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'Completed';
    payment.paymentStatus = 'Completed';
    payment.transactionId = razorpayPaymentId;
    payment.transactionDate = new Date();
    payment.utrNumber = razorpayPayment.vpa || 'N/A';
    payment.paymentMethod = razorpayPayment.method || 'Card';

    if (razorpayPayment.description) {
      payment.notes = razorpayPayment.description;
    }

    await payment.save();

    // ============= UPDATE APPOINTMENT =============

    const appointment = await Appointment.findByIdAndUpdate(
      payment.appointmentId,
      {
        isPaid: true,
        paymentStatus: 'Completed',
        paymentId: payment._id,
        status: 'Confirmed', // Auto-confirm after payment
      },
      { new: true }
    );

    // ============= UPDATE DOCTOR STATS =============

    await Doctor.findByIdAndUpdate(
      payment.doctorId,
      { $inc: { totalAppointments: 1 } },
      { new: true }
    );

    // Generate invoice number
    const invoiceNumber = `INV-${payment._id.toString().slice(-8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    payment.invoiceNumber = invoiceNumber;
    await payment.save();

    sendSuccess(res, 200, 'Payment verified successfully', {
      paymentId: payment._id,
      appointmentId: appointment._id,
      invoiceNumber: payment.invoiceNumber,
      status: 'Completed',
      message: 'Your appointment is now confirmed. Check your email for appointment details.',
    });
  } catch (error) {
    console.error('Payment Verification Error:', error);

    // Update payment status to failed
    payment.status = 'Failed';
    payment.paymentStatus = 'Failed';
    payment.failureReason = error.message;
    await payment.save();

    return sendError(res, 400, 'Payment verification failed', error.message);
  }
});

/**
 * GET PAYMENT STATUS
 * GET /api/payments/:appointmentId
 * 
 * Check payment status for an appointment
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const payment = await Payment.findOne({ appointmentId }).select('-razorpaySignature');

  if (!payment) {
    return sendSuccess(res, 200, 'No payment found, appointment is unpaid', {
      status: 'Unpaid',
      requiresPayment: true,
    });
  }

  sendSuccess(res, 200, 'Payment status retrieved', {
    paymentId: payment._id,
    status: payment.status,
    paymentStatus: payment.paymentStatus,
    amount: payment.amount,
    currency: payment.currency,
    transactionDate: payment.transactionDate,
    invoiceNumber: payment.invoiceNumber,
  });
});

/**
 * GET PAYMENT HISTORY
 * GET /api/payments?page=1&limit=10
 * 
 * List all payments for authenticated user (patient or doctor view)
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { page = 1, limit = 10, status = 'all', sortBy = 'transactionDate', order = 'desc' } = req.query;

  // Build filter based on user role
  const filter = userRole === 'patient' ? { patientId: userId } : { doctorId: userId };

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

  // Fetch payments
  const payments = await Payment.find(filter)
    .populate('appointmentId', 'doctorId patientId appointmentDate startTime')
    .sort(sortObj)
    .skip(skip)
    .limit(pageLimit)
    .select('-razorpaySignature');

  const total = await Payment.countDocuments(filter);

  sendPaginated(res, 200, 'Payment history retrieved', payments, total, pageNum, pageLimit);
});

/**
 * DOWNLOAD INVOICE
 * GET /api/payments/:paymentId/invoice
 * 
 * Generate and download invoice PDF
 */
const downloadInvoice = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.userId;

  const payment = await Payment.findById(paymentId)
    .populate('appointmentId')
    .populate('patientId', 'firstName lastName email phone address')
    .populate('doctorId', 'firstName lastName specialization clinic');

  if (!payment) {
    return sendError(res, 404, 'Payment record not found');
  }

  // Verify authorization
  if (payment.patientId._id.toString() !== userId && payment.doctorId._id.toString() !== userId) {
    return sendError(res, 403, 'You are not authorized to download this invoice');
  }

  try {
    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      payment,
      appointment: payment.appointmentId,
      patient: payment.patientId,
      doctor: payment.doctorId,
    });

    // Send PDF to client
    res.contentType('application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Invoice-${payment.invoiceNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Invoice Generation Error:', error);
    return sendError(res, 500, 'Failed to generate invoice', error.message);
  }
});

/**
 * REQUEST REFUND
 * POST /api/payments/:paymentId/refund
 * 
 * Initiate refund for cancelled appointments
 */
const requestRefund = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.userId;
  const { reason } = req.body;

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    return sendError(res, 404, 'Payment record not found');
  }

  // Verify ownership
  if (payment.patientId.toString() !== userId) {
    return sendError(res, 403, 'You can only refund your own payments');
  }

  // Check if already refunded
  if (payment.refundStatus === 'Completed') {
    return sendError(res, 400, 'This payment is already refunded');
  }

  // Check if payment is completed
  if (payment.status !== 'Completed') {
    return sendError(res, 400, 'Can only refund completed payments');
  }

  try {
    // Create refund with Razorpay
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: payment.amount * 100, // Amount in paise
      notes: {
        reason: reason || 'Appointment cancelled',
        refundRequestedAt: new Date().toISOString(),
      },
    });

    // Update payment record
    payment.refundId = refund.id;
    payment.refundAmount = payment.amount;
    payment.refundStatus = 'Completed';
    payment.refundDate = new Date();
    payment.refundReason = reason || 'Appointment cancelled';
    payment.status = 'Refunded';

    await payment.save();

    // Update appointment payment status
    await Appointment.findByIdAndUpdate(payment.appointmentId, {
      isPaid: false,
      paymentStatus: 'Refunded',
    });

    sendSuccess(res, 200, 'Refund processed successfully', {
      refundId: refund.id,
      refundAmount: payment.refundAmount,
      refundStatus: 'Completed',
      message: 'Refund will be credited to your original payment method within 5-7 business days',
    });
  } catch (error) {
    console.error('Refund Error:', error);

    // Update refund status as pending
    payment.refundStatus = 'Pending';
    payment.refundReason = reason || 'Appointment cancelled';
    await payment.save();

    return sendError(res, 500, 'Refund processing failed', error.message);
  }
});

/**
 * GET PAYMENT STATISTICS
 * GET /api/payments/stats
 * 
 * Get payment statistics (for doctor dashboard)
 */
const getPaymentStats = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const userRole = req.userRole;

  const filter = userRole === 'patient' ? { patientId: userId } : { doctorId: userId };

  const stats = await Payment.aggregate([
    {
      $match: filter,
    },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        completedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] },
        },
        refundedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'Refunded'] }, 1, 0] },
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, '$amount', 0] },
        },
        totalRefunded: {
          $sum: { $cond: [{ $eq: ['$status', 'Refunded'] }, '$refundAmount', 0] },
        },
        netRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'Completed'] },
              { $subtract: ['$amount', { $cond: ['$refundAmount', '$refundAmount', 0] }] },
              0,
            ],
          },
        },
      },
    },
  ]);

  const statData = stats.length > 0 ? stats[0] : {
    totalTransactions: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    totalRevenue: 0,
    totalRefunded: 0,
    netRevenue: 0,
  };

  sendSuccess(res, 200, 'Payment statistics retrieved', statData);
});

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,
  getPaymentHistory,
  downloadInvoice,
  requestRefund,
  getPaymentStats,
};
