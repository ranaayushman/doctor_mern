// src/pages/AppointmentBooking.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentService, doctorService } from '../services';
import { Loader, Alert, TimeSlotPicker } from '../components';
import { Calendar, FileText, CheckCircle, Users } from 'lucide-react';
import '../styles/dashboard.css';
import '../styles/timeslots.css';

export const AppointmentBooking = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'success'
  const [formData, setFormData] = useState({
    appointmentDate: '',
    chiefComplaint: '',
    consultationType: 'in-person'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const res = await doctorService.getById(doctorId);
      setDoctor(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctor details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    if (!formData.appointmentDate) { setError('Please select a date'); return; }
    if (!selectedSlot) { setError('Please select a time slot'); return; }
    setError('');
    setStep('confirm');
  };

  const handleConfirmBooking = async () => {
    try {
      setBookingLoading(true);
      const payload = {
        doctorId,
        appointmentDate: formData.appointmentDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        timeSlotId: selectedSlot._id,
        consultationType: formData.consultationType,
        chiefComplaint: formData.chiefComplaint
      };
      await appointmentService.createAppointment(payload);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
      setStep('form');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  if (loading) return <Loader fullPage />;

  // SUCCESS STEP
  if (step === 'success') {
    return (
      <div className="dashboard-container">
        <div className="container" style={{ maxWidth: '600px' }}>
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Appointment Booked!</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Your appointment has been confirmed.</p>
            <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
              <p><strong>Doctor:</strong> Dr. {doctor?.firstName} {doctor?.lastName}</p>
              <p><strong>Date:</strong> {new Date(formData.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> {formatTime(selectedSlot?.startTime)} – {formatTime(selectedSlot?.endTime)}</p>
              <p><strong>Type:</strong> {formData.consultationType}</p>
              {formData.chiefComplaint && <p><strong>Complaint:</strong> {formData.chiefComplaint}</p>}
            </div>
            <button
              onClick={() => navigate('/patient/appointments')}
              style={{ padding: '0.75rem 2rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer' }}
            >
              View My Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CONFIRM STEP
  if (step === 'confirm') {
    return (
      <div className="dashboard-container">
        <div className="container" style={{ maxWidth: '600px' }}>
          <h1>Confirm Appointment</h1>
          {error && <Alert type="error" message={error} />}
          <div className="dashboard-card" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ margin: '0 0 0.25rem 0' }}>Dr. {doctor?.firstName} {doctor?.lastName}</h2>
              <p style={{ margin: 0, color: '#666' }}>{doctor?.specialization}</p>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Date</span>
                <strong>{new Date(formData.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Time</span>
                <strong>{formatTime(selectedSlot?.startTime)} – {formatTime(selectedSlot?.endTime)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Type</span>
                <strong style={{ textTransform: 'capitalize' }}>{formData.consultationType}</strong>
              </div>
              {formData.chiefComplaint && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Complaint</span>
                  <strong style={{ maxWidth: '60%', textAlign: 'right' }}>{formData.chiefComplaint}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                <span style={{ color: '#666' }}>Consultation Fee</span>
                <strong style={{ color: '#2563eb', fontSize: '1.1rem' }}>₹{doctor?.consultationFee}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep('form')}
                style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                style={{ flex: 2, padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: bookingLoading ? 'not-allowed' : 'pointer', opacity: bookingLoading ? 0.7 : 1 }}
              >
                {bookingLoading ? 'Confirming...' : 'Confirm & Book'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FORM STEP
  return (
    <div className="dashboard-container">
      <div className="container" style={{ maxWidth: '640px' }}>
        <h1>Book Appointment</h1>
        {error && <Alert type="error" message={error} />}

        {doctor && (
          <div className="dashboard-card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#e0e7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={40} color="#2563eb" />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>Dr. {doctor.firstName} {doctor.lastName}</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>{doctor.specialization}</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#2563eb', fontWeight: 600 }}>₹{doctor.consultationFee} consultation fee</p>
              </div>
            </div>

            <form onSubmit={handleProceedToConfirm}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  <Calendar size={16} style={{ display: 'inline', marginRight: '0.4rem' }} />
                  Select Date &amp; Time Slot
                </label>
                <TimeSlotPicker
                  doctorId={doctorId}
                  selectedSlot={selectedSlot}
                  onSlotSelect={setSelectedSlot}
                  onDateChange={(d) => setFormData(prev => ({ ...prev, appointmentDate: d }))}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Consultation Type</label>
                <select
                  name="consultationType"
                  value={formData.consultationType}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem' }}
                >
                  <option value="in-person">In-Person</option>
                  <option value="video">Video Consultation</option>
                  <option value="phone">Phone Consultation</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  <FileText size={16} style={{ display: 'inline', marginRight: '0.4rem' }} />
                  Chief Complaint / Reason for Visit
                </label>
                <textarea
                  name="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={handleChange}
                  placeholder="Describe your symptoms or reason for visit..."
                  rows="4"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '0.85rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}
              >
                Review Booking
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
