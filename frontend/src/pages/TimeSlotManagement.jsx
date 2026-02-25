// src/pages/TimeSlotManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { timeSlotService } from '../services';
import { Loader, Alert } from '../components';
import { Plus, Trash2, XCircle, Clock, BarChart2 } from 'lucide-react';
import '../styles/dashboard.css';
import '../styles/timeslots.css';

export const TimeSlotManagement = () => {
  const { user } = useAuth();
  const doctorId = user?._id || user?.id;

  const [slots, setSlots] = useState([]);
  const [stats, setStats] = useState({ total: 0, booked: 0, available: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const [form, setForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    isRecurring: false,
    recurringDays: 7
  });

  const fetchData = useCallback(async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      const [slotsRes, statsRes] = await Promise.all([
        timeSlotService.getAllForDoctor(doctorId),
        timeSlotService.getStats(doctorId)
      ]);
      setSlots(slotsRes.data.data || []);
      const s = statsRes.data.data || {};
      setStats({ total: s.total || 0, booked: s.booked || 0, available: s.available || 0, cancelled: s.cancelled || 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreateSlots = async (e) => {
    e.preventDefault();
    if (!form.date || !form.startTime || !form.endTime) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setError('');
      setSuccess('');
      const dates = [form.date];
      if (form.isRecurring) {
        const base = new Date(form.date);
        for (let i = 1; i < form.recurringDays; i++) {
          const d = new Date(base);
          d.setDate(base.getDate() + i);
          dates.push(d.toISOString().split('T')[0]);
        }
      }
      await timeSlotService.create({
        dates,
        startTime: form.startTime,
        endTime: form.endTime,
        slotDuration: parseInt(form.slotDuration, 10)
      });
      setSuccess(`Slots created successfully for ${dates.length} day(s)!`);
      setForm(prev => ({ ...prev, date: '', isRecurring: false }));
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create slots');
    }
  };

  const handleCancel = async (slotId) => {
    if (!window.confirm('Cancel this time slot?')) return;
    try {
      setActionLoading(slotId);
      await timeSlotService.cancel(slotId);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel slot');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm('Delete this time slot permanently?')) return;
    try {
      setActionLoading(slotId);
      await timeSlotService.delete(slotId);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete slot');
    } finally {
      setActionLoading(null);
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

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = slot.date ? slot.date.split('T')[0] : 'Unknown';
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(slotsByDate).sort();

  if (loading) return <Loader fullPage />;

  return (
    <div className="dashboard-container">
      <div className="container">
        <h1>Manage Availability</h1>
        <p style={{ color: '#666', margin: '-0.5rem 0 1.5rem 0' }}>Create and manage your time slots</p>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Slots</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#10b981' }}>{stats.available}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#f59e0b' }}>{stats.booked}</div>
            <div className="stat-label">Booked</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#ef4444' }}>{stats.cancelled}</div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Create Form */}
          <div className="dashboard-card">
            <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} /> Create Slots
            </h2>
            <form onSubmit={handleCreateSlots}>
              <div className="ts-form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="ts-input"
                />
              </div>
              <div className="ts-form-group">
                <label>Working Hours Start *</label>
                <input type="time" name="startTime" value={form.startTime} onChange={handleFormChange} required className="ts-input" />
              </div>
              <div className="ts-form-group">
                <label>Working Hours End *</label>
                <input type="time" name="endTime" value={form.endTime} onChange={handleFormChange} required className="ts-input" />
              </div>
              <div className="ts-form-group">
                <label>Slot Duration (minutes)</label>
                <select name="slotDuration" value={form.slotDuration} onChange={handleFormChange} className="ts-input">
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
              <div className="ts-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="isRecurring"
                  id="isRecurring"
                  checked={form.isRecurring}
                  onChange={handleFormChange}
                  style={{ width: 'auto', marginBottom: 0 }}
                />
                <label htmlFor="isRecurring" style={{ margin: 0 }}>Repeat for multiple days</label>
              </div>
              {form.isRecurring && (
                <div className="ts-form-group">
                  <label>Number of days</label>
                  <input
                    type="number"
                    name="recurringDays"
                    value={form.recurringDays}
                    onChange={handleFormChange}
                    min={2}
                    max={30}
                    className="ts-input"
                  />
                </div>
              )}
              <button type="submit" className="ts-btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Plus size={16} /> Create Slots
              </button>
            </form>
          </div>

          {/* Slot Calendar */}
          <div>
            {sortedDates.length === 0 ? (
              <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <Clock size={48} style={{ color: '#d1d5db', marginBottom: '1rem' }} />
                <p style={{ color: '#9ca3af' }}>No slots created yet. Use the form to add availability.</p>
              </div>
            ) : (
              sortedDates.map(date => (
                <div key={date} className="dashboard-card ts-date-group">
                  <h3 className="ts-date-header">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <div className="slot-grid">
                    {slotsByDate[date].map(slot => (
                      <div
                        key={slot._id}
                        className={`slot-card slot-manage ${slot.status === 'booked' ? 'slot-booked' : slot.status === 'cancelled' ? 'slot-cancelled' : 'slot-available'}`}
                      >
                        <span className="slot-time">{formatTime(slot.startTime)}</span>
                        <span className="slot-end">{formatTime(slot.endTime)}</span>
                        <span className="slot-status" style={{ textTransform: 'capitalize' }}>{slot.status || 'available'}</span>
                        {slot.status !== 'booked' && slot.status !== 'cancelled' && (
                          <div className="slot-actions">
                            <button
                              onClick={() => handleCancel(slot._id)}
                              disabled={actionLoading === slot._id}
                              className="slot-action-btn slot-action-cancel"
                              title="Cancel slot"
                            >
                              <XCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(slot._id)}
                              disabled={actionLoading === slot._id}
                              className="slot-action-btn slot-action-delete"
                              title="Delete slot"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
