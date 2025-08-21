import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useArrangementViewer } from '../hooks/useArrangementViewer'
import { useTransposition } from '../hooks/useTransposition'
import { useTransposeKeyboard } from '../hooks/useTransposeKeyboard'
import { useChordSheetSettings } from '../hooks/useChordSheetSettings'
import { usePrint } from '../hooks/usePrint'
import { useStageMode } from '../hooks/useStageMode'
import { extractKeyFromChordPro } from '../utils/chordProUtils'
import { ViewerLayout } from '../components/ViewerLayout'
import { ViewerHeader } from '../components/ViewerHeader'
import { ViewerToolbar } from '../components/ViewerToolbar'
import { ViewerControls } from '../components/ViewerControls'
import { ChordSheetViewer } from '../components/ChordSheetViewer'
import { CollapsibleToolbar } from '@features/responsive/components/CollapsibleToolbar'
import { useViewport } from '@features/responsive/hooks/useViewport'
import '../styles/viewer-layout.css'
import '../styles/stage-mode.css'
import '../styles/transpose.css'

export function ArrangementViewerPage() {
  const { slug } = useParams<{ slug: string }>()
  const { arrangement, loading, error } = useArrangementViewer(slug!)
  const { isStageMode, toggleStageMode } = useStageMode()
  const { handlePrint, printRef } = usePrint()
  const { 
    fontSize,
    setFontSize
  } = useChordSheetSettings()
  const viewport = useViewport()
  
  // Extract the original key from the ChordPro content
  const originalKey = useMemo(() => {
    if (arrangement?.chordProText) {
      // First try to get key from ChordPro directive
      const keyFromContent = extractKeyFromChordPro(arrangement.chordProText)
      if (keyFromContent) return keyFromContent
    }
    // Fallback to arrangement's key field
    return arrangement?.key
  }, [arrangement?.chordProText, arrangement?.key])
  
  // Use transposition hook with the extracted key
  const transpositionState = useTransposition(originalKey, {
    persist: true,
    persistKey: arrangement?.id || 'default'
  })
  
  // Enable keyboard shortcuts for transposition
  useTransposeKeyboard(
    transpositionState.transpose,
    transpositionState.reset,
    !isStageMode // Disable in stage mode as it has its own controls
  )
  
  // Keyboard shortcuts for print - MUST be before any conditional returns
  useEffect(() => {
    const handleKeyboardPrint = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        handlePrint()
      }
    }
    
    window.addEventListener('keydown', handleKeyboardPrint)
    return () => {
      window.removeEventListener('keydown', handleKeyboardPrint)
    }
  }, [handlePrint])
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.125rem',
        color: 'var(--text-secondary)'
      }}>
        Loading arrangement...
      </div>
    )
  }
  
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--color-muted)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h2 style={{
            color: 'var(--status-error)',
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            Error loading arrangement
          </h2>
          <p style={{
            color: 'var(--status-error)',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--status-error)',
              color: 'var(--color-background)',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  if (!arrangement) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.125rem',
        color: 'var(--text-secondary)'
      }}>
        Arrangement not found
      </div>
    )
  }
  
  
  return (
    <ViewerLayout
      header={!isStageMode && <ViewerHeader arrangement={arrangement} />}
      toolbar={
        !isStageMode && (
          viewport.isMobile ? (
            <CollapsibleToolbar
              autoHide={true}
              showFloatingActions={true}
              floatingActions={['transpose', 'stage']}
            >
              <ViewerToolbar
                onPrint={handlePrint}
                onToggleStageMode={toggleStageMode}
                isStageMode={isStageMode}
                transposition={transpositionState}
              />
            </CollapsibleToolbar>
          ) : (
            <ViewerToolbar
              onPrint={handlePrint}
              onToggleStageMode={toggleStageMode}
              isStageMode={isStageMode}
              transposition={transpositionState}
            />
          )
        )
      }
      content={
        <div ref={printRef} style={{ height: '100%' }}>
          <ChordSheetViewer 
            chordProText={arrangement.chordProText}
            isStageMode={isStageMode}
            transposition={transpositionState.semitones}
          />
        </div>
      }
      controls={
        isStageMode ? (
          <ViewerControls
            transposition={transpositionState}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            isMinimalMode={true}
            onToggleMinimalMode={toggleStageMode}
          />
        ) : null
      }
    />
  )
}