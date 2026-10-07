import mongoose from 'mongoose';
import { verifyToken } from '../utils/token.js';
import User from '../models/user.model.js';
import { unauthorized, ApiError } from '../utils/apiError.js';

/**
 * Middleware to protect private routes using JWT Bearer authentication
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1].trim();
    }

    if (!token) {
      return next(unauthorized('Authentication required. No token provided.'));
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(unauthorized('Authentication token has expired. Please log in again.'));
      }
      return next(unauthorized('Invalid authentication token.'));
    }

    if (!decoded || !decoded.id) {
      return next(unauthorized('Malformed token payload.'));
    }

    // Verify database connection is active
    if (mongoose.connection.readyState !== 1) {
      return next(new ApiError(503, 'Database service is currently unavailable. Please verify MONGODB_URI configuration.'));
    }

    // Check if user still exists in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(unauthorized('User account associated with this token no longer exists.'));
    }

    // Attach authenticated user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to optionally attach authenticated user if valid token is provided
 * Does not reject requests without tokens
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1].trim();
    }

    if (!token) {
      return next();
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return next();
    }

    if (decoded && decoded.id && mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};
