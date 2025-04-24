// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default headers for axios
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const loadUser = async () => {
    try {
      const res = await axios.get('/api/users/me');
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  const login = async (formData) => {
    try {
      const res = await axios.post('/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      return false;
    }
  };

  const register = async (formData) => {
    try {
      const res = await axios.post('/api/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        loading,
        user,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
