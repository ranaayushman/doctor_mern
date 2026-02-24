# Frontend API Integration Guide

## Overview

This guide explains how the frontend communicates with the backend API, including authentication flow, error handling, and common patterns used throughout the application.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Components                            │
│  (Pages: LoginPage, DoctorSearchPage, AppointmentBooking, etc)  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
                ┌──────────────────────────┐
                │   useAuth() Hook         │
                │  (AuthContext)           │
                │  - login()               │
                │  - register()            │
                │  - logout()              │
                │  - updateProfile()       │
                │  - user state            │
                └────────────┬─────────────┘
                             │
                             ↓
        ┌──────────────────────────────────────────┐
        │      Service Modules                     │
        │  ┌──────────────────────────────────┐   │
        │  │ authService                      │   │
        │  │ - login(email, pwd, isDoctor)    │   │
        │  │ - register(userData)             │   │
        │  │ - getProfile()                   │   │
        │  │ - updateProfile(data)            │   │
        │  └──────────────────────────────────┘   │
        │  ┌──────────────────────────────────┐   │
        │  │ doctorService                    │   │
        │  │ - getAll(params)                 │   │
        │  │ - search(params)                 │   │
        │  │ - getById(id)                    │   │
        │  │ - getReviews(id)                 │   │
        │  └──────────────────────────────────┘   │
        │  ┌──────────────────────────────────┐   │
        │  │ appointmentService               │   │
        │  │ - getPatientAppointments()       │   │
        │  │ - getDoctorAppointments()        │   │
        │  │ - createAppointment(data)        │   │
        │  │ - rescheduleAppointment(id, data)│  │
        │  │ - cancelAppointment(id)          │   │
        │  │ - getAvailableSlots(id, date)    │   │
        │  └──────────────────────────────────┘   │
        │  ┌──────────────────────────────────┐   │
        │  │ paymentService                   │   │
        │  │ - createPaymentOrder(data)       │   │
        │  │ - verifyPayment(data)            │   │
        │  │ - getPaymentHistory()            │   │
        │  └──────────────────────────────────┘   │
        │  ┌──────────────────────────────────┐   │
        │  │ prescriptionService              │   │
        │  │ - getPatientPrescriptions()      │   │
        │  │ - createPrescription(data)       │   │
        │  │ - downloadPrescription(id)       │   │
        │  │ - deletePrescription(id)         │   │
        │  └──────────────────────────────────┘   │
        │  ┌──────────────────────────────────┐   │
        │  │ adminService                     │   │
        │  │ - getDashboardStats()            │   │
        │  │ - getUsersList(params)           │   │
        │  │ - updateUserStatus(id, status)   │   │
        │  │ - getPaymentAnalytics()          │   │
        │  └──────────────────────────────────┘   │
        └──────────────────┬───────────────────────┘
                           │
                           ↓
            ┌──────────────────────────────┐
            │   api.js (Axios Instance)    │
            │  ┌────────────────────────┐ │
            │  │ Request Interceptor    │ │
            │  │ - Add Bearer token to  │ │
            │  │   Authorization header │ │
            │  └────────────────────────┘ │
            │  ┌────────────────────────┐ │
            │  │ Response Interceptor   │ │
            │  │ - Check for 401        │ │
            │  │ - Auto-logout if found │ │
            │  │ - Handle errors        │ │
            │  └────────────────────────┘ │
            └──────────────────┬───────────┘
                               │
                               ↓
                ┌────────────────────────────┐
                │   REST API                 │
                │   (Backend - Port 5000)    │
                │   53 Total Endpoints       │
                └────────────────────────────┘
```

## Authentication Flow

### 1. User Login

**Request:**
```javascript
// From LoginPage.jsx
const { login } = useAuth();

