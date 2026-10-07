/**
 * Swiggy Instamart Price Provider (Phase 4 & Phase 5 Hardened)
 * Official Model Context Protocol (MCP) integration via Swiggy Builders Club.
 * Connects to the official Swiggy Instamart MCP Server (`https://mcp.swiggy.com/im`).
 *
 * Strictly adheres to:
 * - NO web scraping
 * - NO reverse-engineered private APIs
 * - NO browser automation
 * - NO fake/mock prices in production
 * - Pure official JSON-RPC 2.0 tool execution over HTTP
 * - Non-enumerable token storage (zero secret leakage in serialization or logging)
 * - Deterministic token-overlap product matching validation
 * - Bounded HTTP timeouts and non-aggressive rate-limit handling (no retry storms)
 */

import { BasePriceProvider } from './priceProvider.interface.js';
import { isValidMarketplaceUrl } from '../../utils/marketplaceUrlValidation.js';
import instamartAdapter from '../marketplaces/instamart.adapter.js';
import productMatchingService from '../productMatching.service.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const PACK_SIZE_REGEX = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/;

export class InstamartPriceProvider extends BasePriceProvider {
  /**
   * @param {Object} [options={}]
   * @param {string} [options.endpoint] - Official Instamart MCP endpoint
   * @param {string} [options.token] - Bearer token obtained via official OAuth 2.1 flow
   * @param {string} [options.clientSecret] - Optional client secret for OAuth refresh
   * @param {string} [options.addressId] - Default delivery address ID for location-specific inventory
   * @param {number} [options.timeoutMs=5000] - Request timeout in milliseconds
   */
  constructor(options = {}) {
    super('instamart', 'Swiggy Instamart');

    this.endpoint =
      options.endpoint ||
      process.env.SWIGGY_INSTAMART_MCP_URL ||
      'https://mcp.swiggy.com/im';

    // Store sensitive credentials as non-enumerable properties to prevent accidental leaks
    const tokenVal =
      options.token ||
      process.env.SWIGGY_INSTAMART_BEARER_TOKEN ||
      null;

    const secretVal =
      options.clientSecret ||
      process.env.SWIGGY_INSTAMART_CLIENT_SECRET ||
      null;

    Object.defineProperty(this, 'token', {
      value: tokenVal,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    Object.defineProperty(this, 'clientSecret', {
      value: secretVal,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    this.addressId =
      options.addressId ||
      process.env.SWIGGY_INSTAMART_ADDRESS_ID ||
      null;

    this.timeoutMs = options.timeoutMs || 5000;
  }

  /**
   * Deterministically reports whether official credentials are configured in the environment.
   * Without official Swiggy Builders Club credentials, returns false.
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(
      this.token &&
      typeof this.token === 'string' &&
      this.token.trim().length > 0 &&
      !this.token.includes('your_swiggy_mcp_bearer_token')
    );
  }

  /**
   * Detailed provider operational status
   * Distinguishes:
   * - unconfigured: No Bearer token provided in environment
   * - ready: Configured with official endpoint and token
   * @param {Object} [context={}]
   * @returns {Object}
   */
  getStatus(context = {}) {
    if (!this.isConfigured()) {
      return {
        marketplace: this.id,
        displayName: this.displayName,
        providerAvailable: false,
        pricingAvailable: false,
        status: 'unconfigured',
        endpoint: this.endpoint,
        message:
          'Swiggy Instamart official MCP integration requires SWIGGY_INSTAMART_BEARER_TOKEN from Swiggy Builders Club.',
      };
    }

    return {
      marketplace: this.id,
      displayName: this.displayName,
      providerAvailable: true,
      pricingAvailable: true,
      status: 'ready',
      endpoint: this.endpoint,
      addressId: context.addressId || this.addressId || null,
    };
  }

  /**
   * Parses pack size input into structured quantity and unit
   * Preserves exact values (e.g. 500g, 1kg) without arbitrary arithmetic
   * @param {any} input
   * @returns {{ quantity: number|null, unit: string|null }}
   */
  parsePackSize(input) {
    if (!input) return { quantity: null, unit: null };

    // Case 1: Structured object { quantity: 500, unit: 'g' }
    if (typeof input === 'object' && !Array.isArray(input)) {
      const q = Number(input.quantity || input.packQuantity);
      const u = typeof (input.unit || input.packUnit) === 'string'
        ? (input.unit || input.packUnit).trim().toLowerCase()
        : null;
      if (Number.isFinite(q) && q > 0 && u) {
        return { quantity: q, unit: u };
      }
    }

    // Case 2: String representation (e.g. "500g", "500 g", "1 kg", "200 ml", "2 pcs")
    if (typeof input === 'string') {
      const clean = input.trim();
      const match = clean.match(PACK_SIZE_REGEX);
      if (match) {
        const q = parseFloat(match[1]);
        const u = match[2].trim().toLowerCase();
        if (Number.isFinite(q) && q > 0) {
          return { quantity: q, unit: u };
        }
      }
    }

    return { quantity: null, unit: null };
  }

  /**
   * Normalizes an official Instamart product item into the standard internal offer shape.
   * Strictly uses data returned by the official API; never fabricates prices.
   * @param {any} rawProduct
   * @param {string} [searchUrl=null]
   * @returns {Object} Internal PriceOffer
   */
  normalizeInstamartProduct(rawProduct, searchUrl = null) {
    if (!rawProduct || typeof rawProduct !== 'object' || Array.isArray(rawProduct)) {
      return this.createUnconfiguredOffer({ query: '', originalName: '' });
    }

    for (const key of Object.getOwnPropertyNames(rawProduct)) {
      if (FORBIDDEN_KEYS.has(key)) {
        throw new Error(`Forbidden product attribute: "${key}"`);
      }
    }

    const productName =
      typeof rawProduct.name === 'string' && rawProduct.name.trim()
        ? rawProduct.name.trim()
        : typeof rawProduct.productName === 'string' && rawProduct.productName.trim()
        ? rawProduct.productName.trim()
        : typeof rawProduct.title === 'string' && rawProduct.title.trim()
        ? rawProduct.title.trim()
        : null;

    // Price extraction and strict validation
    const candidatePrice =
      rawProduct.price !== undefined
        ? rawProduct.price
        : rawProduct.finalPrice !== undefined
        ? rawProduct.finalPrice
        : rawProduct.mrp !== undefined
        ? rawProduct.mrp
        : null;

    const rawNum = typeof candidatePrice === 'number' ? candidatePrice : parseFloat(candidatePrice);
    const isValidPrice =
      Number.isFinite(rawNum) &&
      !Number.isNaN(rawNum) &&
      rawNum > 0;

    const price = isValidPrice ? Math.round(rawNum * 100) / 100 : null;

    // Pack size extraction
    const rawPack =
      rawProduct.packSize ||
      rawProduct.packQuantity ||
      rawProduct.weight ||
      rawProduct.quantityDescription ||
      rawProduct.variant;

    const { quantity: packQuantity, unit: packUnit } = this.parsePackSize(rawPack);

    // Product URL validation
    let productUrl = null;
    const candidateUrl = rawProduct.productUrl || rawProduct.deepLink || rawProduct.url;
    if (typeof candidateUrl === 'string' && candidateUrl.trim()) {
      const cleanUrl = candidateUrl.trim();
      if (isValidMarketplaceUrl(cleanUrl)) {
        productUrl = cleanUrl;
      }
    }

    const available = Boolean(
      isValidPrice &&
      rawProduct.available !== false &&
      rawProduct.inStock !== false &&
      (rawProduct.inventory === undefined || rawProduct.inventory > 0)
    );

    const pricingAvailable = Boolean(isValidPrice && available);

    return {
      marketplace: this.id,
      displayName: this.displayName,
      productName,
      productUrl,
      searchUrl: searchUrl || null,
      price,
      currency: 'INR',
      packQuantity,
      packUnit,
      available,
      pricingAvailable,
      source: 'swiggy-instamart',
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Executes official JSON-RPC 2.0 `tools/call` for `search_products` over HTTP
   * Never makes requests if unconfigured.
   * Handles timeouts, HTTP 429, 401/403, and 500 without leaking secrets.
   * @param {string|Object} productQuery
   * @param {Object} [context={}]
   * @returns {Promise<{ pricingAvailable: boolean, providerAvailable: boolean, status: string, errorCode?: string, latencyMs?: number, message: string, products: Array }>}
   */
  async searchProduct(productQuery, context = {}) {
    const formatted = this.formatCanonicalQuery(productQuery);

    if (!this.isConfigured()) {
      return {
        pricingAvailable: false,
        providerAvailable: false,
        status: 'unconfigured',
        message: `${this.displayName} official MCP integration is not configured in this environment.`,
        products: [],
      };
    }

    const addressId = context.addressId || this.addressId || undefined;
    const sanitizedContext = this.sanitizeContext(context);

    // Formulate official JSON-RPC 2.0 request
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'search_products',
        arguments: {
          query: formatted.query,
          ...(addressId ? { addressId } : {}),
          ...(sanitizedContext.pincode ? { pincode: sanitizedContext.pincode } : {}),
        },
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const startTime = Date.now();

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      // Handle HTTP 429: Rate limited
      if (response.status === 429) {
        return {
          pricingAvailable: false,
          providerAvailable: false,
          status: 'rate_limited',
          errorCode: 'RATE_LIMIT_EXCEEDED',
          latencyMs,
          message: 'Swiggy Instamart rate limit reached; please retry later.',
          products: [],
        };
      }

      // Handle HTTP 401 / 403: Authentication or authorization failure
      if (response.status === 401 || response.status === 403) {
        return {
          pricingAvailable: false,
          providerAvailable: false,
          status: 'auth_unavailable',
          errorCode: 'AUTH_FAILED',
          latencyMs,
          message: 'Swiggy Instamart authentication token is invalid or expired.',
          products: [],
        };
      }

      // Handle HTTP 5xx or other non-200 responses
      if (!response.ok) {
        return {
          pricingAvailable: false,
          providerAvailable: false,
          status: 'unavailable',
          errorCode: `HTTP_${response.status}`,
          latencyMs,
          message: `Swiggy Instamart server returned HTTP ${response.status}`,
          products: [],
        };
      }

      let json;
      try {
        json = await response.json();
      } catch {
        return {
          pricingAvailable: false,
          providerAvailable: false,
          status: 'malformed_response',
          errorCode: 'INVALID_JSON',
          latencyMs,
          message: 'Swiggy Instamart returned non-JSON response.',
          products: [],
        };
      }

      if (json && json.error) {
        return {
          pricingAvailable: false,
          providerAvailable: false,
          status: 'error',
          errorCode: json.error.code ? String(json.error.code) : 'TOOL_ERROR',
          latencyMs,
          message: json.error.message || 'Swiggy Instamart tool execution error',
          products: [],
        };
      }

      // Extract products from MCP tool result
      let products = [];
      const toolResult = json?.result;

      if (toolResult) {
        if (Array.isArray(toolResult.products)) {
          products = toolResult.products;
        } else if (Array.isArray(toolResult.items)) {
          products = toolResult.items;
        } else if (Array.isArray(toolResult.content)) {
          // Standard MCP content block format
          for (const block of toolResult.content) {
            if (block.type === 'text' && typeof block.text === 'string') {
              try {
                const parsed = JSON.parse(block.text);
                if (Array.isArray(parsed)) products.push(...parsed);
                else if (Array.isArray(parsed.products)) products.push(...parsed.products);
                else if (Array.isArray(parsed.items)) products.push(...parsed.items);
              } catch {
                // Non-JSON text content
              }
            }
          }
        }
      }

      if (products.length === 0) {
        return {
          pricingAvailable: false,
          providerAvailable: true,
          status: 'no_match',
          latencyMs,
          message: `No matching Instamart products found for "${formatted.query}".`,
          products: [],
        };
      }

      return {
        pricingAvailable: true,
        providerAvailable: true,
        status: 'offers_available',
        latencyMs,
        message: `Found ${products.length} Instamart product(s).`,
        products,
      };
    } catch (err) {
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;
      const isTimeout = err.name === 'AbortError';
      return {
        pricingAvailable: false,
        providerAvailable: false,
        status: isTimeout ? 'timeout' : 'error',
        errorCode: isTimeout ? 'TIMEOUT' : 'CONNECTION_ERROR',
        latencyMs,
        message: isTimeout
          ? 'Swiggy Instamart request timed out.'
          : 'Swiggy Instamart connection failed.',
        products: [],
      };
    }
  }

  /**
   * Retrieves standardized product offer representation for this marketplace.
   * If unconfigured, returns deterministic fallback without network calls.
   * Enforces deterministic product matching: candidate items with zero token overlap are rejected.
   * @param {string|Object} productQuery
   * @param {Object} [context={}]
   * @returns {Promise<Object>}
   */
  async getProductOffer(productQuery, context = {}) {
    const formatted = this.formatCanonicalQuery(productQuery);
    let fallbackSearchUrl = null;
    try {
      fallbackSearchUrl = instamartAdapter.getSearchUrl(formatted.query);
    } catch {
      fallbackSearchUrl = null;
    }

    if (!this.isConfigured()) {
      const offer = this.createUnconfiguredOffer(formatted, context);
      offer.searchUrl = fallbackSearchUrl;
      return offer;
    }

    const searchResult = await this.searchProduct(productQuery, context);

    if (
      !searchResult ||
      !searchResult.products ||
      searchResult.products.length === 0 ||
      !searchResult.pricingAvailable
    ) {
      const offer = this.createUnconfiguredOffer(formatted, context);
      offer.searchUrl = fallbackSearchUrl;
      offer.source = 'swiggy-instamart';
      return offer;
    }

    // Product matching safety: filter candidate items using productMatchingService
    let matchingCandidate = null;
    for (const candidate of searchResult.products) {
      if (!candidate || typeof candidate !== 'object') continue;
      const candidateName = candidate.name || candidate.productName || candidate.title || '';
      const matchScore = productMatchingService.evaluateCandidateMatch(formatted.query, candidateName);

      // Require token match (score > 0) to prevent completely unrelated items (e.g. paneer vs chips)
      if (matchScore.matched || matchScore.score > 0) {
        matchingCandidate = candidate;
        break;
      }
    }

    // If all candidates in the search result are completely unrelated to query, reject
    if (!matchingCandidate) {
      const offer = this.createUnconfiguredOffer(formatted, context);
      offer.searchUrl = fallbackSearchUrl;
      offer.source = 'swiggy-instamart';
      return offer;
    }

    const normalized = this.normalizeInstamartProduct(matchingCandidate, fallbackSearchUrl);

    if (!normalized.pricingAvailable || normalized.price === null) {
      const fallback = this.createUnconfiguredOffer(formatted, context);
      fallback.searchUrl = fallbackSearchUrl;
      fallback.source = 'swiggy-instamart';
      return fallback;
    }

    return normalized;
  }

  /**
   * Custom serialization to guarantee that secrets are NEVER emitted in JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      endpoint: this.endpoint,
      isConfigured: this.isConfigured(),
      addressId: this.addressId || null,
    };
  }
}

const instamartPriceProvider = new InstamartPriceProvider();
export default instamartPriceProvider;
