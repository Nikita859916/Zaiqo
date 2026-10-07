import { BaseMarketplaceAdapter } from './marketplace.interface.js';
import { sanitizeSearchQuery } from '../../utils/marketplaceUrlValidation.js';

export class BlinkitAdapter extends BaseMarketplaceAdapter {
  constructor() {
    super('blinkit', 'Blinkit', 'blinkit.com');
  }

  /**
   * Generates a deterministic search URL for Blinkit
   * Verified pattern: https://blinkit.com/s/?q=<encoded_query>
   * @param {string} query
   * @returns {string} Validated HTTPS search URL
   */
  getSearchUrl(query) {
    const cleanQuery = sanitizeSearchQuery(query);
    const encoded = encodeURIComponent(cleanQuery);
    const url = `https://blinkit.com/s/?q=${encoded}`;
    return this.validateGeneratedUrl(url);
  }
}

export default new BlinkitAdapter();
