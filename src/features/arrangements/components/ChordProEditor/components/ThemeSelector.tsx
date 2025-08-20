import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import type { Theme } from '@shared/contexts/theme-types'

interface ThemeSelectorProps {
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
  className?: string
}

interface ThemeOption {
  value: Theme
  icon: React.ReactNode
  label: string
  description: string
}

/**
 * Theme selector component for switching between light, dark, and stage themes
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  className = ''
}) => {
  const themes: ThemeOption[] = [
    { 
      value: 'light', 
      icon: <Sun size={16} />, 
      label: 'Light',
      description: 'Light theme for daytime use'
    },
    { 
      value: 'dark', 
      icon: <Moon size={16} />, 
      label: 'Dark',
      description: 'Dark theme for low-light environments'
    },
    { 
      value: 'stage', 
      icon: <Monitor size={16} />, 
      label: 'Stage',
      description: 'High contrast theme for stage performance'
    }
  ]
  
  return (
    <div className={`theme-selector ${className}`} role="radiogroup" aria-label="Theme selection">
      {themes.map(theme => (
        <button
          key={theme.value}
          onClick={() => onThemeChange(theme.value)}
          className={`theme-btn ${currentTheme === theme.value ? 'active' : ''}`}
          aria-label={theme.description}
          aria-checked={currentTheme === theme.value}
          role="radio"
          title={theme.label}
          type="button"
        >
          <span className="theme-icon" aria-hidden="true">
            {theme.icon}
          </span>
          <span className="theme-label">
            {theme.label}
          </span>
        </button>
      ))}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .theme-selector {
          display: flex;
          gap: 0.25rem;
          padding: 0.25rem;
          background: var(--hover-bg);
          border-radius: 0.5rem;
          border: 1px solid var(--editor-divider);
        }

        .theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 0.375rem 0.625rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 0.375rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 500;
          min-height: 32px;
        }

        .theme-btn:hover:not(.active) {
          background: var(--editor-bg);
          color: var(--text-primary);
        }

        .theme-btn.active {
          background: var(--focus-ring);
          color: white;
          border-color: var(--focus-ring);
          box-shadow: var(--shadow-sm);
        }

        .theme-btn:focus-visible {
          outline: 2px solid var(--focus-ring);
          outline-offset: 2px;
        }

        .theme-icon {
          display: inline-flex;
          width: 16px;
          height: 16px;
        }

        .theme-label {
          display: inline-block;
        }

        /* Hide labels on mobile */
        @media (max-width: 480px) {
          .theme-label {
            display: none;
          }
          
          .theme-btn {
            padding: 0.375rem;
            min-width: 32px;
          }
        }

        /* Compact mode for small screens */
        @media (max-width: 380px) {
          .theme-selector {
            gap: 0.125rem;
            padding: 0.125rem;
          }
          
          .theme-btn {
            padding: 0.25rem;
            min-height: 28px;
          }
        }

        /* Animation for theme change */
        .theme-btn.active {
          animation: buttonPulse 0.3s ease-out;
        }

        @keyframes buttonPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        /* High contrast mode adjustments */
        @media (prefers-contrast: high) {
          .theme-btn {
            border-width: 2px;
          }
          
          .theme-btn.active {
            border-color: white;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .theme-btn {
            transition: none;
            animation: none;
          }
        }
      ` }} />
    </div>
  )
}

export default ThemeSelector