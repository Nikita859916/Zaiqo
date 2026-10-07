/**
 * Price Provider Registry (Phase 3)
 * Manages registered marketplace price providers.
 * Pure in-memory registry: zero database writes, zero external network calls.
 */
import { BasePriceProvider } from './priceProvider.interface.js';
import { InstamartPriceProvider } from './instamart.priceProvider.js';
import { SUPPORTED_MARKETPLACES } from '../marketplaces/index.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Creates default unconfigured instances for all supported quick commerce platforms.
 * @returns {Map<string, BasePriceProvider>}
 */
const createDefaultProviders = () => {
  const map = new Map();
  map.set('blinkit', new BasePriceProvider('blinkit', 'Blinkit'));
  map.set('zepto', new BasePriceProvider('zepto', 'Zepto'));
  map.set('jiomart', new BasePriceProvider('jiomart', 'JioMart'));
  map.set('instamart', new InstamartPriceProvider());
  return map;
};

// Internal registry map
let providersRegistry = createDefaultProviders();

/**
 * Validates a provider instance against the required contract.
 * @param {any} provider
 * @throws {Error} if invalid
 */
export const validatePriceProvider = (provider) => {
  if (!provider || typeof provider !== 'object') {
    throw new Error('Price provider must be a valid object.');
  }

  const id = provider.id || provider.name;
  if (!id || typeof id !== 'string' || !id.trim()) {
    throw new Error('Price provider must have a valid string id.');
  }

  const cleanId = id.trim().toLowerCase();
  if (FORBIDDEN_KEYS.has(cleanId)) {
    throw new Error(`Forbidden price provider id: "${cleanId}"`);
  }

  if (typeof provider.isConfigured !== 'function') {
    throw new Error(`Price provider "${cleanId}" must implement isConfigured().`);
  }

  if (typeof provider.getProductOffer !== 'function') {
    throw new Error(`Price provider "${cleanId}" must implement getProductOffer().`);
  }

  return cleanId;
};

const resetListeners = new Set();

/**
 * Registers a listener callback invoked whenever the price provider registry is reset or cleared.
 * Used for cache invalidation and test isolation across modules without circular dependencies.
 * @param {Function} listener
 */
export const onResetPriceProviders = (listener) => {
  if (typeof listener === 'function') {
    resetListeners.add(listener);
  }
};

/**
 * Registers a price provider into the registry.
 * Supports both single-argument object form `registerPriceProvider(provider)`
 * and backward-compatible dual-signature `registerPriceProvider(id, provider)`.
 * Overrides any existing provider for the same marketplace id.
 * @param {string|BasePriceProvider} providerOrKey
 * @param {BasePriceProvider} [maybeProvider]
 * @returns {BasePriceProvider} The registered provider
 */
export const registerPriceProvider = (providerOrKey, maybeProvider) => {
  let provider;
  let explicitKey = null;

  if (typeof providerOrKey === 'string' && maybeProvider !== undefined) {
    if (!providerOrKey.trim()) {
      throw new Error('Price provider must have a valid string id.');
    }
    explicitKey = providerOrKey.trim().toLowerCase();
    if (FORBIDDEN_KEYS.has(explicitKey)) {
      throw new Error(`Forbidden price provider id: "${explicitKey}"`);
    }
    provider = maybeProvider;
    if (provider && typeof provider === 'object' && !provider.id && !provider.name) {
      provider.id = explicitKey;
    }
  } else {
    provider = providerOrKey;
  }

  const cleanId = validatePriceProvider(provider);
  providersRegistry.set(cleanId, provider);
  if (explicitKey && explicitKey !== cleanId) {
    providersRegistry.set(explicitKey, provider);
  }
  return provider;
};

/**
 * Retrieves a registered price provider by marketplace ID.
 * Returns null if not found.
 * @param {string} marketplaceKey
 * @returns {BasePriceProvider|null}
 */
export const getPriceProvider = (marketplaceKey) => {
  if (!marketplaceKey || typeof marketplaceKey !== 'string') {
    return null;
  }
  const cleanKey = marketplaceKey.trim().toLowerCase();
  return providersRegistry.get(cleanKey) || null;
};

/**
 * Returns all registered price providers.
 * @returns {BasePriceProvider[]}
 */
export const getAllPriceProviders = () => {
  return Array.from(providersRegistry.values());
};

/**
 * Returns only configured price providers.
 * In default production state without official keys, returns an empty array.
 * @returns {BasePriceProvider[]}
 */
export const getConfiguredPriceProviders = () => {
  return getAllPriceProviders().filter((p) => p.isConfigured());
};

/**
 * Checks whether any configured price provider currently exists in the registry.
 * @returns {boolean}
 */
export const hasConfiguredPriceProviders = () => {
  return getConfiguredPriceProviders().length > 0;
};

/**
 * Checks whether a given marketplace key is supported by either the adapters or provider registry.
 * @param {string} marketplaceKey
 * @returns {boolean}
 */
export const isMarketplaceSupported = (marketplaceKey) => {
  if (!marketplaceKey || typeof marketplaceKey !== 'string') return false;
  const cleanKey = marketplaceKey.trim().toLowerCase();
  return providersRegistry.has(cleanKey) || SUPPORTED_MARKETPLACES.includes(cleanKey);
};

/**
 * Unregisters a provider by marketplace ID, reverting to an unconfigured stub if supported.
 * @param {string} marketplaceKey
 * @returns {boolean} Whether an entry was removed
 */
export const unregisterPriceProvider = (marketplaceKey) => {
  if (!marketplaceKey || typeof marketplaceKey !== 'string') return false;
  const cleanKey = marketplaceKey.trim().toLowerCase();
  return providersRegistry.delete(cleanKey);
};

/**
 * Resets the provider registry to default unconfigured base providers.
 * Also invokes any registered reset listeners to maintain cross-service test isolation.
 * Useful in testing to clear test mocks.
 */
export const resetPriceProviders = () => {
  providersRegistry = createDefaultProviders();
  for (const listener of resetListeners) {
    try {
      listener();
    } catch {
      // Ignore listener failures during reset
    }
  }
};

/**
 * Clears all registered providers entirely.
 * Also invokes any registered reset listeners.
 */
export const clearPriceProviders = () => {
  providersRegistry.clear();
  for (const listener of resetListeners) {
    try {
      listener();
    } catch {
      // Ignore listener failures during clear
    }
  }
};

export { BasePriceProvider, InstamartPriceProvider };
