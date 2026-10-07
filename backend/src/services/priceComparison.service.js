/**
 * Price Comparison Service (Phase 2 & Phase 3)
 * Pure, deterministic mathematical evaluation of real marketplace price offers.
 * Strictly ignores null/unconfigured prices, never invents or estimates values,
 * enforces pack-size safety, and identifies the lowest verified price across marketplaces.
 */

/**
 * Normalizes price to standard base units (per kg, per l, or per pc)
 * ONLY when quantity is known, unit is known, and units are compatible.
 * Never performs arithmetic across incompatible dimensions.
 * @param {number|null} price
 * @param {number|null} packQuantity
 * @param {string|null} packUnit
 * @returns {{ normalizedPrice: number|null, normalizedUnit: string|null }}
 */
export const calculateNormalizedPrice = (price, packQuantity, packUnit) => {
  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price <= 0 ||
    typeof packQuantity !== 'number' ||
    !Number.isFinite(packQuantity) ||
    packQuantity <= 0 ||
    typeof packUnit !== 'string' ||
    !packUnit.trim()
  ) {
    return { normalizedPrice: null, normalizedUnit: null };
  }

  const unit = packUnit.trim().toLowerCase();

  // Mass normalization: base unit 'kg' (1000g = 1kg)
  if (unit === 'g' || unit === 'gm' || unit === 'gram' || unit === 'grams') {
    const pricePerKg = (price / packQuantity) * 1000;
    return { normalizedPrice: Math.round(pricePerKg * 100) / 100, normalizedUnit: 'kg' };
  }
  if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
    const pricePerKg = price / packQuantity;
    return { normalizedPrice: Math.round(pricePerKg * 100) / 100, normalizedUnit: 'kg' };
  }

  // Volume normalization: base unit 'l' (1000ml = 1l)
  if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters') {
    const pricePerL = (price / packQuantity) * 1000;
    return { normalizedPrice: Math.round(pricePerL * 100) / 100, normalizedUnit: 'l' };
  }
  if (unit === 'l' || unit === 'liter' || unit === 'liters' || unit === 'litre' || unit === 'litres') {
    const pricePerL = price / packQuantity;
    return { normalizedPrice: Math.round(pricePerL * 100) / 100, normalizedUnit: 'l' };
  }

  // Count normalization: base unit 'pc'
  if (
    unit === 'pc' ||
    unit === 'pcs' ||
    unit === 'piece' ||
    unit === 'pieces' ||
    unit === 'item' ||
    unit === 'items'
  ) {
    const pricePerPc = price / packQuantity;
    return { normalizedPrice: Math.round(pricePerPc * 100) / 100, normalizedUnit: 'pc' };
  }

  return { normalizedPrice: null, normalizedUnit: null };
};

class PriceComparisonService {
  /**
   * Evaluates an array of marketplace product offers for a single item.
   * Compares only valid, positive finite numbers.
   * Enforces pack-size safety to prevent false equivalence between different pack sizes.
   * @param {Array<Object>} rawOffers - Candidate offers from marketplace providers
   * @returns {Object} Deterministic comparison summary
   */
  compareOffers(rawOffers = []) {
    const baseSummary = {
      pricingAvailable: false,
      bestPrice: null,
      bestMarketplace: null,
      bestOffers: [],
      offers: [],
      totalOffers: 0,
      validOffersCount: 0,
      packSizeMismatch: false,
      normalizedPricingAvailable: false,
      bestNormalizedPrice: null,
      bestNormalizedMarketplace: null,
      disclaimer:
        'Prices and inventory are subject to real-time confirmation on the retailer platform.',
    };

    if (!Array.isArray(rawOffers) || rawOffers.length === 0) {
      return baseSummary;
    }

    const seenMarketplaces = new Map();
    const sanitizedOffers = [];

    // 1. Sanitize and validate incoming offers, resolving duplicate marketplaces deterministically
    for (const raw of rawOffers) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;

      const marketplace = typeof raw.marketplace === 'string' ? raw.marketplace.trim().toLowerCase() : null;
      if (!marketplace) continue;

      const displayName = typeof raw.displayName === 'string' && raw.displayName.trim()
        ? raw.displayName.trim()
        : marketplace;

      const rawPrice = raw.price;
      const isValidPrice =
        typeof rawPrice === 'number' &&
        Number.isFinite(rawPrice) &&
        !Number.isNaN(rawPrice) &&
        rawPrice > 0;

      const packQuantity =
        typeof raw.packQuantity === 'number' && Number.isFinite(raw.packQuantity) && raw.packQuantity > 0
          ? raw.packQuantity
          : null;

      const packUnit =
        typeof raw.packUnit === 'string' && raw.packUnit.trim() ? raw.packUnit.trim().toLowerCase() : null;

      const { normalizedPrice, normalizedUnit } = isValidPrice
        ? calculateNormalizedPrice(rawPrice, packQuantity, packUnit)
        : { normalizedPrice: null, normalizedUnit: null };

      const offerObj = {
        marketplace,
        displayName,
        productName: typeof raw.productName === 'string' ? raw.productName : null,
        productUrl: typeof raw.productUrl === 'string' ? raw.productUrl : null,
        searchUrl: typeof raw.searchUrl === 'string' ? raw.searchUrl : null,
        price: isValidPrice ? Math.round(rawPrice * 100) / 100 : null,
        currency: typeof raw.currency === 'string' ? raw.currency : 'INR',
        packQuantity,
        packUnit,
        normalizedPrice,
        normalizedUnit,
        available: Boolean(
          raw.available !== false &&
          (raw.inStock === undefined || raw.inStock !== false) &&
          isValidPrice
        ),
        pricingAvailable: Boolean(
          (raw.pricingAvailable !== undefined ? raw.pricingAvailable : isValidPrice) &&
          isValidPrice &&
          raw.available !== false &&
          (raw.inStock === undefined || raw.inStock !== false)
        ),
        source: typeof raw.source === 'string' ? raw.source : (isValidPrice ? 'provider' : 'unconfigured'),
        fetchedAt: typeof raw.fetchedAt === 'string' ? raw.fetchedAt : null,
      };

      // If same marketplace appears multiple times, retain the one with lowest valid price or first
      if (seenMarketplaces.has(marketplace)) {
        const existing = seenMarketplaces.get(marketplace);
        if (isValidPrice) {
          if (existing.price === null || offerObj.price < existing.price) {
            seenMarketplaces.set(marketplace, offerObj);
          }
        }
      } else {
        seenMarketplaces.set(marketplace, offerObj);
      }
    }

