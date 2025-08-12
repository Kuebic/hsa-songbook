/**
 * @file ChordEditorSettings.tsx
 * @description Settings panel for ChordEditor configuration
 */

import React from 'react';
import { Button } from '../../../shared/components/UI/Button';
import type { ChordDisplayTheme } from '../types/chord.types';
import { 
  EDITOR_FONT_SIZE_LIMITS, 
  EDITOR_HEIGHT_LIMITS 
} from '../types/chord.types';

export interface ChordEditorSettingsProps {
  theme: ChordDisplayTheme;
  onThemeChange: (theme: ChordDisplayTheme) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  height: number;
  onHeightChange: (height: number) => void;
  showPreview: boolean;
  onShowPreviewChange: (show: boolean) => void;
  autoComplete: boolean;
  onAutoCompleteChange: (enabled: boolean) => void;
  className?: string;
}

export const ChordEditorSettings = React.memo<ChordEditorSettingsProps>(({
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  height,
  onHeightChange,
  showPreview,
  onShowPreviewChange,
  autoComplete,
  onAutoCompleteChange,
  className = ''
}) => {
  const themes: { value: ChordDisplayTheme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'stage', label: 'Stage' }
  ];

  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Theme Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Theme
          </label>
          <div className="flex gap-1">
            {themes.map(({ value, label }) => (
              <Button
                key={value}
                variant={theme === value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onThemeChange(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Font Size: {fontSize}px
          </label>
          <input
            type="range"
            min={EDITOR_FONT_SIZE_LIMITS.MIN}
            max={EDITOR_FONT_SIZE_LIMITS.MAX}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>

        {/* Height */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Height: {height}px
          </label>
          <input
            type="range"
            min={EDITOR_HEIGHT_LIMITS.MIN}
            max={EDITOR_HEIGHT_LIMITS.MAX}
            value={height}
            onChange={(e) => onHeightChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>

        {/* Toggle Options */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="show-preview"
              type="checkbox"
              checked={showPreview}
              onChange={(e) => onShowPreviewChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="show-preview" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Show Preview
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="auto-complete"
              type="checkbox"
              checked={autoComplete}
              onChange={(e) => onAutoCompleteChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="auto-complete" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Auto-complete
            </label>
          </div>
        </div>
      </div>
    </div>
  );
});

ChordEditorSettings.displayName = 'ChordEditorSettings';