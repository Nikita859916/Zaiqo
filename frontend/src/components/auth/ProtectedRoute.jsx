import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChefHat } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg animate-pulse mb-3">
          <ChefHat className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Verifying Zaiqo Session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to login while preserving target route
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
