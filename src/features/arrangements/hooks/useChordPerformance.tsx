/**
 * @file useChordPerformance.ts
 * @description Performance monitoring hook for chord sheet rendering
 * Tracks render times, cache performance, and provides optimization insights
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { chordRenderCache } from '../services/ChordRenderCacheService';
import { PerformanceMonitor } from '../components/ChordProEditor/utils/performance';

export interface PerformanceMetrics {
  // Render metrics
  lastRenderTime: number;
  averageRenderTime: number;
  renderCount: number;
  slowRenderCount: number;
  
  // Cache metrics
  cacheHitRate: number;
  songCacheHitRate: number;
  htmlCacheHitRate: number;
  styledCacheHitRate: number;
  
  // Memory metrics
  estimatedMemoryUsage: number;
  cacheSizes: {
    song: number;
    html: number;
    styled: number;
    total: number;
  };
  
  // Performance score (0-100)
  performanceScore: number;
}

export interface PerformanceThresholds {
  /** Maximum acceptable render time in ms */
  maxRenderTime?: number;
  /** Target cache hit rate (0-1) */
  targetCacheHitRate?: number;
  /** Maximum memory usage in MB */
  maxMemoryUsage?: number;
  /** FPS target for scrolling */
  targetFPS?: number;
}

export interface UseChordPerformanceOptions {
  /** Enable automatic monitoring */
  autoMonitor?: boolean;
  /** Monitoring interval in ms */
  monitorInterval?: number;
  /** Performance thresholds */
  thresholds?: PerformanceThresholds;
  /** Enable console warnings for slow operations */
  enableWarnings?: boolean;
}

/**
 * Hook for monitoring chord sheet rendering performance
 * Provides metrics, optimization suggestions, and performance tracking
 */
