import { useState, useEffect } from 'react';

interface VirtualKeyboardState {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  viewportHeight: number;
  availableHeight: number;
}

/**
 * Hook to detect virtual keyboard presence and height on mobile devices
 * Uses the Visual Viewport API for accurate detection
 */
export const useVirtualKeyboard = (): VirtualKeyboardState => {
  const [state, setState] = useState<VirtualKeyboardState>({
    keyboardHeight: 0,
    isKeyboardVisible: false,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    availableHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Check if Visual Viewport API is available
    const visualViewport = (window as any).visualViewport;
    
    if (!visualViewport) {
      // Fallback for browsers without Visual Viewport API
      const handleResize = () => {
        const currentHeight = window.innerHeight;
        const originalHeight = window.screen.height;
        const keyboardHeight = Math.max(0, originalHeight - currentHeight);
        
        setState({
          keyboardHeight,
          isKeyboardVisible: keyboardHeight > 100, // Threshold to detect keyboard
          viewportHeight: currentHeight,
          availableHeight: currentHeight,
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    // Use Visual Viewport API for accurate detection
    const viewport = visualViewport;
    
    const handleViewportChange = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight);
      
      // Consider keyboard visible if it takes more than 50px
      const isKeyboardVisible = keyboardHeight > 50;
      
      setState({
        keyboardHeight,
        isKeyboardVisible,
        viewportHeight,
        availableHeight: viewportHeight - (isKeyboardVisible ? 0 : keyboardHeight),
      });

      // Update CSS custom property for use in stylesheets
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${keyboardHeight}px`
      );
      
      // Add data attribute for CSS targeting
      document.documentElement.dataset.keyboardVisible = String(isKeyboardVisible);
    };

    // Listen to both resize and scroll events for better detection
    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);
    
    // Also listen to window resize for orientation changes
    window.addEventListener('resize', handleViewportChange);
    
    // Initial check
    handleViewportChange();
    
    // Cleanup
    return () => {
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
      
      // Reset CSS custom property
      document.documentElement.style.removeProperty('--keyboard-height');
      delete document.documentElement.dataset.keyboardVisible;
    };
  }, []);

  return state;
};

/**
 * Hook to handle input focus management with virtual keyboard
 * Ensures input remains visible when keyboard appears
 */
export const useKeyboardScroll = (
  inputRef: React.RefObject<HTMLElement>,
  containerRef?: React.RefObject<HTMLElement>
) => {
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();

  useEffect(() => {
    if (!isKeyboardVisible || !inputRef.current) return;

    // Scroll input into view when keyboard appears
    const scrollIntoView = () => {
      if (!inputRef.current) return;
      
      const container = containerRef?.current || document.documentElement;
      const inputRect = inputRef.current.getBoundingClientRect();
      
      // Calculate if input is hidden by keyboard
      const inputBottom = inputRect.bottom;
      const visibleBottom = window.innerHeight - keyboardHeight;
      
      if (inputBottom > visibleBottom) {
        // Scroll to make input visible above keyboard
        const scrollAmount = inputBottom - visibleBottom + 20; // 20px padding
        
        if (container === document.documentElement) {
          window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth',
          });
        } else {
          container.scrollTop += scrollAmount;
        }
      }
    };

    // Delay to ensure keyboard animation completes
    const timeoutId = setTimeout(scrollIntoView, 300);
    
    return () => clearTimeout(timeoutId);
  }, [isKeyboardVisible, keyboardHeight, inputRef, containerRef]);
};

/**
 * Hook to detect if the device has a physical keyboard
 * Useful for determining if autocomplete should be enabled
 */
export const useHasPhysicalKeyboard = (): boolean => {
  const [hasPhysicalKeyboard, setHasPhysicalKeyboard] = useState(false);

  useEffect(() => {
    // Check if device is likely to have a physical keyboard
    const checkKeyboard = () => {
      // Desktop devices likely have physical keyboards
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      
      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0;
      
      // If desktop without touch, likely has physical keyboard
      // If mobile/tablet, likely uses virtual keyboard
      setHasPhysicalKeyboard(isDesktop && !hasTouch);
    };

    checkKeyboard();
    
    // Re-check on resize (device orientation change)
    window.addEventListener('resize', checkKeyboard);
    
    return () => window.removeEventListener('resize', checkKeyboard);
  }, []);

  return hasPhysicalKeyboard;
};