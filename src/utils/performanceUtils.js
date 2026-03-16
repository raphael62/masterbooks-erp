/**
 * Performance monitoring and optimization utilities
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.slowThreshold = 1000; // milliseconds
  }

  /**
   * Measure execution time of async operations
   */
  async measure(label, asyncFn) {
    const start = performance.now();
    try {
      const result = await asyncFn();
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      
      if (duration > this.slowThreshold) {
        console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms (slow)`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(label, duration, 'error');
      throw error;
    }
  }

  recordMetric(label, duration, status = 'success') {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label).push({ duration, status, timestamp: Date.now() });
  }

  getMetrics(label = null) {
    if (label) {
      return this.metrics.get(label) || [];
    }
    return Object.fromEntries(this.metrics);
  }

  getStats(label) {
    const data = this.metrics.get(label) || [];
    if (data.length === 0) return null;

    const durations = data.map(m => m.duration);
    return {
      count: data.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]
    };
  }

  clear(label = null) {
    if (label) {
      this.metrics.delete(label);
    } else {
      this.metrics.clear();
    }
  }

  report() {
    console.group('Performance Report');
    for (const [label, data] of this.metrics) {
      const stats = this.getStats(label);
      if (stats) {
        console.log(`${label}:`, stats);
      }
    }
    console.groupEnd();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Debounce utility for high-frequency operations
 */
export function debounce(fn, delayMs = 300) {
  let timeoutId;
  let lastArgs;

  return function debounced(...args) {
    lastArgs = args;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...lastArgs);
    }, delayMs);
  };
}

/**
 * Throttle utility for frequent events
 */
export function throttle(fn, delayMs = 300) {
  let lastCallTime = 0;
  let lastArgs;
  let timeoutId;

  return function throttled(...args) {
    lastArgs = args;
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delayMs) {
      fn(...args);
      lastCallTime = now;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
        lastCallTime = Date.now();
      }, delayMs - timeSinceLastCall);
    }
  };
}

/**
 * Batch operations to reduce re-renders
 */
export class OperationBatcher {
  constructor(batchFn, delayMs = 100) {
    this.queue = [];
    this.timeoutId = null;
    this.batchFn = batchFn;
    this.delayMs = delayMs;
  }

  add(operation) {
    this.queue.push(operation);
    this.scheduleFlush();
  }

  scheduleFlush() {
    if (this.timeoutId) return;
    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.delayMs);
  }

  async flush() {
    if (this.queue.length === 0) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      return;
    }

    const batch = this.queue.splice(0);
    this.timeoutId = null;

    try {
      await this.batchFn(batch);
    } catch (error) {
      console.error('Batch operation failed:', error);
    }
  }

  clear() {
    clearTimeout(this.timeoutId);
    this.queue = [];
    this.timeoutId = null;
  }
}

/**
 * Memory leak detection and cleanup utilities
 */
export class LifecycleManager {
  constructor() {
    this.subscriptions = new Set();
    this.timers = new Set();
    this.eventListeners = new Set();
  }

  addSubscription(unsubscribe) {
    this.subscriptions.add(unsubscribe);
    return () => {
      unsubscribe();
      this.subscriptions.delete(unsubscribe);
    };
  }

  addTimer(timerId) {
    this.timers.add(timerId);
    return () => {
      clearTimeout(timerId);
      this.timers.delete(timerId);
    };
  }

  addEventListener(target, event, handler) {
    target.addEventListener(event, handler);
    const remove = () => {
      target.removeEventListener(event, handler);
      this.eventListeners.delete(remove);
    };
    this.eventListeners.add(remove);
    return remove;
  }

  cleanup() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.eventListeners.forEach(remove => remove());
    
    this.subscriptions.clear();
    this.timers.clear();
    this.eventListeners.clear();
  }
}
