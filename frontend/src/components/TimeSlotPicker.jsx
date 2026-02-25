// src/components/TimeSlotPicker.jsx
import React, { useState, useEffect } from 'react';
import { Clock, Sun, Sunset, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { timeSlotService } from '../services';

/**
 * TimeSlotPicker
 * Props:
 *   doctorId        – MongoDB ObjectId of the selected doctor
 *   selectedSlot    – currently selected slot object (or null)
 *   onSlotSelect    – (slot) => void  called when user picks a slot
 *   onDateChange    – (dateStr) => void  called when date changes (optional)
 *   initialDate     – 'YYYY-MM-DD' string to pre-fill (optional)
 */
// Returns YYYY-MM-DD for today offset by `days`
const offsetDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const TimeSlotPicker = ({ doctorId, selectedSlot, onSlotSelect, onDateChange, initialDate }) => {
  const today    = offsetDate(0);
  // Default to tomorrow so users immediately see available slots
  const tomorrow = offsetDate(1);
  const startDate = initialDate || tomorrow;

  const [date, setDate] = useState(startDate);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-load slots for the default date on mount
  useEffect(() => {
    if (startDate && doctorId) {
      loadSlots(startDate);
      if (onDateChange) onDateChange(startDate);
    }
  }, [doctorId]);

  const loadSlots = async (d) => {
    if (!d || !doctorId) return;
    setLoading(true);
    setError('');
    setSlots([]);
    try {
      const res = await timeSlotService.getAvailable(doctorId, d);
      setSlots(res.data.data || []);
    } catch {
      setError('Could not load slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const d = e.target.value;
    setDate(d);
    onSlotSelect(null);          // clear slot when date changes
    if (onDateChange) onDateChange(d);
    loadSlots(d);
  };

  // Shift date forward/backward one day
  const shiftDate = (days) => {
    const base = date || today;
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    const str = d.toISOString().split('T')[0];
    if (str < today) return;     // don't go before today
    setDate(str);
    onSlotSelect(null);
    if (onDateChange) onDateChange(str);
    loadSlots(str);
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const formatDateLabel = (d) => {
    if (!d) return '';
    const parsed = new Date(d + 'T00:00:00');
    return parsed.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  // Bucket slots: morning <12, afternoon 12-17, evening >=17
  const buckets = { morning: [], afternoon: [], evening: [] };
  for (const s of slots) {
    const hour = parseInt(s.startTime.split(':')[0], 10);
    if (hour < 12) buckets.morning.push(s);
    else if (hour < 17) buckets.afternoon.push(s);
    else buckets.evening.push(s);
  }

  const sections = [
    { key: 'morning',   label: 'Morning',   icon: <Sun size={15} />,    color: '#f59e0b' },
    { key: 'afternoon', label: 'Afternoon',  icon: <Sunset size={15} />, color: '#f97316' },
    { key: 'evening',   label: 'Evening',    icon: <Moon size={15} />,   color: '#6366f1' },
  ];

  const availableCount = slots.filter(s => !s.isBooked && !s.isCancelled).length;

  return (
    <div className="tsp-wrapper">
      {/* ── Date selector row ── */}
      <div className="tsp-date-row">
        <button
          type="button"
          className="tsp-arrow"
          onClick={() => shiftDate(-1)}
          disabled={!date || date <= today}
          title="Previous day (no slots today)"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="tsp-date-center">
          <label className="tsp-date-label" htmlFor="tsp-date-input">
            <Clock size={15} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            {date ? formatDateLabel(date) : 'Select a date'}
          </label>
          <input
            id="tsp-date-input"
            type="date"
            value={date}
            min={today}
            onChange={handleDateChange}
            className="tsp-date-input"
          />
        </div>

        <button
          type="button"
          className="tsp-arrow"
          onClick={() => shiftDate(1)}
          disabled={!date}
          title="Next day"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="tsp-body">
        {!date && (
          <div className="tsp-empty">
            <Clock size={36} className="tsp-empty-icon" />
            <p>Pick a date above to see available time slots</p>
          </div>
        )}

        {date && loading && (
          <div className="tsp-loading">
            <span className="tsp-spinner" />
            <span>Loading available slots…</span>
          </div>
        )}

        {date && !loading && error && (
          <div className="tsp-error">{error}</div>
        )}

        {date && !loading && !error && slots.length === 0 && (
          <div className="tsp-empty">
            <Clock size={36} className="tsp-empty-icon" />
            <p>No available slots on this date</p>
            <span>Try selecting a different date</span>
          </div>
        )}

        {date && !loading && !error && slots.length > 0 && (
          <>
            <div className="tsp-summary">
              <span className="tsp-summary-count">{availableCount}</span> slot{availableCount !== 1 ? 's' : ''} available
              {selectedSlot && (
                <span className="tsp-summary-selected">
                  &nbsp;· Selected: <strong>{formatTime(selectedSlot.startTime)}</strong>
                </span>
              )}
            </div>

            {sections.map(({ key, label, icon, color }) => {
              const items = buckets[key];
              if (!items.length) return null;
              return (
                <div key={key} className="tsp-section">
                  <div className="tsp-section-header" style={{ color }}>
                    {icon}
                    <span>{label}</span>
                    <span className="tsp-section-count">{items.length}</span>
                  </div>
                  <div className="tsp-slot-grid">
                    {items.map(slot => {
                      const booked = slot.isBooked || slot.isCancelled;
                      const isSelected = selectedSlot?._id === slot._id;
                      return (
                        <button
                          key={slot._id}
                          type="button"
                          disabled={booked}
                          onClick={() => !booked && onSlotSelect(isSelected ? null : slot)}
                          className={[
                            'tsp-slot',
                            booked     ? 'tsp-slot--booked'    : 'tsp-slot--open',
                            isSelected ? 'tsp-slot--selected'  : '',
                          ].join(' ')}
                          title={booked ? 'Already booked' : `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`}
                        >
                          <span className="tsp-slot-start">{formatTime(slot.startTime)}</span>
                          <span className="tsp-slot-end">{formatTime(slot.endTime)}</span>
                          {booked && <span className="tsp-slot-tag">Booked</span>}
                          {isSelected && !booked && <span className="tsp-slot-tag tsp-slot-tag--sel">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default TimeSlotPicker;
