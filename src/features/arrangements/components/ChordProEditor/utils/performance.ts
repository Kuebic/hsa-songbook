/**
 * Performance optimization utilities for ChordPro editor
 */

/**
 * Throttle function calls to improve performance
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function throttled(this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          throttled.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * RequestAnimationFrame-based throttle for 60fps
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  return function rafThrottled(this: ThisParameterType<T>, ...args: Parameters<T>) {
    lastArgs = args;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func.apply(this, lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };
}

/**
 * Measure render performance
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();
  private enabled: boolean;
  
  constructor(enabled = process.env.NODE_ENV === 'development') {
    this.enabled = enabled;
  }
  
  mark(name: string): void {
    if (!this.enabled) return;
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark?: string): void {
    if (!this.enabled) return;
    
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (start === undefined || end === undefined) {
      console.warn(`Performance marks not found: ${startMark}, ${endMark}`);
      return;
    }
    
    const duration = end - start;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    
    this.measures.get(name)!.push(duration);
    
    // Log slow operations
    if (duration > 16.67) { // Slower than 60fps
      console.warn(`Slow operation "${name}": ${duration.toFixed(2)}ms`);
    }
  }
  
  getStats(measureName: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    total: number;
  } | null {
    const measures = this.measures.get(measureName);
    if (!measures || measures.length === 0) return null;
    
    const total = measures.reduce((sum, val) => sum + val, 0);
    const avg = total / measures.length;
    const min = Math.min(...measures);
    const max = Math.max(...measures);
    
    return { count: measures.length, avg, min, max, total };
  }
  
  logStats(): void {
    if (!this.enabled) return;
    
    console.group('Performance Stats');
    this.measures.forEach((_, name) => {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`${name}:`, {
          avg: `${stats.avg.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          count: stats.count,
        });
      }
    });
    console.groupEnd();
  }
  
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * Batch DOM updates for better performance
 */
export class DOMUpdateBatcher {
  private updates: (() => void)[] = [];
  private rafId: number | null = null;
  
  add(update: () => void): void {
    this.updates.push(update);
    this.scheduleFlush();
  }
  
  private scheduleFlush(): void {
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.flush();
      });
    }
  }
  
  private flush(): void {
    const updates = this.updates.splice(0);
    updates.forEach(update => update());
    this.rafId = null;
  }
  
  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.updates = [];
  }
}

/**
 * Memoize expensive computations
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

/**
 * Lazy load components/features
 */
export function lazyLoad<T>(
  loader: () => Promise<T>
): () => Promise<T> {
  let promise: Promise<T> | null = null;
  
  return () => {
    if (!promise) {
      promise = loader();
    }
    return promise;
  };
}

/**
 * Check if device has low performance characteristics
 */
export function isLowEndDevice(): boolean {
  // Check for low memory
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory && memory < 4) return true;
  
  // Check for low core count
  const cores = navigator.hardwareConcurrency;
  if (cores && cores < 4) return true;
  
  // Check for slow connection
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return true;
    }
  }
  
  return false;
}

/**
 * Optimize for low-end devices
 */
export function getPerformanceSettings() {
  const isLowEnd = isLowEndDevice();
  
  return {
    enableAnimations: !isLowEnd,
    enableSyntaxHighlighting: !isLowEnd,
    scrollDebounceMs: isLowEnd ? 100 : 16,
    autocompleteDebounceMs: isLowEnd ? 300 : 150,
    maxAutocompleteItems: isLowEnd ? 10 : 20,
    enableLineNumbers: !isLowEnd,
    enableMinimap: false, // Always disabled on mobile
  };
}

/**
 * Virtual scrolling helper for large documents
 */
export class VirtualScroller {
  private itemHeight: number;
  private containerHeight: number;
  private totalItems: number;
  private overscan: number;
  
  constructor(
    itemHeight: number,
    containerHeight: number,
    totalItems: number,
    overscan = 3
  ) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.totalItems = totalItems;
    this.overscan = overscan;
  }
  
  getVisibleRange(scrollTop: number): {
    start: number;
    end: number;
    offsetY: number;
  } {
    const visibleStart = Math.floor(scrollTop / this.itemHeight);
    const visibleEnd = Math.ceil((scrollTop + this.containerHeight) / this.itemHeight);
    
    const start = Math.max(0, visibleStart - this.overscan);
    const end = Math.min(this.totalItems, visibleEnd + this.overscan);
    const offsetY = start * this.itemHeight;
    
    return { start, end, offsetY };
  }
  
  getTotalHeight(): number {
    return this.totalItems * this.itemHeight;
  }
  
  updateDimensions(
    itemHeight?: number,
    containerHeight?: number,
    totalItems?: number
  ): void {
    if (itemHeight !== undefined) this.itemHeight = itemHeight;
    if (containerHeight !== undefined) this.containerHeight = containerHeight;
    if (totalItems !== undefined) this.totalItems = totalItems;
  }
}

/**
 * Intersection Observer for lazy rendering
 */
export function createLazyRenderer(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '100px',
    threshold: 0,
    ...options,
  });
}

/**
 * Memory-efficient string operations
 */
export class StringPool {
  private pool = new Map<string, string>();
  
  intern(str: string): string {
    if (!this.pool.has(str)) {
      this.pool.set(str, str);
    }
    return this.pool.get(str)!;
  }
  
  clear(): void {
    this.pool.clear();
  }
  
  get size(): number {
    return this.pool.size;
  }
}