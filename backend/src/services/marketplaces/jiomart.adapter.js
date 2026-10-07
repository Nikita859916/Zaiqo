import { BaseMarketplaceAdapter } from './marketplace.interface.js';
import { sanitizeSearchQuery } from '../../utils/marketplaceUrlValidation.js';

export class JioMartAdapter extends BaseMarketplaceAdapter {
  constructor() {
    super('jiomart', 'JioMart', 'jiomart.com');
  }

  /**
   * Generates a deterministic search URL for JioMart
   * Verified pattern: https://www.jiomart.com/search/<encoded_query>
   * @param {string} query
   * @returns {string} Validated HTTPS search URL
   */
  getSearchUrl(query) {
    const cleanQuery = sanitizeSearchQuery(query);
    const encoded = encodeURIComponent(cleanQuery);
    const url = `https://www.jiomart.com/search/${encoded}`;
    return this.validateGeneratedUrl(url);
  }
}

export default new JioMartAdapter();
