import { Check } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import type { SetlistItemProps } from '../../types/dropdown.types'

/**
 * Individual setlist item in the dropdown
 * Shows setlist name, metadata, and whether it already contains the arrangement
 */
export function SetlistItem({
  setlist,
  isFocused,
  isSelected = false,
  onClick,
  onMouseEnter,
  showCheckbox = false
}: SetlistItemProps) {
  return (
    <button
      className={cn(
        'dropdown-item',
        setlist.containsArrangement && 'contains-arrangement',
        isFocused && 'focused',
        isSelected && 'selected'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={isFocused}
      disabled={setlist.containsArrangement}
    >
      <div className="item-content">
        <div className="item-main">
          {/* Checkbox for bulk selection (future feature) */}
          {showCheckbox && (
            <input
              type="checkbox"
              className="item-checkbox"
              checked={isSelected}
              onChange={(e) => e.stopPropagation()}
              aria-label={`Select ${setlist.name}`}
            />
          )}
          
          {/* Check icon if already contains arrangement */}
          {setlist.containsArrangement && (
            <Check className="check-icon" aria-label="Already added" />
          )}
          
          {/* Setlist name and metadata */}
          <div className="item-details">
            <span className="item-name">{setlist.name}</span>
            {setlist.description && (
              <span className="item-description">{setlist.description}</span>
            )}
          </div>
        </div>
        
        {/* Additional metadata */}
        <div className="item-meta">
          <span className="item-count">
            {setlist.arrangementCount} {setlist.arrangementCount === 1 ? 'song' : 'songs'}
          </span>
          <span className="item-time">{setlist.lastModifiedRelative}</span>
        </div>
      </div>
    </button>
  )
}