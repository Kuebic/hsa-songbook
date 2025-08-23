import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useArrangementViewer } from '../hooks/useArrangementViewer'
import { useTransposition } from '../hooks/useTransposition'
import { useTransposeKeyboard } from '../hooks/useTransposeKeyboard'
import { usePrint } from '../hooks/usePrint'
import { extractKeyFromChordPro } from '../utils/chordProUtils'
import { ViewerLayout } from '../components/ViewerLayout'
import { ViewerHeader } from '../components/ViewerHeader'
import { ViewerToolbar } from '../components/ViewerToolbar'
import { ChordSheetViewer } from '../components/ChordSheetViewer'
import { StageCustomizer } from '../components/StageCustomizer'
import { CollapsibleToolbar } from '@features/responsive/components/CollapsibleToolbar'
import { useViewport } from '@features/responsive/hooks/useViewport'
import '../styles/viewer-layout.css'
import '../styles/transpose.css'

export function ArrangementViewerPage() {
  const { slug } = useParams<{ slug: string }>()
  const { arrangement, loading, error } = useArrangementViewer(slug!)
  const { handlePrint, printRef } = usePrint()
  const viewport = useViewport()
  const [_toolbarHeight, setToolbarHeight] = useState(0)
  
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
    true // Always enable keyboard shortcuts
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
  
  // Handle floating action button clicks
  useEffect(() => {
    const handleToolbarAction = (e: CustomEvent) => {
      const action = e.detail.action
      
      switch (action) {
        case 'transpose':
          // Simple transpose up action for FAB
          transpositionState.transpose(1)
          break
        default:
          break
      }
    }
    
    window.addEventListener('toolbar-action', handleToolbarAction as EventListener)
    
    return () => {
      window.removeEventListener('toolbar-action', handleToolbarAction as EventListener)
    }
  }, [transpositionState])
  
  // Handle toolbar visibility change
  const handleToolbarVisibilityChange = useCallback((_visible: boolean, height: number) => {
    setToolbarHeight(height)
  }, [])
  
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
    <>
      {/* Stage customization when in stage theme */}
      <StageCustomizer arrangementId={arrangement.id} />
      
      <ViewerLayout
      header={<ViewerHeader arrangement={arrangement} />}
      toolbar={
        (
          viewport.isMobile ? (
            <CollapsibleToolbar
              // Core Behavior
              autoHide={true}
              autoHideDelay={3000}
              defaultVisible={true}
              
              // Device-Specific Settings
              autoHideOnMobile={true}
              autoHideOnTablet={true}
              autoHideOnDesktop={false}
              
              // Scroll Behavior
              showOnScrollUp={true}
              hideOnScrollDown={true}
              scrollThreshold={10}
              
              // Activity Detection
              detectMouse={true}
              detectTouch={true}
              detectKeyboard={true}
              
              // Floating Actions
              showFloatingActions={true}
              floatingActions={[]}
              
              // Callbacks
              onVisibilityChange={handleToolbarVisibilityChange}
              
              // Persistence
              persistKey={`toolbar-state-${arrangement.id}`}
              enablePersistence={true}
              
              // Manual Control
              showToggleButton={true}
              toggleButtonPosition="right"
            >
              <ViewerToolbar
                onPrint={handlePrint}
                arrangementId={arrangement.id}
                transposition={transpositionState}
              />
            </CollapsibleToolbar>
          ) : (
            <CollapsibleToolbar
              // Desktop configuration
              autoHide={false}
              autoHideOnDesktop={false}
              showFloatingActions={false}
              showToggleButton={false}
              defaultVisible={true}  // Ensure toolbar is visible by default
              onVisibilityChange={handleToolbarVisibilityChange}
              persistKey={`toolbar-state-${arrangement.id}`}
              enablePersistence={true}
            >
              <ViewerToolbar
                onPrint={handlePrint}
                arrangementId={arrangement.id}
                transposition={transpositionState}
              />
            </CollapsibleToolbar>
          )
        )
      }
      onToolbarHeightChange={setToolbarHeight}
      content={
        <div ref={printRef} style={{ height: '100%' }}>
          <ChordSheetViewer 
            chordProText={arrangement.chordProText}
            transposition={transpositionState.semitones}
          />
        </div>
      }
      controls={null}
    />
    </>
  )
}