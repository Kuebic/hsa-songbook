/**
 * @file ResponsiveChordSheet.tsx
 * @description Responsive chord sheet component with mobile optimization
 * Includes touch gestures, dynamic font sizing, and viewport detection
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useUnifiedChordRenderer } from '../hooks/useUnifiedChordRenderer';
import { useResponsiveLayout, useIsTouchDevice } from '../components/ChordProEditor/hooks/useResponsiveLayout';
// import { chordPreferencesService } from '../services/chordPreferencesService'; // Not used
import { PerformanceMonitor } from '../components/ChordProEditor/utils/performance';
// import type { ChordDisplayPreferences } from '../types/preferences.types'; // Not used

export interface ChordInteractionEvent {
  type: 'chord-click' | 'section-jump' | 'transpose' | 'zoom';
  data?: unknown;
}

export interface ResponsiveChordSheetProps {
  /** ChordPro content to render */
  content: string;
  /** Rendering context */
  context: 'preview' | 'viewer' | 'stage' | 'print';
  /** Initial transposition value */
  initialTranspose?: number;
  /** Callback for chord interactions */
  onInteraction?: (event: ChordInteractionEvent) => void;
  /** Custom CSS class name */
  className?: string;
  /** Enable virtual scrolling for long songs */
  enableVirtualScroll?: boolean;
}

/**
 * Responsive chord sheet component optimized for all device sizes
 * Implements mobile-first design with touch gesture support
 */
