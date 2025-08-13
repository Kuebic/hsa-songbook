import ChordSheetJS from 'chordsheetjs';

/**
 * LRU Cache for parsed ChordPro songs
 * Improves performance by caching parse results
 */
class ChordProCache {
  private cache: Map<string, any>;
  private maxSize: number;

  constructor(maxSize = 10) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get cached parse result
   */
  get(content: string): any | undefined {
    const cached = this.cache.get(content);
    if (cached) {
      // Move to end (most recently used)
      this.cache.delete(content);
      this.cache.set(content, cached);
      return cached;
    }
    return undefined;
  }

  /**
   * Set cache entry
   */
  set(content: string, parsed: any): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(content, parsed);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance
const chordProCache = new ChordProCache(10);

/**
 * Parse ChordPro content with caching
 * @param content - ChordPro formatted text
 * @returns Parsed song object
 */
export const parseSongWithCache = (content: string): any => {
  // Check cache first
  const cached = chordProCache.get(content);
  if (cached) {
    return cached;
  }

  // Parse and cache
  try {
    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(content);
    chordProCache.set(content, song);
    return song;
  } catch (error) {
    console.error('Error parsing ChordPro:', error);
    return null;
  }
};

/**
 * Format parsed song to HTML with caching
 * @param content - ChordPro formatted text
 * @param formatter - ChordSheetJS formatter instance
 * @returns Formatted HTML string
 */
export const formatSongWithCache = (
  content: string,
  formatter: any = new ChordSheetJS.HtmlTableFormatter()
): string => {
  const song = parseSongWithCache(content);
  if (!song) return '';
  
  try {
    return formatter.format(song);
  } catch (error) {
    console.error('Error formatting song:', error);
    return '';
  }
};

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Debounce delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
};

/**
 * Throttle function for performance optimization
 * @param func - Function to throttle
 * @param limit - Throttle limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Clear the ChordPro cache
 * Useful when switching between songs or on cleanup
 */
export const clearChordProCache = (): void => {
  chordProCache.clear();
};

/**
 * Get current cache size
 * Useful for debugging and monitoring
 */
export const getChordProCacheSize = (): number => {
  return chordProCache.size();
};