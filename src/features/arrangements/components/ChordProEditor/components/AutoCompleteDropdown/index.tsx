import React, { useEffect, useRef } from 'react';
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
import '../../styles/autocomplete.css';

interface AutoCompleteDropdownProps {
  items: AutocompleteItem[];
  selectedIndex: number;
  onSelect: (item: AutocompleteItem) => void;
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  isMobile: boolean;
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
  onClose,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Configure Floating UI positioning
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: isMobile ? 'top-start' : 'bottom-start',
    middleware: [
      offset(4),
      flip({
        fallbackPlacements: isMobile 
          ? ['bottom-start', 'top-end', 'bottom-end']
          : ['top-start', 'bottom-end', 'top-end'],
      }),
      shift({ 
        padding: 8,
        crossAxis: true,
      }),
      size({
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.min(availableHeight - 10, isMobile ? 200 : 300)}px`,
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
        listRef.current &&
        !listRef.current.contains(target) &&
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
        listRef.current = el;
        refs.setFloating(el);
      }}
      style={floatingStyles}
      className={`autocomplete-dropdown ${isMobile ? 'autocomplete-mobile' : ''}`}
      role="listbox"
      aria-label="ChordPro suggestions"
      aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
    >
      <div className="autocomplete-list">
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
                <span className="autocomplete-item-label">{item.label}</span>
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