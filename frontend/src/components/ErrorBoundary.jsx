// src/components/ErrorBoundary.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <AlertCircle size={64} style={{color: '#ef4444', marginBottom: '1rem'}} />
            <h1 style={{margin: '0 0 0.5rem 0', color: '#1f2937'}}>Something Went Wrong</h1>
            <p style={{margin: '0 0 1.5rem 0', color: '#6b7280'}}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>
                <p style={{margin: 0, color: '#991b1b', fontSize: '0.85rem', fontFamily: 'monospace'}}>
                  {this.state.error?.message}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 2rem',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
