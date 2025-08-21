/**
 * @file useVirtualChordScroller.ts
 * @description Hook for using virtual scrolling with ChordPro content
 */

import { useMemo } from 'react';
import { parseChordProIntoSections } from '../components/VirtualChordScroller.utils';

/**
 * Hook to use virtual scrolling with ChordPro content
 */
export function useVirtualChordScroller(
  content: string,
  options?: {
    containerHeight?: number;
    estimatedSectionHeight?: number;
    overscan?: number;
  }
) {
  const sections = useMemo(() => parseChordProIntoSections(content), [content]);
  
  return {
    sections,
    containerHeight: options?.containerHeight,
    estimatedSectionHeight: options?.estimatedSectionHeight,
    overscan: options?.overscan
  };
}