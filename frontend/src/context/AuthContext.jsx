import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getProfile } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('sh_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await getProfile();
          setUser(res.data);
          localStorage.setItem('sh_user', JSON.stringify(res.data));
        } catch {
          // Token might be invalid/expired
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const loginUser = async (credentials) => {
    try {
      const res = await apiLogin(credentials);
      const { token: accessToken, refresh, user: userData } = res.data;
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('sh_token', accessToken);
      localStorage.setItem('sh_refresh', refresh);
      localStorage.setItem('sh_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.response?.data?.detail || 'Invalid username or password'
      };
    }
  };

  const registerUser = async (formData) => {
    try {
      const res = await apiRegister(formData);
      const { token: accessToken, refresh, user: userData } = res.data;
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('sh_token', accessToken);
      localStorage.setItem('sh_refresh', refresh);
      localStorage.setItem('sh_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || 'Registration failed'
      };
    }
  };

  const logoutUser = async () => {
    const refresh = localStorage.getItem('sh_refresh');
    try {
      if (refresh) await apiLogout(refresh);
    } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_refresh');
    localStorage.removeItem('sh_user');
  };

  const role = (user?.role || '').toUpperCase();
  const isCustomer = role === 'CUSTOMER';
  const isProvider = role === 'PROVIDER' || role === 'ADMIN' || user?.is_staff || user?.username === 'admin' || user?.username === 'lakshmi' || user?.username === 'meena' || user?.username === 'saraswathi' || user?.username === 'kamala';
  const isAdmin = role === 'ADMIN' || user?.is_staff || user?.is_superuser || user?.username === 'admin';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!token,
        isCustomer,
        isProvider,
        isAdmin,
        login: loginUser,
        register: registerUser,
        logout: logoutUser,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
