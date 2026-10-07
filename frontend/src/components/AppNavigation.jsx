import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  LayoutDashboard,
  MessageSquare,
  UtensilsCrossed,
  Calendar,
  ShoppingCart,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loadGroceryList } from '../services/groceryService';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Ask Zai', path: '/zai', icon: MessageSquare },
  { name: 'Recipes', path: '/recipes', icon: UtensilsCrossed },
  { name: 'Meal Planner', path: '/meal-planner', icon: Calendar },
  { name: 'Grocery List', path: '/grocery', icon: ShoppingCart },
  { name: 'Account', path: '/account', icon: User },
];

export default function AppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [groceryCount, setGroceryCount] = useState(0);

  // Sync remaining grocery items count
  const refreshGroceryCount = () => {
    try {
      const items = loadGroceryList();
      const remaining = items.filter((i) => !i.completed).length;
      setGroceryCount(remaining);
    } catch {
      setGroceryCount(0);
    }
  };

  useEffect(() => {
    refreshGroceryCount();
    // Close mobile drawer on route transition
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path) => {
    if (path === '/zai' && (location.pathname === '/zai' || location.pathname === '/chat')) return true;
    if (path === '/meal-planner' && (location.pathname === '/meal-planner' || location.pathname === '/planner')) return true;
    return location.pathname === path;
  };

  const displayName = user?.name || 'Member';
  const displayInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-40 bg-[#FAFBF7]/90 backdrop-blur-md border-b border-[#E5EAD8] px-4 sm:px-6 py-3 shadow-[0_2px_12px_rgba(40,74,18,0.03)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 group cursor-pointer focus-visible:outline-2 focus-visible:outline-[#284A12] rounded-2xl"
            title="Zaiqo Dashboard"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#284A12] via-[#3E5C22] to-[#284A12] flex items-center justify-center text-[#D8E8B5] shadow-sm group-hover:scale-105 transition-transform">
              <ChefHat className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-[#24301F] leading-none flex items-center gap-1">
                Zaiqo
                <span className="text-[#78A83A] text-sm">&bull;</span>
              </span>
              <span className="text-[9px] tracking-wider uppercase font-semibold text-[#557342]">
                Food &amp; Wellness
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-[#284A12] text-[#FAFBF7] shadow-xs'
                      : 'text-[#71806A] hover:text-[#24301F] hover:bg-[#F1F4E6]/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#D8E8B5]' : 'text-[#71806A]'}`} />
                  <span>{item.name}</span>
                  {item.path === '/grocery' && groceryCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        active ? 'bg-[#D8E8B5] text-[#284A12]' : 'bg-[#E5EAD8] text-[#24301F]'
                      }`}
                    >
                      {groceryCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Companion Live Indicator & User Account Controls */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Zai Companion Status Pill */}
          <Link
            to="/zai"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1F4E6] border border-[#D8E8B5] text-[#284A12] text-xs font-semibold hover:bg-[#E3EBCF] transition-colors"
            title="Chat with Zai"
          >
            <span className="flex h-2 w-2 relative" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#78A83A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#78A83A]"></span>
            </span>
            <span>Zai Online</span>
          </Link>

          <div className="h-4 w-px bg-[#E5EAD8]" />

          {/* User Account Button */}
          <Link
            to="/account"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAFBF7] hover:bg-[#F1F4E6] text-[#24301F] text-xs font-semibold transition-colors border border-[#E5EAD8]"
            title={`Account settings for ${displayName}`}
          >
            <div className="w-5 h-5 rounded-full bg-[#284A12] text-[#D8E8B5] flex items-center justify-center text-[10px] font-bold">
              {displayInitial}
            </div>
            <span className="max-w-[110px] truncate">{displayName.split(' ')[0]}</span>
          </Link>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-[#FAFBF7] hover:bg-rose-50 text-[#71806A] hover:text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-[#E5EAD8] hover:border-rose-200"
            title="Sign out of Zaiqo"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-2xl text-[#24301F] hover:bg-[#F1F4E6] transition-colors cursor-pointer"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-[#E5EAD8] mt-3 pt-3 space-y-2 overflow-hidden"
          >
            {/* User Info Bar */}
            <div className="flex items-center justify-between p-3 bg-[#F1F4E6] rounded-2xl border border-[#D8E8B5] mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#284A12] text-[#D8E8B5] flex items-center justify-center text-xs font-bold">
                  {displayInitial}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#24301F]">{displayName}</span>
                  <span className="text-[10px] text-[#71806A] truncate max-w-[180px]">{user?.email}</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D8E8B5] text-[#284A12] text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#284A12]" />
                Active
              </div>
            </div>

            {/* Mobile Nav Links */}
            <div className="grid grid-cols-1 gap-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#284A12] text-[#FAFBF7] font-bold shadow-xs'
                        : 'text-[#24301F] hover:bg-[#F1F4E6]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-[#D8E8B5]' : 'text-[#71806A]'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.path === '/grocery' && groceryCount > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          active ? 'bg-[#D8E8B5] text-[#284A12]' : 'bg-[#E5EAD8] text-[#24301F]'
                        }`}
                      >
                        {groceryCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Sign Out */}
            <div className="pt-2 border-t border-[#E5EAD8]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Zaiqo</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
