/**
 * @file FontPreferences/index.tsx
 * @description Component for managing chord sheet display preferences
 */

import React, { useState, useCallback } from 'react';
import { useUnifiedChordRenderer } from '../../hooks/useUnifiedChordRenderer';
import './styles.css';

const FONT_FAMILIES = [
  { value: 'system-ui, -apple-system, sans-serif', label: 'System Default' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Monaco, monospace', label: 'Monaco' },
  { value: 'Consolas, monospace', label: 'Consolas' },
];

const THEMES = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'stage', label: 'Stage Mode' },
];

interface FontPreferencesProps {
  onClose?: () => void;
  showCompact?: boolean;
}

export const FontPreferences: React.FC<FontPreferencesProps> = ({ 
  onClose,
  showCompact = false 
}) => {
  const { preferences, updatePreferences, resetPreferences } = useUnifiedChordRenderer();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    setLocalPrefs(prev => ({ ...prev, fontSize: size }));
    updatePreferences({ fontSize: size });
  }, [updatePreferences]);

  const handleFontFamilyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const family = e.target.value;
    setLocalPrefs(prev => ({ ...prev, fontFamily: family }));
    updatePreferences({ fontFamily: family });
  }, [updatePreferences]);

  const handleThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = e.target.value as 'light' | 'dark' | 'auto' | 'stage';
    setLocalPrefs(prev => ({ ...prev, theme }));
    updatePreferences({ theme });
  }, [updatePreferences]);

  const handleChordColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setLocalPrefs(prev => ({ ...prev, chordColor: color }));
    updatePreferences({ chordColor: color });
  }, [updatePreferences]);

  const handleLyricColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setLocalPrefs(prev => ({ ...prev, lyricColor: color }));
    updatePreferences({ lyricColor: color });
  }, [updatePreferences]);

  const handleLineHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const height = parseFloat(e.target.value);
    setLocalPrefs(prev => ({ ...prev, lineHeight: height }));
    updatePreferences({ lineHeight: height });
  }, [updatePreferences]);


  const handleReset = useCallback(() => {
    resetPreferences();
    setLocalPrefs(preferences);
  }, [resetPreferences, preferences]);

  if (showCompact) {
    // Compact inline version for toolbar
    return (
      <div className="font-preferences-compact">
        <button 
          className="font-size-decrease"
          onClick={() => handleFontSizeChange({ target: { value: Math.max(10, localPrefs.fontSize - 2).toString() } } as React.ChangeEvent<HTMLInputElement>)}
          aria-label="Decrease font size"
        >
          A-
        </button>
        <span className="font-size-display">{localPrefs.fontSize}px</span>
        <button 
          className="font-size-increase"
          onClick={() => handleFontSizeChange({ target: { value: Math.min(32, localPrefs.fontSize + 2).toString() } } as React.ChangeEvent<HTMLInputElement>)}
          aria-label="Increase font size"
        >
          A+
        </button>
        <select 
          value={localPrefs.fontFamily}
          onChange={handleFontFamilyChange}
          className="font-family-select-compact"
        >
          {FONT_FAMILIES.map(font => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Full preferences panel
  return (
    <div className="font-preferences-panel">
      <div className="font-preferences-header">
        <h3>Display Preferences</h3>
        {onClose && (
          <button className="close-button" onClick={onClose} aria-label="Close preferences">
            ×
          </button>
        )}
      </div>

      <div className="font-preferences-content">
        <div className="preference-group">
          <label htmlFor="font-size">Font Size</label>
          <div className="font-size-control" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              className="font-size-decrease"
              onClick={() => handleFontSizeChange({ target: { value: Math.max(10, localPrefs.fontSize - 2).toString() } } as React.ChangeEvent<HTMLInputElement>)}
              aria-label="Decrease font size"
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              -
            </button>
            <span className="font-size-value" style={{ minWidth: '60px', textAlign: 'center' }}>{localPrefs.fontSize}px</span>
            <button 
              className="font-size-increase"
              onClick={() => handleFontSizeChange({ target: { value: Math.min(32, localPrefs.fontSize + 2).toString() } } as React.ChangeEvent<HTMLInputElement>)}
              aria-label="Increase font size"
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              +
            </button>
          </div>
        </div>

        <div className="preference-group">
          <label htmlFor="font-family">Font Family</label>
          <select
            id="font-family"
            value={localPrefs.fontFamily}
            onChange={handleFontFamilyChange}
          >
            {FONT_FAMILIES.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        <div className="preference-group">
          <label htmlFor="theme">Theme</label>
          <select
            id="theme"
            value={localPrefs.theme}
            onChange={handleThemeChange}
          >
            {THEMES.map(theme => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>

        <div className="preference-group">
          <label htmlFor="chord-color">Chord Color</label>
          <div className="color-input-wrapper">
            <input
              id="chord-color"
              type="color"
              value={localPrefs.chordColor}
              onChange={handleChordColorChange}
            />
            <input
              type="text"
              value={localPrefs.chordColor}
              onChange={handleChordColorChange}
              className="color-text-input"
            />
          </div>
        </div>

        <div className="preference-group">
          <label htmlFor="lyric-color">Lyric Color</label>
          <div className="color-input-wrapper">
            <input
              id="lyric-color"
              type="color"
              value={localPrefs.lyricColor}
              onChange={handleLyricColorChange}
            />
            <input
              type="text"
              value={localPrefs.lyricColor}
              onChange={handleLyricColorChange}
              className="color-text-input"
            />
          </div>
        </div>

        <div className="preference-group">
          <label htmlFor="line-height">Line Height</label>
          <div className="line-height-control">
            <input
              id="line-height"
              type="range"
              min="1"
              max="2.5"
              step="0.1"
              value={localPrefs.lineHeight}
              onChange={handleLineHeightChange}
            />
            <span className="line-height-value">{localPrefs.lineHeight}</span>
          </div>
        </div>


        <div className="preference-actions">
          <button className="reset-button" onClick={handleReset}>
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default FontPreferences;