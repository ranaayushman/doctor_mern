# Doctor Appointment System - Frontend

A modern, responsive React Vite application for booking doctor appointments with role-based dashboards for patients, doctors, and administrators.

## Features

### 🔐 Authentication
- Patient & Doctor registration with role-specific fields
- Secure JWT-based authentication
- Auto-logout on token expiration
- Protected routes with role-based access control

### 🏥 Core Features

#### Patient Features
- Search doctors by specialization and rating
- View doctor profiles and availability
- Book appointments with real-time slot availability
- Manage appointment scheduling and rescheduling
- Cancel appointments with confirmation
- View and download prescriptions
- Track payment history
- Update profile information

#### Doctor Features
- Dashboard with appointment statistics
- View upcoming patient appointments
- Manage appointment status
- View patient details and complaints
- Access prescription records
- Track consultation earnings
- Update professional information

#### Admin Features
- System dashboard with key metrics
- User management and status tracking
- Payment analytics and revenue charts
- Appointment statistics
- System health monitoring
- Recent transaction logs

### 💳 Payment Integration
- Razorpay payment gateway integration
- Secure payment processing
- Order tracking and verification
- Payment history records

### 📱 Responsive Design
- Mobile-first responsive layout
- Desktop, tablet, and mobile optimized
- Touch-friendly navigation
- Clean and modern UI

## Tech Stack

- **Framework:** React 18.2.0
- **Build Tool:** Vite 4
- **Routing:** React Router 6
- **API Client:** Axios with interceptors
- **State Management:** React Context API
- **Icons:** Lucide React
- **Styling:** Custom CSS with CSS variables
- **Payment:** Razorpay SDK

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API running on `http://localhost:5000`

### Setup Steps

1. **Clone the repository**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY=your_razorpay_key_id
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── main.jsx                      # React entry point
├── App.jsx                       # Router configuration
├── config/
│   └── api.js                    # API endpoints mapping
├── context/
│   └── AuthContext.jsx           # Authentication state management
├── services/
│   ├── api.js                    # Axios instance with interceptors
│   ├── authService.js            # Auth endpoints
│   ├── doctorService.js          # Doctor search/profile
│   ├── appointmentService.js     # Appointment management
│   ├── paymentService.js         # Razorpay integration
│   ├── prescriptionService.js    # Prescription management
│   └── adminService.js           # Admin dashboard
├── components/
│   ├── Navigation.jsx            # Navigation bar
│   ├── ErrorBoundary.jsx         # Error handling
│   └── index.jsx                 # Reusable components
├── pages/
│   ├── HomePage.jsx              # Landing page
│   ├── LoginPage.jsx             # Login
│   ├── RegisterPage.jsx          # Registration
│   ├── DoctorSearchPage.jsx      # Doctor search
│   ├── AppointmentBooking.jsx    # Booking page
│   ├── PatientDashboard.jsx      # Patient dashboard
│   ├── DoctorDashboard.jsx       # Doctor dashboard
│   ├── AdminDashboard.jsx        # Admin dashboard
│   ├── AppointmentsList.jsx      # Manage appointments
│   ├── PrescriptionsList.jsx     # Manage prescriptions
│   ├── ProfilePage.jsx           # User profile
│   └── NotFound.jsx              # 404 page
└── styles/
    ├── index.css                 # Global styles
    ├── navigation.css            # Navigation styling
    ├── auth.css                  # Auth pages styling
    ├── home.css                  # Homepage styling
    ├── doctors.css               # Doctor search styling
    └── dashboard.css             # Dashboard styling
```

## API Integration

### Authentication Flow
1. User logs in with email and password
2. Backend returns JWT token and user data
3. Token stored in localStorage
4. Axios interceptor adds token to all requests
5. On 401 response, auto-logout and redirect to login

### Service Modules

**authService**
- `login(email, password, isDoctor)` - User login
- `register(data)` - User registration
- `getProfile()` - Fetch user profile
- `updateProfile(data)` - Update user info

**doctorService**
- `getAll(params)` - List all doctors
- `search(params)` - Search doctors
- `getById(id)` - Get doctor details
- `getReviews(id)` - Get doctor reviews

**appointmentService**
- `getPatientAppointments()` - User's appointments
- `getDoctorAppointments()` - Doctor's appointments
- `createAppointment(data)` - Book appointment
- `rescheduleAppointment(id, data)` - Reschedule
- `cancelAppointment(id)` - Cancel appointment
- `getAvailableSlots(doctorId, date)` - Available time slots

**paymentService**
- `createPaymentOrder(data)` - Create Razorpay order
- `verifyPayment(data)` - Verify payment signature
- `getPaymentHistory()` - User's payment records

**prescriptionService**
- `getPatientPrescriptions()` - User's prescriptions
- `createPrescription(data)` - Create prescription
- `downloadPrescription(id)` - Download PDF
- `deletePrescription(id)` - Delete prescription

**adminService**
- `getDashboardStats()` - Dashboard statistics
- `getUsersList(params)` - List all users
- `updateUserStatus(id, status)` - Change user status
- `getPaymentAnalytics()` - Payment data
- `getAppointmentAnalytics()` - Appointment data
- `getDoctorAnalytics()` - Doctor performance data

## Authentication Details

### Protected Routes

The application uses `ProtectedRoute` component for role-based access:

```jsx
<ProtectedRoute requiredRole="patient">
  <Route path="/patient/dashboard" element={<PatientDashboard />} />
