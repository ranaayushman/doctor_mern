// src/pages/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { prescriptionService } from '../services/prescriptionService';
import { Loader, Alert } from '../components';
import { Calendar, FileText, Plus } from 'lucide-react';
import '../styles/dashboard.css';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apptRes, prescRes] = await Promise.all([
        appointmentService.getMyAppointments({ limit: 5 }),
        prescriptionService.getAll({ limit: 5 })
      ]);

      setAppointments(apptRes.data.data.appointments || []);
      setPrescriptions(prescRes.data.data.prescriptions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {user?.firstName}!</h1>
          <Link to="/doctors" className="btn-primary">
            <Plus size={18} /> Book Appointment
          </Link>
        </div>

        {error && <Alert type="error" message={error} />}

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2><Calendar size={24} /> Appointments</h2>
            {appointments.length === 0 ? (
              <p className="empty-text">No appointments yet</p>
            ) : (
              <div className="appointments-list">
                {appointments.map(apt => (
                  <div key={apt.appointmentId} className="appointment-item">
                    <div>
                      <strong>Dr. {apt.doctorName}</strong>
                      <p>{new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
                    </div>
                    <span className={`status-badge status-${apt.status.toLowerCase()}`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link to="/appointments" className="btn-secondary" style={{marginTop: '1rem', width: '100%'}}>
              View All
            </Link>
          </div>

          <div className="dashboard-card">
            <h2><FileText size={24} /> Prescriptions</h2>
            {prescriptions.length === 0 ? (
              <p className="empty-text">No prescriptions yet</p>
            ) : (
              <div className="prescriptions-list">
                {prescriptions.map(presc => (
                  <div key={presc.prescriptionId} className="prescription-item">
                    <div>
                      <strong>{presc.diagnosis}</strong>
                      <p>{presc.medicineCount || 0} medicines</p>
                    </div>
                    <Link to={`/prescriptions/${presc.prescriptionId}`} className="btn-sm">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <Link to="/prescriptions" className="btn-secondary" style={{marginTop: '1rem', width: '100%'}}>
              View All
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
