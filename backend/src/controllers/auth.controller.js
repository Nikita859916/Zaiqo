import mongoose from 'mongoose';
import User from '../models/user.model.js';
import preferenceService from '../services/preference.service.js';
import { validatePreferenceInput } from '../utils/preferenceValidation.js';
import { generateToken } from '../utils/token.js';
import { badRequest, unauthorized, conflict, ApiError } from '../utils/apiError.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Check if MongoDB connection is active
 */
const checkDbConnection = (next) => {
  if (mongoose.connection.readyState !== 1) {
    next(new ApiError(503, 'Database service is currently unavailable. Please verify MONGODB_URI configuration.'));
    return false;
  }
  return true;
};

/**
 * Register a new user
 * POST /api/auth/signup
 */
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, preferences } = req.body || {};

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Validate presence
    if (!trimmedName || !trimmedEmail || !password) {
      return next(badRequest('Please provide name, email, and password.'));
    }

    // Validate email format
    if (!emailRegex.test(trimmedEmail)) {
      return next(badRequest('Please provide a valid email address.'));
    }

    // Validate password criteria
    if (typeof password !== 'string' || password.length < 6) {
      return next(badRequest('Password must be at least 6 characters long.'));
    }

    // Validate preferences if provided
    let preferencePayload = null;
    if (preferences !== undefined && preferences !== null) {
      const validation = validatePreferenceInput(preferences, false);
      if (!validation.isValid) {
        return next(badRequest(validation.error));
      }
      preferencePayload = validation.sanitized;
    }

    // Check database availability before performing queries
    if (!checkDbConnection(next)) return;

    // Check if user already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return next(conflict('An account with this email already exists. Please log in.'));
    }

    // Create user
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password,
    });

    // Persist preferences in UserPreference collection if provided
    let createdPreferences = null;
    if (preferencePayload) {
      createdPreferences = await preferenceService.createPreferences(user._id, preferencePayload);
    }

    // Generate JWT token
    const token = generateToken({ id: user._id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
        ...(createdPreferences ? { preferences: createdPreferences } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate existing user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!trimmedEmail || !password) {
      return next(badRequest('Please provide email and password.'));
    }

    if (!emailRegex.test(trimmedEmail)) {
      return next(badRequest('Please provide a valid email address.'));
    }

    // Check database availability before performing queries
    if (!checkDbConnection(next)) return;

    // Retrieve user including password field for verification
    const user = await User.findOne({ email: trimmedEmail }).select('+password');
    if (!user) {
      return next(unauthorized('Invalid email or password.'));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(unauthorized('Invalid email or password.'));
    }

    // Generate token
    const token = generateToken({ id: user._id, email: user.email });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};
