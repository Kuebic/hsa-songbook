/**
 * @file AutoCompleteEnhanced.tsx
 * @description Enhanced auto-complete dropdown with improved features
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '../../../../lib/utils';
// Define types directly to avoid import issues
interface AutoCompleteContext {
  triggerChar: '{' | '[';
  triggerPosition: number;
  filterText: string;
  isVisible: boolean;
  selectedIndex: number;
}

interface AutoCompleteEnhancedProps {
  context: AutoCompleteContext | null;
  suggestions: string[];
  onSelect: (suggestion: string, index: number) => void;
  onMove: (direction: 'up' | 'down') => void;
  onHide: () => void;
  className?: string;
  maxItems?: number;
  theme?: 'light' | 'dark' | 'stage';
}

export const AutoCompleteEnhanced: React.FC<AutoCompleteEnhancedProps> = ({
  context,
  suggestions,
  onSelect,
  onMove,
  onHide,
  className,
  maxItems = 8,
  theme = 'dark'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  /**
   * Handle item selection
   */
  const handleSelect = useCallback((suggestion: string, index: number) => {
    onSelect(suggestion, index);
  }, [onSelect]);

  /**
   * Scroll selected item into view
   */
  useEffect(() => {
    if (selectedItemRef.current && containerRef.current) {
      const container = containerRef.current;
      const selectedItem = selectedItemRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();
      
      if (itemRect.top < containerRect.top) {
        selectedItem.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } else if (itemRect.bottom > containerRect.bottom) {
        selectedItem.scrollIntoView({ block: 'end', behavior: 'smooth' });
      }
    }
  }, [context?.selectedIndex]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!context?.isVisible) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onMove('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          onMove('down');
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (suggestions[context.selectedIndex]) {
            handleSelect(suggestions[context.selectedIndex], context.selectedIndex);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onHide();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [context, suggestions, onMove, onHide, handleSelect]);

  if (!context?.isVisible || suggestions.length === 0) {
    return null;
  }

  const visibleSuggestions = suggestions.slice(0, maxItems);
  const hasMore = suggestions.length > maxItems;

  /**
   * Get theme-specific classes
   */
  const getThemeClasses = () => {
    const baseClasses = 'absolute z-50 min-w-48 max-w-80 border rounded-lg shadow-lg overflow-hidden';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'bg-gray-800 border-gray-600 text-gray-100');
      case 'stage':
        return cn(baseClasses, 'bg-black border-yellow-600 text-yellow-100');
      case 'light':
        return cn(baseClasses, 'bg-white border-gray-300 text-gray-900');
      default:
        return cn(baseClasses, 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-foreground)]');
    }
  };

  const getItemClasses = (isSelected: boolean, isHighlighted: boolean) => {
    const baseClasses = 'px-3 py-2 cursor-pointer flex items-center justify-between text-sm transition-colors';
    
    switch (theme) {
      case 'dark':
        return cn(
          baseClasses,
          isSelected && 'bg-blue-600 text-white',
          !isSelected && isHighlighted && 'bg-gray-700',
          !isSelected && !isHighlighted && 'hover:bg-gray-700'
        );
      case 'stage':
        return cn(
          baseClasses,
          isSelected && 'bg-yellow-600 text-black',
          !isSelected && isHighlighted && 'bg-gray-900',
          !isSelected && !isHighlighted && 'hover:bg-gray-900'
        );
      case 'light':
        return cn(
          baseClasses,
          isSelected && 'bg-blue-500 text-white',
          !isSelected && isHighlighted && 'bg-gray-100',
          !isSelected && !isHighlighted && 'hover:bg-gray-100'
        );
      default:
        return cn(
          baseClasses,
          isSelected && 'bg-[var(--color-primary)] text-white',
          !isSelected && isHighlighted && 'bg-[var(--color-card-hover)]',
          !isSelected && !isHighlighted && 'hover:bg-[var(--color-card-hover)]'
        );
    }
  };

  /**
   * Get suggestion type badge
   */
  const getSuggestionType = (suggestion: string) => {
    if (context.triggerChar === '{') {
      const directiveTypes: Record<string, string> = {
        title: 'meta',
        t: 'meta',
        subtitle: 'meta',
        st: 'meta',
        artist: 'meta',
        composer: 'meta',
        album: 'meta',
        year: 'meta',
        key: 'meta',
        tempo: 'meta',
        capo: 'meta',
        comment: 'format',
        c: 'format',
        start_of_chorus: 'section',
        soc: 'section',
        end_of_chorus: 'section',
        eoc: 'section',
        start_of_verse: 'section',
        sov: 'section',
        end_of_verse: 'section',
        eov: 'section',
        new_song: 'control',
        ns: 'control',
        new_page: 'control',
        np: 'control'
      };
      
      return directiveTypes[suggestion] || 'custom';
    }
    
    return 'chord';
  };

  const getBadgeClasses = (type: string) => {
    const baseClasses = 'px-2 py-0.5 rounded text-xs font-medium';
    
    switch (type) {
      case 'meta':
        return cn(baseClasses, 'bg-blue-100 text-blue-800');
      case 'section':
        return cn(baseClasses, 'bg-green-100 text-green-800');
      case 'format':
        return cn(baseClasses, 'bg-yellow-100 text-yellow-800');
      case 'control':
        return cn(baseClasses, 'bg-purple-100 text-purple-800');
      case 'chord':
        return cn(baseClasses, 'bg-orange-100 text-orange-800');
      default:
        return cn(baseClasses, 'bg-gray-100 text-gray-800');
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(getThemeClasses(), 'animate-slideDown', className)}
      style={{
        maxHeight: `${maxItems * 40}px`,
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-current/10 text-xs font-medium opacity-70">
        {context.triggerChar === '{' ? 'ChordPro Directives' : 'Chord Names'}
        {context.filterText && (
          <span className="ml-2 opacity-50">
            matching "{context.filterText}"
          </span>
        )}
      </div>
      
      {/* Suggestions */}
      {visibleSuggestions.map((suggestion, index) => {
        const isSelected = index === context.selectedIndex;
        const suggestionType = getSuggestionType(suggestion);
        
        return (
          <div
            key={suggestion}
            ref={isSelected ? selectedItemRef : null}
            className={getItemClasses(isSelected, false)}
            onClick={() => handleSelect(suggestion, index)}
            onMouseEnter={() => {
              // Update selected index on mouse hover
              // This would require a callback to update the context
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono">{suggestion}</span>
              <span className={getBadgeClasses(suggestionType)}>
                {suggestionType}
              </span>
            </div>
            
            {isSelected && (
              <div className="text-xs opacity-70">
                ↵ Enter
              </div>
            )}
          </div>
        );
      })}
      
      {/* More items indicator */}
      {hasMore && (
        <div className="px-3 py-2 border-t border-current/10 text-xs opacity-70 text-center">
          +{suggestions.length - maxItems} more items...
        </div>
      )}
      
      {/* Help text */}
      <div className="px-3 py-2 border-t border-current/10 text-xs opacity-50">
        <div className="flex justify-between">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Cancel</span>
        </div>
      </div>
    </div>
  );
};
