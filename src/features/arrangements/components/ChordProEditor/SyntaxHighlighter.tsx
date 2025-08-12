/**
 * @file SyntaxHighlighter.tsx
 * @description Overlay component that provides syntax highlighting for ChordPro content
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '../../../../lib/utils';
import { useSyntaxHighlight } from './hooks/useSyntaxHighlight';

interface SyntaxHighlighterProps {
  content: string;
  fontSize: number;
  theme: 'light' | 'dark' | 'stage';
  scrollTop: number;
  scrollLeft: number;
  className?: string;
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  content,
  fontSize,
  theme,
  scrollTop,
  scrollLeft,
  className
}) => {
  const highlightRef = useRef<HTMLDivElement>(null);
  const segments = useSyntaxHighlight(content, theme);

  /**
   * Sync scroll position with textarea
   */
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollTop, scrollLeft]);

  /**
   * Render highlighted content
   */
  const renderHighlightedContent = () => {
    return segments.map((segment, index) => {
      if (segment.type === 'text') {
        // Preserve whitespace and line breaks
        return segment.text.split('\n').map((line, lineIndex) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {lineIndex > 0 && <br />}
            {line}
          </React.Fragment>
        ));
      }

      return (
        <span
          key={index}
          className={segment.className}
          style={segment.style}
        >
          {segment.text}
        </span>
      );
    });
  };

  // Get text color based on theme
  const getTextColor = () => {
    switch (theme) {
      case 'dark':
        return '#e5e7eb'; // gray-200
      case 'stage':
        return '#fef3c7'; // yellow-100
      default:
        return '#111827'; // gray-900
    }
  };

  return (
    <div
      ref={highlightRef}
      className={cn(
        'absolute inset-0 p-4 font-mono pointer-events-none overflow-hidden whitespace-pre-wrap break-words text-left',
        className
      )}
      style={{ 
        fontSize: `${fontSize}px`,
        lineHeight: '1.5',
        color: getTextColor()
      }}
      aria-hidden="true"
    >
      {renderHighlightedContent()}
    </div>
  );
};
