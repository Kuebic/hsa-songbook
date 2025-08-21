/**
 * @file ChordSheetFormatterFactory.ts
 * @description Factory for creating and caching ChordSheetJS formatters
 * Optimizes performance through formatter reuse and LRU caching
 */

import * as ChordSheetJS from 'chordsheetjs';

export type FormatterType = 'responsive' | 'print' | 'text' | 'chordpro';

export interface FormatterOptions {
  /** Whether to show chord diagrams */
  showDiagrams?: boolean;
  /** Custom CSS class prefix */
  cssPrefix?: string;
  /** Whether to transpose chords */
  transpose?: number;
  /** Whether to use flats instead of sharps */
  useFlats?: boolean;
}

/**
 * Factory for creating and caching ChordSheetJS formatters
 * Implements LRU caching to limit memory usage
 */
export class ChordSheetFormatterFactory {
  private static formatters = new Map<string, ChordSheetJS.Formatter>();
  private static readonly MAX_CACHE_SIZE = 10;

  /**
   * Get or create a formatter instance
   * @param type - Type of formatter to create
   * @param options - Formatter configuration options
   * @returns Cached or new formatter instance
   */
  static getFormatter(
    type: FormatterType,
    options: FormatterOptions = {}
  ): ChordSheetJS.Formatter {
    // Generate cache key from type and options
    const cacheKey = this.generateCacheKey(type, options);
    
    // Check cache first
    if (this.formatters.has(cacheKey)) {
      // Move to end (most recently used) for LRU
      const formatter = this.formatters.get(cacheKey)!;
      this.formatters.delete(cacheKey);
      this.formatters.set(cacheKey, formatter);
      return formatter;
    }

    // Create new formatter based on type
    let formatter: ChordSheetJS.Formatter;
    
    switch (type) {
      case 'responsive':
        // HtmlDivFormatter is best for responsive web display
        formatter = new ChordSheetJS.HtmlDivFormatter();
        break;
        
      case 'print':
        // HtmlTableFormatter provides better alignment for print
        formatter = new ChordSheetJS.HtmlTableFormatter();
        break;
        
      case 'text':
        // TextFormatter for plain text output
        formatter = new ChordSheetJS.TextFormatter();
        break;
        
      case 'chordpro':
        // ChordProFormatter to convert back to ChordPro format
        formatter = new ChordSheetJS.ChordProFormatter();
        break;
        
      default:
        // Default to responsive formatter
        formatter = new ChordSheetJS.HtmlDivFormatter();
    }

    // Apply LRU eviction if cache is full
    if (this.formatters.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.formatters.keys().next().value;
      if (firstKey !== undefined) {
        this.formatters.delete(firstKey);
      }
    }

    // Cache and return
    this.formatters.set(cacheKey, formatter);
    return formatter;
  }

  /**
   * Generate a cache key from formatter type and options
   * @param type - Formatter type
   * @param options - Formatter options
   * @returns Unique cache key string
   */
  private static generateCacheKey(
    type: FormatterType,
    options: FormatterOptions
  ): string {
    // Sort options keys for consistent key generation
    const sortedOptions = Object.keys(options)
      .sort()
      .reduce((acc, key) => {
        acc[key] = options[key as keyof FormatterOptions];
        return acc;
      }, {} as Record<string, unknown>);

    return `${type}-${JSON.stringify(sortedOptions)}`;
  }

  /**
   * Clear the formatter cache
   * Useful for memory management or testing
   */
  static clearCache(): void {
    this.formatters.clear();
  }

  /**
   * Get current cache size
   * @returns Number of cached formatters
   */
  static getCacheSize(): number {
    return this.formatters.size;
  }

  /**
   * Get cache statistics
   * @returns Object with cache metrics
   */
  static getCacheStats(): {
    size: number;
    maxSize: number;
    keys: string[];
  } {
    return {
      size: this.formatters.size,
      maxSize: this.MAX_CACHE_SIZE,
      keys: Array.from(this.formatters.keys())
    };
  }

  /**
   * Get formatter with context-aware selection
   * @param context - Rendering context
   * @param options - Additional formatter options
   * @returns Appropriate formatter for the context
   */
  static getFormatterForContext(
    context: 'preview' | 'viewer' | 'stage' | 'print' | 'export',
    options: FormatterOptions = {}
  ): ChordSheetJS.Formatter {
    // Map context to formatter type
    const typeMap: Record<typeof context, FormatterType> = {
      preview: 'responsive',
      viewer: 'responsive',
      stage: 'responsive', // Stage mode uses responsive with custom styling
      print: 'print',
      export: 'text'
    };

    const type = typeMap[context] || 'responsive';
    return this.getFormatter(type, options);
  }

  /**
   * Create a formatter with custom configuration
   * Does not cache the result
   * @param type - Formatter type
   * @param customConfig - Custom configuration object
   * @returns New formatter instance
   */
  static createCustomFormatter(
    type: FormatterType,
    customConfig?: unknown
  ): ChordSheetJS.Formatter {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = customConfig as any;
    switch (type) {
      case 'responsive':
        return new ChordSheetJS.HtmlDivFormatter(config);
      case 'print':
        return new ChordSheetJS.HtmlTableFormatter(config);
      case 'text':
        return new ChordSheetJS.TextFormatter(config);
      case 'chordpro':
        return new ChordSheetJS.ChordProFormatter(config);
      default:
        return new ChordSheetJS.HtmlDivFormatter(config);
    }
  }
}

// Export singleton instance methods for convenience
export const getFormatter = ChordSheetFormatterFactory.getFormatter.bind(ChordSheetFormatterFactory);
export const getFormatterForContext = ChordSheetFormatterFactory.getFormatterForContext.bind(ChordSheetFormatterFactory);
export const clearFormatterCache = ChordSheetFormatterFactory.clearCache.bind(ChordSheetFormatterFactory);
export const getFormatterCacheStats = ChordSheetFormatterFactory.getCacheStats.bind(ChordSheetFormatterFactory);