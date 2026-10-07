/**
 * Base Price Provider Interface (Phase 3)
 * Defines the contract for marketplace price intelligence providers.
 * Strictly non-scraping, non-fabricating, deterministic boundary.
 */
import { isValidMarketplaceUrl } from '../../utils/marketplaceUrlValidation.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Standard offer shape produced by price providers
 * @typedef {Object} PriceOffer
 * @property {string} marketplace - Identifier (e.g. 'blinkit')
 * @property {string} displayName - Human-readable name (e.g. 'Blinkit')
 * @property {string|null} productName - Matched product title or null
 * @property {string|null} productUrl - Verified external product URL or null
 * @property {string|null} searchUrl - Verified fallback search URL or null
 * @property {number|null} price - Verified numeric price in INR or null
 * @property {string} currency - Currency code (default 'INR')
 * @property {number|null} packQuantity - Numeric pack quantity (e.g. 500) or null
 * @property {string|null} packUnit - Unit string (e.g. 'g', 'ml', 'kg') or null
 * @property {boolean} available - Whether item is in stock
 * @property {boolean} pricingAvailable - Whether verified live pricing was retrieved
 * @property {string} source - 'provider' | 'unconfigured'
 * @property {string|null} fetchedAt - ISO timestamp of retrieval or null
 */

export class BasePriceProvider {
  /**
   * @param {string} id - Lowercase marketplace identifier (e.g. 'blinkit')
   * @param {string} displayName - Human-readable name (e.g. 'Blinkit')
   * @param {Object} [options={}] - Optional configuration options
   */
  constructor(id, displayName, options = {}) {
    if (!id || typeof id !== 'string' || !id.trim()) {
      throw new Error('Price provider requires a valid id.');
    }
    if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
      throw new Error('Price provider requires a valid displayName.');
    }

    const cleanId = id.trim().toLowerCase();
    if (FORBIDDEN_KEYS.has(cleanId)) {
      throw new Error(`Forbidden provider id: "${cleanId}"`);
    }

