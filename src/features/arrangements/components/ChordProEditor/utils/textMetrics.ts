/**
 * Standardized font definitions for perfect text alignment
 * between textarea and syntax highlighter layers
 */

export const EDITOR_FONT_STACK = "'Courier New', Courier, monospace" as const;
export const EDITOR_FONT_SIZE = 16;
export const EDITOR_LINE_HEIGHT = 1.5;
export const EDITOR_TAB_SIZE = 4;
export const EDITOR_PADDING = 16;

/**
 * Get standardized editor font styles for consistent rendering
 * across textarea and syntax highlighter layers
 */
export const getEditorFontStyle = () => ({
  fontFamily: EDITOR_FONT_STACK,
  fontSize: `${EDITOR_FONT_SIZE}px`,
  lineHeight: EDITOR_LINE_HEIGHT,
  letterSpacing: 'normal',
  wordSpacing: 'normal',
  tabSize: EDITOR_TAB_SIZE,
  // Text rendering optimization for perfect alignment
  textRendering: 'geometricPrecision' as const,
  fontFeatureSettings: '"liga" 0, "clig" 0',
  fontVariantLigatures: 'none',
  WebkitFontSmoothing: 'subpixel-antialiased' as const,
  MozOsxFontSmoothing: 'auto' as const,
} as const);

/**
 * Get CSS properties for editor layers
 */
export const getEditorLayerStyles = () => ({
  // Typography - must match exactly
  ...getEditorFontStyle(),
  
  // Box model - must be identical
  padding: `${EDITOR_PADDING}px`,
  margin: 0,
  border: '1px solid transparent',
  boxSizing: 'border-box' as const,
  
  // Text behavior
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
  textAlign: 'left' as const,
  
  // Prevent sub-pixel issues
  transform: 'translateZ(0)',
  willChange: 'transform',
  contain: 'layout style',
} as const);

/**
 * Detect browser-specific rendering optimizations
 */
export const getBrowserOptimizations = () => {
  const isWebKit = 'webkitRequestAnimationFrame' in window;
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  return {
    textRendering: isWebKit ? 'geometricPrecision' : 'auto',
    // Safari-specific fixes for font rendering
    WebkitFontSmoothing: isSafari ? 'antialiased' : 'subpixel-antialiased',
    // Firefox handles geometricPrecision as optimizeLegibility
    MozTextSizeAdjust: isFirefox ? '100%' : 'none',
  };
};

/**
 * Calculate precise text metrics for alignment
 */
export const measureText = (
  text: string,
  container?: HTMLElement
): { width: number; height: number } => {
  const measureSpan = document.createElement('span');
  Object.assign(measureSpan.style, {
    ...getEditorFontStyle(),
    position: 'absolute',
    visibility: 'hidden',
    whiteSpace: 'pre',
    pointerEvents: 'none',
  });
  
  measureSpan.textContent = text;
  const parent = container || document.body;
  parent.appendChild(measureSpan);
  
  const rect = measureSpan.getBoundingClientRect();
  parent.removeChild(measureSpan);
  
  return {
    width: rect.width,
    height: rect.height,
  };
};

/**
 * Get responsive font size based on viewport
 */
export const getResponsiveFontSize = (viewportWidth: number): number => {
  // Mobile: 16px (prevents iOS zoom)
  if (viewportWidth < 768) return 16;
  // Tablet: 18px
  if (viewportWidth < 1024) return 18;
  // Desktop: 20px
  return 20;
};