import React, { useMemo } from 'react';
import { useUnifiedChordRenderer } from '../../hooks/useUnifiedChordRenderer';
import type { Theme } from '@shared/contexts/ThemeContext';
import '../../styles/unified-chord-display.css';
import './styles/preview.css';
import './styles/chordAlignment.css';

interface PreviewPaneProps {
  content: string;
  theme?: Theme;
  className?: string;
  transpose?: number;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ 
  content, 
  theme = 'light',
  className = '',
  transpose = 0
}) => {
  const { renderChordSheet } = useUnifiedChordRenderer();
  
  // Render the preview
  const previewHtml = useMemo(() => {
    if (!content.trim()) {
      return `
        <div class="preview-empty">
          <div class="preview-empty-icon">🎵</div>
          <div class="preview-empty-text">Start typing to see the preview</div>
          <div class="preview-empty-hint">Enter ChordPro notation with chords in [brackets] and directives in {braces}</div>
        </div>
      `;
    }
    
    try {
      return renderChordSheet(content, { transpose });
    } catch (error) {
      console.error('Preview error:', error);
      return `
        <div class="preview-error">
          <div class="preview-error-title">Error parsing ChordPro</div>
          <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
        </div>
      `;
    }
  }, [content, transpose, renderChordSheet]);
  
  return (
    <div 
      className={`preview-pane ${className}`}
      data-theme={theme}
      role="document"
      aria-label="Chord sheet preview"
    >
      <div 
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
    </div>
  );
};