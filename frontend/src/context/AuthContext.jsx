import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getToken,
  removeToken,
  getCurrentUser,
  login as authServiceLogin,
  signup as authServiceSignup,
  logout as authServiceLogout,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and validate session on mount against /api/auth/me
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const token = getToken();
        if (token) {
          const verifiedUser = await getCurrentUser();
          if (isMounted) {
            if (verifiedUser) {
              setUser(verifiedUser);
            } else {
              removeToken();
              setUser(null);
            }
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch {
        removeToken();
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for unauthorized 401 events dispatched by API client
  useEffect(() => {
    const handleUnauthorized = (e) => {
      const url = e?.detail?.url || '';
      if (!url.includes('/auth/login')) {
        removeToken();
        setUser(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('zaiqo:unauthorized', handleUnauthorized);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('zaiqo:unauthorized', handleUnauthorized);
      }
    };
  }, []);

  const login = async (email, password) => {
    const authenticatedUser = await authServiceLogin(email, password);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const signup = async (name, email, password) => {
    const newUser = await authServiceSignup(name, email, password);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    authServiceLogout();
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const refreshed = await getCurrentUser();
      if (refreshed) {
        setUser(refreshed);
      } else {
        removeToken();
        setUser(null);
      }
      return refreshed;
    } catch {
      removeToken();
      setUser(null);
      return null;
    }
  }, []);

  const value = {
    user,
    setUser,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
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
