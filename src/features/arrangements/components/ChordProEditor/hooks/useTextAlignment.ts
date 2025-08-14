import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Hook to manage perfect text alignment between textarea and syntax highlighter
 * Handles scroll synchronization and dimension matching
 */
export const useTextAlignment = (
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  highlightRef: RefObject<HTMLDivElement | null>
) => {
  // Synchronize scroll positions with requestAnimationFrame for smooth performance
  const syncScroll = useCallback(() => {
    if (!textareaRef.current || !highlightRef.current) return;
    
    const { scrollTop, scrollLeft } = textareaRef.current;
    
    // Use requestAnimationFrame for smooth 60fps scrolling
    requestAnimationFrame(() => {
      if (highlightRef.current) {
        highlightRef.current.scrollTop = scrollTop;
        highlightRef.current.scrollLeft = scrollLeft;
      }
    });
  }, [textareaRef, highlightRef]);

  // Alternative transform-based sync for better performance on mobile
  const syncScrollTransform = useCallback(() => {
    if (!textareaRef.current || !highlightRef.current) return;
    
    const { scrollTop, scrollLeft } = textareaRef.current;
    
    requestAnimationFrame(() => {
      if (highlightRef.current) {
        // Use transform for GPU acceleration
        highlightRef.current.style.transform = 
          `translate(-${scrollLeft}px, -${scrollTop}px)`;
      }
    });
  }, [textareaRef, highlightRef]);

  // Synchronize dimensions on resize
  useEffect(() => {
    if (!textareaRef.current || !highlightRef.current) return;
    
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    
    // ResizeObserver to track dimension changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === textarea) {
          const { width, height } = entry.contentRect;
          
          // Apply same dimensions to highlight layer
          requestAnimationFrame(() => {
            if (highlight) {
              highlight.style.width = `${width}px`;
              highlight.style.height = `${height}px`;
            }
          });
        }
      }
    });
    
    resizeObserver.observe(textarea);
    
    // Initial dimension sync
    const rect = textarea.getBoundingClientRect();
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [textareaRef, highlightRef]);

  // Synchronize computed styles to ensure identical rendering
  useEffect(() => {
    if (!textareaRef.current || !highlightRef.current) return;
    
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    
    // Get computed styles from textarea
    const textareaStyles = window.getComputedStyle(textarea);
    
    // Critical properties that must match
    const propertiesToSync = [
      'fontFamily',
      'fontSize',
      'lineHeight',
      'letterSpacing',
      'wordSpacing',
      'padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'borderWidth',
      'borderStyle',
      'boxSizing',
    ];
    
    // Apply same styles to highlight layer
    propertiesToSync.forEach(property => {
      const value = textareaStyles.getPropertyValue(
        property.replace(/([A-Z])/g, '-$1').toLowerCase()
      );
      if (value) {
        (highlight.style as CSSStyleDeclaration & Record<string, string>)[property] = value;
      }
    });
  }, [textareaRef, highlightRef]);

  // Handle font loading to re-sync after fonts are loaded
  useEffect(() => {
    if (!document.fonts) return;
    
    const handleFontLoad = () => {
      // Re-sync dimensions after font load
      if (textareaRef.current && highlightRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        highlightRef.current.style.width = `${rect.width}px`;
        highlightRef.current.style.height = `${rect.height}px`;
      }
    };
    
    document.fonts.ready.then(handleFontLoad);
    
    // Also listen for font load events
    document.fonts.addEventListener('loadingdone', handleFontLoad);
    
    return () => {
      document.fonts.removeEventListener('loadingdone', handleFontLoad);
    };
  }, [textareaRef, highlightRef]);

  // Detect if transform-based scrolling should be used (better for mobile)
  const shouldUseTransform = () => {
    // Use transform on mobile devices for better performance
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  return {
    syncScroll: shouldUseTransform() ? syncScrollTransform : syncScroll,
    syncScrollDirect: syncScroll,
    syncScrollTransform,
  };
};