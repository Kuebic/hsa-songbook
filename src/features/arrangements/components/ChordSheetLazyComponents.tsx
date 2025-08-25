/**
 * @file ChordSheetLazyComponents.tsx
 * @description React components for lazy loading ChordSheetJS features
 */

import React, { lazy, useState, useEffect } from 'react';
import {
  loadChordSheetJS,
  isChordSheetJSLoaded
} from '../utils/chordSheetLazyLoader';

/**
 * React component for lazy loading ChordSheetJS features
 * Wraps children and only renders when ChordSheetJS is loaded
 */
export const LazyChordSheetProvider: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <div>Loading chord sheet...</div> }) => {
  const [isLoaded, setIsLoaded] = useState(isChordSheetJSLoaded());

  useEffect(() => {
    if (!isLoaded) {
      loadChordSheetJS().then(() => {
        setIsLoaded(true);
      });
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Hook moved to ../hooks/useChordSheetJS.ts

/**
 * Lazy load specific ChordSheetJS components
 * Use these for code splitting at the component level
 */
export const LazyChordProEditor = lazy(() => 
  import('./ChordProEditor').then(module => ({
    default: module.ChordProEditor
  }))
);

export const LazyChordSheetViewer = lazy(() => 
  import('./ChordSheetViewer').then(module => ({
    default: module.ChordSheetViewer
  }))
);

export const LazyResponsiveChordSheet = lazy(() => 
  import('./ResponsiveChordSheet').then(module => ({
    default: module.ResponsiveChordSheet
  }))
);

export const LazyVirtualChordScroller = lazy(() => 
  import('./VirtualChordScroller').then(module => ({
    default: module.VirtualChordScroller
  }))
);