import { useState, useCallback, useMemo } from 'react'
import { FormTextarea } from '@shared/components/form'
import { chordProValidation } from '@features/songs/validation/schemas/arrangementSchema'
import { MUSICAL_KEYS } from '@features/songs/validation/constants/musicalKeys'

interface ChordEditorProps {
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  className?: string
  rows?: number
  showPreview?: boolean
  autoDetectMetadata?: boolean
  onMetadataDetected?: (metadata: { title?: string; key?: string; artist?: string }) => void
}

export function ChordEditor({
  value,
  onChange,
  error,
  placeholder,
  className = '',
  rows = 15,
  showPreview = true,
  autoDetectMetadata = false,
  onMetadataDetected
}: ChordEditorProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  
  const handleChange = useCallback((newValue: string) => {
    onChange(newValue)
    
    // Auto-detect metadata if enabled
    if (autoDetectMetadata && onMetadataDetected) {
      const title = chordProValidation.extractTitle(newValue)
      const key = chordProValidation.extractKey(newValue)
      const artistMatch = newValue.match(/\{(?:artist|a):([^}]+)\}/i)
      const artist = artistMatch ? artistMatch[1].trim() : undefined
      
      if (title || key || artist) {
        onMetadataDetected({ title, key, artist })
      }
    }
  }, [onChange, autoDetectMetadata, onMetadataDetected])
  
  // Analyze the chord content
  const analysis = useMemo(() => {
    if (!value) return null
    
    const hasDirectives = chordProValidation.hasDirectives(value)
    const hasChords = chordProValidation.hasChords(value)
    const isValid = chordProValidation.isValid(value)
    
    // Extract chords
    const chordMatches = value.match(/\[[A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*\]/g) || []
    const uniqueChords = [...new Set(chordMatches.map(chord => chord.slice(1, -1)))]
    
    // Extract sections
    const sectionMatches = value.match(/\[(?:Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus)[^\]]*\]/gi) || []
    const sections = [...new Set(sectionMatches)]
    
    // Detect key suggestions based on chords
    const suggestedKeys = MUSICAL_KEYS.filter(key => {
      const baseKey = key.replace('m', '')
      return uniqueChords.some(chord => 
        chord.startsWith(baseKey) || 
        chord === baseKey
      )
    }).slice(0, 3)
    
    return {
      hasDirectives,
      hasChords,
      isValid,
      uniqueChords: uniqueChords.slice(0, 10), // Limit for display
      sections,
      suggestedKeys,
      lineCount: value.split('\n').length,
      characterCount: value.length
    }
  }, [value])
  
  // Render chord content as HTML for preview
  const renderPreview = useCallback(() => {
    if (!value) return <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No content to preview</div>
    
    const lines = value.split('\n')
    
    return (
      <div style={{
        fontFamily: 'monospace',
        fontSize: '13px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap'
      }}>
        {lines.map((line, index) => {
          // Directive lines (metadata)
          if (line.match(/^\{[^}]+\}/)) {
            return (
              <div key={index} style={{ 
                color: '#3b82f6', 
                fontWeight: 500,
                marginBottom: '4px'
              }}>
                {line}
              </div>
            )
          }
          
          // Section headers
          if (line.match(/^\[(?:Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus)/i)) {
            return (
              <div key={index} style={{ 
                color: '#7c3aed', 
                fontWeight: 600,
                fontSize: '14px',
                marginTop: '12px',
                marginBottom: '4px'
              }}>
                {line}
              </div>
            )
          }
          
          // Lines with chords
          if (line.includes('[') && line.includes(']')) {
            const parts = line.split(/(\[[^\]]+\])/)
            return (
              <div key={index} style={{ marginBottom: '2px' }}>
                {parts.map((part, partIndex) => {
                  if (part.match(/^\[[^\]]+\]$/)) {
                    return (
                      <span key={partIndex} style={{ 
                        backgroundColor: '#fbbf24',
                        color: '#92400e',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 600,
                        marginRight: '2px'
                      }}>
                        {part.slice(1, -1)}
                      </span>
                    )
                  }
                  return <span key={partIndex}>{part}</span>
                })}
              </div>
            )
          }
          
          // Regular text lines
          return (
            <div key={index} style={{ 
              color: line.trim() ? '#374151' : 'transparent',
              marginBottom: '2px'
            }}>
              {line || '\u00A0'}
            </div>
          )
        })}
      </div>
    )
  }, [value])
  
  const editorStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }
  
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  }
  
  const titleStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e293b'
  }
  
  const toggleButtonStyles = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: active ? '#3b82f6' : 'white',
    color: active ? 'white' : '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  })
  
  const analysisStyles: React.CSSProperties = {
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '12px'
  }
  
  const helpStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
    marginTop: '12px'
  }
  
  return (
    <div className={className} style={editorStyles}>
      <div style={headerStyles}>
        <div style={titleStyles}>ChordPro Editor</div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            style={{
              ...toggleButtonStyles(showHelp),
              borderColor: '#10b981',
              backgroundColor: showHelp ? '#10b981' : 'white',
              color: showHelp ? 'white' : '#10b981'
            }}
          >
            {showHelp ? 'Hide Help' : 'Show Help'}
          </button>
          
          {showPreview && (
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              style={toggleButtonStyles(previewMode)}
            >
              {previewMode ? 'Edit' : 'Preview'}
            </button>
          )}
        </div>
      </div>
      
      {/* Analysis panel */}
      {analysis && !previewMode && (
        <div style={analysisStyles}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div>
              <strong>Status:</strong>
              <span style={{ 
                marginLeft: '6px',
                color: analysis.isValid ? '#22c55e' : '#ef4444'
              }}>
                {analysis.isValid ? '✓ Valid ChordPro' : '⚠ Invalid Format'}
              </span>
            </div>
            
            <div><strong>Lines:</strong> {analysis.lineCount}</div>
            <div><strong>Characters:</strong> {analysis.characterCount}</div>
            
            {analysis.uniqueChords.length > 0 && (
              <div>
                <strong>Chords:</strong>
                <span style={{ marginLeft: '6px' }}>
                  {analysis.uniqueChords.join(', ')}
                  {analysis.uniqueChords.length === 10 && '...'}
                </span>
              </div>
            )}
            
            {analysis.sections.length > 0 && (
              <div>
                <strong>Sections:</strong>
                <span style={{ marginLeft: '6px' }}>
                  {analysis.sections.length}
                </span>
              </div>
            )}
            
            {analysis.suggestedKeys.length > 0 && !chordProValidation.extractKey(value) && (
              <div>
                <strong>Suggested Keys:</strong>
                <span style={{ marginLeft: '6px', color: '#3b82f6' }}>
                  {analysis.suggestedKeys.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Editor/Preview */}
      {previewMode ? (
        <div style={{
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '16px',
          backgroundColor: 'white',
          minHeight: `${rows * 1.5}em`,
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {renderPreview()}
        </div>
      ) : (
        <FormTextarea
          label=""
          value={value}
          onChange={e => handleChange(e.target.value)}
          error={error}
          rows={rows}
          fontFamily="monospace"
          placeholder={placeholder}
          style={{
            lineHeight: '1.6',
            fontSize: '13px'
          }}
        />
      )}
      
      {/* Help panel */}
      {showHelp && (
        <div style={helpStyles}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#1e40af' }}>
            ChordPro Format Help
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div>
              <h5 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Metadata Directives</h5>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: '1.4' }}>
                <div>{'{title: Song Title}'}</div>
                <div>{'{artist: Artist Name}'}</div>
                <div>{'{key: G}'}</div>
                <div>{'{tempo: 120}'}</div>
                <div>{'{capo: 2}'}</div>
              </div>
            </div>
            
            <div>
              <h5 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Chords</h5>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: '1.4' }}>
                <div>[G] [C] [D] [Em] - Basic chords</div>
                <div>[Am7] [G/B] [Csus4] - Complex chords</div>
                <div>Place before the syllable they apply to</div>
              </div>
            </div>
            
            <div>
              <h5 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Sections</h5>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: '1.4' }}>
                <div>[Verse 1], [Chorus], [Bridge]</div>
                <div>[Intro], [Outro], [Pre-Chorus]</div>
                <div>Use to organize song structure</div>
              </div>
            </div>
            
            <div>
              <h5 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Example</h5>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: '1.4', backgroundColor: 'white', padding: '8px', borderRadius: '4px' }}>
                <div>{'{title: Amazing Grace}'}</div>
                <div>{'{key: G}'}</div>
                <div></div>
                <div>[Verse 1]</div>
                <div>[G]Amazing [D]grace</div>
                <div>How [Em]sweet the [C]sound</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}