    for (const offer of seenMarketplaces.values()) {
      sanitizedOffers.push(offer);
    }

    // 2. Filter for strictly valid positive prices
    const validPricedOffers = sanitizedOffers.filter((o) => o.price !== null && o.pricingAvailable);

    if (validPricedOffers.length === 0) {
      return {
        ...baseSummary,
        offers: sanitizedOffers,
        totalOffers: sanitizedOffers.length,
      };
    }

    // 3. Find minimum raw price
    let lowestPrice = Infinity;
    for (const offer of validPricedOffers) {
      if (offer.price < lowestPrice) {
        lowestPrice = offer.price;
      }
    }

    const bestOffers = validPricedOffers.filter((o) => o.price === lowestPrice);
    const bestMarketplace = bestOffers.length > 0 ? bestOffers[0].marketplace : null;
    const isTied = bestOffers.length > 1;

    // 4. Pack Size Safety Evaluation
    let packSizeMismatch = false;
    let normalizedPricingAvailable = false;
    let bestNormalizedPrice = null;
    let bestNormalizedMarketplace = null;

    if (validPricedOffers.length > 1) {
      const firstQty = validPricedOffers[0].packQuantity;
      const firstUnit = validPricedOffers[0].packUnit;

      const hasDifferentPack = validPricedOffers.some(
        (o) => o.packQuantity !== firstQty || o.packUnit !== firstUnit
      );

      if (hasDifferentPack) {
        packSizeMismatch = true;
      }
    }

    // If all valid offers have compatible normalized pricing
    const allHaveNormalized = validPricedOffers.every((o) => o.normalizedPrice !== null);
    if (allHaveNormalized && validPricedOffers.length > 0) {
      const targetUnit = validPricedOffers[0].normalizedUnit;
      const sameNormUnit = validPricedOffers.every((o) => o.normalizedUnit === targetUnit);

      if (sameNormUnit) {
        normalizedPricingAvailable = true;
        let lowestNorm = Infinity;
        let lowestNormMkt = null;

        for (const offer of validPricedOffers) {
          if (offer.normalizedPrice < lowestNorm) {
            lowestNorm = offer.normalizedPrice;
            lowestNormMkt = offer.marketplace;
          }
        }

        bestNormalizedPrice = lowestNorm;
        bestNormalizedMarketplace = lowestNormMkt;
      }
    }

