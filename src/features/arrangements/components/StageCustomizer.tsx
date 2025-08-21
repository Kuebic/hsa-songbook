/**
 * @file StageCustomizer.tsx
 * @description Component for customizing per-arrangement stage theme settings
 * Only shows when app is in stage theme
 */

import React, { useState } from 'react'
import { Settings, RotateCcw, Download, Upload, X } from 'lucide-react'
import { useArrangementStagePrefs } from '../hooks/useArrangementStagePrefs'

interface StageCustomizerProps {
  arrangementId: string
  className?: string
}

export const StageCustomizer: React.FC<StageCustomizerProps> = ({ 
  arrangementId,
  className = ''
}) => {
  const {
    preferences,
    isStageTheme,
    updatePreference,
    resetToDefaults,
    exportPreferences,
    importPreferences
  } = useArrangementStagePrefs(arrangementId)
  
  const [isOpen, setIsOpen] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  
  // Only show when in stage theme
  if (!isStageTheme || !preferences) {
    return null
  }
  
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        importPreferences(json)
        setImportError(null)
        setIsOpen(false)
      } catch (_error) {
        setImportError('Failed to import preferences. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }
  
  const handleExport = () => {
    const json = exportPreferences()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stage-prefs-${arrangementId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <>
      {/* Floating Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`stage-customizer-trigger ${className}`}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'all 0.2s'
        }}
        aria-label="Stage customization settings"
      >
        <Settings size={20} />
      </button>
      
      {/* Settings Panel */}
      {isOpen && (
        <div
          className="stage-customizer-panel"
          style={{
            position: 'fixed',
            top: '4rem',
            right: '1rem',
            width: '320px',
            maxHeight: 'calc(100vh - 5rem)',
            overflowY: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            color: 'white',
            zIndex: 1001,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
              Stage Customization
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Font Size */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              opacity: 0.8
            }}>
              Font Size: {preferences.stageOverrides?.fontSize || 18}px
            </label>
            <input
              type="range"
              min="12"
              max="32"
              value={preferences.stageOverrides?.fontSize || 18}
              onChange={(e) => updatePreference('fontSize', Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#fbbf24'
              }}
            />
          </div>
          
          {/* Chord Color */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              opacity: 0.8
            }}>
              Chord Color
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={preferences.stageOverrides?.chordColor || '#fbbf24'}
                onChange={(e) => updatePreference('chordColor', e.target.value)}
                style={{
                  width: '50px',
                  height: '35px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  backgroundColor: 'transparent'
                }}
              />
              <input
                type="text"
                value={preferences.stageOverrides?.chordColor || '#fbbf24'}
                onChange={(e) => updatePreference('chordColor', e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.25rem',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
          
          {/* Lyric Color */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              opacity: 0.8
            }}>
              Lyric Color
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={preferences.stageOverrides?.lyricColor || '#ffffff'}
                onChange={(e) => updatePreference('lyricColor', e.target.value)}
                style={{
                  width: '50px',
                  height: '35px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  backgroundColor: 'transparent'
                }}
              />
              <input
                type="text"
                value={preferences.stageOverrides?.lyricColor || '#ffffff'}
                onChange={(e) => updatePreference('lyricColor', e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.25rem',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>
          
          {/* Line Spacing */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              opacity: 0.8
            }}>
              Line Spacing: {preferences.stageOverrides?.lineSpacing || 1.5}
            </label>
            <input
              type="range"
              min="1"
              max="2"
              step="0.1"
              value={preferences.stageOverrides?.lineSpacing || 1.5}
              onChange={(e) => updatePreference('lineSpacing', Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#fbbf24'
              }}
            />
          </div>
          
          {/* Toggle Options */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              marginBottom: '0.75rem'
            }}>
              <input
                type="checkbox"
                checked={preferences.stageOverrides?.showSections !== false}
                onChange={(e) => updatePreference('showSections', e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#fbbf24'
                }}
              />
              Show Section Markers
            </label>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={preferences.stageOverrides?.showComments === true}
                onChange={(e) => updatePreference('showComments', e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#fbbf24'
                }}
              />
              Show Comments
            </label>
          </div>
          
          {/* Custom CSS (Advanced) */}
          <details style={{ marginBottom: '1.5rem' }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: '0.875rem',
              opacity: 0.8,
              marginBottom: '0.5rem'
            }}>
              Advanced: Custom CSS
            </summary>
            <textarea
              value={preferences.stageOverrides?.customCSS || ''}
              onChange={(e) => updatePreference('customCSS', e.target.value)}
              placeholder="/* Custom CSS for stage mode */"
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.25rem',
                color: 'white',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </details>
          
          {/* Import Error */}
          {importError && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '0.25rem',
              color: '#fca5a5',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {importError}
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem'
          }}>
            <button
              onClick={resetToDefaults}
              style={{
                padding: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.25rem',
                color: 'white',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <RotateCcw size={14} />
              Reset
            </button>
            
            <button
              onClick={handleExport}
              style={{
                padding: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.25rem',
                color: 'white',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <Download size={14} />
              Export
            </button>
            
            <label
              style={{
                gridColumn: 'span 2',
                padding: '0.5rem',
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                borderRadius: '0.25rem',
                color: '#fbbf24',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.2)'
              }}
            >
              <Upload size={14} />
              Import Settings
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      )}
    </>
  )
}

export default StageCustomizer