import api from './api';

const TOKEN_KEY = 'zaiqo_auth_token';

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
 * Retrieve stored JWT token
 */
export function getToken() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Store JWT token
 */
export function setToken(token) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Storage access gracefully ignored
  }
}

/**
 * Remove stored JWT token and clear legacy session markers
 */
export function removeToken() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem('zaiqo_auth_session');
    window.localStorage.removeItem('zaiqo_registered_users');
  } catch {
    // Storage access gracefully ignored
  }
}

/**
 * Check if an active token is stored
 */
export function isAuthenticated() {
  return Boolean(getToken());
}

/**
 * Register a new user via POST /api/auth/signup
 */
export async function signup(payloadOrName, email, password) {
  let name;
  if (typeof payloadOrName === 'object' && payloadOrName !== null) {
    name = payloadOrName.name;
    email = payloadOrName.email;
    password = payloadOrName.password;
  } else {
    name = payloadOrName;
  }

  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim().toLowerCase();

  if (!trimmedName) {
    throw new Error('Please enter your full name.');
  }

  if (!isValidEmail(trimmedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (!isValidPassword(password)) {
    throw new Error('Password must be at least 6 characters long.');
  }

  try {
    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      password,
    };
    if (typeof payloadOrName === 'object' && payloadOrName?.preferences) {
      payload.preferences = payloadOrName.preferences;
    }

    const response = await api.post('/auth/signup', payload);

    const responseData = response.data?.data || response.data || {};
    const { token, user } = responseData;

    if (token) {
      setToken(token);
    }

    return user;
  } catch (error) {
    if (!error.response) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    const errorMsg =
      error.response?.data?.message ||
      (error.response?.status === 409
        ? 'An account with this email already exists. Please log in.'
        : error.response?.status === 503
        ? 'Database service is currently unavailable. Please try again shortly.'
        : 'Failed to create account. Please try again.');
    throw new Error(errorMsg);
  }
}

/**
 * Authenticate existing user via POST /api/auth/login
 */
export async function login(payloadOrEmail, password) {
  let email;
  if (typeof payloadOrEmail === 'object' && payloadOrEmail !== null) {
    email = payloadOrEmail.email;
    password = payloadOrEmail.password;
  } else {
    email = payloadOrEmail;
  }

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

  try {
    const response = await api.post('/auth/login', {
      email: trimmedEmail,
      password,
    });

    const responseData = response.data?.data || response.data || {};
    const { token, user } = responseData;

    if (token) {
      setToken(token);
    }

    return user;
  } catch (error) {
    if (!error.response) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    const errorMsg =
      error.response?.data?.message ||
      (error.response?.status === 401
        ? 'Invalid email or password. Please verify your credentials.'
        : error.response?.status === 503
        ? 'Database service is currently unavailable. Please try again shortly.'
        : 'Failed to sign in. Please check your credentials.');
    throw new Error(errorMsg);
  }
}

/**
 * Retrieve authenticated user profile via GET /api/auth/me
 */
export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await api.get('/auth/me');
    return response.data?.data?.user || response.data?.user || null;
  } catch (error) {
    // If token expired or invalid, clear token and return null
    if (error.response?.status === 401) {
      removeToken();
    }
    return null;
  }
}

/**
 * Alias for backward compatibility
 */
export function getCurrentSession() {
  return null;
}

/**
 * Log out user by clearing stored JWT and state
 */
export function logout() {
  removeToken();
}
