// src/pages/AppointmentsList.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { Loader, Alert } from '../components';
import { Calendar, Clock, X, RefreshCw } from 'lucide-react';
import '../styles/dashboard.css';

export const AppointmentsList = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let endpoint = appointmentService.getPatientAppointments;
      
      if (filter !== 'all') {
        const params = { status: filter.charAt(0).toUpperCase() + filter.slice(1) };
        const res = await appointmentService.getPatientAppointments(params);
        setAppointments(res.data.data.appointments || []);
      } else {
        const res = await endpoint();
        setAppointments(res.data.data.appointments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (appointmentId) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    const newTime = prompt('Enter new time (HH:MM):');

    if (!newDate || !newTime) return;

    try {
      setActionLoading(appointmentId);
      await appointmentService.rescheduleAppointment(appointmentId, {
        date: newDate,
        time: newTime
      });
      setError('');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      setActionLoading(appointmentId);
      await appointmentService.cancelAppointment(appointmentId);
      setError('');
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Loader fullPage />;

  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(a => a.status.toLowerCase() === filter);

  return (
    <div className="dashboard-container">
      <div className="container">
        <h1>My Appointments</h1>

        {error && <Alert type="error" message={error} />}

        <div style={{display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap'}}>
          {['all', 'upcoming', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                background: filter === status ? '#2563eb' : '#f3f4f6',
                color: filter === status ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontWeight: filter === status ? 'bold' : 'normal'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="dashboard-card" style={{textAlign: 'center', padding: '3rem'}}>
            <Calendar size={48} style={{color: '#d1d5db', marginBottom: '1rem'}} />
            <p className="empty-text">No appointments found</p>
          </div>
        ) : (
          <div style={{display: 'grid', gap: '1rem'}}>
            {filteredAppointments.map(apt => (
              <div key={apt.appointmentId} className="dashboard-card" style={{padding: '1.5rem'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start'}}>
                  <div>
                    <h3 style={{margin: '0 0 0.5rem 0', fontSize: '1.1rem'}}>
                      Dr. {apt.doctorName}
                    </h3>
                    <p style={{margin: '0.25rem 0', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <Calendar size={18} />
                      {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p style={{margin: '0.25rem 0', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <Clock size={18} />
                      {apt.time}
                    </p>
                    {apt.complaint && (
                      <p style={{margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.95rem'}}>
                        <strong>Complaint:</strong> {apt.complaint}
                      </p>
                    )}
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <span className={`status-badge status-${apt.status.toLowerCase()}`} style={{display: 'block', marginBottom: '1rem'}}>
                      {apt.status}
                    </span>
                    <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
                      {!['Completed', 'Cancelled'].includes(apt.status) && (
                        <>
                          <button
                            onClick={() => handleReschedule(apt.appointmentId)}
                            disabled={actionLoading === apt.appointmentId}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <RefreshCw size={16} /> Reschedule
                          </button>
                          <button
                            onClick={() => handleCancel(apt.appointmentId)}
                            disabled={actionLoading === apt.appointmentId}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <X size={16} /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
