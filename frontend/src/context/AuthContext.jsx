import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: { key: 'admin', label: 'Admin (Full Access)', color: 'purple' },
  MANAGER: { key: 'manager', label: 'Warehouse Manager', color: 'indigo' },
  PICKER: { key: 'picker', label: 'Picker (Zone Squad)', color: 'emerald' },
  PACKER: { key: 'packer', label: 'Packer & Dispatch', color: 'amber' },
  INVENTORY: { key: 'inventory', label: 'Inventory Control', color: 'cyan' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('smartfulfill_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.user);
        } catch (err) {
          localStorage.removeItem('smartfulfill_token');
          // Auto login as Manager for demo ease
          await demoSwitchRole('manager');
        }
      } else {
        // Automatically default to Manager demo account for instant hackathon walkthrough
        await demoSwitchRole('manager');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    localStorage.setItem('smartfulfill_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const demoSwitchRole = async (roleKey) => {
    try {
      const res = await authApi.demoLogin(roleKey);
      localStorage.setItem('smartfulfill_token', res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      console.error('Demo login failed', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('smartfulfill_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, demoSwitchRole, roles: ROLES }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
