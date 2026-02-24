// src/components/Navigation.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, User, Home, FileText, BarChart3 } from 'lucide-react';
import '../styles/navigation.css';

export const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'doctor') return '/doctor/dashboard';
    return '/patient/dashboard';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">⚕️</span>
          DocCare
        </Link>

        <button 
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`nav-menu ${mobileOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/doctors" className="nav-link">Doctors</Link>

          {isAuthenticated ? (
            <>
              <Link to={getDashboardLink()} className="nav-link">
                <Home size={18} /> Dashboard
              </Link>
              <Link to="/prescriptions" className="nav-link">
                <FileText size={18} /> Prescriptions
              </Link>
              <div className="nav-divider"></div>
              <span className="nav-text">
                <User size={18} /> {user?.firstName}
              </span>
              <button className="btn-logout" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-primary" style={{marginRight: '0.5rem'}}>Login</Link>
              <Link to="/register" className="btn-secondary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
