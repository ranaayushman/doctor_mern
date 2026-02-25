// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';

export const AuthContext = createContext();

// Cookie helpers
const setCookie = (name, value, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const removeCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth from cookies/localStorage
  useEffect(() => {
    const savedToken = getCookie('accessToken');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // If the stored user has no role it's stale data from before the role fix.
      // Clear it so the user gets a clean login that returns role correctly.
      if (!parsedUser.role) {
        removeCookie('accessToken');
        removeCookie('refreshToken');
        localStorage.removeItem('user');
      } else {
        setToken(savedToken);
        setUser(parsedUser);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, isDoctor = false) => {
    try {
      setError(null);
      const endpoint = isDoctor ? API_ENDPOINTS.DOCTOR.LOGIN : API_ENDPOINTS.AUTH.LOGIN;
      const response = await api.post(endpoint, { email, password });

      const { user: userData, tokens } = response.data.data;
      const accessToken = tokens?.accessToken || response.data.data.token;

      setCookie('accessToken', accessToken, 7);
      if (tokens?.refreshToken) {
        setCookie('refreshToken', tokens.refreshToken, 30);
      }
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (formData, isDoctor = false) => {
    try {
      setError(null);
      const endpoint = isDoctor ? API_ENDPOINTS.DOCTOR.REGISTER : API_ENDPOINTS.AUTH.REGISTER;
      const response = await api.post(endpoint, formData);

      const { user: userData, tokens } = response.data.data;
      const accessToken = tokens?.accessToken || response.data.data.token;

      setCookie('accessToken', accessToken, 7);
      if (tokens?.refreshToken) {
        setCookie('refreshToken', tokens.refreshToken, 30);
      }
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const updateProfile = async (data, isDoctor = false) => {
    try {
      setError(null);
      const endpoint = isDoctor ? API_ENDPOINTS.DOCTOR.UPDATE_PROFILE : API_ENDPOINTS.AUTH.UPDATE_PROFILE;
      const response = await api.patch(endpoint, data);

      const updatedUser = response.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Profile update failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    removeCookie('accessToken');
    removeCookie('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    updateProfile,
    logout,
    isAuthenticated: !!token,
    isDoctor: user?.role === 'doctor',
    isPatient: user?.role === 'patient',
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
