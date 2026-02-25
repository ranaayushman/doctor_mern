// src/components/RescheduleModal.jsx
import React, { useState, useEffect } from 'react';
import { timeSlotService } from '../services';
import { XCircle, Calendar, Clock } from 'lucide-react';

export const RescheduleModal = ({ appointment, onClose, onReschedule }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doctorId = appointment?.doctorId || appointment?.doctor?._id;

  useEffect(() => {
    if (selectedDate && doctorId) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, doctorId]);

  const fetchSlots = async (date) => {
    try {
      setSlotsLoading(true);
      setSelectedSlot(null);
      const res = await timeSlotService.getAvailable(doctorId, date);
      setAvailableSlots((res.data.data || []).filter(s => !s.isBooked));
    } catch (err) {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please select a date and time slot');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onReschedule(appointment.appointmentId || appointment._id, {
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        timeSlotId: selectedSlot._id
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '520px', width: '90%' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>Reschedule Appointment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <XCircle size={24} color="#6b7280" />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Current: <strong>{appointment?.doctorName || `Dr. ${appointment?.doctor?.firstName} ${appointment?.doctor?.lastName}`}</strong>
            {' — '}
            {appointment?.date ? new Date(appointment.date).toLocaleDateString() : ''} {appointment?.time || ''}
          </p>

          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '0.4rem' }} />
              Select New Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          {selectedDate && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                <Clock size={16} style={{ display: 'inline', marginRight: '0.4rem' }} />
                Select Time Slot
              </label>
              {slotsLoading ? (
                <p style={{ color: '#6b7280' }}>Loading slots...</p>
              ) : availableSlots.length === 0 ? (
                <p style={{ color: '#ef4444' }}>No available slots for this date</p>
              ) : (
                <div className="slot-grid">
                  {availableSlots.map(slot => (
                    <button
                      key={slot._id}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`slot-card slot-available ${selectedSlot?._id === slot._id ? 'slot-selected' : ''}`}
                    >
                      <span className="slot-time">{formatTime(slot.startTime)}</span>
                      <span className="slot-end">{formatTime(slot.endTime)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !selectedDate || !selectedSlot}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading || !selectedDate || !selectedSlot ? 'not-allowed' : 'pointer',
              opacity: loading || !selectedDate || !selectedSlot ? 0.6 : 1,
              fontSize: '1rem'
            }}
          >
            {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
};
