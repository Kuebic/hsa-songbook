/**
 * @file ChordRenderCacheService.ts
 * @description Three-tier caching service for optimized ChordSheetJS rendering
 * Implements LRU caching at multiple levels for maximum performance
 */

import * as ChordSheetJS from 'chordsheetjs';
import type { RenderOptions } from '../types/preferences.types';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

interface CacheMetrics {
  songHits: number;
  songMisses: number;
  htmlHits: number;
  htmlMisses: number;
  styledHits: number;
  styledMisses: number;
  totalRenderTime: number;
  renderCount: number;
}

/**
 * LRU Cache implementation with size limits and metrics
 */
class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      this.hits++;
      // Move to end (most recently used)
      this.cache.delete(key);
      entry.accessCount++;
      entry.timestamp = Date.now();
      this.cache.set(key, entry);
      return entry.value;
    }
    this.misses++;
    return undefined;
  }

  /**
   * Set value in cache
   */
  set(key: K, value: V): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  /**
   * Check if key exists
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0
    };
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Three-tier caching service for ChordSheetJS rendering
 * Optimizes performance through multi-level caching
 */
export class ChordRenderCacheService {
  // Level 1: Parsed song objects (most expensive to create)
  private songCache: LRUCache<string, ChordSheetJS.Song>;
  
  // Level 2: Formatted HTML (medium cost)
  private htmlCache: LRUCache<string, string>;
  
  // Level 3: Styled output (cheapest, includes CSS)
  private styledCache: LRUCache<string, string>;
  
  // Performance metrics
  private metrics: CacheMetrics = {
    songHits: 0,
    songMisses: 0,
    htmlHits: 0,
    htmlMisses: 0,
    styledHits: 0,
    styledMisses: 0,
    totalRenderTime: 0,
    renderCount: 0
  };

  // Performance tracking
  private lastRenderTime = 0;

  constructor() {
    // Initialize caches with appropriate size limits
    this.songCache = new LRUCache(20);     // 20 parsed songs
    this.htmlCache = new LRUCache(50);     // 50 HTML renders
    this.styledCache = new LRUCache(100);  // 100 styled outputs
  }

  /**
   * Generate cache key from content and options
   * @param content - ChordPro content
   * @param options - Render options
   * @returns Unique cache key
   */
  generateKey(content: string, options?: RenderOptions): string {
    // Use content hash for better performance
    const contentHash = this.hashContent(content);
    const optionsKey = options ? JSON.stringify({
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      transpose: options.transpose,
      showDiagrams: options.showDiagrams
    }) : '';
    
    return `${contentHash}-${optionsKey}`;
  }

  /**
   * Fast hash function for content
   * @param content - String to hash
   * @returns Hash string
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get or parse song from cache
   * @param content - ChordPro content
   * @returns Parsed song object
   */
  getParsedSong(content: string): ChordSheetJS.Song | undefined {
    const key = this.hashContent(content);
    let song = this.songCache.get(key);
    
    if (song) {
      this.metrics.songHits++;
    } else {
      this.metrics.songMisses++;
      
      // Parse and cache
      const startTime = performance.now();
      try {
        const parser = new ChordSheetJS.ChordProParser();
        song = parser.parse(content);
        this.songCache.set(key, song);
        
        const parseTime = performance.now() - startTime;
        this.updateRenderMetrics(parseTime);
      } catch (error) {
        console.error('Error parsing ChordPro:', error);
        return undefined;
      }
    }
    
    return song;
  }

  /**
   * Set parsed song in cache
   * @param content - ChordPro content
   * @param song - Parsed song object
   */
  setParsedSong(content: string, song: ChordSheetJS.Song): void {
    const key = this.hashContent(content);
    this.songCache.set(key, song);
  }

  /**
   * Get formatted HTML from cache
   * @param key - Cache key
   * @returns Formatted HTML or undefined
   */
  getFormattedHtml(key: string): string | undefined {
    const html = this.htmlCache.get(key);
    if (html) {
      this.metrics.htmlHits++;
    } else {
      this.metrics.htmlMisses++;
    }
    return html;
  }

  /**
   * Set formatted HTML in cache
   * @param key - Cache key
   * @param html - Formatted HTML
   */
  setFormattedHtml(key: string, html: string): void {
    this.htmlCache.set(key, html);
  }

  /**
   * Get styled output from cache
   * @param key - Cache key
   * @returns Styled HTML or undefined
   */
  getStyledHtml(key: string): string | undefined {
    const html = this.styledCache.get(key);
    if (html) {
      this.metrics.styledHits++;
    } else {
      this.metrics.styledMisses++;
    }
    return html;
  }

