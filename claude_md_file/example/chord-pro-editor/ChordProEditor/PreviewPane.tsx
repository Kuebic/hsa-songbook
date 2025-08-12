/**
 * @file PreviewPane.tsx
 * @description Preview pane component that renders ChordPro content using ChordDisplay
 */

import React, { useMemo } from 'react';
import { cn } from '../../../../shared/utils/cn';
import { ChordDisplay } from '../ChordDisplay';

interface PreviewPaneProps {
  content: string;
  transpose?: number;
  fontSize?: number;
  showChords?: boolean;
  theme?: 'light' | 'dark' | 'stage';
  className?: string;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  content,
  transpose = 0,
  fontSize = 16,
  showChords = true,
  theme = 'light',
  className
}) => {
  /**
   * Get theme-specific container classes
   */
  const getContainerClasses = () => {
    const baseClasses = 'h-full overflow-auto';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'bg-gray-800');
      case 'stage':
        return cn(baseClasses, 'bg-gray-900');
      default:
        return cn(baseClasses, 'bg-gray-50');
    }
  };

  /**
   * Memoize the preview to prevent unnecessary re-renders
   */
  const preview = useMemo(() => {
    if (!content.trim()) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>Preview will appear here as you type...</p>
        </div>
      );
    }

    return (
      <ChordDisplay
        content={content}
        transpose={transpose}
        fontSize={fontSize}
        showChords={showChords}
        theme={theme}
      />
    );
  }, [content, transpose, fontSize, showChords, theme]);

  return (
    <div className={cn(getContainerClasses(), className)}>
      <div className="p-4">
        {preview}
      </div>
    </div>
  );
};