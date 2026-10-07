import { BaseMarketplaceAdapter } from './marketplace.interface.js';
import { sanitizeSearchQuery } from '../../utils/marketplaceUrlValidation.js';

export class ZeptoAdapter extends BaseMarketplaceAdapter {
  constructor() {
    super('zepto', 'Zepto', 'zeptonow.com');
  }

  /**
   * Generates a deterministic search URL for Zepto
   * Verified pattern: https://www.zeptonow.com/search?q=<encoded_query>
   * @param {string} query
   * @returns {string} Validated HTTPS search URL
   */
  getSearchUrl(query) {
    const cleanQuery = sanitizeSearchQuery(query);
    const encoded = encodeURIComponent(cleanQuery);
    const url = `https://www.zeptonow.com/search?q=${encoded}`;
    return this.validateGeneratedUrl(url);
  }
}

export default new ZeptoAdapter();
