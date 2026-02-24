// src/services/paymentService.js
import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const paymentService = {
  createOrder: (data) => api.post(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, data),
  verify: (data) => api.post(API_ENDPOINTS.PAYMENTS.VERIFY, data),
  getHistory: (params) => api.get(API_ENDPOINTS.PAYMENTS.HISTORY, { params }),
  getById: (id) => api.get(API_ENDPOINTS.PAYMENTS.GET_ONE(id)),
  downloadInvoice: (id) => api.get(API_ENDPOINTS.PAYMENTS.INVOICE(id), { responseType: 'blob' }),
  requestRefund: (data) => api.post(API_ENDPOINTS.PAYMENTS.REFUND, data),
  getRefundStatus: (id) => api.get(API_ENDPOINTS.PAYMENTS.REFUND_STATUS(id))
};

// Initialize Razorpay
export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiatePayment = async (order, user) => {
  const isLoaded = await loadRazorpay();

  if (!isLoaded) {
    throw new Error('Razorpay SDK failed to load');
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount: order.amount,
      currency: order.currency || 'INR',
      order_id: order.id,
      name: 'Doctor Appointment System',
      description: `Appointment Payment`,
      customer_notify: 1,
      prefill: {
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        contact: user.phone
      },
      handler: function(response) {
        resolve(response);
      },
      modal: {
        ondismiss: function() {
          reject(new Error('Payment cancelled'));
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  });
};