    this.id = cleanId;
    this.name = this.id;
    this.displayName = displayName.trim();
    this._configured = Boolean(options.configured);
  }

  /**
   * Deterministically reports whether this provider has active credentials/API configuration.
   * In production without official partner credentials, always returns false.
   * @returns {boolean}
   */
  isConfigured() {
    return this._configured;
  }

  /**
   * Whether this provider currently supports pricing lookups.
   * @returns {boolean}
   */
  supportsPricing() {
    return this.isConfigured();
  }

  /**
   * Formats and normalizes incoming product query input
   * @param {string|Object} productQuery
   * @returns {{ query: string, originalName: string }}
   */
  formatCanonicalQuery(productQuery) {
    if (!productQuery) {
      return { query: '', originalName: '' };
    }

    if (typeof productQuery === 'string') {
      const clean = productQuery.trim();
      return {
        query: clean.toLowerCase(),
        originalName: clean,
      };
    }

    if (typeof productQuery === 'object') {
      const originalName = String(productQuery.originalName || productQuery.name || productQuery.query || '').trim();
      const query = String(productQuery.query || productQuery.canonicalQuery || originalName).trim().toLowerCase();
      return {
        query,
        originalName: originalName || query,
      };
    }

    return { query: '', originalName: '' };
  }

  /**
   * Validates and sanitizes optional geographic context for location-aware queries
   * Does NOT persist or call geolocation services.
   * @param {Object} [context={}]
   * @returns {{ pincode: string|null, city: string|null, latitude: number|null, longitude: number|null }}
   */
  sanitizeContext(context = {}) {
    if (!context || typeof context !== 'object' || Array.isArray(context)) {
      return { pincode: null, city: null, latitude: null, longitude: null };
    }

    if (
      Object.prototype.hasOwnProperty.call(context, '__proto__') ||
      (Object.getPrototypeOf(context) !== Object.prototype && Object.getPrototypeOf(context) !== null)
    ) {
      throw new Error('Forbidden context key: prototype pollution detected');
    }

    for (const key of Object.getOwnPropertyNames(context)) {
      if (FORBIDDEN_KEYS.has(key)) {
        throw new Error(`Forbidden context key: "${key}"`);
      }
    }

    let pincode = null;
    if (typeof context.pincode === 'string' && /^\d{6}$/.test(context.pincode.trim())) {
      pincode = context.pincode.trim();
    }

    let city = null;
    if (typeof context.city === 'string' && context.city.trim().length > 0) {
      city = context.city.trim().slice(0, 50);
    }

    let latitude = null;
    if (typeof context.latitude === 'number' && Number.isFinite(context.latitude)) {
      latitude = context.latitude >= -90 && context.latitude <= 90 ? context.latitude : null;
    }

    let longitude = null;
    if (typeof context.longitude === 'number' && Number.isFinite(context.longitude)) {
      longitude = context.longitude >= -180 && context.longitude <= 180 ? context.longitude : null;
    }

    let addressId = null;
    if (typeof context.addressId === 'string' && context.addressId.trim().length > 0) {
      addressId = context.addressId.trim().slice(0, 100);
    }

    return { pincode, city, latitude, longitude, addressId };
  }

  /**
   * Creates a deterministic unconfigured offer representation.
   * Never fabricates prices or availability.
   * @param {{ query: string, originalName: string }} queryObj
   * @param {Object} [context={}]
   * @returns {PriceOffer}
   */
  createUnconfiguredOffer(queryObj = { query: '', originalName: '' }, context = {}) {
    return {
      marketplace: this.id,
      displayName: this.displayName,
      productName: queryObj.originalName || null,
      productUrl: null,
      searchUrl: null,
      price: null,
      currency: 'INR',
      packQuantity: null,
      packUnit: null,
      available: false,
      pricingAvailable: false,
      source: 'unconfigured',
      fetchedAt: null,
    };
  }

  /**
   * Validates and sanitizes a raw offer against the strict result contract.
   * Protects against prototype pollution, malformed prices, and arbitrary URLs.
   * @param {any} rawOffer
   * @returns {PriceOffer}
   */
  sanitizeOffer(rawOffer) {
    if (!rawOffer || typeof rawOffer !== 'object' || Array.isArray(rawOffer)) {
      return this.createUnconfiguredOffer();
    }

    if (
      Object.prototype.hasOwnProperty.call(rawOffer, '__proto__') ||
      (Object.getPrototypeOf(rawOffer) !== Object.prototype && Object.getPrototypeOf(rawOffer) !== null)
    ) {
      throw new Error('Forbidden offer property: prototype pollution detected');
    }

    for (const key of Object.getOwnPropertyNames(rawOffer)) {
      if (FORBIDDEN_KEYS.has(key)) {
        throw new Error(`Forbidden offer property: "${key}"`);
      }
    }

    const marketplace = this.id;
    const displayName = typeof rawOffer.displayName === 'string' && rawOffer.displayName.trim()
      ? rawOffer.displayName.trim()
      : this.displayName;

    const productName = typeof rawOffer.productName === 'string' && rawOffer.productName.trim()
      ? rawOffer.productName.trim()
      : null;

    let productUrl = null;
    if (typeof rawOffer.productUrl === 'string' && rawOffer.productUrl.trim()) {
      const cleanUrl = rawOffer.productUrl.trim();
      if (isValidMarketplaceUrl(cleanUrl)) {
        productUrl = cleanUrl;
      }
    }

    let searchUrl = null;
    if (typeof rawOffer.searchUrl === 'string' && rawOffer.searchUrl.trim()) {
      const cleanSearchUrl = rawOffer.searchUrl.trim();
      if (isValidMarketplaceUrl(cleanSearchUrl)) {
        searchUrl = cleanSearchUrl;
      }
    }

    const rawPrice = rawOffer.price;
    const isValidPrice =
      typeof rawPrice === 'number' &&
      Number.isFinite(rawPrice) &&
      !Number.isNaN(rawPrice) &&
      rawPrice > 0;

    const price = isValidPrice ? Math.round(rawPrice * 100) / 100 : null;
    const currency = typeof rawOffer.currency === 'string' && rawOffer.currency.trim()
      ? rawOffer.currency.trim().toUpperCase()
      : 'INR';

    let packQuantity = null;
    if (
      typeof rawOffer.packQuantity === 'number' &&
      Number.isFinite(rawOffer.packQuantity) &&
      rawOffer.packQuantity > 0
    ) {
      packQuantity = rawOffer.packQuantity;
    }

    let packUnit = null;
    if (typeof rawOffer.packUnit === 'string' && rawOffer.packUnit.trim()) {
      packUnit = rawOffer.packUnit.trim().toLowerCase();
    }

    const pricingAvailable = Boolean(this.isConfigured() && isValidPrice && rawOffer.pricingAvailable !== false);
    const available = Boolean(pricingAvailable && rawOffer.available !== false);
    const source = pricingAvailable ? 'provider' : 'unconfigured';

    let fetchedAt = null;
    if (pricingAvailable && rawOffer.fetchedAt) {
      const parsedDate = new Date(rawOffer.fetchedAt);
      if (!Number.isNaN(parsedDate.getTime())) {
        fetchedAt = parsedDate.toISOString();
      }
    }

    return {
      marketplace,
      displayName,
      productName,
      productUrl,
      searchUrl,
      price,
      currency,
      packQuantity,
      packUnit,
      available,
      pricingAvailable,
      source,
      fetchedAt,
    };
  }

  /**
   * Search for products matching a query.
   * Default implementation for unconfigured providers.
   * @param {string|Object} productQuery
   * @param {Object} [context={}]
   * @returns {Promise<{ pricingAvailable: boolean, message: string, products: Array }>}
   */
  async searchProduct(productQuery, context = {}) {
    return {
      pricingAvailable: false,
      message: `${this.displayName} price provider is not configured in this environment.`,
      products: [],
    };
  }

  /**
   * Retrieves a standardized product offer for this marketplace.
   * By default, returns an unconfigured offer without network calls or fabrication.
   * @param {string|Object} productQuery
   * @param {Object} [context={}]
   * @returns {Promise<PriceOffer>|PriceOffer}
   */
  getProductOffer(productQuery, context = {}) {
    const formatted = this.formatCanonicalQuery(productQuery);
    return this.createUnconfiguredOffer(formatted, this.sanitizeContext(context));
  }
}
