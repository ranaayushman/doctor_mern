// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Calendar, FileText, BarChart3 } from 'lucide-react';
import '../styles/home.css';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Your Health, Our Priority</h1>
            <p>Book appointments with top doctors, get prescriptions, and manage your health digitally</p>
            <div className="hero-buttons">
              {isAuthenticated ? (
                <>
                  <Link to="/doctors" className="btn-primary" style={{padding: '1rem 2rem'}}>Search Doctors</Link>
                  <Link to="/patient/dashboard" className="btn-secondary" style={{padding: '1rem 2rem'}}>Dashboard</Link>
                </>
              ) : (
                <>
                  <Link to="/register?role=patient" className="btn-primary" style={{padding: '1rem 2rem'}}>Get Started</Link>
                  <Link to="/login" className="btn-secondary" style={{padding: '1rem 2rem'}}>Login</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <Stethoscope className="feature-icon" size={40} />
              <h3>Expert Doctors</h3>
              <p>Access a network of verified and experienced healthcare professionals</p>
            </div>
            <div className="feature-card">
              <Calendar className="feature-icon" size={40} />
              <h3>Easy Booking</h3>
              <p>Schedule appointments at your convenience with real-time availability</p>
            </div>
            <div className="feature-card">
              <FileText className="feature-icon" size={40} />
              <h3>Digital Prescriptions</h3>
              <p>Receive and manage prescriptions digitally with secure storage</p>
            </div>
            <div className="feature-card">
              <BarChart3 className="feature-icon" size={40} />
              <h3>Health Analytics</h3>
              <p>Track your health records and appointment history in one place</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of patients managing their health better</p>
          <Link to={isAuthenticated ? '/doctors' : '/register'} className="btn-primary" style={{padding: '1rem 2rem'}}>
            {isAuthenticated ? 'Find a Doctor' : 'Sign Up Now'}
          </Link>
        </div>
      </div>
    </>
  );
};
