import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('hostel_user_data');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hostel_jwt_token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.post('/auth/login', { email, password });
      const { access_token, user: userData } = res.data;
      
      localStorage.setItem('hostel_jwt_token', access_token);
      localStorage.setItem('hostel_user_data', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      return userData;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('hostel_jwt_token');
    localStorage.removeItem('hostel_user_data');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const newObj = { ...prev, ...updatedFields };
      localStorage.setItem('hostel_user_data', JSON.stringify(newObj));
      return newObj;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, updateUser, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
