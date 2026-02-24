/**
 * Payment Routes
 * Razorpay integration and payment processing
 */

const express = require('express');
const {
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,
  getPaymentHistory,
  downloadInvoice,
  requestRefund,
  getPaymentStats,
} = require('../controllers/paymentController');
const { protect, protectPatient } = require('../middleware/auth');

const router = express.Router();

// PAYMENT ENDPOINTS - All require authentication
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.get('/status/:appointmentId', protect, getPaymentStatus);
router.get('/', protect, getPaymentHistory);
router.get('/stats', protect, getPaymentStats);
router.get('/:paymentId/invoice', protect, downloadInvoice);
router.post('/:paymentId/refund', protect, protectPatient, requestRefund);

module.exports = router;
