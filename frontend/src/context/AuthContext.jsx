import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const setAuthHeader = (user) => {
  if (user?.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('safarbot_user');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.role) {
        parsed.role = String(parsed.role).toLowerCase();
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthHeader(user);
  }, [user]);

  // ✅ NEW: stable per-user chat key (so chat persists across logout/login)
  const chatKey = useMemo(() => {
    // pick the most stable identifier your backend provides
    const id = user?._id || user?.id || user?.email || 'guest';
    return String(id).toLowerCase();
  }, [user]);

  const register = async ({ name, email, password, role }) => {
    setLoading(true);
    try {
      await axios.post('/api/auth/signup', { name, email, password, role });
      return { success: true };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const payload = {
        ...res.data,
        role: res.data.role ? String(res.data.role).toLowerCase() : 'user',
      };
      setUser(payload);
      localStorage.setItem('safarbot_user', JSON.stringify(payload));
      return { success: true, user: payload };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const updateProfileLocally = (updatedUser) => {
    const normalized = {
      ...updatedUser,
      role: updatedUser.role ? String(updatedUser.role).toLowerCase() : 'user',
    };
    setUser(normalized);
    localStorage.setItem('safarbot_user', JSON.stringify(normalized));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('safarbot_user');
    // ✅ NOTE: DO NOT clear chat here if you want chat to remain
  };

  return (
    <AuthContext.Provider
      value={{ user, register, login, updateProfileLocally, logout, loading, chatKey }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);