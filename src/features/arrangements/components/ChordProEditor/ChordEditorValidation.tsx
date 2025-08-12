/**
 * @file ChordEditorValidation.tsx
 * @description Component for displaying ChordPro validation results
 */

import React from 'react';
import { cn } from '../../../../lib/utils';
import type { ValidationProps } from '../../types/editor.types';

export const ChordEditorValidation: React.FC<ValidationProps> = ({
  errors,
  warnings,
  parseTime,
  className,
}) => {
  // Show success state if no issues
  if (!errors.length && !warnings.length) {
    return (
      <div className={cn('flex items-center gap-2 text-green-600 text-sm', className)}>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>Valid ChordPro</span>
        {parseTime !== undefined && (
          <span className="text-gray-500">({parseTime.toFixed(1)}ms)</span>
        )}
      </div>
    );
  }
  
  // Show errors and warnings
  return (
    <div
      className={cn('space-y-2', className)}
      role="alert"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Error messages */}
      {errors.map((error) => (
        <div
          key={error.id}
          className="flex items-start gap-2 text-red-600 text-sm"
          role="alert"
        >
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <span className="font-medium">Line {error.line}:</span>{' '}
            <span>{error.message}</span>
          </div>
        </div>
      ))}
      
      {/* Warning messages */}
      {warnings.map((warning) => (
        <div
          key={warning.id}
          className="flex items-start gap-2 text-yellow-600 text-sm"
          role="status"
        >
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            {warning.line > 0 && (
              <span className="font-medium">Line {warning.line}:</span>
            )}{' '}
            <span>{warning.message}</span>
          </div>
        </div>
      ))}
      
      {/* Parse time indicator */}
      {parseTime !== undefined && (errors.length > 0 || warnings.length > 0) && (
        <div className="text-xs text-gray-500 pl-6">
          Validation completed in {parseTime.toFixed(1)}ms
        </div>
      )}
    </div>
  );
};