  /**
   * Set styled output in cache
   * @param key - Cache key
   * @param html - Styled HTML
   */
  setStyledHtml(key: string, html: string): void {
    this.styledCache.set(key, html);
  }

  /**
   * Update render time metrics
   * @param renderTime - Time taken to render in ms
   */
  private updateRenderMetrics(renderTime: number): void {
    this.metrics.totalRenderTime += renderTime;
    this.metrics.renderCount++;
    this.lastRenderTime = renderTime;
  }

  /**
   * Get comprehensive metrics
   * @returns Cache and performance metrics
   */
  getMetrics(): CacheMetrics & {
    songHitRate: number;
    htmlHitRate: number;
    styledHitRate: number;
    averageRenderTime: number;
    lastRenderTime: number;
    cacheStats: {
      song: ReturnType<LRUCache<string, ChordSheetJS.Song>['getStats']>;
      html: ReturnType<LRUCache<string, string>['getStats']>;
      styled: ReturnType<LRUCache<string, string>['getStats']>;
    };
  } {
    const songTotal = this.metrics.songHits + this.metrics.songMisses;
    const htmlTotal = this.metrics.htmlHits + this.metrics.htmlMisses;
    const styledTotal = this.metrics.styledHits + this.metrics.styledMisses;

    return {
      ...this.metrics,
      songHitRate: songTotal > 0 ? this.metrics.songHits / songTotal : 0,
      htmlHitRate: htmlTotal > 0 ? this.metrics.htmlHits / htmlTotal : 0,
      styledHitRate: styledTotal > 0 ? this.metrics.styledHits / styledTotal : 0,
      averageRenderTime: this.metrics.renderCount > 0 
        ? this.metrics.totalRenderTime / this.metrics.renderCount 
        : 0,
      lastRenderTime: this.lastRenderTime,
      cacheStats: {
        song: this.songCache.getStats(),
        html: this.htmlCache.getStats(),
        styled: this.styledCache.getStats()
      }
    };
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.songCache.clear();
    this.htmlCache.clear();
    this.styledCache.clear();
    this.resetMetrics();
  }

  /**
   * Clear specific cache level
   * @param level - Cache level to clear
   */
  clearLevel(level: 'song' | 'html' | 'styled'): void {
    switch (level) {
      case 'song':
        this.songCache.clear();
        break;
      case 'html':
        this.htmlCache.clear();
        break;
      case 'styled':
        this.styledCache.clear();
        break;
    }
  }

  /**
   * Reset performance metrics
   */
  private resetMetrics(): void {
    this.metrics = {
      songHits: 0,
      songMisses: 0,
      htmlHits: 0,
      htmlMisses: 0,
      styledHits: 0,
      styledMisses: 0,
      totalRenderTime: 0,
      renderCount: 0
    };
    this.lastRenderTime = 0;
  }

  /**
   * Get cache sizes
   * @returns Object with cache sizes
   */
  getCacheSizes(): { song: number; html: number; styled: number; total: number } {
    const song = this.songCache.size();
    const html = this.htmlCache.size();
    const styled = this.styledCache.size();
    
    return {
      song,
      html,
      styled,
      total: song + html + styled
    };
  }

  /**
   * Warm up cache with common content
   * @param contents - Array of common ChordPro contents to pre-cache
   */
  async warmUp(contents: string[]): Promise<void> {
    const promises = contents.map(async (content) => {
      return new Promise<void>((resolve) => {
        // Use setTimeout to avoid blocking
        setTimeout(() => {
          this.getParsedSong(content);
          resolve();
        }, 0);
      });
    });

    await Promise.all(promises);
  }

  /**
   * Export cache statistics for monitoring
   * @returns Detailed cache statistics
   */
  exportStats() {
    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      sizes: this.getCacheSizes()
    };
  }
}

// Create singleton instance
export const chordRenderCache = new ChordRenderCacheService();

// Export convenience methods
export const getCachedSong = chordRenderCache.getParsedSong.bind(chordRenderCache);
export const getCachedHtml = chordRenderCache.getFormattedHtml.bind(chordRenderCache);
export const getCachedStyled = chordRenderCache.getStyledHtml.bind(chordRenderCache);
export const clearRenderCache = chordRenderCache.clearAll.bind(chordRenderCache);
export const getRenderCacheMetrics = chordRenderCache.getMetrics.bind(chordRenderCache);