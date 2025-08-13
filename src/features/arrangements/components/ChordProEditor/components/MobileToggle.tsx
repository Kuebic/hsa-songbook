import React from 'react'
import { Edit3, Eye } from 'lucide-react'

interface MobileToggleProps {
  showPreview: boolean
  onToggle: () => void
  className?: string
}

/**
 * Mobile toggle component for switching between editor and preview views
 * Only visible on mobile devices (< 768px)
 */
export const MobileToggle: React.FC<MobileToggleProps> = ({ 
  showPreview, 
  onToggle,
  className = ''
}) => {
  return (
    <div className={`mobile-toggle-container ${className}`}>
      <button
        onClick={onToggle}
        className="mobile-toggle-btn"
        aria-label={showPreview ? 'Show editor' : 'Show preview'}
        aria-pressed={showPreview}
        type="button"
      >
        <div className="toggle-indicator">
          <span 
            className={`toggle-option ${!showPreview ? 'active' : ''}`}
            aria-hidden="true"
          >
            <Edit3 size={16} className="icon" />
            <span>Edit</span>
          </span>
          <span 
            className={`toggle-option ${showPreview ? 'active' : ''}`}
            aria-hidden="true"
          >
            <Eye size={16} className="icon" />
            <span>Preview</span>
          </span>
        </div>
      </button>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .mobile-toggle-container {
          display: inline-flex;
          padding: 2px;
          background: var(--hover-bg);
          border-radius: 0.5rem;
          border: 1px solid var(--editor-divider);
        }

        .mobile-toggle-btn {
          display: flex;
          padding: 0;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        .toggle-indicator {
          display: flex;
          gap: 2px;
        }

        .toggle-option {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          user-select: none;
        }

        .toggle-option .icon {
          display: inline-block;
          width: 16px;
          height: 16px;
        }

        .toggle-option.active {
          background: var(--focus-ring);
          color: white;
          box-shadow: var(--shadow-sm);
        }

        .toggle-option:not(.active):hover {
          background: var(--editor-bg);
          color: var(--text-primary);
        }

        /* Hide on tablet and desktop */
        @media (min-width: 768px) {
          .mobile-toggle-container {
            display: none !important;
          }
        }

        /* Reduce size on very small screens */
        @media (max-width: 380px) {
          .toggle-option {
            padding: 0.25rem 0.5rem;
            font-size: 0.8125rem;
          }
          
          .toggle-option span:not(.icon) {
            display: none;
          }
        }
      ` }} />
    </div>
  )
}

export default MobileToggle