import { BaseMarketplaceAdapter } from './marketplace.interface.js';
import { sanitizeSearchQuery } from '../../utils/marketplaceUrlValidation.js';

export class InstamartAdapter extends BaseMarketplaceAdapter {
  constructor() {
    super('instamart', 'Swiggy Instamart', 'swiggy.com');
  }

  /**
   * Generates a deterministic search URL for Swiggy Instamart
   * Verified pattern: https://www.swiggy.com/instamart/search?query=<encoded_query>
   * @param {string} query
   * @returns {string} Validated HTTPS search URL
   */
  getSearchUrl(query) {
    const cleanQuery = sanitizeSearchQuery(query);
    const encoded = encodeURIComponent(cleanQuery);
    const url = `https://www.swiggy.com/instamart/search?query=${encoded}`;
    return this.validateGeneratedUrl(url);
  }
}

export default new InstamartAdapter();
