// src/pages/PrescriptionsList.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { prescriptionService } from '../services/prescriptionService';
import { Loader, Alert } from '../components';
import { FileText, Download, Eye } from 'lucide-react';
import '../styles/dashboard.css';

export const PrescriptionsList = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await prescriptionService.getPatientPrescriptions();
      setPrescriptions(response.data.data.prescriptions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (prescriptionId) => {
    try {
      const response = await prescriptionService.downloadPrescription(prescriptionId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${prescriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download prescription');
    }
  };

  if (loading) return <Loader fullPage />;

  const filteredPrescriptions = prescriptions.filter(p =>
    p.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medicines?.some(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="dashboard-container">
      <div className="container">
        <h1>My Prescriptions</h1>

        {error && <Alert type="error" message={error} />}

        <div style={{marginBottom: '2rem'}}>
          <input
            type="text"
            placeholder="Search by doctor name or medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          />
        </div>

        {filteredPrescriptions.length === 0 ? (
          <div className="dashboard-card" style={{textAlign: 'center', padding: '3rem'}}>
            <FileText size={48} style={{color: '#d1d5db', marginBottom: '1rem'}} />
            <p className="empty-text">No prescriptions found</p>
          </div>
        ) : (
          <div style={{display: 'grid', gap: '1rem'}}>
            {filteredPrescriptions.map(prescription => (
              <div key={prescription.prescriptionId} className="dashboard-card" style={{padding: '1.5rem'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start'}}>
                  <div>
                    <h3 style={{margin: '0 0 0.5rem 0', fontSize: '1.1rem'}}>
                      Dr. {prescription.doctorName}
                    </h3>
                    <p style={{margin: '0.25rem 0', color: '#666', fontSize: '0.95rem'}}>
                      Date: {new Date(prescription.date || prescription.createdAt).toLocaleDateString()}
                    </p>
                    
                    <div style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb'}}>
                      <h4 style={{margin: '0 0 0.5rem 0', fontSize: '0.95rem'}}>Medicines:</h4>
                      <div style={{display: 'grid', gap: '0.5rem'}}>
                        {prescription.medicines?.map((med, idx) => (
                          <div key={idx} style={{fontSize: '0.9rem', color: '#666', paddingLeft: '1rem'}}>
                            • <strong>{med.name}</strong> - {med.dosage} {med.frequency}
                            {med.duration && <> for {med.duration}</>}
                          </div>
                        )) || <p style={{color: '#999', fontSize: '0.9rem'}}>No medicines listed</p>}
                      </div>
                    </div>

                    {prescription.notes && (
                      <div style={{marginTop: '0.75rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '4px', fontSize: '0.9rem'}}>
                        <strong>Notes:</strong> {prescription.notes}
                      </div>
                    )}
                  </div>

                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '120px'}}>
                    <button
                      onClick={() => setSelectedPrescription(prescription)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Eye size={16} /> View
                    </button>
                    <button
                      onClick={() => handleDownload(prescription.prescriptionId)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Download size={16} /> PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedPrescription && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                <h2>Prescription Details</h2>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}
                >
                  ×
                </button>
              </div>

              <div style={{display: 'grid', gap: '1rem'}}>
                <div>
                  <p style={{margin: 0, color: '#666', fontSize: '0.9rem'}}>Doctor</p>
                  <p style={{margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 'bold'}}>
                    Dr. {selectedPrescription.doctorName}
                  </p>
                </div>

                <div>
                  <p style={{margin: 0, color: '#666', fontSize: '0.9rem'}}>Date</p>
                  <p style={{margin: '0.25rem 0 0 0', fontSize: '1rem'}}>
                    {new Date(selectedPrescription.date || selectedPrescription.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div style={{paddingTop: '1rem', borderTop: '1px solid #e5e7eb'}}>
                  <h3 style={{margin: '0 0 0.75rem 0'}}>Medicines</h3>
                  <div style={{display: 'grid', gap: '0.75rem'}}>
                    {selectedPrescription.medicines?.map((med, idx) => (
                      <div key={idx} style={{
                        padding: '0.75rem',
                        background: '#f0f9ff',
                        borderRadius: '4px',
                        fontSize: '0.95rem'
                      }}>
                        <p style={{margin: 0, fontWeight: 'bold'}}>{med.name}</p>
                        <p style={{margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem'}}>
                          {med.dosage} • {med.frequency}
                          {med.duration && <> • {med.duration}</>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPrescription.notes && (
                  <div style={{paddingTop: '1rem', borderTop: '1px solid #e5e7eb'}}>
                    <p style={{margin: '0 0 0.5rem 0', fontWeight: 'bold'}}>Additional Notes</p>
                    <p style={{margin: 0, color: '#666'}}>{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedPrescription(null)}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '0.75rem',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
