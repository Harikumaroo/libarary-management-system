import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').trim().replace(/\/+$/, '');
export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add Authorization header automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const user_id = localStorage.getItem('user_id');
    const register_number = localStorage.getItem('register_number');
    const email = localStorage.getItem('email');
    
    if (token && role && username) {
      setUser({ role, username, user_id, register_number, email });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login/', {
        username,
        password
      });
      
      const { access, refresh, role, username: resUsername, user_id, register_number, email } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('role', role);
      localStorage.setItem('username', resUsername);
      if (user_id) localStorage.setItem('user_id', user_id);
      if (register_number) localStorage.setItem('register_number', register_number);
      if (email) localStorage.setItem('email', email);
      
      const userData = { role, username: resUsername, user_id, register_number, email };
      setUser(userData);
      return { success: true, role, user: userData };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || error.response?.data?.error || 'Login failed. Please check credentials.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    localStorage.removeItem('register_number');
    localStorage.removeItem('email');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
