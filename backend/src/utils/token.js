import jwt from 'jsonwebtoken';

/**
 * Resolve JWT secret based on environment
 * In production mode, mandates process.env.JWT_SECRET and throws if missing.
 * In development/test mode, falls back to a development secret if unset.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Configuration error: JWT_SECRET environment variable is strictly required in production mode.'
      );
    }
    return 'zaiqo_jwt_development_secret_key_change_in_production';
  }
  return secret;
};

/**
 * Generate a signed JWT token for a given user ID and payload
 * @param {Object} payload - User identification payload (e.g. { id, email })
 * @param {string} expiresIn - Optional expiration (default from env or 7d)
 * @returns {string} - Signed JWT string
 */
export const generateToken = (payload, expiresIn = null) => {
  const secret = getJwtSecret();
  const expiration = expiresIn || process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, {
    expiresIn: expiration,
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - Bearer JWT token string
 * @returns {Object} - Decoded token payload
 */
export const verifyToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};
