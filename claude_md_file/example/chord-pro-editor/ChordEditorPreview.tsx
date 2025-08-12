/**
 * @file ChordEditorPreview.tsx
 * @description Live preview component for ChordEditor showing rendered ChordPro content
 */

import React, { useMemo } from 'react';
import { cn } from '../../../shared/utils/cn';
import { ChordDisplay } from './ChordDisplay';
import type { 
  ChordDisplayTheme,
  ValidationResult
} from '../types/chord.types';

export interface ChordEditorPreviewProps {
  /** ChordPro content to preview */
  content: string;
  /** Display theme */
  theme?: ChordDisplayTheme;
  /** Validation results for error highlighting */
  validation?: ValidationResult;
  /** Whether to show validation errors inline */
  showValidationErrors?: boolean;
  /** Preview height */
  height?: number;
  /** Whether the preview is loading */
  isLoading?: boolean;
  /** Update delay in milliseconds for performance */
  updateDelay?: number;
  /** Additional CSS classes */
  className?: string;
  /** Custom title for the preview */
  title?: string;
}

/**
 * ChordEditorPreview Component
 * 
 * Provides a live preview of ChordPro content with validation error highlighting.
 * Uses the existing ChordDisplay component for consistent rendering.
 * 
 * @example
 * ```tsx
 * <ChordEditorPreview
 *   content={chordProContent}
 *   theme="light"
 *   validation={validationResult}
 *   showValidationErrors={true}
 *   height={400}
 * />
 * ```
 */
export const ChordEditorPreview = React.memo<ChordEditorPreviewProps>(({
  content,
  theme = 'light',
  validation,
  showValidationErrors = true,
  height = 400,
  isLoading = false,
  title = 'Preview',
  className
}) => {
  /**
   * Get theme-specific container classes
   */
  const getContainerClasses = () => {
    const baseClasses = 'chord-editor-preview border-l flex flex-col';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'border-gray-700 bg-gray-900');
      case 'stage':
        return cn(baseClasses, 'border-yellow-600 bg-black');
      default:
        return cn(baseClasses, 'border-gray-200 bg-white');
    }
  };

  /**
   * Get header classes based on theme
   */
  const getHeaderClasses = () => {
    const baseClasses = 'preview-header border-b px-3 py-2 text-sm font-medium flex items-center justify-between';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'border-gray-700 bg-gray-800 text-gray-200');
      case 'stage':
        return cn(baseClasses, 'border-yellow-600 bg-gray-900 text-yellow-300');
      default:
        return cn(baseClasses, 'border-gray-200 bg-gray-50 text-gray-700');
    }
  };

  /**
   * Get content classes based on theme
   */
  const getContentClasses = () => {
    const baseClasses = 'preview-content flex-1 overflow-auto p-4';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'bg-gray-900 text-white');
      case 'stage':
        return cn(baseClasses, 'bg-black text-yellow-300');
      default:
        return cn(baseClasses, 'bg-white text-gray-900');
    }
  };

  /**
   * Get validation error classes
   */
  const getValidationClasses = () => {
    return 'validation-errors border-t border-red-200 bg-red-50 p-2 text-xs max-h-32 overflow-auto';
  };

  /**
   * Check if content is empty or whitespace only
   */
  const isEmpty = useMemo(() => {
    return !content || content.trim().length === 0;
  }, [content]);

  /**
   * Get placeholder text based on validation state
   */
  const getPlaceholderText = () => {
    if (isEmpty) {
      return 'Start typing in the editor to see your song preview here...';
    }
    if (validation && !validation.valid) {
      return 'Fix validation errors to see preview...';
    }
    return 'Rendering preview...';
  };

  return (
    <div 
      className={cn(getContainerClasses(), className)}
      style={{ height: `${height}px` }}
    >
      {/* Header */}
      <div className={getHeaderClasses()}>
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          )}
          {validation && (
            <div className="flex items-center gap-1 text-xs">
              {validation.errors.length > 0 && (
                <span className="text-red-500" title={`${validation.errors.length} errors`}>
                  ❌ {validation.errors.length}
                </span>
              )}
              {validation.warnings && validation.warnings.length > 0 && (
                <span className="text-yellow-500" title={`${validation.warnings.length} warnings`}>
                  ⚠️ {validation.warnings.length}
                </span>
              )}
              {validation.valid && validation.errors.length === 0 && (
                <span className="text-green-500" title="Valid">
                  ✅
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={getContentClasses()}>
        {isEmpty || (validation && !validation.valid) ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-center">
            <div>
              <div className="text-4xl mb-2">🎵</div>
              <div>{getPlaceholderText()}</div>
            </div>
          </div>
        ) : (
          <ChordDisplay
            content={content}
            theme={theme}
            showChords={true}
            className="h-full"
          />
        )}
      </div>

      {/* Validation Errors */}
      {showValidationErrors && validation && validation.errors.length > 0 && (
        <div className={getValidationClasses()}>
          <div className="font-medium text-red-700 mb-1">Validation Errors:</div>
          <div className="space-y-1">
            {validation.errors.slice(0, 5).map((error, index) => (
              <div key={index} className="flex items-start gap-2 text-red-600">
                <span className="text-red-500 font-mono text-xs min-w-0">
                  {error.line}:{error.column}
                </span>
                <span className="flex-1 min-w-0">
                  {error.message}
                  {error.suggestion && (
                    <span className="block text-red-500 mt-1 italic">
                      💡 {error.suggestion}
                    </span>
                  )}
                </span>
              </div>
            ))}
            {validation.errors.length > 5 && (
              <div className="text-red-500 italic">
                ... and {validation.errors.length - 5} more errors
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ChordEditorPreview.displayName = 'ChordEditorPreview';