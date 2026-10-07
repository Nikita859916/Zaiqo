/**
 * Product Matching Service (Phase 2)
 * Deterministically normalizes and prepares grocery item names for external product lookup.
 * Pure in-memory logic: zero HTTP requests, zero scraping, zero database writes.
 */

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Strip decorative punctuation but preserve alphanumeric characters, spaces, and Unicode glyphs
const PUNCTUATION_REGEX = /[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?~`\-]+/g;

class ProductMatchingService {
  /**
   * Normalizes a product name: trims, collapses whitespace, removes decorative punctuation,
   * converts to lowercase while preserving Unicode terms.
   * @param {any} rawName
   * @returns {string} Cleaned canonical string
   * @throws {Error} On invalid or malicious input
   */
  normalizeProductName(rawName) {
    if (rawName === null || rawName === undefined) {
      throw new Error('Product name cannot be empty.');
    }

    if (typeof rawName !== 'string') {
      throw new Error('Product name must be a string.');
    }

    const trimmed = rawName.trim();
    if (trimmed.length === 0) {
      throw new Error('Product name cannot be empty.');
    }

    if (trimmed.length > 200) {
      throw new Error('Product name exceeds maximum length of 200 characters.');
    }

    for (const forbidden of FORBIDDEN_KEYS) {
      if (trimmed.toLowerCase().includes(forbidden)) {
        throw new Error(`Forbidden keyword detected: "${forbidden}"`);
      }
    }

    // Remove control characters
    const cleanChars = trimmed.replace(/[\x00-\x1F\x7F]/g, '');

    // Strip punctuation and collapse internal whitespace
    const withoutPunctuation = cleanChars.replace(PUNCTUATION_REGEX, ' ');
    const collapsed = withoutPunctuation.replace(/\s+/g, ' ').trim();

    if (collapsed.length === 0) {
      throw new Error('Product name contains only punctuation or invalid characters.');
    }

    return collapsed.toLowerCase();
  }

  /**
   * Prepares a canonical product query object from a raw string or grocery item object
   * @param {string|Object} itemOrName
   * @returns {{ originalName: string, canonicalQuery: string, tokens: string[] }}
   */
  prepareProductQuery(itemOrName) {
    if (!itemOrName) {
      throw new Error('Item or product name is required.');
    }

    let originalName = '';
    if (typeof itemOrName === 'string') {
      originalName = itemOrName;
    } else if (typeof itemOrName === 'object' && itemOrName.name) {
      originalName = String(itemOrName.name);
    } else {
      throw new Error('Invalid item representation; must be a string or object with a name property.');
    }

    const canonicalQuery = this.normalizeProductName(originalName);
    const tokens = canonicalQuery.split(/\s+/).filter(Boolean);

    return {
      originalName: originalName.trim(),
      canonicalQuery,
      tokens,
    };
  }

  /**
   * Evaluates the degree of match between a canonical query and a candidate product title.
   * Deterministic token overlap score between 0 and 1.
   * @param {string} canonicalQuery - Target normalized query (e.g. 'fresh paneer')
   * @param {string} candidateTitle - Candidate product title (e.g. 'Amul Fresh Malai Paneer 200g')
   * @returns {{ matched: boolean, score: number, matchedTokens: string[] }}
   */
  evaluateCandidateMatch(canonicalQuery, candidateTitle) {
    if (!canonicalQuery || !candidateTitle || typeof candidateTitle !== 'string') {
      return { matched: false, score: 0, matchedTokens: [] };
    }

    let normalizedCandidate = '';
    try {
      normalizedCandidate = this.normalizeProductName(candidateTitle);
    } catch {
      return { matched: false, score: 0, matchedTokens: [] };
    }

    const queryTokens = canonicalQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const candidateTokens = new Set(normalizedCandidate.split(/\s+/).filter(Boolean));

    if (queryTokens.length === 0) {
      return { matched: false, score: 0, matchedTokens: [] };
    }

    const matchedTokens = queryTokens.filter((token) => candidateTokens.has(token));
    const score = matchedTokens.length / queryTokens.length;

    // Matched if all query tokens are present in candidate
    const matched = score === 1.0;

    return {
      matched,
      score: Math.round(score * 100) / 100,
      matchedTokens,
    };
  }
}

const productMatchingService = new ProductMatchingService();
export default productMatchingService;
