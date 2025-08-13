import React, { useEffect, useRef } from 'react';
import * as ChordSheetJS from 'chordsheetjs';
import './styles/preview.css';

interface PreviewPaneProps {
  content: string;
  theme?: 'light' | 'dark' | 'stage';
  className?: string;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ 
  content, 
  theme = 'light',
  className = '' 
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!previewRef.current) return;
    
    if (!content.trim()) {
      previewRef.current.innerHTML = `
        <div class="preview-empty">
          <div class="preview-empty-icon">🎵</div>
          <div class="preview-empty-text">Start typing to see the preview</div>
          <div class="preview-empty-hint">Enter ChordPro notation with chords in [brackets] and directives in {braces}</div>
        </div>
      `;
      return;
    }
    
    try {
      const parser = new ChordSheetJS.ChordProParser();
      const song = parser.parse(content);
      
      // Use HtmlTableFormatter for better chord alignment
      const formatter = new ChordSheetJS.HtmlTableFormatter();
      const html = formatter.format(song);
      
      // Build the complete preview HTML
      previewRef.current.innerHTML = `
        <div class="chord-sheet-wrapper">
          ${song.title || song.artist ? `
            <div class="chord-sheet-header">
              ${song.title ? `<h1 class="song-title">${song.title}</h1>` : ''}
              ${song.artist ? `<p class="song-artist">${song.artist}</p>` : ''}
              ${(song.key || song.tempo || song.capo) ? `
                <div class="song-metadata">
                  ${song.key ? `<span class="metadata-item"><span class="metadata-label">Key:</span> ${song.key}</span>` : ''}
                  ${song.tempo ? `<span class="metadata-item"><span class="metadata-label">Tempo:</span> ${song.tempo}</span>` : ''}
                  ${song.capo ? `<span class="metadata-item"><span class="metadata-label">Capo:</span> ${song.capo}</span>` : ''}
                </div>
              ` : ''}
            </div>
          ` : ''}
          <div class="chord-sheet-content">
            ${html}
          </div>
        </div>
      `;
      
      // Apply theme-specific classes to chord elements
      const chordElements = previewRef.current.querySelectorAll('.chord');
      chordElements.forEach(el => {
        el.classList.add('syntax-chord');
      });
      
      // Apply theme-specific classes to section labels
      const sectionLabels = previewRef.current.querySelectorAll('.paragraph-label');
      sectionLabels.forEach(el => {
        el.classList.add('section-label');
      });
      
    } catch (error) {
      console.error('Error parsing ChordPro:', error);
      previewRef.current.innerHTML = `
        <div class="preview-error">
          <div class="preview-error-title">Error parsing ChordPro</div>
          <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
        </div>
      `;
    }
  }, [content, theme]);
  
  return (
    <div 
      ref={previewRef}
      className={`preview-pane ${className}`}
      data-theme={theme}
      role="document"
      aria-label="Chord sheet preview"
    />
  );
};