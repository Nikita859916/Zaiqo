import blinkitAdapter from './blinkit.adapter.js';
import zeptoAdapter from './zepto.adapter.js';
import jiomartAdapter from './jiomart.adapter.js';
import instamartAdapter from './instamart.adapter.js';

export const MARKETPLACE_ADAPTERS = Object.freeze({
  blinkit: blinkitAdapter,
  zepto: zeptoAdapter,
  jiomart: jiomartAdapter,
  instamart: instamartAdapter,
});

export const SUPPORTED_MARKETPLACES = Object.freeze(Object.keys(MARKETPLACE_ADAPTERS));

/**
 * Retrieves a specific marketplace adapter by key
 * @param {string} marketplaceKey
 * @returns {import('./marketplace.interface.js').BaseMarketplaceAdapter | null}
 */
export const getMarketplaceAdapter = (marketplaceKey) => {
  if (!marketplaceKey || typeof marketplaceKey !== 'string') return null;
  return MARKETPLACE_ADAPTERS[marketplaceKey.toLowerCase().trim()] || null;
};

/**
 * Returns all registered marketplace adapters
 * @returns {Array<import('./marketplace.interface.js').BaseMarketplaceAdapter>}
 */
export const getAllMarketplaceAdapters = () => {
  return Object.values(MARKETPLACE_ADAPTERS);
};

export {
  blinkitAdapter,
  zeptoAdapter,
  jiomartAdapter,
  instamartAdapter,
};
