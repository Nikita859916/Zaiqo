/**
 * Concurrency Utilities (Phase 10 Step 3)
 * Provides lightweight, zero-dependency bounded concurrency pooling for async operations.
 * Preserves deterministic result ordering matching input array indices.
 */

export const DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS = 5;

/**
 * Maps over an array of items with a bounded concurrency pool.
 * Guarantees that at most `concurrency` async tasks are active at any time.
 * As one task finishes, the next queued task starts immediately.
 * Preserves deterministic result ordering matching the original items array.
 *
 * @template T, R
 * @param {Array<T>} items - Input array of items
 * @param {function(T, number, Array<T>): Promise<R>} iteratorFn - Async mapping function
 * @param {number|Object} [options=DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS] - Concurrency limit or options object
 * @returns {Promise<Array<R>>} Deterministic array of results in original input order
 */
export async function mapConcurrent(items, iteratorFn, options = DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const concurrency =
    typeof options === 'number'
      ? options
      : options && typeof options.concurrency === 'number'
      ? options.concurrency
      : DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS;

  const limit = Math.max(
    1,
    Number.isFinite(concurrency) ? Math.floor(concurrency) : DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS
  );

  const continueOnError = Boolean(options && typeof options === 'object' && options.continueOnError);
  const onError =
    options && typeof options === 'object' && typeof options.onError === 'function'
      ? options.onError
      : null;

  const results = new Array(items.length);
  let currentIndex = 0;
  let firstError = null;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await iteratorFn(items[idx], idx, items);
      } catch (err) {
        if (continueOnError) {
          results[idx] = onError
            ? onError(err, items[idx], idx)
            : { error: err, failed: true };
        } else {
          if (!firstError) firstError = err;
          throw err;
        }
      }
    }
  }

  const workerCount = Math.min(items.length, limit);
  const workers = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  try {
    await Promise.all(workers);
  } catch (err) {
    if (!continueOnError) {
      throw firstError || err;
    }
  }

  return results;
}