export function useChordPerformance(options: UseChordPerformanceOptions = {}) {
  const {
    autoMonitor = true,
    monitorInterval = 5000,
    thresholds = {
      maxRenderTime: 100,
      targetCacheHitRate: 0.8,
      maxMemoryUsage: 50,
      targetFPS: 60
    },
    enableWarnings = process.env.NODE_ENV === 'development'
  } = options;

  // State
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lastRenderTime: 0,
    averageRenderTime: 0,
    renderCount: 0,
    slowRenderCount: 0,
    cacheHitRate: 0,
    songCacheHitRate: 0,
    htmlCacheHitRate: 0,
    styledCacheHitRate: 0,
    estimatedMemoryUsage: 0,
    cacheSizes: { song: 0, html: 0, styled: 0, total: 0 },
    performanceScore: 100
  });

  const [isMonitoring, setIsMonitoring] = useState(autoMonitor);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Refs
  const performanceMonitor = useRef(new PerformanceMonitor(true));
  const renderTimings = useRef<number[]>([]);
  const frameTimings = useRef<number[]>([]);
  const lastFrameTime = useRef(performance.now());

  /**
   * React Profiler callback for component render tracking
   */
  const onRenderCallback = useCallback((
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    _baseDuration: number,
    _startTime: number,
    _commitTime: number
  ) => {
    // Track render time
    renderTimings.current.push(actualDuration);
    
    // Keep only last 100 timings
    if (renderTimings.current.length > 100) {
      renderTimings.current.shift();
    }
    
    // Check if render is slow
    if (actualDuration > (thresholds.maxRenderTime || 100)) {
      if (enableWarnings) {
        console.warn(`Slow render detected: ${id} took ${actualDuration.toFixed(2)}ms (phase: ${phase})`);
      }
      
      setMetrics(prev => ({
        ...prev,
        slowRenderCount: prev.slowRenderCount + 1
      }));
    }
    
    // Update metrics
    setMetrics(prev => ({
      ...prev,
      lastRenderTime: actualDuration,
      renderCount: prev.renderCount + 1,
      averageRenderTime: renderTimings.current.reduce((a, b) => a + b, 0) / renderTimings.current.length
    }));
  }, [thresholds.maxRenderTime, enableWarnings]);

  /**
   * Track frame rate during scrolling
   */
  const trackFrameRate = useCallback(() => {
    const now = performance.now();
    const frameDuration = now - lastFrameTime.current;
    const fps = 1000 / frameDuration;
    
    frameTimings.current.push(fps);
    
    // Keep only last 60 frame timings
    if (frameTimings.current.length > 60) {
      frameTimings.current.shift();
    }
    
    lastFrameTime.current = now;
    
    // Check for frame drops
    if (fps < (thresholds.targetFPS || 60) * 0.9) {
      if (enableWarnings) {
        console.warn(`Frame drop detected: ${fps.toFixed(1)} FPS`);
      }
    }
  }, [thresholds.targetFPS, enableWarnings]);

  /**
   * Collect metrics from cache service
   */
  const collectCacheMetrics = useCallback(() => {
    const cacheMetrics = chordRenderCache.getMetrics();
    const cacheSizes = chordRenderCache.getCacheSizes();
    
    // Estimate memory usage (rough calculation)
    const estimatedMemory = (
      cacheSizes.song * 0.5 + // ~0.5MB per parsed song
      cacheSizes.html * 0.1 + // ~0.1MB per HTML render
      cacheSizes.styled * 0.05 // ~0.05MB per styled output
    );
    
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: (cacheMetrics.songHitRate + cacheMetrics.htmlHitRate + cacheMetrics.styledHitRate) / 3,
      songCacheHitRate: cacheMetrics.songHitRate,
      htmlCacheHitRate: cacheMetrics.htmlHitRate,
      styledCacheHitRate: cacheMetrics.styledHitRate,
      estimatedMemoryUsage: estimatedMemory,
      cacheSizes
    }));
    
    return { cacheMetrics, cacheSizes, estimatedMemory };
  }, []);

  /**
   * Calculate performance score (0-100)
   */
  const calculatePerformanceScore = useCallback(() => {
    let score = 100;
    
    // Penalize slow renders
    if (metrics.averageRenderTime > (thresholds.maxRenderTime || 100)) {
      score -= 20;
    } else if (metrics.averageRenderTime > (thresholds.maxRenderTime || 100) * 0.75) {
      score -= 10;
    }
    
    // Penalize low cache hit rate
    if (metrics.cacheHitRate < (thresholds.targetCacheHitRate || 0.8)) {
      score -= 15;
    } else if (metrics.cacheHitRate < (thresholds.targetCacheHitRate || 0.8) * 0.9) {
      score -= 5;
    }
    
    // Penalize high memory usage
    if (metrics.estimatedMemoryUsage > (thresholds.maxMemoryUsage || 50)) {
      score -= 10;
    }
    
    // Penalize slow frame rate
    const avgFPS = frameTimings.current.reduce((a, b) => a + b, 0) / (frameTimings.current.length || 1);
    if (avgFPS < (thresholds.targetFPS || 60) * 0.9) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }, [metrics, thresholds]);

  /**
   * Generate performance optimization suggestions
   */
  const generateSuggestions = useCallback(() => {
    const newSuggestions: string[] = [];
    
    // Check render performance
    if (metrics.averageRenderTime > (thresholds.maxRenderTime || 100)) {
      newSuggestions.push('Consider enabling virtual scrolling for long songs');
      newSuggestions.push('Reduce the complexity of chord sheets or split into sections');
    }
    
    // Check cache performance
    if (metrics.cacheHitRate < (thresholds.targetCacheHitRate || 0.8)) {
      if (metrics.songCacheHitRate < 0.7) {
        newSuggestions.push('Song parsing cache hit rate is low - consider pre-parsing common songs');
      }
      if (metrics.htmlCacheHitRate < 0.7) {
        newSuggestions.push('HTML cache hit rate is low - avoid unnecessary re-renders');
      }
      if (metrics.styledCacheHitRate < 0.7) {
        newSuggestions.push('Styled cache hit rate is low - minimize preference changes');
      }
    }
    
    // Check memory usage
    if (metrics.estimatedMemoryUsage > (thresholds.maxMemoryUsage || 50)) {
      newSuggestions.push('High memory usage detected - consider clearing cache periodically');
      newSuggestions.push('Reduce cache sizes or implement more aggressive eviction');
    }
    
    // Check frame rate
    const avgFPS = frameTimings.current.reduce((a, b) => a + b, 0) / (frameTimings.current.length || 1);
    if (avgFPS < (thresholds.targetFPS || 60) * 0.9) {
      newSuggestions.push('Frame drops detected - enable virtual scrolling');
      newSuggestions.push('Reduce DOM complexity or use CSS transforms for animations');
    }
    
    setSuggestions(newSuggestions);
    return newSuggestions;
  }, [metrics, thresholds]);

  /**
   * Start performance monitoring
   */
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  /**
   * Stop performance monitoring
   */
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  /**
   * Reset all metrics
   */
  const resetMetrics = useCallback(() => {
    renderTimings.current = [];
    frameTimings.current = [];
    performanceMonitor.current.clear();
    
    setMetrics({
      lastRenderTime: 0,
      averageRenderTime: 0,
      renderCount: 0,
      slowRenderCount: 0,
      cacheHitRate: 0,
      songCacheHitRate: 0,
      htmlCacheHitRate: 0,
      styledCacheHitRate: 0,
      estimatedMemoryUsage: 0,
      cacheSizes: { song: 0, html: 0, styled: 0, total: 0 },
      performanceScore: 100
    });
    
    setSuggestions([]);
  }, []);

  /**
   * Export performance report
   */
  const exportReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      suggestions,
      thresholds,
      details: {
        renderTimings: renderTimings.current,
        frameTimings: frameTimings.current,
        performanceStats: performanceMonitor.current.getStats('render-complete')
      }
    };
    
    return report;
  }, [metrics, suggestions, thresholds]);

  /**
   * Automatic monitoring interval
   */
  useEffect(() => {
    if (!isMonitoring) return;
    
    const interval = setInterval(() => {
      collectCacheMetrics();
      const score = calculatePerformanceScore();
      setMetrics(prev => ({ ...prev, performanceScore: score }));
      generateSuggestions();
    }, monitorInterval);
    
    return () => clearInterval(interval);
  }, [isMonitoring, monitorInterval, collectCacheMetrics, calculatePerformanceScore, generateSuggestions]);

  /**
   * Track scroll performance
   */
  useEffect(() => {
    if (!isMonitoring) return;
    
    let rafId: number;
    const trackScroll = () => {
      trackFrameRate();
      rafId = requestAnimationFrame(trackScroll);
    };
    
    const handleScrollStart = () => {
      rafId = requestAnimationFrame(trackScroll);
    };
    
    const handleScrollEnd = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
    
    window.addEventListener('scroll', handleScrollStart, { passive: true });
    window.addEventListener('scrollend', handleScrollEnd, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScrollStart);
      window.removeEventListener('scrollend', handleScrollEnd);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isMonitoring, trackFrameRate]);

  /**
   * Log performance stats in development
   */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && enableWarnings) {
      const logInterval = setInterval(() => {
        console.group('ChordSheet Performance');
        console.log('Score:', metrics.performanceScore);
        console.log('Avg Render:', metrics.averageRenderTime.toFixed(2) + 'ms');
        console.log('Cache Hit Rate:', (metrics.cacheHitRate * 100).toFixed(1) + '%');
        console.log('Memory:', metrics.estimatedMemoryUsage.toFixed(1) + 'MB');
        if (suggestions.length > 0) {
          console.log('Suggestions:', suggestions);
        }
        console.groupEnd();
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(logInterval);
    }
  }, [metrics, suggestions, enableWarnings]);

  return {
    metrics,
    suggestions,
    isMonitoring,
    onRenderCallback,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    exportReport,
    performanceScore: metrics.performanceScore
  };
}

/**
 * HOC to wrap components with performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentId: string
) {
  return React.forwardRef<unknown, P>((props, ref) => {
    const { onRenderCallback } = useChordPerformance();
    
    return (
      <React.Profiler id={componentId} onRender={onRenderCallback}>
        <Component {...(props as P)} ref={ref} />
      </React.Profiler>
    );
  });
}