try {
  const result = await login('user@email.com', 'password', false); // false = patient
  if (result.success) {
    navigate('/patient/dashboard');
  }
} catch (error) {
  setError(error.message);
}
```

**Backend Call:**
```javascript
// In AuthContext.jsx
const login = async (email, password, isDoctor) => {
  const response = await authService.login(email, password, isDoctor);
  // Returns: { token, user: { userId, email, role, firstName, lastName, ... } }
  
  localStorage.setItem('token', response.token);
  localStorage.setItem('user', JSON.stringify(response.user));
  setUser(response.user);
  setIsAuthenticated(true);
};
```

**Request Details:**
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "isDoctor": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "phone": "+91-xxxxxxxxxx",
      "city": "Mumbai",
      "state": "Maharashtra"
    }
  }
}
```

### 2. Token Storage & Use

**Where Token is Stored:**
```javascript
// localStorage key: 'token'
localStorage.setItem('token', response.token);
```

**How Token is Used:**
```javascript
// In api.js (Axios request interceptor)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

**All Subsequent Requests Include Token**
```
GET /appointments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Token Expiration Handling

**Auto-Logout on 401:**
```javascript
// In api.js (Axios response interceptor)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

## Service Module Pattern

Every service module follows this consistent pattern:

### Example: doctorService

**File Location:** `src/services/doctorService.js`

```javascript
import { api } from './api';
import { API_ENDPOINTS } from '../config/api';

export const doctorService = {
  // Get all doctors with optional filters
  getAll: async (params = {}) => {
    return api.get(API_ENDPOINTS.DOCTORS.GET_ALL, { params });
  },

  // Search doctors by name, specialization, etc
  search: async (params = {}) => {
    return api.get(API_ENDPOINTS.DOCTORS.SEARCH, { params });
  },

  // Get single doctor by ID
  getById: async (id) => {
    return api.get(API_ENDPOINTS.DOCTORS.GET_ONE(id));
  },

  // Get doctor reviews
  getReviews: async (doctorId, params = {}) => {
    return api.get(API_ENDPOINTS.DOCTORS.GET_REVIEWS(doctorId), { params });
  }
};
```

**Usage in Components:**
```javascript
// In DoctorSearchPage.jsx
const { doctorService } = await import('../services/doctorService');

useEffect(() => {
  const fetchDoctors = async () => {
    try {
      const response = await doctorService.getAll();
      setDoctors(response.data.data.doctors);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch');
    }
  };
  
  fetchDoctors();
}, []);
```

## API Endpoint Configuration

**File Location:** `src/config/api.js`

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`
  },

  // Doctors
  DOCTORS: {
    GET_ALL: `${API_BASE_URL}/doctors`,
    SEARCH: `${API_BASE_URL}/doctors/search`,
    GET_ONE: (id) => `${API_BASE_URL}/doctors/${id}`,
    GET_REVIEWS: (id) => `${API_BASE_URL}/doctors/${id}/reviews`
  },

  // Appointments
  APPOINTMENTS: {
    GET_PATIENT: `${API_BASE_URL}/appointments/patient`,
    GET_DOCTOR: `${API_BASE_URL}/appointments/doctor`,
    GET_ONE: (id) => `${API_BASE_URL}/appointments/${id}`,
    CREATE: `${API_BASE_URL}/appointments`,
    UPDATE: (id) => `${API_BASE_URL}/appointments/${id}`,
    CANCEL: (id) => `${API_BASE_URL}/appointments/${id}/cancel`,
    RESCHEDULE: (id) => `${API_BASE_URL}/appointments/${id}/reschedule`,
    AVAILABLE_SLOTS: (doctorId) => `${API_BASE_URL}/doctors/${doctorId}/slots`
  },

  // Payments
  PAYMENTS: {
    CREATE_ORDER: `${API_BASE_URL}/payments/create-order`,
    VERIFY: `${API_BASE_URL}/payments/verify`,
    HISTORY: `${API_BASE_URL}/payments/history`
  },

  // ... etc
};
```

## Common API Patterns

### 1. GET Request (Fetch Data)

```javascript
// Simple GET
const response = await doctorService.getAll();
const doctors = response.data.data.doctors;

// GET with parameters
const response = await doctorService.search({
  specialization: 'Cardiologist',
  rating: 4.5
});

