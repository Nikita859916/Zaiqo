import groceryService from './grocery.service.js';
import {
  getAllMarketplaceAdapters,
  getMarketplaceAdapter,
} from './marketplaces/index.js';
import { getPriceProvider, onResetPriceProviders } from './priceProviders/index.js';
import productMatchingService from './productMatching.service.js';
import priceComparisonService from './priceComparison.service.js';
import { sanitizeSearchQuery } from '../utils/marketplaceUrlValidation.js';
import { badRequest } from '../utils/apiError.js';
import {
  mapConcurrent,
  DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS,
} from '../utils/concurrency.js';
import {
  PriceCache,
  generatePriceCacheKey,
  isCacheableOffer,
  DEFAULT_PRICE_CACHE_TTL_MS,
  DEFAULT_MAX_PRICE_CACHE_ENTRIES,
  cloneDeep,
} from '../utils/priceCache.js';

/**
 * Service to orchestrate Price Intelligence:
 * Phase 1: Generates verified, deterministic marketplace search links for grocery list items.
 * Phase 2: Product normalization and deterministic price comparison foundation.
 * Phase 3: Provider architecture with clean integration boundaries and failure isolation.
 * Phase 10 Step 3: Bounded concurrency pooling for marketplace/provider pricing requests.
 * Phase 10 Step 4: Short-lived in-memory TTL price & availability caching with request coalescing.
 * Strictly adheres to non-scraping, non-fake-pricing architectural boundaries.
 */
class PriceIntelligenceService {
  constructor() {
    this.concurrencyLimit = DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS;
    this.priceCache = new PriceCache();
    this.inFlightRequests = new Map();

    onResetPriceProviders(() => {
      this.clearPriceCache();
    });
  }

  /**
   * Retrieves the current bounded concurrency limit for price requests.
   * @returns {number}
   */
  getConcurrencyLimit() {
    return this.concurrencyLimit;
  }