    return {
      pricingAvailable: true,
      bestPrice: lowestPrice,
      bestMarketplace,
      bestOffers,
      isTied,
      packSizeMismatch,
      normalizedPricingAvailable,
      bestNormalizedPrice,
      bestNormalizedMarketplace,
      offers: sanitizedOffers,
      totalOffers: sanitizedOffers.length,
      validOffersCount: validPricedOffers.length,
      disclaimer:
        'Prices and inventory are subject to real-time confirmation on the retailer platform.',
    };
  }

  /**
   * Compares offers across a multi-item grocery list and calculates aggregate basket totals per marketplace.
   * Evaluates individual item prices and calculates marketplace basket totals with completeness guarantees.
   * @param {Array<Object>} itemsWithOffers - Array of items, each containing an `offers` array
   * @returns {Object} Basket comparison summary
   */
  compareBasket(itemsWithOffers = []) {
    if (!Array.isArray(itemsWithOffers) || itemsWithOffers.length === 0) {
      return {
        pricingAvailable: false,
        items: [],
        summary: null,
        basketTotals: [],
        disclaimer:
          'Prices and inventory are subject to real-time confirmation on the retailer platform.',
      };
    }

    const processedItems = itemsWithOffers.map((item) => {
      const comparison = this.compareOffers(item.offers || []);
      return {
        ...item,
        comparison,
      };
    });

    const anyPricingAvailable = processedItems.some((i) => i.comparison.pricingAvailable);
    const totalItemsCount = processedItems.length;

    // Collect all unique marketplaces appearing across all items
    const marketplaceStats = new Map();

    for (const item of processedItems) {
      const sanitizedOffers = item.comparison?.offers || [];
      for (const offer of sanitizedOffers) {
        if (!offer || typeof offer.marketplace !== 'string') continue;
        const mkt = offer.marketplace.trim().toLowerCase();
        if (!mkt) continue;

        if (!marketplaceStats.has(mkt)) {
          marketplaceStats.set(mkt, {
            marketplace: mkt,
            displayName: offer.displayName || mkt,
            pricedOffers: [],
            hasCurrencyMismatch: false,
            primaryCurrency: null,
          });
        }
        const stats = marketplaceStats.get(mkt);
        if (offer.displayName && stats.displayName === mkt) {
          stats.displayName = offer.displayName;
        }

        const isValidPrice =
          typeof offer.price === 'number' &&
          Number.isFinite(offer.price) &&
          !Number.isNaN(offer.price) &&
          offer.price > 0;

        const isAvailable =
          offer.available !== false &&
          offer.pricingAvailable !== false &&
          offer.inStock !== false;

        if (isValidPrice && isAvailable) {
          const offerCurrency =
            typeof offer.currency === 'string' && offer.currency.trim()
              ? offer.currency.trim().toUpperCase()
              : 'INR';

          if (!stats.primaryCurrency) {
            stats.primaryCurrency = offerCurrency;
          } else if (stats.primaryCurrency !== offerCurrency) {
            stats.hasCurrencyMismatch = true;
          }

          stats.pricedOffers.push({
            itemName: item.name || '',
            price: offer.price,
            currency: offerCurrency,
          });
        }
      }
    }

    // Build marketplace totals
    const basketTotals = [];
    const marketplaceSummaries = {};

    for (const [mkt, stats] of marketplaceStats.entries()) {
      const pricedItemsCount = stats.pricedOffers.length;
      const unpricedItemsCount = totalItemsCount - pricedItemsCount;
      const isComplete =
        pricedItemsCount === totalItemsCount && totalItemsCount > 0 && !stats.hasCurrencyMismatch;

      let totalPrice = null;
      let pricingAvailable = false;

      if (pricedItemsCount > 0 && !stats.hasCurrencyMismatch) {
        const sum = stats.pricedOffers.reduce((acc, o) => acc + o.price, 0);
        totalPrice = Math.round(sum * 100) / 100;
        pricingAvailable = true;
      }

      const mktEntry = {
        marketplace: mkt,
        displayName: stats.displayName,
        totalPrice,
        currency: stats.primaryCurrency || (pricedItemsCount > 0 ? 'INR' : null),
        totalItemsCount,
        pricedItemsCount,
        unpricedItemsCount,
        isComplete,
        pricingAvailable,
        currencyMismatch: stats.hasCurrencyMismatch,
      };

      basketTotals.push(mktEntry);
      marketplaceSummaries[mkt] = mktEntry;
    }

    // Sort basketTotals deterministically by marketplace name
    basketTotals.sort((a, b) => a.marketplace.localeCompare(b.marketplace));

    // Determine best marketplace
    // Rule 11 & 12: Only complete baskets are eligible to be declared best overall marketplace
    const completeMarketplaces = basketTotals.filter(
      (m) => m.isComplete && m.totalPrice !== null && !m.currencyMismatch
    );

    let bestMarketplace = null;
    let bestPrice = null;
    let isTied = false;
    let tiedMarketplaces = [];

    if (completeMarketplaces.length > 0) {
      const baseCurrency = completeMarketplaces[0].currency;
      const sameCurrencyStores = completeMarketplaces.filter((m) => m.currency === baseCurrency);

      if (sameCurrencyStores.length > 0) {
        let lowestTotal = Infinity;
        for (const m of sameCurrencyStores) {
          if (m.totalPrice < lowestTotal) {
            lowestTotal = m.totalPrice;
          }
        }

        const bestStores = sameCurrencyStores.filter((m) => m.totalPrice === lowestTotal);
        bestPrice = lowestTotal;
        bestMarketplace = bestStores[0].marketplace;
        isTied = bestStores.length > 1;
        tiedMarketplaces = bestStores.map((s) => s.marketplace);
      }
    }

    const summary = {
      totalItemsCount,
      pricingAvailable: anyPricingAvailable,
      hasCompleteBasket: completeMarketplaces.length > 0,
      bestMarketplace,
      bestPrice,
      bestCompleteMarketplace: bestMarketplace,
      bestCompletePrice: bestPrice,
      isTied,
      tiedMarketplaces,
      marketplaces: marketplaceSummaries,
      basketTotals,
    };

    return {
      pricingAvailable: anyPricingAvailable,
      items: processedItems,
      summary,
      basketTotals,
      disclaimer:
        'Prices and inventory are subject to real-time confirmation on the retailer platform.',
    };
  }
}

const priceComparisonService = new PriceComparisonService();
export default priceComparisonService;