// GET with pagination
const response = await appointmentService.getPatientAppointments({
  page: 1,
  limit: 10
});
```

### 2. POST Request (Create Data)

```javascript
// Create appointment
const response = await appointmentService.createAppointment({
  doctorId: '123',
  date: '2024-01-15',
  time: '10:00 AM',
  complaint: 'Chest pain'
});

// Response contains newly created resource
const appointmentId = response.data.data.appointmentId;
```

### 3. PUT Request (Update Data)

```javascript
// Update appointment time
const response = await appointmentService.rescheduleAppointment(
  appointmentId,
  {
    date: '2024-01-20',
    time: '2:00 PM'
  }
);

// Update user profile
const response = await authService.updateProfile({
  firstName: 'John',
  phone: '+91-9999999999',
  city: 'New Delhi'
});
```

### 4. DELETE Request (Remove Data)

```javascript
// Cancel appointment
const response = await appointmentService.cancelAppointment(appointmentId);

// Delete prescription
const response = await prescriptionService.deletePrescription(prescriptionId);
```

### 5. File Upload (Multipart)

```javascript
// Upload prescription attachment
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('appointmentId', appointmentId);

const response = await prescriptionService.uploadPrescription(formData);
// Note: Content-Type is automatically set to multipart/form-data by Axios
```

## Error Handling

### Standard Error Response Format

**Backend sends:**
```json
{
  "success": false,
  "message": "Appointment not found",
  "error": "NOT_FOUND",
  "statusCode": 404,
  "data": null
}
```

### Frontend Error Handling Pattern

```javascript
try {
  const response = await doctorService.getAll();
  setDoctors(response.data.data.doctors);
  setError(''); // Clear any previous errors
} catch (err) {
  // Backend error with message
  if (err.response?.data?.message) {
    setError(err.response.data.message);
  }
  // Network error or unknown
  else if (err.message) {
    setError(err.message);
  }
  // Fallback error
  else {
    setError('An unexpected error occurred. Please try again.');
  }
}
```

### Common HTTP Status Codes

| Code | Meaning | Frontend Action |
|------|---------|-----------------|
| 200 | Success | Update state, show success |
| 201 | Created | Show success toast |
| 400 | Bad Request | Show validation error |
| 401 | Unauthorized | Auto-logout, redirect to login |
| 403 | Forbidden | Redirect to home (no access) |
| 404 | Not Found | Show not found message |
| 500 | Server Error | Show generic error, retry option |

## Real-World Example: Appointment Booking Flow

### Step 1: User selects Doctor
```javascript
// In DoctorSearchPage.jsx
const handleBookAppointment = (doctorId) => {
  navigate(`/book-appointment/${doctorId}`);
};
```

### Step 2: Fetch Doctor Details & Available Slots
```javascript
// In AppointmentBooking.jsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const doctorRes = await doctorService.getById(doctorId);
      setDoctor(doctorRes.data.data);
      
      const slotsRes = await appointmentService.getAvailableSlots(
        doctorId,
        { date: today }
      );
      setAvailableSlots(slotsRes.data.data.slots);
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };
  fetchData();
}, [doctorId]);
```

### Step 3: Create Appointment
```javascript
// In AppointmentBooking.jsx - User submits form
const appointmentRes = await appointmentService.createAppointment({
  doctorId: doctorId,
  date: formData.appointmentDate,
  time: formData.appointmentTime,
  complaint: formData.complaint
});

const appointmentId = appointmentRes.data.data.appointmentId; // Save this
```

### Step 4: Create Razorpay Order
```javascript
const razorpayOrder = await paymentService.createPaymentOrder({
  appointmentId: appointmentId,
  amount: doctor.consultationFee * 100 // in paise
});
```

### Step 5: Display Razorpay Payment Modal
```javascript
const options = {
  key: import.meta.env.VITE_RAZORPAY_KEY,
  amount: razorpayOrder.data.data.amount,
  currency: 'INR',
  order_id: razorpayOrder.data.data.orderId,
  handler: async (response) => {
    // Step 6: User completes payment, handle response
  }
};

