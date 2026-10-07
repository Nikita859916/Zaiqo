import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentSession,
  login as authServiceLogin,
  signup as authServiceSignup,
  logout as authServiceLogout,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    try {
      const activeSession = getCurrentSession();
      if (activeSession) {
        setUser(activeSession);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const authenticatedUser = await authServiceLogin({ email, password });
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const signup = async (name, email, password) => {
    const newUser = await authServiceSignup({ name, email, password });
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    authServiceLogout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
