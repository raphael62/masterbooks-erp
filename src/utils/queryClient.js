import { supabase } from '../lib/supabase';

/**
 * Enhanced query client with automatic retries, caching, and error handling
 */
export const queryClient = {
  /**
   * Execute a query with retry logic and error handling
   */
  async executeQuery(queryFn, options = {}) {
    const { maxRetries = 3, retryDelay = 1000, timeout = 30000 } = options;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const result = await Promise.race([
          queryFn(),
          new Promise((_, reject) =>
            controller.signal.addEventListener('abort', () =>
              reject(new Error('Query timeout'))
            )
          )
        ]);

        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error('Query failed after max retries');
  },

  /**
   * Fetch data with pagination support
   */
  async fetchPaginated(table, { limit = 25, offset = 0, filters = {}, orderBy = null } = {}) {
    let query = supabase.from(table).select('*', { count: 'exact' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value);
      }
    });

    // Apply ordering
    if (orderBy) {
      const { column, ascending = true } = orderBy;
      query = query.order(column, { ascending });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    return this.executeQuery(() => query);
  },

  /**
   * Bulk insert with batching
   */
  async bulkInsert(table, records, batchSize = 100) {
    const results = [];
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { data, error } = await this.executeQuery(() =>
        supabase.from(table).insert(batch).select()
      );

      if (error) throw error;
      results.push(...(data || []));
    }
    return results;
  },

  /**
   * Bulk update with batching
   */
  async bulkUpdate(table, records, batchSize = 100) {
    const results = [];
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const updates = batch.map(record => ({
        ...record,
        updated_at: new Date().toISOString()
      }));

      // Use upsert for bulk updates
      const { data, error } = await this.executeQuery(() =>
        supabase
          .from(table)
          .upsert(updates, { onConflict: 'id' })
          .select()
      );

      if (error) throw error;
      results.push(...(data || []));
    }
    return results;
  },

  /**
   * Batch delete records
   */
  async bulkDelete(table, ids, batchSize = 100) {
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const { error } = await this.executeQuery(() =>
        supabase.from(table).delete().in('id', batch)
      );

      if (error) throw error;
    }
  }
};

/**
 * Query cache with TTL support
 */
class QueryCache {
  constructor(ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.timers = new Map();
    this.ttl = ttl;
  }

  set(key, value, customTtl = null) {
    const actualTtl = customTtl || this.ttl;
    const existingTimer = this.timers.get(key);
    if (existingTimer) clearTimeout(existingTimer);

    this.cache.set(key, value);
    const timer = setTimeout(() => this.invalidate(key), actualTtl);
    this.timers.set(key, timer);
  }

  get(key) {
    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  invalidate(key) {
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);
    this.cache.delete(key);
    this.timers.delete(key);
  }

  invalidateAll() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }
}

export const cacheManager = new QueryCache();
