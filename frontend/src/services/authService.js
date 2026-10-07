/**
 * Zaiqo Centralized Authentication & Session Service
 * 
 * Provides mock authentication, inline validation logic, session persistence,
 * and user state management.
 * Designed to be directly replaceable by a real backend API/OAuth service.
 */

const SESSION_KEY = 'zaiqo_auth_session';
const REGISTERED_USERS_KEY = 'zaiqo_registered_users';

// Simple salt/mock hash for local prototype testing (never stored plaintext in session)
function mockHash(password) {
  try {
    return btoa(unescape(encodeURIComponent(password)));
  } catch {
    return password;
  }
}

// Initial demo user for quick prototype testing
const DEFAULT_DEMO_USERS = [
  {
    id: 'usr_demo_1',
    name: 'Zaiqo Explorer',
    email: 'demo@zaiqo.com',
    passwordHash: mockHash('wellness123'),
  },
];

/**
 * Validate email format with standard regex
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Validate password requirements
 */
export function isValidPassword(password) {
  return typeof password === 'string' && password.trim().length >= 6;
}

/**
 * Get all registered mock users from localStorage
 */
function getRegisteredUsers() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [...DEFAULT_DEMO_USERS];
    }
    const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) {
      window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(DEFAULT_DEMO_USERS));
      return [...DEFAULT_DEMO_USERS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_DEMO_USERS];
  } catch {
    return [...DEFAULT_DEMO_USERS];
  }
}

/**
 * Save registered mock users to localStorage
 */
function saveRegisteredUsers(users) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save registered users', err);
  }
}

/**
 * Get current session from localStorage
 * Returns only { id, name, email } - no passwords
 */
export function getCurrentSession() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && session.id && session.email) {
      return {
        id: session.id,
        name: session.name || 'Zaiqo User',
        email: session.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Set current session in localStorage
 */
export function setSession(user) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (err) {
    console.error('Failed to set session', err);
  }
}

/**
 * Clear session on logout
 */
export function clearSession() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error('Failed to clear session', err);
  }
}

/**
 * Check if a session exists
 */
export function isAuthenticated() {
  return Boolean(getCurrentSession());
}

/**
 * Register a new user
 */
export async function signup({ name, email, password }) {
  // Simulate small network delay (200ms)
  await new Promise((resolve) => setTimeout(resolve, 200));

  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim().toLowerCase();

  if (!trimmedName) {
    throw new Error('Please enter your full name.');
  }

  if (!isValidEmail(trimmedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!isValidPassword(password)) {
    throw new Error('Password must be at least 6 characters.');
  }

  const users = getRegisteredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);

  if (existing) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: trimmedName,
    email: trimmedEmail,
    passwordHash: mockHash(password),
  };

  users.push(newUser);
  saveRegisteredUsers(users);

  // Set session with safe user object (no password)
  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
  };

  setSession(sessionUser);
  return sessionUser;
}

/**
 * Authenticate existing user
 */
export async function login({ email, password }) {
  // Simulate small network delay (200ms)
  await new Promise((resolve) => setTimeout(resolve, 200));

  const trimmedEmail = (email || '').trim().toLowerCase();

  if (!trimmedEmail) {
    throw new Error('Please enter your email address.');
  }

  if (!isValidEmail(trimmedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password) {
    throw new Error('Please enter your password.');
  }

  const users = getRegisteredUsers();
  const targetHash = mockHash(password);

  const matched = users.find(
    (u) => u.email.toLowerCase() === trimmedEmail && u.passwordHash === targetHash
  );

  if (!matched) {
    throw new Error('Invalid email or password. Please verify your credentials.');
  }

  const sessionUser = {
    id: matched.id,
    name: matched.name,
    email: matched.email,
  };

  setSession(sessionUser);
  return sessionUser;
}

/**
 * Log out user
 */
export function logout() {
  clearSession();
}
