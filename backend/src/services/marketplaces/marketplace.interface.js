/**
 * Base Marketplace Adapter Interface
 * Defines the standard contract for external e-grocery and quick commerce platforms.
 */
import { assertValidMarketplaceUrl } from '../../utils/marketplaceUrlValidation.js';

export class BaseMarketplaceAdapter {
  /**
   * @param {string} id - Unique lowercase marketplace identifier (e.g. 'blinkit')
   * @param {string} displayName - Human-readable marketplace name (e.g. 'Blinkit')
   * @param {string} domain - Allowed primary domain (e.g. 'blinkit.com')
   */
  constructor(id, displayName, domain) {
    if (!id || !displayName || !domain) {
      throw new Error('Marketplace adapter requires id, displayName, and domain.');
    }
    this.id = id.toLowerCase();
    this.name = this.id;
    this.displayName = displayName;
    this.domain = domain.toLowerCase();
  }

  /**
   * Check whether live API authentication/keys are configured.
   * In Phase 1, returns false as no public consumer API keys exist.
   * @returns {boolean}
   */
  isConfigured() {
    return false;
  }

  /**
   * Future API search method placeholder.
   * Does NOT make external HTTP calls or mock fake pricing.
   * @param {string} query
   * @param {Object} [options={}]
   * @returns {Promise<{ pricingAvailable: boolean, message: string, products: Array }>}
   */
  async searchProduct(query, options = {}) {
    return {
      pricingAvailable: false,
      message: `${this.displayName} live product API is not configured in this environment.`,
      products: [],
    };
  }

  /**
   * Generates a validated deterministic search URL for a query.
   * Must be overridden by subclasses.
   * @param {string} query
   * @returns {string} Validated HTTPS URL
   */
  getSearchUrl(query) {
    throw new Error(`getSearchUrl not implemented for adapter: ${this.id}`);
  }

  /**
   * Helper to validate that a generated URL conforms to whitelist rules
   * @param {string} url
   * @returns {string} The validated URL
   */
  validateGeneratedUrl(url) {
    assertValidMarketplaceUrl(url);
    return url;
  }

  /**
   * Retrieves standardized product offer representation for this marketplace.
   * In Phase 2, pricingAvailable remains false without external HTTP calls.
   * @param {string} query
   * @returns {{ marketplace: string, displayName: string, price: null, pricingAvailable: boolean, searchUrl: string|null }}
   */
  getProductOffer(query) {
    let searchUrl = null;
    try {
      searchUrl = this.getSearchUrl(query);
    } catch {
      searchUrl = null;
    }

    return {
      marketplace: this.name,
      displayName: this.displayName,
      price: null,
      pricingAvailable: false,
      searchUrl,
    };
  }
}
