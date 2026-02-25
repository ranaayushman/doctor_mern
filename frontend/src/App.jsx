// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { DoctorSearchPage } from './pages/DoctorSearchPage';
import { AppointmentBooking } from './pages/AppointmentBooking';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AppointmentsList } from './pages/AppointmentsList';
import { PrescriptionsList } from './pages/PrescriptionsList';
import { ProfilePage } from './pages/ProfilePage';
import { TimeSlotManagement } from './pages/TimeSlotManagement';
import { NotFound } from './pages/NotFound';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components';

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Navigation />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />
        <Route path="/doctors" element={<DoctorSearchPage />} />

        {/* Patient Routes */}
        <Route path="/patient/dashboard" element={<ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/appointments" element={<ProtectedRoute requiredRole="patient"><AppointmentsList /></ProtectedRoute>} />
        <Route path="/patient/prescriptions" element={<ProtectedRoute requiredRole="patient"><PrescriptionsList /></ProtectedRoute>} />
        <Route path="/patient/profile" element={<ProtectedRoute requiredRole="patient"><ProfilePage /></ProtectedRoute>} />
        <Route path="/book-appointment/:doctorId" element={<ProtectedRoute requiredRole="patient"><AppointmentBooking /></ProtectedRoute>} />

        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/appointments" element={<ProtectedRoute requiredRole="doctor"><AppointmentsList /></ProtectedRoute>} />
        <Route path="/doctor/timeslots" element={<ProtectedRoute requiredRole="doctor"><TimeSlotManagement /></ProtectedRoute>} />
        <Route path="/doctor/profile" element={<ProtectedRoute requiredRole="doctor"><ProfilePage /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

        {/* Fallback Routes */}
        <Route path="/dashboard" element={<Navigate to={getDashboardPath()} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

const getDashboardPath = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  switch (user.role) {
    case 'doctor':
      return '/doctor/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'patient':
    default:
      return '/patient/dashboard';
  }
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
