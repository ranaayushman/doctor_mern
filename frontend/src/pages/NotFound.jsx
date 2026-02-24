// src/pages/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'white',
        borderRadius: '8px',
        padding: '3rem 2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '500px'
      }}>
        <AlertCircle size={80} style={{color: '#ef4444', marginBottom: '1rem'}} />
        <h1 style={{margin: '0 0 1rem 0', fontSize: '3rem', color: '#1f2937'}}>404</h1>
        <h2 style={{margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#4b5563'}}>Page Not Found</h2>
        <p style={{margin: '0 0 2rem 0', color: '#6b7280', fontSize: '1rem', lineHeight: '1.6'}}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.75rem 2rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          Go Home
        </button>
        <br />
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '0.75rem 2rem',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};
