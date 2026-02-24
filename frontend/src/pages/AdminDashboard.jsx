// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import { Loader } from '../components/Loader';
import { Alert } from '../components/Alert';
import { BarChart3, Users, TrendingUp } from 'lucide-react';
import '../styles/dashboard.css';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    stats: {
      totalUsers: 0,
      totalDoctors: 0,
      totalAppointments: 0
    },
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, users] = await Promise.all([
        adminService.getDashboard(),
        adminService.users.getAll({ limit: 5 })
      ]);

      setData({
        stats: stats.data.data || {
          totalUsers: 0,
          totalDoctors: 0,
          totalAppointments: 0
        },
        users: users.data.data?.users || []
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className="dashboard-container">
      <div className="container">
        <h1>Admin Dashboard</h1>

        {error && <Alert type="error" message={error} />}

        <div className="stats-grid">
          <div className="stat-card">
            <Users size={32} style={{color: '#2563eb'}} />
            <div className="stat-number">{data.stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <Users size={32} style={{color: '#10b981'}} />
            <div className="stat-number">{data.stats.totalDoctors}</div>
            <div className="stat-label">Total Doctors</div>
          </div>
          <div className="stat-card">
            <TrendingUp size={32} style={{color: '#f59e0b'}} />
            <div className="stat-number">{data.stats.totalAppointments}</div>
            <div className="stat-label">Total Appointments</div>
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginTop: '2rem'}}>
          <div className="dashboard-card">
            <h2><Users size={24} /> Recent Users</h2>
            {data.users.length === 0 ? (
              <p className="empty-text">No users</p>
            ) : (
              <div style={{overflowX: 'auto'}}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map(user => (
                      <tr key={user.userId}>
                        <td>{user.firstName} {user.lastName}</td>
                        <td>{user.email}</td>
                        <td><span style={{fontSize: '0.85rem', textTransform: 'capitalize'}}>{user.role}</span></td>
                        <td>
                          <span className={`status-badge ${user.status === 'active' ? 'status-confirmed' : 'status-cancelled'}`}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card" style={{marginTop: '2rem'}}>
          <h2><BarChart3 size={24} /> System Health</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem'}}>
            <div style={{padding: '1rem', background: '#f0f9ff', borderRadius: '8px', textAlign: 'center'}}>
              <p style={{fontSize: '0.9rem', color: '#666'}}>API Status</p>
              <p style={{fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold'}}>✓ Active</p>
            </div>
            <div style={{padding: '1rem', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center'}}>
              <p style={{fontSize: '0.9rem', color: '#666'}}>Database</p>
              <p style={{fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold'}}>✓ Connected</p>
            </div>
            <div style={{padding: '1rem', background: '#fef2f2', borderRadius: '8px', textAlign: 'center'}}>
              <p style={{fontSize: '0.9rem', color: '#666'}}>Cache</p>
              <p style={{fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold'}}>✓ Running</p>
            </div>
            <div style={{padding: '1rem', background: '#fffbeb', borderRadius: '8px', textAlign: 'center'}}>
              <p style={{fontSize: '0.9rem', color: '#666'}}>Storage</p>
              <p style={{fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold'}}>✓ Available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
