/**
 * @file VirtualChordScroller.index.ts
 * @description Exports for VirtualChordScroller and related utilities
 */

export { VirtualChordScroller } from './VirtualChordScroller';
export type { ChordSection } from './VirtualChordScroller';
export { parseChordProIntoSections, sectionsToChordPro } from './VirtualChordScroller.utils';
export { useVirtualChordScroller } from '../hooks/useVirtualChordScroller';