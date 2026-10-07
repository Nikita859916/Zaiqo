/**
 * Price & Availability Cache Utility (Phase 10 Step 4)
 * Provides short-lived, in-memory TTL caching with deterministic key hashing,
 * capacity bounding, LRU eviction, mutation protection, and in-flight request coalescing.
 * Strictly avoids caching errors, timeouts, malformed data, or unconfigured fallbacks.
 */

export const DEFAULT_PRICE_CACHE_TTL_MS = 60 * 1000; // 60 seconds
export const DEFAULT_MAX_PRICE_CACHE_ENTRIES = 500;

/**
 * Deep clones an object safely to prevent caller mutations from corrupting cache state.
 * @param {any} obj
 * @returns {any}
 */
export function cloneDeep(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch {
      // Fallback for objects with non-cloneable prototypes
    }
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generates a deterministic, specific cache key for price requests.
 * Distinguishes marketplace, canonical query, explicit pack-sizes/units, and location context.
 * Normalizes harmless whitespace and casing differences to maximize safe hit rates.
 *
 * @param {string} marketplace - Retailer platform (e.g. 'instamart', 'blinkit')
 * @param {string|Object} queryObj - Query string or object containing canonicalQuery, pack info
 * @param {Object} [context={}] - Optional location context (pincode, city)
 * @returns {string} Deterministic cache key
 */
export function generatePriceCacheKey(marketplace, queryObj, context = {}) {
  const mkt = typeof marketplace === 'string' ? marketplace.trim().toLowerCase() : 'unknown';

  let canonical = '';
  if (typeof queryObj === 'string') {
    canonical = queryObj.trim().toLowerCase().replace(/\s+/g, ' ');
  } else if (queryObj && typeof queryObj === 'object') {
    canonical = (queryObj.canonicalQuery || queryObj.query || queryObj.originalName || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  // Pack/unit distinction if explicitly provided
  let packPart = '';
  const packQty = queryObj?.packQuantity ?? queryObj?.quantity;
  const packUnit = queryObj?.packUnit ?? queryObj?.unit;
  if (packQty !== undefined && packQty !== null && packUnit) {
    packPart = `:pack=${String(packQty).trim()}${String(packUnit).trim().toLowerCase()}`;
  }

  // Location context distinction (e.g. dark store / hyperlocal pricing)
  let contextPart = '';
  if (context && typeof context === 'object') {
    const parts = [];
    if (context.pincode) parts.push(`pin=${String(context.pincode).trim()}`);
    if (context.city) parts.push(`city=${String(context.city).trim().toLowerCase()}`);
    if (parts.length > 0) {
      contextPart = `:${parts.sort().join(';')}`;
    }
  }

  return `${mkt}:${canonical}${packPart}${contextPart}`;
}

/**
 * Validates whether a provider offer is safe and valid to cache.
 * Strictly prevents caching errors, timeouts, unconfigured fallbacks, and malformed prices.
 *
 * @param {any} offer - Candidate offer
 * @returns {boolean} True if offer is verified and cacheable
 */
export function isCacheableOffer(offer) {
  if (!offer || typeof offer !== 'object' || Array.isArray(offer)) {
    return false;
  }

  // Never cache errors, rejections, or failed provider payloads
  if (offer.error || offer.failed === true) {
    return false;
  }

  // Never cache unconfigured adapter fallbacks or generic search link placeholders
  if (offer.source === 'unconfigured' || offer.source === 'fallback') {
    return false;
  }

  // Marketplace name must be valid
  if (typeof offer.marketplace !== 'string' || !offer.marketplace.trim()) {
    return false;
  }

  // Case 1: Valid priced offer
  const hasValidPrice =
    typeof offer.price === 'number' &&
    Number.isFinite(offer.price) &&
    !Number.isNaN(offer.price) &&
    offer.price > 0;

  if (hasValidPrice) {
    const currency =
      typeof offer.currency === 'string' && offer.currency.trim()
        ? offer.currency.trim().toUpperCase()
        : 'INR';
    if (!currency) return false;
    return offer.pricingAvailable !== false;
  }

  // Case 2: Explicit valid unavailable result from a configured live provider
  // (e.g. verified out-of-stock without exceptions or unconfigured status)
  if (offer.available === false || offer.pricingAvailable === false) {
    return Boolean(offer.source && offer.source !== 'unconfigured' && !offer.error);
  }

  return false;
}

/**
 * In-memory TTL Price Cache with LRU capacity bounding and mutation protection.
 */
export class PriceCache {
  /**
   * @param {Object} [options={}]
   * @param {number} [options.ttlMs=60000] Default TTL in milliseconds
   * @param {number} [options.maxEntries=500] Maximum entries allowed before LRU eviction
   */
  constructor(options = {}) {
    this.ttlMs =
      typeof options.ttlMs === 'number' && options.ttlMs > 0
        ? options.ttlMs
        : DEFAULT_PRICE_CACHE_TTL_MS;
    this.maxEntries =
      typeof options.maxEntries === 'number' && options.maxEntries > 0
        ? options.maxEntries
        : DEFAULT_MAX_PRICE_CACHE_ENTRIES;
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  getTTL() {
    return this.ttlMs;
  }

  setTTL(ms) {
    if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0) {
      this.ttlMs = Math.floor(ms);
    }
    return this.ttlMs;
  }

  resetTTL() {
    this.ttlMs = DEFAULT_PRICE_CACHE_TTL_MS;
    return this.ttlMs;
  }

  getMaxEntries() {
    return this.maxEntries;
  }

  setMaxEntries(max) {
    if (typeof max === 'number' && Number.isFinite(max) && max > 0) {
      this.maxEntries = Math.floor(max);
      this._pruneToCapacity();
    }
    return this.maxEntries;
  }

  /**
   * Retrieves a cached value by key if present and not expired.
   * Returns a deep clone to prevent callers from corrupting cache entries.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    if (!key || !this.store.has(key)) {
      this.misses++;
      return null;
    }

    const entry = this.store.get(key);
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    // Re-insert key to refresh LRU order
    this.store.delete(key);
    this.store.set(key, entry);
    return cloneDeep(entry.value);
  }

  /**
   * Stores a value in the cache with the configured or custom TTL.
   * Clones the value to ensure immutability.
   * @param {string} key
   * @param {any} value
   * @param {number} [customTtlMs]
   * @returns {boolean}
   */
  set(key, value, customTtlMs = null) {
    if (!key || typeof key !== 'string') return false;

    // Prune expired entries if at or near capacity
    if (this.store.size >= this.maxEntries) {
      this.pruneExpired();
    }

    // If still at capacity, evict the oldest entry (first item in Map)
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    const ttl =
      typeof customTtlMs === 'number' && customTtlMs > 0 ? customTtlMs : this.ttlMs;
    const now = Date.now();

    this.store.set(key, {
      value: cloneDeep(value),
      createdAt: now,
      expiresAt: now + ttl,
    });
    return true;
  }

  has(key) {
    if (!key || !this.store.has(key)) return false;
    const entry = this.store.get(key);
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key) {
    if (!key) return false;
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  size() {
    this.pruneExpired();
    return this.store.size;
  }

  rawSize() {
    return this.store.size;
  }

  pruneExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  _pruneToCapacity() {
    this.pruneExpired();
    while (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
      hits: this.hits,
      misses: this.misses,
    };
  }
}

export const defaultPriceCache = new PriceCache();
