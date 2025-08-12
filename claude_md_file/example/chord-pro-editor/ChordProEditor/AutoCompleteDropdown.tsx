/**
 * @file AutoCompleteDropdown.tsx
 * @description Dropdown component for auto-completion suggestions
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '../../../../shared/utils/cn';
import type { AutoCompleteItem } from './types';

interface AutoCompleteDropdownProps {
  isVisible: boolean;
  items: AutoCompleteItem[];
  selectedIndex: number;
  onSelect: (item: AutoCompleteItem) => void;
  onClose: () => void;
  position: { top: number; left: number };
  theme: 'light' | 'dark' | 'stage';
  className?: string;
}

export const AutoCompleteDropdown: React.FC<AutoCompleteDropdownProps> = ({
  isVisible,
  items,
  selectedIndex,
  onSelect,
  onClose,
  position,
  theme,
  className
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Handle clicks outside to close dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible, onClose]);

  /**
   * Scroll selected item into view
   */
  useEffect(() => {
    if (isVisible && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'auto'
        });
      }
    }
  }, [isVisible, selectedIndex]);

  /**
   * Get theme-specific classes
   */
  const getThemeClasses = () => {
    const baseClasses = 'absolute z-50 min-w-[250px] max-w-[400px] max-h-[200px] overflow-y-auto border rounded-lg shadow-lg';
    
    switch (theme) {
      case 'dark':
        return cn(baseClasses, 'bg-gray-800 border-gray-600');
      case 'stage':
        return cn(baseClasses, 'bg-gray-900 border-yellow-600');
      default:
        return cn(baseClasses, 'bg-white border-gray-300');
    }
  };

  /**
   * Get item theme classes
   */
  const getItemClasses = (isSelected: boolean) => {
    const baseClasses = 'px-3 py-2 cursor-pointer transition-colors';
    
    if (isSelected) {
      switch (theme) {
        case 'dark':
          return cn(baseClasses, 'bg-blue-600 text-white');
        case 'stage':
          return cn(baseClasses, 'bg-yellow-600 text-black');
        default:
          return cn(baseClasses, 'bg-blue-500 text-white');
      }
    } else {
      switch (theme) {
        case 'dark':
          return cn(baseClasses, 'text-gray-100 hover:bg-gray-700');
        case 'stage':
          return cn(baseClasses, 'text-yellow-400 hover:bg-gray-800');
        default:
          return cn(baseClasses, 'text-gray-900 hover:bg-gray-100');
      }
    }
  };

  /**
   * Get description theme classes
   */
  const getDescriptionClasses = (isSelected: boolean) => {
    const baseClasses = 'text-xs mt-1';
    
    if (isSelected) {
      switch (theme) {
        case 'dark':
        case 'stage':
          return cn(baseClasses, 'text-gray-200');
        default:
          return cn(baseClasses, 'text-gray-100');
      }
    } else {
      switch (theme) {
        case 'dark':
          return cn(baseClasses, 'text-gray-400');
        case 'stage':
          return cn(baseClasses, 'text-yellow-600');
        default:
          return cn(baseClasses, 'text-gray-500');
      }
    }
  };

  if (!isVisible || items.length === 0) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={cn(getThemeClasses(), className)}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      {items.map((item, index) => (
        <div
          key={`${item.value}-${index}`}
          className={getItemClasses(index === selectedIndex)}
          onClick={() => onSelect(item)}
          onMouseEnter={() => {
            // Optional: Update selected index on hover
            // This would require adding a callback prop
          }}
        >
          <div className="font-mono font-medium">
            {item.value}
          </div>
          {item.description && (
            <div className={getDescriptionClasses(index === selectedIndex)}>
              {item.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};