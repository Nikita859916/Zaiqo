/**
 * Centralized marketplace URL and search query validation
 * Strict whitelist-based validation protecting against open redirects,
 * protocol manipulation, javascript/data URLs, and query injection.
 */

export const ALLOWED_MARKETPLACE_DOMAINS = Object.freeze([
  'blinkit.com',
  'zeptonow.com',
  'jiomart.com',
  'swiggy.com',
]);

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Validates and sanitizes a search query string for marketplace URL construction
 * @param {any} rawQuery
 * @returns {string} Sanitized query string
 * @throws {Error} If query is empty, invalid, or dangerous
 */
export const sanitizeSearchQuery = (rawQuery) => {
  if (rawQuery === null || rawQuery === undefined) {
    throw new Error('Search query cannot be empty.');
  }

  // Reject object-based prototype pollution attempts
  if (typeof rawQuery === 'object') {
    throw new Error('Search query must be a string.');
  }

  const queryStr = String(rawQuery).trim();
  if (queryStr.length === 0) {
    throw new Error('Search query cannot be empty.');
  }

  if (queryStr.length > 200) {
    throw new Error('Search query exceeds maximum length of 200 characters.');
  }

  for (const forbidden of FORBIDDEN_KEYS) {
    if (queryStr.toLowerCase().includes(forbidden)) {
      throw new Error(`Forbidden term detected in query: "${forbidden}"`);
    }
  }

  // Strip dangerous control characters and null bytes
  const sanitized = queryStr.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (sanitized.length === 0) {
    throw new Error('Search query contains only invalid control characters.');
  }

  return sanitized;
};

/**
 * Checks whether a given URL string is a valid, secure marketplace URL
 * strictly matching allowed HTTPS domains without open redirects.
 * @param {string} urlString
 * @returns {boolean}
 */
export const isValidMarketplaceUrl = (urlString) => {
  if (typeof urlString !== 'string' || !urlString.trim()) {
    return false;
  }

  try {
    const parsed = new URL(urlString.trim());

    // 1. Protocol must strictly be HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // 2. Reject credentials in URL
    if (parsed.username || parsed.password) {
      return false;
    }

    // 3. Hostname must be an exact match or valid subdomain of an allowed marketplace domain
    const hostname = parsed.hostname.toLowerCase();
    const isDomainAllowed = ALLOWED_MARKETPLACE_DOMAINS.some((allowed) => {
      return hostname === allowed || hostname.endsWith(`.${allowed}`);
    });

    if (!isDomainAllowed) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Asserts that a URL string is valid and adheres to marketplace security constraints
 * @param {string} urlString
 * @throws {Error} If URL violates security constraints
 */
export const assertValidMarketplaceUrl = (urlString) => {
  if (!isValidMarketplaceUrl(urlString)) {
    throw new Error(
      `Invalid marketplace URL: "${urlString}". URL must be HTTPS and belong to an approved domain (${ALLOWED_MARKETPLACE_DOMAINS.join(', ')}).`
    );
  }
};
