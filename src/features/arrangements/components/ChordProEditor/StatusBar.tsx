/**
 * @file StatusBar.tsx
 * @description Status bar component showing editor metrics and validation state
 */

import React from 'react';
import { cn } from '../../../../lib/utils';
import { TextAreaMetrics, ValidationResult } from './types/textArea.types';

interface StatusBarProps {
  metrics?: TextAreaMetrics | null;
  validation?: ValidationResult | null;
  theme?: 'light' | 'dark' | 'stage';
  isModified?: boolean;
  currentMode?: string;
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  metrics,
  validation,
  theme = 'dark',
  isModified = false,
  currentMode = 'ChordPro',
  className
}) => {
  /**
   * Get theme-specific classes
   */
  const getThemeClasses = () => {
    const baseClasses = 'text-xs border-t px-3 py-1 flex items-center justify-between transition-colors duration-300';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'bg-gray-800 border-gray-700 text-gray-300');
      case 'stage':
        return cn(baseClasses, 'bg-black border-yellow-600/20 text-yellow-200');
      case 'light':
        return cn(baseClasses, 'bg-gray-50 border-gray-200 text-gray-600');
      default:
        return cn(baseClasses, 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-secondary)]');
    }
  };

  /**
   * Get validation status indicator
   */
  const getValidationStatus = () => {
    if (!validation) return null;
    
    const hasErrors = validation.errors.length > 0;
    const hasWarnings = validation.warnings.length > 0;
    
    if (hasErrors) {
      return (
        <span className="flex items-center gap-1 text-red-400">
          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
          {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
        </span>
      );
    }
    
    if (hasWarnings) {
      return (
        <span className="flex items-center gap-1 text-yellow-400">
          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
          {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
        </span>
      );
    }
    
    return (
      <span className="flex items-center gap-1 text-green-400">
        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        No issues
      </span>
    );
  };

  return (
    <div className={cn(getThemeClasses(), className)}>
      {/* Left side - Mode and status */}
      <div className="flex items-center gap-4">
        <span className="font-medium">{currentMode}</span>
        
        {isModified && (
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            Modified
          </span>
        )}
        
        {getValidationStatus()}
      </div>

      {/* Right side - Metrics */}
      {metrics && (
        <div className="flex items-center gap-4">
          <span>
            Ln {metrics.cursorLine}, Col {metrics.cursorColumn}
          </span>
          
          <span>
            {metrics.charCount} chars
          </span>
          
          <span>
            {metrics.lineCount} lines
          </span>
          
          {metrics.selectionLength > 0 && (
            <span className="text-blue-400">
              {metrics.selectionLength} selected
            </span>
          )}
        </div>
      )}
    </div>
  );
};