</ProtectedRoute>
```

### Available Roles
- `patient` - Regular users booking appointments
- `doctor` - Healthcare professionals
- `admin` - System administrators

### Token Management

**Storage:** localStorage with key `token`
**Header Format:** `Authorization: Bearer <token>`
**Expiration:** Handled by backend (default 7 days)
**Refresh:** Automatic on login

## Styling System

### CSS Variables
The application uses CSS variables for consistent theming:

```css
--primary: #2563eb        /* Main brand color */
--secondary: #6b7280      /* Secondary text */
--success: #10b981        /* Success states */
--warning: #f59e0b        /* Warning states */
--danger: #ef4444         /* Error states */
--light-bg: #f9fafb       /* Light backgrounds */
--border: #e5e7eb         /* Border color */
```

### Responsive Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

## Component Usage

### Loader Component
```jsx
<Loader />              // Inline spinner
<Loader fullPage />     // Full-page spinner
```

### Alert Component
```jsx
<Alert type="success" message="Operation completed!" />
<Alert type="error" message="An error occurred" />
```

### Modal Component
```jsx
<Modal isOpen={isOpen} title="Confirm" onClose={handleClose}>
  Modal content here
</Modal>
```

### ProtectedRoute Component
```jsx
<ProtectedRoute requiredRole="doctor">
  <DoctorDashboard />
</ProtectedRoute>
```

## Form Handling

All forms use controlled components with state management:

```jsx
const [formData, setFormData] = useState({ ... });
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};
```

Validation occurs on form submission before sending to backend.

## Error Handling

### Error Boundary
Catches React component errors and displays fallback UI to prevent full app crash.

### API Errors
- 401: Auto-logout and redirect to login
- 400: Display validation errors from backend
- 500: Show generic error message with retry option

### User-Friendly Messages
All errors display in Alert components with actionable information.

## Performance Optimizations

- Lazy loading for route components
- Debounced search inputs
- Conditional API calls in useEffect
- CSS variables reduce style recalculations
- Efficient re-render with React Context

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Deployment

### Build for Production
```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Environment Variables for Production
```
VITE_API_URL=https://api.yourdomain.com/api
VITE_RAZORPAY_KEY=your_production_razorpay_key
```

### Hosting Options
- Vercel (recommended for Vite)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

## API Endpoints Reference

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Current user profile
- `PUT /auth/profile` - Update profile

### Doctors
- `GET /doctors` - List doctors
- `GET /doctors/search` - Search doctors
- `GET /doctors/:id` - Doctor details
- `GET /doctors/:id/reviews` - Doctor reviews
- `GET /doctors/:id/availability` - Available slots

### Appointments
- `GET /appointments` - User's appointments
- `POST /appointments` - Create appointment
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment
- `PUT /appointments/:id/reschedule` - Reschedule

### Payments
- `POST /payments/create-order` - Create Razorpay order
- `POST /payments/verify` - Verify payment
- `GET /payments/history` - Payment history

### Prescriptions
- `GET /prescriptions` - User's prescriptions
- `POST /prescriptions` - Create prescription
- `GET /prescriptions/:id` - Prescription details
- `GET /prescriptions/:id/download` - Download PDF
- `DELETE /prescriptions/:id` - Delete prescription

### Admin
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/users` - List users
- `PUT /admin/users/:id/status` - Update user status
- `GET /admin/payments/analytics` - Payment analytics
- `GET /admin/appointments/analytics` - Appointment analytics
- `GET /admin/doctors/analytics` - Doctor analytics

## Troubleshooting

### CORS Errors
Ensure backend CORS headers include your frontend URL:
```
Access-Control-Allow-Origin: http://localhost:3000
```

### Token Issues
- Check if token is in localStorage
- Verify token expiration
- Clear localStorage and re-login if needed

### API Connection
- Verify backend is running on correct port
- Check `VITE_API_URL` in `.env.local`
- Look for network errors in browser console

### Payment Integration
- Ensure Razorpay key is set in environment
- Test with Razorpay test keys first
- Check browser console for gateway errors

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review API documentation
3. Check backend logs for errors
4. Report issues with error messages and screenshots

## License

MIT License - see LICENSE file for details
