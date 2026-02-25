// src/pages/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { Loader, Alert } from '../components';
import { Users, CheckCircle, Clock, TrendingUp, CalendarDays } from 'lucide-react';
import '../styles/dashboard.css';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getDoctorAppointments({ limit: 10 });
      const appts = response.data.data || [];
      
      setAppointments(appts);
      setStats({
        total: appts.length,
        completed: appts.filter(a => a.status === 'Completed').length,
        pending: appts.filter(a => a.status === 'Confirmed').length,
        cancelled: appts.filter(a => a.status === 'Cancelled').length
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="dashboard-container">
      <div className="container">
        <h1>Welcome, Dr. {user?.lastName}!</h1>

        {error && <Alert type="error" message={error} />}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{color: '#10b981'}}>{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{color: '#f59e0b'}}>{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{color: '#ef4444'}}>{stats.cancelled}</div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0 }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/doctor/timeslots"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.25rem', background: '#2563eb', color: '#fff',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem'
              }}
            >
              <CalendarDays size={20} /> Manage Availability
            </Link>
            <Link
              to="/doctor/appointments"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.25rem', background: '#f3f4f6', color: '#374151',
                borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem'
              }}
            >
              <Users size={20} /> View All Appointments
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <h2><Users size={24} /> Recent Appointments</h2>
          {appointments.length === 0 ? (
            <p className="empty-text">No appointments</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(apt => (
                    <tr key={apt._id}>
                      <td>{apt.patientId?.firstName} {apt.patientId?.lastName}</td>
                      <td>{new Date(apt.appointmentDate).toLocaleDateString()} {apt.startTime}</td>
                      <td>
                        <span className={`status-badge status-${(apt.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-sm" style={{fontSize: '0.75rem'}}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
