import React, { createContext, useState, useEffect } from 'react';
import { apiGet } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    async function fetchUser() {
      try {
        const me = await apiGet('/office/auth/me');
        setUser(me);
      } catch {
        setUser(null);
      }
    }
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};