  /**
   * Safely updates the bounded concurrency limit.
   * @param {number} limit
   * @returns {number} The active limit
   */
  setConcurrencyLimit(limit) {
    if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
      this.concurrencyLimit = Math.floor(limit);
    }
    return this.concurrencyLimit;
  }

  /**
   * Resets the bounded concurrency limit back to default (5).
   * @returns {number}
   */
  resetConcurrencyLimit() {
    this.concurrencyLimit = DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS;
    return this.concurrencyLimit;
  }

  /**
   * Retrieves the internal price cache instance.
   * @returns {PriceCache}
   */
  getPriceCache() {
    return this.priceCache;
  }

  /**
   * Clears all cached price entries and in-flight request tracking.
   */
  clearPriceCache() {
    this.priceCache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Retrieves the active price cache TTL in milliseconds.
   * @returns {number}
   */
  getCacheTTL() {
    return this.priceCache.getTTL();
  }

  /**
   * Safely updates the price cache TTL in milliseconds.
   * @param {number} ms
   * @returns {number}
   */
  setCacheTTL(ms) {
    return this.priceCache.setTTL(ms);
  }

  /**
   * Resets the price cache TTL back to default (60,000ms).
   * @returns {number}
   */
  resetCacheTTL() {
    return this.priceCache.resetTTL();
  }

  /**
   * Retrieves cache statistics (size, hits, misses, maxEntries).
   * @returns {Object}
   */
  getCacheStats() {
    return this.priceCache.getStats();
  }
  /**
   * Retrieves a user's grocery list via groceryService and constructs deterministic
   * marketplace search links for each item (Phase 1).
   * @param {string|import('mongoose').Types.ObjectId} userId - Authenticated user ID
   * @param {string} listId - Grocery list ID
   * @param {string|null} [preferredMarketplace=null] - Optional single marketplace filter
   * @returns {Promise<Object>} Formatted shopping links payload
   */
  async getShoppingLinksForList(userId, listId, preferredMarketplace = null) {
    if (!userId) {
      throw badRequest('User ID is required to generate shopping links.');
    }
    if (!listId) {
      throw badRequest('Grocery list ID is required.');
    }

    // 1. Fetch grocery list with ownership validation via domain service
    const groceryList = await groceryService.getGroceryListById(userId, listId);

    // 2. Select targeted adapters (all or filtered by preferredMarketplace)
    const adapters = this._resolveAdapters(preferredMarketplace);

    // 3. Construct marketplace search links for each item in the list
    const items = (groceryList.items || []).map((item) => {
      const groceryItemId = item._id ? item._id.toString() : item.id;
      const itemName = item.name || '';

      const marketplaceLinks = [];
      for (const adapter of adapters) {
        try {
          const searchUrl = adapter.getSearchUrl(itemName);
          marketplaceLinks.push({
            marketplace: adapter.name,
            displayName: adapter.displayName,
            searchUrl,
            pricingAvailable: false,
          });
        } catch {
          // If a specific item name cannot form a valid search URL, omit that adapter link safely
        }
      }

      return {
        groceryItemId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || '',
        category: item.category || 'other',
        checked: Boolean(item.checked),
        marketplaces: marketplaceLinks,
      };
    });

    return {
      groceryListId: groceryList._id ? groceryList._id.toString() : groceryList.id,
      listName: groceryList.name,
      items,
      pricingAvailable: false,
      disclaimer:
        'Prices and inventory are subject to real-time confirmation on the retailer platform.',
    };
  }

  /**
   * Generates marketplace search links for a single standalone item query (Phase 1)
   * @param {string} rawItemName
   * @param {string|null} [preferredMarketplace=null]
   * @returns {Object}
   */
  getItemShoppingLinks(rawItemName, preferredMarketplace = null) {
    const cleanName = sanitizeSearchQuery(rawItemName);
    const adapters = this._resolveAdapters(preferredMarketplace);

    const marketplaceLinks = [];
    for (const adapter of adapters) {
      try {
        const searchUrl = adapter.getSearchUrl(cleanName);
        marketplaceLinks.push({
          marketplace: adapter.name,
          displayName: adapter.displayName,
          searchUrl,
          pricingAvailable: false,
        });
      } catch {
        // Safe skip on individual failure
      }
    }

    return {
      item: cleanName,
      marketplaces: marketplaceLinks,
      pricingAvailable: false,
      disclaimer:
        'Prices and inventory are subject to real-time confirmation on the retailer platform.',
    };
  }

  /**
   * Retrieves a user's grocery list, normalizes product names via ProductMatchingService,
   * gathers marketplace product offers from configured PriceProviders (with adapter fallbacks),
   * and executes PriceComparisonService evaluation.
   * If providers are unconfigured or fail, falls back safely to verified search links.
   * @param {string|import('mongoose').Types.ObjectId} userId
   * @param {string} listId
   * @param {string|null} [preferredMarketplace=null]
   * @param {Object} [context={}] Optional location context { pincode, city, latitude, longitude }
   * @returns {Promise<Object>}
   */
  async getPriceComparisonForList(userId, listId, preferredMarketplace = null, context = {}) {
    if (!userId) {
      throw badRequest('User ID is required to generate price comparison.');
    }
    if (!listId) {
      throw badRequest('Grocery list ID is required.');
    }

    const groceryList = await groceryService.getGroceryListById(userId, listId);
    const adapters = this._resolveAdapters(preferredMarketplace);

    const items = await mapConcurrent(
      groceryList.items || [],
      async (item) => {
        const groceryItemId = item._id ? item._id.toString() : item.id;
        const originalName = item.name || '';

        let canonicalQuery = originalName;
        let queryObj = { originalName, canonicalQuery: originalName, tokens: [] };
        try {
          queryObj = productMatchingService.prepareProductQuery(originalName);
          canonicalQuery = queryObj.canonicalQuery;
        } catch {
          canonicalQuery = originalName;
        }

        const offers = await Promise.all(
          adapters.map((adapter) =>
            this._resolveOfferForAdapter(
              adapter,
              { canonicalQuery, originalName },
              context
            )
          )
        );

        const comparison = priceComparisonService.compareOffers(offers);

        return {
          groceryItemId,
          name: originalName,
          canonicalQuery,
          quantity: item.quantity,
          unit: item.unit || '',
          category: item.category || 'other',
          checked: Boolean(item.checked),
          comparison,
        };
      },
      {
        concurrency: this.concurrencyLimit,
        continueOnError: true,
        onError: (err, item) => ({
          groceryItemId: item?._id ? item._id.toString() : item?.id,
          name: item?.name || '',
          canonicalQuery: item?.name || '',
          quantity: item?.quantity,
          unit: item?.unit || '',
          category: item?.category || 'other',
          checked: Boolean(item?.checked),
          comparison: priceComparisonService.compareOffers([]),
        }),
      }
    );

    const anyPricingAvailable = items.some((i) => i.comparison && i.comparison.pricingAvailable);

    return {
      groceryListId: groceryList._id ? groceryList._id.toString() : groceryList.id,
      listName: groceryList.name,
      items,
      pricingAvailable: anyPricingAvailable,
      disclaimer:
        'Prices and inventory are subject to real-time confirmation on the retailer platform.',
    };
  }

  /**
   * Evaluates price comparison foundation for a single standalone item query (Phase 2 & Phase 3)
   * Synchronous signature preserved for backward compatibility.
   * @param {string} rawItemName
   * @param {string|null} [preferredMarketplace=null]
   * @param {Object} [context={}]
   * @returns {Object}
   */
  getItemPriceComparison(rawItemName, preferredMarketplace = null, context = {}) {
    const queryObj = productMatchingService.prepareProductQuery(rawItemName);
    const adapters = this._resolveAdapters(preferredMarketplace);

    const offers = adapters.map((adapter) => {
      let searchUrl = null;
      try {
        searchUrl = adapter.getSearchUrl(queryObj.canonicalQuery);
      } catch {
        searchUrl = null;
      }

      // Check synchronous cache hit
      const cacheKey = generatePriceCacheKey(adapter.name, queryObj, context);
      const cached = this.priceCache.get(cacheKey);
      if (cached) {
        if (!cached.searchUrl && searchUrl) {
          cached.searchUrl = searchUrl;
        }
        return cloneDeep(cached);
      }

      const provider = getPriceProvider(adapter.name);

      if (provider && provider.isConfigured()) {
        try {
          const providerQuery = {
            query: queryObj.canonicalQuery,
            originalName: queryObj.originalName,
          };
          const rawOffer = provider.getProductOffer(providerQuery, context);

          // If async provider called in sync method, return unconfigured fallback safely
          if (rawOffer && typeof rawOffer.then === 'function') {
            return {
              marketplace: adapter.name,
              displayName: adapter.displayName,
              productName: queryObj.originalName,
              productUrl: null,
              searchUrl,
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

          const offer =
            typeof provider.sanitizeOffer === 'function'
              ? provider.sanitizeOffer(rawOffer)
              : rawOffer;

          if (!offer.searchUrl && searchUrl) {
            offer.searchUrl = searchUrl;
          }

          if (isCacheableOffer(offer)) {
            this.priceCache.set(cacheKey, offer);
          }

          return cloneDeep(offer);
        } catch {
          return {
            marketplace: adapter.name,
            displayName: adapter.displayName,
            productName: queryObj.originalName,
            productUrl: null,
            searchUrl,
            price: null,
            currency: 'INR',
            packQuantity: null,
            packUnit: null,
            available: false,
            pricingAvailable: false,
            source: 'unconfigured',
            fetchedAt: null,
            error: 'Provider unavailable',
          };
        }
      }

      const baseOffer = adapter.getProductOffer(queryObj.canonicalQuery);
      return {
        marketplace: adapter.name,
        displayName: adapter.displayName,
        productName: queryObj.originalName,
        productUrl: null,
        searchUrl: baseOffer.searchUrl || searchUrl,
        price: null,
        currency: 'INR',
        packQuantity: null,
        packUnit: null,
        available: false,
        pricingAvailable: false,
        source: 'unconfigured',
        fetchedAt: null,
      };
    });

    const comparison = priceComparisonService.compareOffers(offers);

    return {
      item: queryObj.originalName,
      canonicalQuery: queryObj.canonicalQuery,
      comparison,
      pricingAvailable: comparison.pricingAvailable,
      disclaimer:
        'Prices and inventory are subject to real-time confirmation on the retailer platform.',
    };
  }

  /**
   * Asynchronous standalone item comparison supporting asynchronous providers
   * @param {string} rawItemName
   * @param {string|null} [preferredMarketplace=null]
   * @param {Object} [context={}]
   * @returns {Promise<Object>}
   */
  async getItemPriceComparisonAsync(rawItemName, preferredMarketplace = null, context = {}) {
    const queryObj = productMatchingService.prepareProductQuery(rawItemName);
    const adapters = this._resolveAdapters(preferredMarketplace);

    const offers = await Promise.all(
      adapters.map((adapter) =>
        this._resolveOfferForAdapter(adapter, queryObj, context)
      )
    );

    const comparison = priceComparisonService.compareOffers(offers);

    return {
      item: queryObj.originalName,
      canonicalQuery: queryObj.canonicalQuery,
      comparison,
      pricingAvailable: comparison.pricingAvailable,
      disclaimer:
        'Prices and inventory are subject to real-time confirmation on the retailer platform.',
    };
  }

  /**
   * Resolves an offer for a single adapter asynchronously.
   * Handles configured live providers with error isolation, sanitization, and unconfigured fallback.
   * @private
   * @param {Object} adapter
   * @param {{ canonicalQuery: string, originalName: string }} queryObj
   * @param {Object} [context={}]
   * @returns {Promise<Object>}
   */
  async _resolveOfferForAdapter(adapter, queryObj, context = {}) {
    let searchUrl = null;
    try {
      searchUrl = adapter.getSearchUrl(queryObj.canonicalQuery);
    } catch {
      searchUrl = null;
    }

    const provider = getPriceProvider(adapter.name);

    if (!provider || !provider.isConfigured()) {
      // Unconfigured provider: fallback cleanly to Phase 1 adapter (never cache unconfigured fallback)
      const baseOffer = adapter.getProductOffer(queryObj.canonicalQuery);
      return {
        marketplace: adapter.name,
        displayName: adapter.displayName,
        productName: queryObj.originalName,
        productUrl: null,
        searchUrl: baseOffer.searchUrl || searchUrl,
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

    // Step 4: Check in-memory TTL cache
    const cacheKey = generatePriceCacheKey(adapter.name, queryObj, context);
    const cachedOffer = this.priceCache.get(cacheKey);
    if (cachedOffer) {
      if (!cachedOffer.searchUrl && searchUrl) {
        cachedOffer.searchUrl = searchUrl;
      }
      return cloneDeep(cachedOffer);
    }

    // Step 4: Request Coalescing - if identical request is already in-flight, await the same promise
    if (this.inFlightRequests.has(cacheKey)) {
      try {
        const inFlightResult = await this.inFlightRequests.get(cacheKey);
        return cloneDeep(inFlightResult);
      } catch {
        // If in-flight failed, proceed to fresh attempt
      }
    }

    // Launch provider request with in-flight tracking
    const requestPromise = (async () => {
      try {
        const providerQuery = {
          query: queryObj.canonicalQuery,
          originalName: queryObj.originalName,
          quantity: queryObj.quantity,
          unit: queryObj.unit,
        };
        const rawOffer = await Promise.resolve(
          provider.getProductOffer(providerQuery, context)
        );
        const offer =
          typeof provider.sanitizeOffer === 'function'
            ? provider.sanitizeOffer(rawOffer)
            : rawOffer;

        if (!offer.searchUrl && searchUrl) {
          offer.searchUrl = searchUrl;
        }

        // Only cache valid, non-error, non-fallback results
        if (isCacheableOffer(offer)) {
          this.priceCache.set(cacheKey, offer);
        }

        return offer;
      } catch {
        // Failure isolation: single provider error never crashes comparison and is NEVER cached
        return {
          marketplace: adapter.name,
          displayName: adapter.displayName,
          productName: queryObj.originalName,
          productUrl: null,
          searchUrl,
          price: null,
          currency: 'INR',
          packQuantity: null,
          packUnit: null,
          available: false,
          pricingAvailable: false,
          source: 'unconfigured',
          fetchedAt: null,
          error: 'Provider unavailable',
        };
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    this.inFlightRequests.set(cacheKey, requestPromise);
    const result = await requestPromise;
    return cloneDeep(result);
  }

  /**
   * Helper to resolve active adapters based on user preference
   * @private
   */
  _resolveAdapters(preferredMarketplace) {
    if (preferredMarketplace && typeof preferredMarketplace === 'string') {
      const singleAdapter = getMarketplaceAdapter(preferredMarketplace);
      if (singleAdapter) {
        return [singleAdapter];
      }
    }
    return getAllMarketplaceAdapters();
  }
}

const priceIntelligenceService = new PriceIntelligenceService();
export {
  PriceIntelligenceService,
  priceIntelligenceService,
  PriceCache,
  generatePriceCacheKey,
  isCacheableOffer,
  DEFAULT_PRICE_CACHE_TTL_MS,
  DEFAULT_MAX_PRICE_CACHE_ENTRIES,
  mapConcurrent,
  DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS as MAX_CONCURRENT_PRICE_REQUESTS,
};
export default priceIntelligenceService;
