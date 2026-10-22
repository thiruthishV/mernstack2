import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('library_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('library_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('library_token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          setUser((prev) => ({ ...prev, ...res.data }));
          localStorage.setItem('library_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, ...userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('library_token', newToken);
    localStorage.setItem('library_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    const { token: newToken, ...userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('library_token', newToken);
    localStorage.setItem('library_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
  };

  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isMember,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