export const ResponsiveChordSheet: React.FC<ResponsiveChordSheetProps> = ({
  content,
  context,
  initialTranspose = 0,
  onInteraction,
  className = '',
  enableVirtualScroll = false
}) => {
  // Hooks
  const { renderChordSheet, preferences, updatePreferences } = useUnifiedChordRenderer();
  const { isMobile, isTablet, viewportWidth, deviceType } = useResponsiveLayout();
  const isTouch = useIsTouchDevice();
  
  // State
  const [transpose, setTranspose] = useState(initialTranspose);
  const [fontSize, setFontSize] = useState(preferences.fontSize);
  const [isPinching, setIsPinching] = useState(false);
  const [baseDistance, setBaseDistance] = useState(0);
  const [baseFontSize, setBaseFontSize] = useState(preferences.fontSize);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const performanceMonitor = useMemo(() => new PerformanceMonitor(), []);

  /**
   * Calculate optimal font size based on viewport
   */
  const optimalFontSize = useMemo(() => {
    if (context === 'stage') {
      // Larger font for stage mode
      return isMobile ? 20 : 24;
    }
    
    if (isMobile) {
      // Dynamic sizing for mobile based on viewport width
      // Ensures text is readable without horizontal scroll
      const baseFontSize = Math.max(14, Math.min(18, viewportWidth / 30));
      return Math.round(baseFontSize);
    }
    
    if (isTablet) {
      return 16;
    }
    
    return preferences.fontSize;
  }, [isMobile, isTablet, viewportWidth, preferences.fontSize, context]);

  /**
   * Handle pinch-to-zoom gestures
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setBaseDistance(distance);
      setBaseFontSize(fontSize);
    }
  }, [fontSize]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPinching && e.touches.length === 2) {
      e.preventDefault(); // Prevent default zoom
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scale = distance / baseDistance;
      const newFontSize = Math.round(baseFontSize * scale);
      const clampedSize = Math.max(12, Math.min(30, newFontSize));
      
      setFontSize(clampedSize);
      
      // Notify parent of zoom interaction
      onInteraction?.({
        type: 'zoom',
        data: { fontSize: clampedSize }
      });
    }
  }, [isPinching, baseDistance, baseFontSize, onInteraction]);

  const handleTouchEnd = useCallback(() => {
    if (isPinching) {
      setIsPinching(false);
      // Persist the new font size preference
      updatePreferences({ fontSize });
    }
  }, [isPinching, fontSize, updatePreferences]);

  /**
   * Handle transposition with keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (context !== 'viewer' && context !== 'stage') return;
      
      // Transpose up with + or =
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setTranspose(prev => {
          const newValue = Math.min(11, prev + 1);
          onInteraction?.({
            type: 'transpose',
            data: { transpose: newValue }
          });
          return newValue;
        });
      }
      
      // Transpose down with -
      if (e.key === '-') {
        e.preventDefault();
        setTranspose(prev => {
          const newValue = Math.max(-11, prev - 1);
          onInteraction?.({
            type: 'transpose',
            data: { transpose: newValue }
          });
          return newValue;
        });
      }
      
      // Reset transposition with 0
      if (e.key === '0') {
        e.preventDefault();
        setTranspose(0);
        onInteraction?.({
          type: 'transpose',
          data: { transpose: 0 }
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [context, onInteraction]);

  /**
   * Initialize font size on mount and preference changes
   */
  useEffect(() => {
    setFontSize(optimalFontSize);
  }, [optimalFontSize]);

  /**
   * Render the chord sheet with optimizations
   */
  const renderedContent = useMemo(() => {
    performanceMonitor.mark('responsive-render-start');
    
    const html = renderChordSheet(content, {
      fontSize,
      transpose,
      showDiagrams: context === 'viewer' && preferences.showChordDiagrams
    });
    
    performanceMonitor.mark('responsive-render-end');
    performanceMonitor.measure('responsive-render', 'responsive-render-start', 'responsive-render-end');
    
    return html;
  }, [content, fontSize, transpose, context, preferences.showChordDiagrams, renderChordSheet, performanceMonitor]);

  /**
   * Calculate container styles
   */
  const containerStyles = useMemo((): React.CSSProperties => ({
    fontSize: `${fontSize}px`,
    touchAction: isPinching ? 'none' : 'pan-y pinch-zoom',
    WebkitUserSelect: context === 'stage' ? 'none' : 'text',
    userSelect: context === 'stage' ? 'none' : 'text',
    // Optimize for mobile viewport
    maxWidth: isMobile ? '100vw' : undefined,
    overflowX: isMobile ? 'hidden' : 'auto',
    // Stage mode specific styles
    ...(context === 'stage' && {
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '2rem',
      minHeight: '100vh'
    }),
    // Print mode specific styles
    ...(context === 'print' && {
      fontSize: '10pt',
      lineHeight: '1.2',
      pageBreakInside: 'avoid' as const
    })
  }), [fontSize, isPinching, context, isMobile]);

  /**
   * Generate container class names
   */
  const containerClassName = useMemo(() => {
    const classes = [
      'responsive-chord-sheet',
      `context-${context}`,
      `device-${deviceType}`,
      className
    ];
    
    if (isMobile) classes.push('mobile-view');
    if (isTablet) classes.push('tablet-view');
    if (isTouch) classes.push('touch-enabled');
    if (context === 'stage') classes.push('stage-mode');
    if (enableVirtualScroll) classes.push('virtual-scroll-enabled');
    
    return classes.filter(Boolean).join(' ');
  }, [context, deviceType, className, isMobile, isTablet, isTouch, enableVirtualScroll]);

  /**
   * Handle chord clicks for interaction
   */
  const handleChordClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('chord')) {
      const chordText = target.textContent || '';
      onInteraction?.({
        type: 'chord-click',
        data: { chord: chordText }
      });
    }
  }, [onInteraction]);

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      style={containerStyles}
      onTouchStart={isTouch ? handleTouchStart : undefined}
      onTouchMove={isTouch ? handleTouchMove : undefined}
      onTouchEnd={isTouch ? handleTouchEnd : undefined}
      onClick={handleChordClick}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

/**
 * Memoized version of ResponsiveChordSheet
 * Use when parent component re-renders frequently
 */
export const MemoizedResponsiveChordSheet = React.memo(ResponsiveChordSheet);