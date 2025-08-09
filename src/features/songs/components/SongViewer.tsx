import { useState, useEffect } from 'react'
import { SongTitleEdit } from './SongTitleEdit'
import { ArrangementSwitcher } from './arrangements/ArrangementSwitcher'
import type { Song, Arrangement } from '../types/song.types'

interface SongViewerProps {
  song: Song
  arrangement?: Arrangement // Backward compatibility for single arrangement
  arrangements?: Arrangement[] // New: support multiple arrangements
  selectedArrangementId?: string // New: externally controlled selection
  onArrangementSelect?: (id: string) => void // New: callback for selection
}

export function SongViewer({ 
  song: initialSong, 
  arrangement,
  arrangements,
  selectedArrangementId,
  onArrangementSelect
}: SongViewerProps) {
  // Local state to handle optimistic updates
  const [song, setSong] = useState(initialSong)
  const [localSelectedId, setLocalSelectedId] = useState<string | undefined>(selectedArrangementId)
  
  // Update local state when prop changes
  useEffect(() => {
    setSong(initialSong)
  }, [initialSong])
  
  // Update selected ID when prop changes
  useEffect(() => {
    setLocalSelectedId(selectedArrangementId)
  }, [selectedArrangementId])
  
  // Determine which arrangements to use (backward compatibility)
  const effectiveArrangements = arrangements || (arrangement ? [arrangement] : [])
  
  // Auto-select first arrangement if none selected
  useEffect(() => {
    if (effectiveArrangements.length > 0 && !localSelectedId) {
      setLocalSelectedId(effectiveArrangements[0].id)
    }
  }, [effectiveArrangements, localSelectedId])
  
  // Find the currently selected arrangement
  const selectedArrangement = effectiveArrangements.find(a => a.id === localSelectedId) || arrangement
  
  const handleArrangementSelect = (id: string) => {
    setLocalSelectedId(id)
    onArrangementSelect?.(id)
  }
  
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          <SongTitleEdit 
            song={song} 
            onUpdate={setSong}
          />
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.125rem' }}>
          {song.artist} {song.compositionYear && `(${song.compositionYear})`}
        </p>
        {song.ccli && (
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            CCLI: {song.ccli}
          </p>
        )}
      </header>

      {effectiveArrangements.length > 1 && (
        <ArrangementSwitcher
          arrangements={effectiveArrangements}
          selectedId={localSelectedId}
          onSelect={handleArrangementSelect}
        />
      )}

      {selectedArrangement && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '1rem',
            flexWrap: 'wrap' 
          }}>
            <span style={{ 
              padding: '0.25rem 0.75rem', 
              backgroundColor: '#f1f5f9',
              borderRadius: '4px' 
            }}>
              Key: {selectedArrangement.key}
            </span>
            {selectedArrangement.tempo && (
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                backgroundColor: '#f1f5f9',
                borderRadius: '4px' 
              }}>
                Tempo: {selectedArrangement.tempo} BPM
              </span>
            )}
            {selectedArrangement.timeSignature && (
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                backgroundColor: '#f1f5f9',
                borderRadius: '4px' 
              }}>
                Time: {selectedArrangement.timeSignature}
              </span>
            )}
            <span style={{ 
              padding: '0.25rem 0.75rem', 
              backgroundColor: '#f1f5f9',
              borderRadius: '4px' 
            }}>
              Difficulty: {selectedArrangement.difficulty}
            </span>
          </div>

          <div style={{ 
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '1rem',
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap'
          }}>
            {selectedArrangement.chordData}
          </div>
        </div>
      )}

      {song.notes && (
        <div style={{ 
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <strong>Notes:</strong> {song.notes}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Themes</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {song.themes?.map(theme => (
            <span 
              key={theme}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#e0f2fe',
                borderRadius: '4px',
                color: '#0369a1'
              }}
            >
              {theme}
            </span>
          )) || <span style={{ color: '#64748b', fontStyle: 'italic' }}>No themes available</span>}
        </div>
      </div>

      {song.source && (
        <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
          Source: {song.source}
        </p>
      )}
    </div>
  )
}