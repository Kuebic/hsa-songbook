/**
 * @file VirtualChordScroller.tsx
 * @description Virtual scrolling component for long chord sheets
 * Optimizes performance by only rendering visible sections
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { VirtualScroller } from '../components/ChordProEditor/utils/performance';
import { useUnifiedChordRenderer } from '../hooks/useUnifiedChordRenderer';
import { useResponsiveLayout } from '../components/ChordProEditor/hooks/useResponsiveLayout';
import * as ChordSheetJS from 'chordsheetjs';

export interface ChordSection {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'custom';
  label?: string;
  content: string;
  estimatedHeight?: number;
}

interface VirtualChordScrollerProps {
  /** Array of chord sections to render */
  sections: ChordSection[];
  /** Container height in pixels */
  containerHeight?: number;
  /** Estimated height of each section */
  estimatedSectionHeight?: number;
  /** Number of sections to render outside viewport */
  overscan?: number;
  /** Context for rendering */
  context?: 'preview' | 'viewer' | 'stage';
  /** Custom class name */
  className?: string;
  /** Callback when scrolling */
  onScroll?: (scrollTop: number) => void;
}

/**
 * Virtual scrolling component for efficient rendering of long chord sheets
 * Only renders visible sections plus overscan buffer
 */
export const VirtualChordScroller: React.FC<VirtualChordScrollerProps> = ({
  sections,
  containerHeight,
  estimatedSectionHeight = 150,
  overscan = 3,
  // context = 'viewer', // Currently unused
  className = '',
  onScroll
}) => {
  // Hooks
  const { renderChordSheet, preferences } = useUnifiedChordRenderer();
  const { isMobile, viewportHeight } = useResponsiveLayout();
  
  // State
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [sectionHeights, setSectionHeights] = useState<Map<string, number>>(new Map());
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const virtualScrollerRef = useRef<VirtualScroller | null>(null);

  // Calculate actual container height
  const actualContainerHeight = useMemo(() => {
    if (containerHeight) return containerHeight;
    if (isMobile) return viewportHeight - 100; // Account for mobile UI
    return 600; // Default height
  }, [containerHeight, isMobile, viewportHeight]);

  /**
   * Initialize virtual scroller
   */
  useEffect(() => {
    virtualScrollerRef.current = new VirtualScroller(
      estimatedSectionHeight,
      actualContainerHeight,
      sections.length,
      overscan
    );
    
    // Calculate initial visible range
    const range = virtualScrollerRef.current.getVisibleRange(0);
    setVisibleRange(range);
  }, [sections.length, estimatedSectionHeight, actualContainerHeight, overscan]);

  /**
   * Handle scroll events with throttling
   */
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !virtualScrollerRef.current) return;
    
    const newScrollTop = scrollRef.current.scrollTop;
    setScrollTop(newScrollTop);
    
    // Calculate new visible range
    const range = virtualScrollerRef.current.getVisibleRange(newScrollTop);
    setVisibleRange(range);
    
    // Notify parent
    onScroll?.(newScrollTop);
  }, [onScroll]);

  /**
   * Measure section heights after render
   */
  useEffect(() => {
    const measuredHeights = new Map<string, number>();
    
    measureRefs.current.forEach((element, id) => {
      if (element) {
        const height = element.getBoundingClientRect().height;
        measuredHeights.set(id, height);
      }
    });
    
    setSectionHeights(measuredHeights);
  }, [visibleRange]);

  /**
   * Calculate total height based on measured or estimated heights
   */
  const totalHeight = useMemo(() => {
    let height = 0;
    sections.forEach(section => {
      const measuredHeight = sectionHeights.get(section.id);
      height += measuredHeight || section.estimatedHeight || estimatedSectionHeight;
    });
    return height;
  }, [sections, sectionHeights, estimatedSectionHeight]);

  /**
   * Calculate offset for visible sections
   */
  const visibleSectionOffset = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < visibleRange.start; i++) {
      const section = sections[i];
      if (section) {
        const height = sectionHeights.get(section.id) || section.estimatedHeight || estimatedSectionHeight;
        offset += height;
      }
    }
    return offset;
  }, [visibleRange.start, sections, sectionHeights, estimatedSectionHeight]);

  /**
   * Render a single section
   */
  const renderSection = useCallback((section: ChordSection, index: number) => {
    // Create ChordPro content for the section
    let chordProContent = '';
    
    // Add section directive
    if (section.type !== 'custom') {
      chordProContent += `{start_of_${section.type}}\n`;
      if (section.label) {
        chordProContent += `{comment: ${section.label}}\n`;
      }
    }
    
    chordProContent += section.content;
    
    if (section.type !== 'custom') {
      chordProContent += `\n{end_of_${section.type}}`;
    }
    
    // Render the section
    const html = renderChordSheet(chordProContent, {
      fontSize: preferences.fontSize,
      showDiagrams: false // Disable diagrams in virtual scroll for performance
    });
    
    return (
      <div
        key={section.id}
        ref={el => {
          if (el) measureRefs.current.set(section.id, el);
        }}
        className={`virtual-section section-${section.type}`}
        data-section-id={section.id}
        data-section-index={index}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }, [renderChordSheet, preferences.fontSize]);

  /**
   * Get visible sections to render
   */
  const visibleSections = useMemo(() => {
    return sections.slice(visibleRange.start, visibleRange.end);
  }, [sections, visibleRange]);

  /**
   * Container styles
   */
  const containerStyles = useMemo(() => ({
    height: `${actualContainerHeight}px`,
    overflow: 'auto',
    position: 'relative' as const
  }), [actualContainerHeight]);

  /**
   * Viewport styles
   */
  const viewportStyles = useMemo(() => ({
    height: `${totalHeight}px`,
    position: 'relative' as const
  }), [totalHeight]);

  /**
   * Content styles
   */
  const contentStyles = useMemo(() => ({
    transform: `translateY(${visibleSectionOffset}px)`,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0
  }), [visibleSectionOffset]);

  return (
    <div
      ref={containerRef}
      className={`virtual-chord-scroller ${className}`}
      style={containerStyles}
    >
      <div
        ref={scrollRef}
        className="virtual-scroll-container"
        style={containerStyles}
        onScroll={handleScroll}
      >
        <div className="virtual-viewport" style={viewportStyles}>
          <div className="virtual-content" style={contentStyles}>
            {visibleSections.map((section, index) => 
              renderSection(section, visibleRange.start + index)
            )}
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      {sections.length > 20 && (
        <div className="scroll-indicator">
          <div 
            className="scroll-thumb"
            style={{
              height: `${(actualContainerHeight / totalHeight) * 100}%`,
              top: `${(scrollTop / totalHeight) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Helper function to parse ChordPro content into sections
 */
export function parseChordProIntoSections(content: string): ChordSection[] {
  try {
    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(content);
    const sections: ChordSection[] = [];
    
    let currentSection: ChordSection | null = null;
    let sectionContent: string[] = [];
    let sectionIndex = 0;
    
    song.lines.forEach((line: ChordSheetJS.Line) => {
      // Check for section markers
      const lineText = line.items?.map(item => {
        if ('lyrics' in item) return item.lyrics;
        return '';
      }).join('').trim();
      
      // Simple section detection based on directives
      if (lineText.includes('{start_of_verse}') || lineText.includes('{sov}')) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = sectionContent.join('\n');
          sections.push(currentSection);
        }
        
        currentSection = {
          id: `verse-${sectionIndex++}`,
          type: 'verse',
          label: `Verse ${sectionIndex}`,
          content: ''
        };
        sectionContent = [];
      } else if (lineText.includes('{start_of_chorus}') || lineText.includes('{soc}')) {
        if (currentSection) {
          currentSection.content = sectionContent.join('\n');
          sections.push(currentSection);
        }
        
        currentSection = {
          id: `chorus-${sectionIndex++}`,
          type: 'chorus',
          label: 'Chorus',
          content: ''
        };
        sectionContent = [];
      } else if (lineText.includes('{start_of_bridge}') || lineText.includes('{sob}')) {
        if (currentSection) {
          currentSection.content = sectionContent.join('\n');
          sections.push(currentSection);
        }
        
        currentSection = {
          id: `bridge-${sectionIndex++}`,
          type: 'bridge',
          label: 'Bridge',
          content: ''
        };
        sectionContent = [];
      } else {
        // Add line to current section
        const lineContent = line.items?.map(item => {
          if ('chords' in item && 'lyrics' in item) {
            return `[${item.chords}]${item.lyrics}`;
          }
          if ('lyrics' in item) return item.lyrics;
          return '';
        }).join('');
        
        if (lineContent) {
          sectionContent.push(lineContent);
        }
      }
    });
    
    // Save last section
    if (currentSection) {
      (currentSection as ChordSection).content = sectionContent.join('\n');
      sections.push(currentSection);
    }
    
    // If no sections were detected, treat entire content as one section
    if (sections.length === 0) {
      sections.push({
        id: 'full-song',
        type: 'custom',
        content: content
      });
    }
    
    return sections;
  } catch (error) {
    console.error('Error parsing ChordPro into sections:', error);
    // Fallback: return entire content as single section
    return [{
      id: 'full-song',
      type: 'custom',
      content: content
    }];
  }
}

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