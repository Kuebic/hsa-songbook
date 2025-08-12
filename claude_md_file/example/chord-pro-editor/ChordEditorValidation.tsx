/**
 * @file ChordEditorValidation.tsx
 * @description Validation display component for ChordEditor
 */

import React from 'react';
import type { ValidationResult } from '../types/chord.types';

export interface ChordEditorValidationProps {
  validation: ValidationResult | null;
  cursorPosition: { line: number; column: number };
  className?: string;
}

export const ChordEditorValidation = React.memo<ChordEditorValidationProps>(({
  validation,
  cursorPosition,
  className = ''
}) => {
  if (!validation) {
    return null;
  }

  const { valid, errors, warnings } = validation;

  return (
    <div className={`p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-3 h-3 rounded-full ${
            valid ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {valid ? 'Valid ChordPro' : 'Invalid ChordPro'}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Line {cursorPosition.line + 1}, Column {cursorPosition.column + 1}
        </span>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
            Errors ({errors.length})
          </h4>
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div
                key={index}
                className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded"
              >
                <span className="font-mono">
                  Line {error.line}: {error.message}
                </span>
                {error.suggestion && (
                  <div className="mt-1 text-red-500 dark:text-red-300">
                    Suggestion: {error.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
            Warnings ({warnings.length})
          </h4>
          <div className="space-y-1">
            {warnings.map((warning, index) => (
              <div
                key={index}
                className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"
              >
                <span className="font-mono">
                  Line {warning.line}: {warning.message}
                </span>
                {warning.suggestion && (
                  <div className="mt-1 text-yellow-500 dark:text-yellow-300">
                    Suggestion: {warning.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Valid state message */}
      {valid && errors.length === 0 && (!warnings || warnings.length === 0) && (
        <div className="text-xs text-green-600 dark:text-green-400">
          ChordPro syntax is valid
        </div>
      )}
    </div>
  );
});

ChordEditorValidation.displayName = 'ChordEditorValidation';