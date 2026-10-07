/**
 * Custom Error class for operational API errors
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const badRequest = (message = 'Bad Request', details = null) => {
  return new ApiError(400, message, details);
};

export const unauthorized = (message = 'Unauthorized', details = null) => {
  return new ApiError(401, message, details);
};

export const forbidden = (message = 'Forbidden', details = null) => {
  return new ApiError(403, message, details);
};

export const notFound = (message = 'Resource not found', details = null) => {
  return new ApiError(404, message, details);
};

export const conflict = (message = 'Conflict', details = null) => {
  return new ApiError(409, message, details);
};

export const internal = (message = 'Internal Server Error', details = null) => {
  return new ApiError(500, message, details);
};
