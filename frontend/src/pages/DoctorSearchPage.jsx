// src/pages/DoctorSearchPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../services/doctorService';
import { useAuth } from '../context/AuthContext';
import { Alert, Loader } from '../components';
import { Star, MapPin, Briefcase } from 'lucide-react';
import '../styles/doctors.css';

export const DoctorSearchPage = () => {
  const { isAuthenticated } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    specialization: '',
    minRating: 0,
    search: ''
  });

  useEffect(() => {
    fetchSpecializations();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [filters]);

  const fetchSpecializations = async () => {
    try {
      const res = await doctorService.getSpecializations();
      setSpecializations(res.data.data?.specializations || []);
    } catch (err) {
      // fall back to empty — select will just show "All Specializations"
      console.error('Failed to fetch specializations', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await doctorService.search(filters);
      setDoctors(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="doctors-container">
      <div className="container">
        <h1>Find a Doctor</h1>

        {error && <Alert type="error" message={error} />}

        <div className="filters-section">
          <div className="filter-group">
            <label>Specialization</label>
            <select 
              name="specialization" 
              value={filters.specialization} 
              onChange={handleFilterChange}
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec.name} value={spec.name}>{spec.name} ({spec.count})</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Minimum Rating</label>
            <select 
              name="minRating" 
              value={filters.minRating} 
              onChange={handleFilterChange}
            >
              <option value="">All Ratings</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input 
              type="text" 
              name="search"
              placeholder="Search by name..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        {loading ? (
          <Loader fullPage />
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <p>No doctors found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="doctors-grid">
            {doctors.map(doctor => (
              <div key={doctor._id} className="doctor-card">
                <div className="doctor-header">
                  <div className="doctor-profile">
                    {doctor.profilePicture && (
                      <img src={doctor.profilePicture} alt={`${doctor.firstName} ${doctor.lastName}`} className="doctor-avatar" />
                    )}
                    <div className="doctor-name-section">
                      <h3>{doctor.firstName} {doctor.lastName}</h3>
                      <p className="specialization">{doctor.specialization}</p>
                    </div>
                  </div>
                  <div className="rating">
                    <Star size={18} fill="#fbbf24" color="#fbbf24" />
                    <span className="rating-value">{doctor.averageRating || 0}</span>
                    <span className="rating-count">({doctor.totalRatings || 0})</span>
                  </div>
                </div>

                <div className="doctor-bio">
                  {doctor.bio && <p>{doctor.bio}</p>}
                </div>

                <div className="doctor-info">
                  <div className="info-item">
                    <Briefcase size={16} />
                    <span>{doctor.yearsOfExperience} years experience</span>
                  </div>
                  <div className="info-item">
                    <MapPin size={16} />
                    <span>{doctor.clinic?.city}, {doctor.clinic?.state}</span>
                  </div>
                  <div className="info-item">
                    <span className="languages">Languages: {doctor.languages?.join(', ')}</span>
                  </div>
                </div>

                <div className="doctor-stats">
                  <div className="stat">
                    <span className="stat-label">Appointments</span>
                    <span className="stat-value">{doctor.totalAppointments}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Slot Duration</span>
                    <span className="stat-value">{doctor.slotDuration} min</span>
                  </div>
                </div>

                <div className="doctor-footer">
                  <div className="fee">
                    <span className="fee-label">Consultation Fee</span>
                    <span className="fee-value">₹{doctor.consultationFee}</span>
                  </div>
                  {isAuthenticated ? (
                    <Link 
                      to={`/book-appointment/${doctor._id}`} 
                      className="btn-primary btn-sm"
                    >
                      Book Now
                    </Link>
                  ) : (
                    <Link to="/login" className="btn-primary btn-sm">
                      Login to Book
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
