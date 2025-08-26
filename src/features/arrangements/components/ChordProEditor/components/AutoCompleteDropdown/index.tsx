import React, { useEffect, useRef, useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
  FloatingPortal,
} from '@floating-ui/react';
import type { AutocompleteItem } from '../../data/chordProDirectives';
import { highlightMatches } from '../../utils/fuzzyMatch';
import { useVirtualKeyboard } from '../../hooks/useVirtualKeyboard';
import '../../styles/autocomplete.css';

interface AutoCompleteDropdownProps {
  items: AutocompleteItem[];
  selectedIndex: number;
  onSelect: (item: AutocompleteItem) => void;
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  isMobile: boolean;
  isSearching?: boolean;
  onClose?: () => void;
}

/**
 * Autocomplete dropdown component with mobile-first design
 * Uses Floating UI for intelligent positioning
 */
export const AutoCompleteDropdown: React.FC<AutoCompleteDropdownProps> = ({
  items,
  selectedIndex,
  onSelect,
  anchorEl,
  isOpen,
  isMobile,
  isSearching = false,
  onClose,
}) => {
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();

  // Determine placement based on keyboard visibility
  const getPlacement = () => {
    if (isMobile && isKeyboardVisible) {
      // When keyboard is visible on mobile, prefer top placement
      return 'top-start';
    } else if (isMobile) {
      // When keyboard is hidden, can use bottom
      return 'bottom-start';
    }
    // Desktop default
    return 'bottom-start';
  };

  // Configure Floating UI positioning
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: getPlacement(),
    middleware: [
      offset(isMobile && isKeyboardVisible ? 8 : 4),
      flip({
        fallbackPlacements: isMobile 
          ? ['bottom-start', 'top-end', 'bottom-end']
          : ['top-start', 'bottom-end', 'top-end'],
      }),
      shift({ 
        padding: isMobile ? 16 : 8,
        crossAxis: true,
      }),
      size({
        apply({ availableHeight, elements }) {
          // Adjust max height based on keyboard presence
          const maxHeight = isMobile && isKeyboardVisible
            ? Math.min(availableHeight - keyboardHeight - 20, 200)
            : Math.min(availableHeight - 10, isMobile ? 250 : 300);
          
          Object.assign(elements.floating.style, {
            maxHeight: `${maxHeight}px`,
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Set reference element
  useEffect(() => {
    if (anchorEl) {
      refs.setReference(anchorEl);
    }
  }, [anchorEl, refs]);

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        listElement &&
        !listElement.contains(target) &&
        anchorEl &&
        !anchorEl.contains(target)
      ) {
        onClose?.();
      }
    };

    // Delay to prevent immediate close on open
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, anchorEl, onClose]);

  if (!isOpen || items.length === 0) return null;

  const dropdownContent = (
    <div
      ref={(el) => {
        setListElement(el);
        refs.setFloating(el);
      }}
      style={floatingStyles}
      className={`autocomplete-dropdown ${isMobile ? 'autocomplete-mobile' : ''}`}
      role="listbox"
      aria-label="ChordPro suggestions"
      aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
    >
      <div className="autocomplete-list">
        {isSearching && items.length === 0 && (
          <div className="autocomplete-searching">
            <span className="searching-indicator">Searching...</span>
          </div>
        )}
        {!isSearching && items.length === 0 && (
          <div className="autocomplete-no-results">
            <span>No matches found</span>
            <span className="no-results-hint">Try a different search term</span>
          </div>
        )}
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          
          return (
            <button
              key={`${item.value}-${index}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={isSelected}
              className={`autocomplete-item ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(item);
              }}
              onMouseDown={(e) => {
                // Prevent blur on textarea
                e.preventDefault();
              }}
              type="button"
              tabIndex={-1}
            >
              {item.icon && (
                <span className="autocomplete-item-icon" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className="autocomplete-item-content">
                <span className="autocomplete-item-label">
                  {item.fuzzyMatches && item.fuzzyMatches.length > 0
                    ? highlightMatches(item.label, item.fuzzyMatches)
                    : item.label}
                </span>
                {item.description && (
                  <span className="autocomplete-item-description">
                    {item.description}
                  </span>
                )}
              </span>
              {item.category && (
                <span className="autocomplete-item-category" aria-hidden="true">
                  {item.category}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Portal to body for proper stacking context
  return (
    <FloatingPortal>
      {dropdownContent}
    </FloatingPortal>
  );
};

export default AutoCompleteDropdown;