/**
 * @file useSyntaxHighlight.ts
 * @description Hook for parsing ChordPro content and generating syntax highlighting
 */

import { useMemo } from 'react';

export interface HighlightedSegment {
  text: string;
  type: 'text' | 'chord' | 'directive' | 'comment' | 'section' | 'tab';
  className: string;
  style?: React.CSSProperties;
}

export const useSyntaxHighlight = (content: string, theme: 'light' | 'dark' | 'stage' = 'light'): HighlightedSegment[] => {
  return useMemo(() => {
    if (!content) return [];

    const segments: HighlightedSegment[] = [];
    let currentIndex = 0;

    // Get theme-specific styles
    const getThemeStyle = (type: string): React.CSSProperties => {
      switch (type) {
        case 'chord':
          return {
            color: theme === 'dark' ? '#60a5fa' : theme === 'stage' ? '#fde047' : '#2563eb',
            fontWeight: 600,
            backgroundColor: theme === 'dark' ? 'rgba(96, 165, 250, 0.1)' : theme === 'stage' ? 'rgba(253, 224, 71, 0.1)' : 'rgba(37, 99, 235, 0.1)',
            padding: '0 4px',
            borderRadius: '3px'
          };
        case 'section':
          return {
            color: theme === 'dark' ? '#c084fc' : theme === 'stage' ? '#d8b4fe' : '#9333ea',
            fontWeight: 500,
            fontStyle: 'italic'
          };
        case 'comment':
          return {
            color: theme === 'dark' ? '#9ca3af' : theme === 'stage' ? '#d1d5db' : '#6b7280',
            fontStyle: 'italic'
          };
        case 'directive':
          return {
            color: theme === 'dark' ? '#4ade80' : theme === 'stage' ? '#86efac' : '#16a34a',
            fontWeight: 500
          };
        default:
          return {};
      }
    };

    // Regex patterns for different ChordPro elements
    const patterns = [
      // Chord brackets - [Am], [G/B], etc.
      { 
        regex: /\[([^\]]+)\]/g, 
        type: 'chord' as const, 
        style: getThemeStyle('chord'),
        className: '' 
      },
      
      // Section directives - {start_of_chorus}, {soc}, etc.
      { 
        regex: /\{(start_of_chorus|end_of_chorus|soc|eoc|start_of_verse|end_of_verse|sov|eov|start_of_bridge|end_of_bridge|sob|eob|start_of_tab|end_of_tab|sot|eot)\}/g, 
        type: 'section' as const, 
        style: getThemeStyle('section'),
        className: '' 
      },
      
      // Comment directives - {comment:...}, {c:...}
      { 
        regex: /\{(comment|c):\s*([^}]*)\}/g, 
        type: 'comment' as const, 
        style: getThemeStyle('comment'),
        className: '' 
      },
      
      // Other directives - {title:...}, {key:...}, etc.
      { 
        regex: /\{([^}:]+):\s*([^}]*)\}/g, 
        type: 'directive' as const, 
        style: getThemeStyle('directive'),
        className: '' 
      },
      
      // Simple directives without colons - {chorus}, {verse}, etc.
      { 
        regex: /\{([^}]+)\}/g, 
        type: 'directive' as const, 
        style: getThemeStyle('directive'),
        className: '' 
      }
    ];

    // Find all matches and their positions, avoiding overlaps
    const allMatches: Array<{
      index: number;
      length: number;
      text: string;
      type: 'chord' | 'directive' | 'comment' | 'section' | 'tab';
      className: string;
      style?: React.CSSProperties;
    }> = [];

    patterns.forEach(pattern => {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((match = regex.exec(content)) !== null) {
        // Check if this match overlaps with any existing match
        const hasOverlap = allMatches.some(existing => 
          (match!.index >= existing.index && match!.index < existing.index + existing.length) ||
          (match!.index + match![0].length > existing.index && match!.index + match![0].length <= existing.index + existing.length) ||
          (match!.index <= existing.index && match!.index + match![0].length >= existing.index + existing.length)
        );

        if (!hasOverlap) {
          allMatches.push({
            index: match.index,
            length: match[0].length,
            text: match[0],
            type: pattern.type,
            className: pattern.className,
            style: pattern.style
          });
        }
      }
    });

    // Sort matches by position
    allMatches.sort((a, b) => a.index - b.index);

    // Build segments array
    allMatches.forEach(match => {
      // Add any plain text before this match
      if (match.index > currentIndex) {
        const plainText = content.slice(currentIndex, match.index);
        if (plainText) {
          segments.push({
            text: plainText,
            type: 'text',
            className: ''
          });
        }
      }

      // Add the highlighted match
      segments.push({
        text: match.text,
        type: match.type,
        className: match.className,
        style: match.style
      });

      currentIndex = match.index + match.length;
    });

    // Add any remaining plain text
    if (currentIndex < content.length) {
      const remainingText = content.slice(currentIndex);
      if (remainingText) {
        segments.push({
          text: remainingText,
          type: 'text',
          className: ''
        });
      }
    }

    return segments;
  }, [content, theme]);
};