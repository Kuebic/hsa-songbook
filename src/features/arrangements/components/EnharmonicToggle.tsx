/**
 * @file EnharmonicToggle.tsx
 * @description Toggle component for switching between sharp and flat notation
 */

import { Music } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { enharmonicService } from '../services/enharmonicService'

interface EnharmonicToggleProps {
  currentKey?: string
  onToggle: () => void
  className?: string
  variant?: 'button' | 'switch'
}

export function EnharmonicToggle({ 
  currentKey, 
  onToggle, 
  className,
  variant = 'button' 
}: EnharmonicToggleProps) {
  const isEnharmonic = currentKey && enharmonicService.isEnharmonicKey(currentKey)
  const preference = enharmonicService.getPreference()
  
  if (!isEnharmonic) return null
  
  const handleToggle = () => {
    const newPref = preference.preference === 'sharp' ? 'flat' : 'sharp'
    enharmonicService.setPreference({ 
      preference: newPref,
      contextKey: currentKey 
    })
    onToggle()
  }
  
  if (variant === 'switch') {
    return (
      <div className={cn('enharmonic-switch', className)}>
        <button
          onClick={handleToggle}
          className={cn(
            'switch-button',
            preference.preference === 'sharp' && 'active-sharp',
            preference.preference === 'flat' && 'active-flat'
          )}
          aria-label="Toggle between sharp and flat notation"
          title={`Currently showing ${preference.preference}s`}
        >
          <span className="sharp-symbol">♯</span>
          <span className="switch-slider" />
          <span className="flat-symbol">♭</span>
        </button>
      </div>
    )
  }
  
  return (
    <button
      onClick={handleToggle}
      className={cn(
        'enharmonic-toggle-button',
        'inline-flex items-center gap-1 px-3 py-1.5 rounded-md',
        'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
        'text-sm font-medium text-gray-700 dark:text-gray-300',
        'transition-colors duration-200',
        className
      )}
      aria-label="Toggle enharmonic equivalent"
      title={`Switch to ${preference.preference === 'sharp' ? 'flat' : 'sharp'} notation`}
    >
      <Music className="w-4 h-4" />
      <span>{preference.preference === 'sharp' ? '♯' : '♭'}</span>
    </button>
  )
}