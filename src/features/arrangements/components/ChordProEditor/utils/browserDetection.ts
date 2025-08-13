/**
 * Browser-specific styles and workarounds for text rendering
 * Different browsers handle text-rendering properties differently
 */
export const getBrowserSpecificStyles = () => {
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const isWebKit = 'webkitRequestAnimationFrame' in window;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (isFirefox) {
    // Firefox handles text-rendering differently
    // Using 'auto' instead of 'geometricPrecision' for better compatibility
    // Also disable ligatures to prevent alignment issues
    return {
      textRendering: 'auto',
      MozOsxFontSmoothing: 'auto',
      fontVariantLigatures: 'none',
      fontFeatureSettings: '"liga" 0, "clig" 0'
    };
  }
  
  if (isSafari) {
    // Safari-specific optimizations
    return {
      textRendering: 'geometricPrecision',
      WebkitFontSmoothing: 'subpixel-antialiased',
      transform: 'translateZ(0)', // Force GPU acceleration
      willChange: 'transform'
    };
  }
  
  if (isWebKit) {
    // Chrome and other WebKit browsers
    // geometricPrecision provides the most accurate text rendering
    return {
      textRendering: 'geometricPrecision',
      WebkitFontSmoothing: 'subpixel-antialiased',
      fontVariantLigatures: 'none'
    };
  }
  
  // Default for other browsers
  return {
    textRendering: 'auto',
    fontVariantLigatures: 'none'
  };
};

/**
 * Detect if the browser supports certain features
 */
export const browserFeatures = {
  hasRAF: typeof window !== 'undefined' && 'requestAnimationFrame' in window,
  hasResizeObserver: typeof window !== 'undefined' && 'ResizeObserver' in window,
  hasVisualViewport: typeof window !== 'undefined' && 'visualViewport' in window,
  isTouch: typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
};

/**
 * Get browser name for debugging
 */
export const getBrowserName = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
  if (userAgent.includes('chrome')) return 'chrome';
  if (userAgent.includes('edge')) return 'edge';
  
  return 'unknown';
};