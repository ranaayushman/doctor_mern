// src/pages/AppointmentsList.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { RescheduleModal } from '../components/RescheduleModal';
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
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = user?.role === 'doctor'
        ? await appointmentService.getDoctorAppointments({})
        : await appointmentService.getPatientAppointments({});
      setAppointments(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = (appointment) => {
    setRescheduleTarget(appointment);
  };

  const doReschedule = async (appointmentId, data) => {
    await appointmentService.rescheduleAppointment(appointmentId, data);
    setError('');
    fetchAppointments();
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

  const today = new Date();
  const filteredAppointments = appointments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      const upcoming = ['Confirmed', 'Scheduled', 'Rescheduled'];
      return upcoming.includes(a.status) && new Date(a.appointmentDate) >= today;
    }
    if (filter === 'completed') return a.status === 'Completed';
    if (filter === 'cancelled') return a.status === 'Cancelled';
    return true;
  });

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
        {filteredAppointments.map(apt => {
            const isDoctor = user?.role === 'doctor';
            const personName = isDoctor
              ? `${apt.patientId?.firstName || ''} ${apt.patientId?.lastName || ''}`.trim()
              : `Dr. ${apt.doctorId?.firstName || ''} ${apt.doctorId?.lastName || ''}`.trim();
            const personSub = isDoctor
              ? apt.patientId?.email
              : apt.doctorId?.specialization;
            const aptDate = apt.appointmentDate
              ? new Date(apt.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : '';
            const formatTime = (t) => {
              if (!t) return '';
              const [h, m] = t.split(':');
              const hour = parseInt(h, 10);
              return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
            };
            return (
              <div key={apt._id} className="dashboard-card" style={{padding: '1.5rem'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start'}}>
                  <div>
                    <h3 style={{margin: '0 0 0.25rem 0', fontSize: '1.1rem'}}>{personName}</h3>
                    {personSub && <p style={{margin: '0 0 0.5rem 0', color: '#2563eb', fontSize: '0.875rem'}}>{personSub}</p>}
                    <p style={{margin: '0.25rem 0', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <Calendar size={15} />
                      {aptDate}
                    </p>
                    <p style={{margin: '0.25rem 0', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <Clock size={15} />
                      {formatTime(apt.startTime)} – {formatTime(apt.endTime)}
                    </p>
                    {apt.consultationType && (
                      <p style={{margin: '0.25rem 0', color: '#666', fontSize: '0.875rem', textTransform: 'capitalize'}}>
                        <strong>Type:</strong> {apt.consultationType}
                      </p>
                    )}
                    {apt.chiefComplaint && (
                      <p style={{margin: '0.5rem 0 0 0', color: '#555', fontSize: '0.9rem'}}>
                        <strong>Complaint:</strong> {apt.chiefComplaint}
                      </p>
                    )}
                    {apt.consultationFee && (
                      <p style={{margin: '0.25rem 0', color: '#059669', fontSize: '0.875rem', fontWeight: 600}}>
                        Fee: ₹{apt.consultationFee}
                      </p>
                    )}
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <span className={`status-badge status-${(apt.status || '').toLowerCase().replace(/\s+/g, '-')}`} style={{display: 'block', marginBottom: '1rem'}}>
                      {apt.status}
                    </span>
                    <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
                      {!['Completed', 'Cancelled'].includes(apt.status) && (
                        <>
                          <button
                            onClick={() => handleReschedule(apt)}
                            disabled={actionLoading === apt._id}
                            style={{padding: '0.5rem 1rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}
                          >
                            <RefreshCw size={16} /> Reschedule
                          </button>
                          <button
                            onClick={() => handleCancel(apt._id)}
                            disabled={actionLoading === apt._id}
                            style={{padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}
                          >
                            <X size={16} /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onReschedule={doReschedule}
        />
      )}
    </div>
  );
};
