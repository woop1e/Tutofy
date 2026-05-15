import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

function buildUser(decoded, storedName) {
  return {
    ...decoded,
    name: storedName || decoded.name || '',
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const name = localStorage.getItem('user_name') || '';
        setUser(buildUser(decoded, name));
        setRole(decoded.role);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user_name');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token, name) => {
    localStorage.setItem('token', token);
    if (name) localStorage.setItem('user_name', name);
    const decoded = jwtDecode(token);
    const storedName = name || localStorage.getItem('user_name') || '';
    setUser(buildUser(decoded, storedName));
    setRole(decoded.role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    setUser(null);
    setRole(null);
  };

  const value = {
    user,
    role,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