const razorpay = new window.Razorpay(options);
razorpay.open();
```

### Step 6: Verify Payment
```javascript
// In Razorpay response handler
try {
  const verifyRes = await paymentService.verifyPayment({
    orderId: razorpayOrder.data.data.orderId,
    razorpayPaymentId: response.razorpay_payment_id,
    razorpaySignature: response.razorpay_signature,
    appointmentId: appointmentId
  });

  // Payment verified successfully
  navigate('/patient/appointments', {
    state: { message: 'Appointment booked successfully!' }
  });
} catch (err) {
  setError('Payment verification failed');
}
```

## Data Flow Examples

### Example 1: Doctor Search & Filter

```
User types "Cardiologist" 
         ↓
DoctorSearchPage.jsx:
  - handleSearch(searchTerm)
  - Set local state: filteredDoctors
  - Call doctorService.search({ specialization: 'Cardiologist' })
         ↓
doctorService.js:
  - api.get(API_ENDPOINTS.DOCTORS.SEARCH, { params })
         ↓
Axios Interceptor:
  - Add Authorization header with token
  - GET /doctors/search?specialization=Cardiologist
         ↓
Backend:
  - Query database for doctors
  - Return: { doctors: [...], count: 5 }
         ↓
Axios Interceptor:
  - Check status code 200
  - Parse JSON response
         ↓
Response Handler:
  - Update filteredDoctors state
  - Render doctor cards
         ↓
User clicks "Book Appointment"
```

### Example 2: User Profile Update

```
User clicks "Edit Profile"
         ↓
ProfilePage.jsx:
  - Show edit form
  - User changes data
  - handleSubmit(formData)
         ↓
authService.js:
  - Call api.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, updateData)
         ↓
Axios Interceptor:
  - Add Authorization header
  - PUT /auth/profile
  - Body: { firstName: "Jane", phone: "+91-..." }
         ↓
Backend:
  - Validate data
  - Update database
  - Return updated user
         ↓
AuthContext.jsx:
  - updateProfile() function called
  - Update localStorage
  - Update user state
         ↓
Component re-renders with new data
```

## Testing API Integration

### Manual Testing Checklist

- [ ] Login with patient credentials
- [ ] Login with doctor credentials
- [ ] Logout and verify token removed
- [ ] Search doctors with filters
- [ ] Book appointment and verify slots
- [ ] Verify Razorpay payment modal appears
- [ ] Complete payment flow
- [ ] View created appointment in list
- [ ] Reschedule appointment
- [ ] Cancel appointment
- [ ] View prescriptions
- [ ] Download prescription PDF
- [ ] Edit user profile
- [ ] Verify all error scenarios (invalid data, network error, 404, 500, 401)

### Debugging Tips

**Check Network Tab in DevTools:**
```
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action
4. Check request headers (Authorization: Bearer token)
5. Check response status and data
```

**Check Console Errors:**
```javascript
// Add error logging
try {
  const response = await doctorService.getAll();
  console.log('Response:', response);
} catch (error) {
  console.error('Error:', error);
  console.error('Status:', error.response?.status);
  console.error('Message:', error.response?.data?.message);
}
```

**Check LocalStorage:**
```javascript
// In console:
localStorage.getItem('token'); // Should return JWT token
localStorage.getItem('user'); // Should return user object JSON
```

## Environment Variables

**File:** `.env.local`

```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY=rzp_test_abcd1234xyz
VITE_DEBUG=true
```

**Access in Code:**
```javascript
const API_URL = import.meta.env.VITE_API_URL;
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;
```

## Conclusion

This integration guide covers:
- ✅ How frontend communicates with backend
- ✅ Authentication flow with JWT tokens
- ✅ Service modules pattern
- ✅ API endpoint configuration
- ✅ Request/response handling
- ✅ Error management
- ✅ Real-world examples
- ✅ Testing and debugging

For more details, refer to the main README.md and individual service modules in the codebase.
