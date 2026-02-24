// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Loader, Alert } from '../components';
import { User, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import '../styles/dashboard.css';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
    state: user?.state || '',
    specialization: user?.specialization || '',
    consultationFee: user?.consultationFee || '',
    bio: user?.bio || '',
    licenseNumber: user?.licenseNumber || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const updateData = user?.role === 'doctor' ? {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        specialization: formData.specialization,
        consultationFee: formData.consultationFee,
        bio: formData.bio,
        licenseNumber: formData.licenseNumber
      } : {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        city: formData.city,
        state: formData.state
      };

      await updateProfile(updateData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="container" style={{maxWidth: '700px'}}>
        <h1>My Profile</h1>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <div className="dashboard-card">
          {!isEditing ? (
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb'}}>
                <h2>Profile Information</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Edit Profile
                </button>
              </div>

              <div style={{display: 'grid', gap: '1rem'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <p style={{margin: 0, color: '#666', fontSize: '0.85rem', textTransform: 'uppercase'}}>First Name</p>
                    <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem'}}>{user?.firstName}</p>
                  </div>
                  <div>
                    <p style={{margin: 0, color: '#666', fontSize: '0.85rem', textTransform: 'uppercase'}}>Last Name</p>
                    <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem'}}>{user?.lastName}</p>
                  </div>
                </div>

                <div>
                  <p style={{margin: 0, color: '#666', fontSize: '0.85rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <Mail size={16} /> Email
                  </p>
                  <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem'}}>{user?.email}</p>
                </div>

                <div>
                  <p style={{margin: 0, color: '#666', fontSize: '0.85rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <Phone size={16} /> Phone
                  </p>
                  <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem'}}>{user?.phone || 'Not provided'}</p>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <p style={{margin: 0, color: '#666', fontSize: '0.85rem', textTransform: 'uppercase'}}>City</p>
                    <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem'}}>{user?.city || 'Not provided'}</p>
                  </div>
                  <div>
                    <p style={{margin: 0, color: '#666', fontSize: '0.85rem', textTransform: 'uppercase'}}>State</p>
                    <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem'}}>{user?.state || 'Not provided'}</p>
                  </div>
                </div>

                {user?.role === 'doctor' && (
                  <>
                    <div style={{paddingTop: '1rem', borderTop: '1px solid #e5e7eb'}}>
                      <p style={{margin: '0 0 1rem 0', color: '#666', fontSize: '0.85rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <Briefcase size={16} /> Professional Information
                      </p>

                      <div style={{display: 'grid', gap: '1rem'}}>
                        <div>
                          <p style={{margin: 0, color: '#666', fontSize: '0.85rem'}}>Specialization</p>
                          <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem'}}>{user?.specialization}</p>
                        </div>

                        <div>
                          <p style={{margin: 0, color: '#666', fontSize: '0.85rem'}}>Consultation Fee</p>
                          <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem'}}>₹{user?.consultationFee}</p>
                        </div>

                        <div>
                          <p style={{margin: 0, color: '#666', fontSize: '0.85rem'}}>License Number</p>
                          <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem'}}>{user?.licenseNumber || 'Not provided'}</p>
                        </div>

                        {user?.bio && (
                          <div>
                            <p style={{margin: 0, color: '#666', fontSize: '0.85rem'}}>Bio</p>
                            <p style={{margin: '0.5rem 0 0 0', fontSize: '1rem', lineHeight: '1.6'}}>{user.bio}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{marginBottom: '1.5rem'}}>Edit Profile</h2>

              <div style={{display: 'grid', gap: '1rem'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
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
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
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
                </div>

                <div>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                {user?.role === 'doctor' && (
                  <>
                    <div style={{paddingTop: '1rem', borderTop: '1px solid #e5e7eb'}}>
                      <h3 style={{marginBottom: '1rem'}}>Professional Information</h3>

                      <div>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Specialization</label>
                        <input
                          type="text"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '1rem'
                          }}
                        />
                      </div>

                      <div style={{marginTop: '1rem'}}>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Consultation Fee (₹)</label>
                        <input
                          type="number"
                          name="consultationFee"
                          value={formData.consultationFee}
                          onChange={handleChange}
                          min="0"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '1rem'
                          }}
                        />
                      </div>

                      <div style={{marginTop: '1rem'}}>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>License Number</label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '1rem'
                          }}
                        />
                      </div>

                      <div style={{marginTop: '1rem'}}>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>Bio</label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows="4"
                          placeholder="Tell patients about yourself..."
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
                    </div>
                  </>
                )}
              </div>

              <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
