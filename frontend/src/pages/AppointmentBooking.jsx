// src/pages/AppointmentBooking.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentService, doctorService } from '../services';
import { Loader, Alert } from '../components';
import { Calendar, Clock, FileText } from 'lucide-react';
import '../styles/dashboard.css';

export const AppointmentBooking = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    complaint: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDoctorAndSlots();
  }, [doctorId]);

  const fetchDoctorAndSlots = async () => {
    try {
      setLoading(true);
      const doctorRes = await doctorService.getById(doctorId);
      setDoctor(doctorRes.data.data);
      
      const today = new Date().toISOString().split('T')[0];
      const slotsRes = await appointmentService.getAvailableSlots(doctorId, { date: today });
      setAvailableSlots(slotsRes.data.data.slots || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctor details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'appointmentDate') {
      fetchSlotsForDate(value);
    }
  };

  const fetchSlotsForDate = async (date) => {
    try {
      const slotsRes = await appointmentService.getAvailableSlots(doctorId, { date });
      setAvailableSlots(slotsRes.data.data.slots || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!formData.appointmentDate || !formData.appointmentTime) {
      setError('Please select date and time');
      return;
    }

    try {
      setBookingLoading(true);

      const appointmentRes = await appointmentService.createAppointment({
        doctorId,
        date: formData.appointmentDate,
        time: formData.appointmentTime,
        complaint: formData.complaint
      });

      navigate('/patient/appointments', {
        state: { message: 'Appointment booked successfully!' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="dashboard-container">
      <div className="container" style={{maxWidth: '600px'}}>
        <h1>Book Appointment</h1>

        {error && <Alert type="error" message={error} />}

        {doctor && (
          <div className="dashboard-card" style={{marginTop: '1rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb'}}>
              <div style={{width: '100px', height: '100px', backgroundColor: '#e0e7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Users size={48} color="#2563eb" />
              </div>
              <div>
                <h2 style={{margin: 0, fontSize: '1.5rem'}}>Dr. {doctor.firstName} {doctor.lastName}</h2>
                <p style={{margin: '0.5rem 0 0 0', color: '#666'}}>{doctor.specialization}</p>
                <p style={{margin: '0.25rem 0 0 0', color: '#666'}}>₹{doctor.consultationFee} consultation fee</p>
                <p style={{margin: '0.25rem 0 0 0', color: '#666'}}>Rating: {doctor.rating || 'N/A'}/5</p>
              </div>
            </div>

            <form onSubmit={handleBookAppointment}>
              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>
                  <Calendar size={18} style={{display: 'inline-block', marginRight: '0.5rem'}} />
                  Select Date
                </label>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>
                  <Clock size={18} style={{display: 'inline-block', marginRight: '0.5rem'}} />
                  Select Time
                </label>
                <select
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">-- Select a time slot --</option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {availableSlots.length === 0 && (
                  <p style={{color: '#ef4444', fontSize: '0.9rem', marginTop: '0.5rem'}}>No slots available for selected date</p>
                )}
              </div>

              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>
                  <FileText size={18} style={{display: 'inline-block', marginRight: '0.5rem'}} />
                  Chief Complaint / Reason
                </label>
                <textarea
                  name="complaint"
                  value={formData.complaint}
                  onChange={handleChange}
                  placeholder="Describe your symptoms or reason for visit..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{
                background: '#f0f9ff',
                padding: '1rem',
                borderRadius: '6px',
                marginBottom: '1.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <p style={{margin: 0, color: '#666', fontSize: '0.9rem'}}>Consultation Fee</p>
                  <p style={{margin: '0.5rem 0 0 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb'}}>₹{doctor.consultationFee}</p>
                </div>
                <div style={{textAlign: 'right'}}>
                  <p style={{margin: 0, color: '#666', fontSize: '0.9rem'}}>Total Amount</p>
                  <p style={{margin: '0.5rem 0 0 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981'}}>₹{doctor.consultationFee}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: bookingLoading ? 'not-allowed' : 'pointer',
                  opacity: bookingLoading ? 0.7 : 1
                }}
              >
                {bookingLoading ? 'Processing...' : 'Book Appointment'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

import { Users } from 'lucide-react';
