import { ApiError } from '../utils/apiError.js';

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Centralized Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with that ${field} already exists.`;
  }

  // Handle Mongoose schema validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // Handle Mongoose connection/buffering errors
  if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
    statusCode = 503;
    message = 'Database service temporarily unavailable. Please try again shortly.';
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Image file size exceeds the maximum limit of 10 MB.';
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  const isDev = process.env.NODE_ENV !== 'production';

  // In production, ensure no raw database credentials or tokens leak into error messages
  let safeMessage = message;
  if (!isDev && typeof message === 'string') {
    safeMessage = message
      .replace(/mongodb(\+srv)?:\/\/[^\s@]+@/gi, 'mongodb://[REDACTED]@')
      .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/key=[a-zA-Z0-9_-]+/gi, 'key=[REDACTED]');
  }

  res.status(statusCode).json({
    success: false,
    error: safeMessage,
    message: safeMessage,
    ...(details ? { details } : {}),
    ...(isDev && statusCode === 500 ? { stack: err.stack } : {}),
  });
};
