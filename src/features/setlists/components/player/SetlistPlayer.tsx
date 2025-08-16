import { useEffect, useRef } from 'react'
import { Modal } from '@shared/components/modal'
import { ChordSheetViewer } from '@features/arrangements/components/ChordSheetViewer'
import { usePlayback } from '../../contexts/PlaybackContext'
import { PlayerControls } from './PlayerControls'
import { ProgressIndicator } from './ProgressIndicator'

export function SetlistPlayer() {
  const {
    setlist,
    currentIndex,
    isPlaying,
    isFullscreen,
    fontSize,
    autoScroll,
    scrollSpeed,
    next,
    previous,
    jumpTo,
    toggleFullscreen,
    setFontSize,
    setAutoScroll,
    setScrollSpeed,
    exit
  } = usePlayback()
  
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll implementation
  useEffect(() => {
    if (!autoScroll || !scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    let animationId: number
    
    const scroll = () => {
      container.scrollTop += scrollSpeed
      
      // Loop back to top when reaching bottom
      if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
        container.scrollTop = 0
      }
      
      animationId = requestAnimationFrame(scroll)
    }
    
    animationId = requestAnimationFrame(scroll)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [autoScroll, scrollSpeed])
  
  if (!setlist || !isPlaying) return null
  
  const currentArrangement = setlist.arrangements[currentIndex]
  if (!currentArrangement) return null
  
  return (
    <Modal
      isOpen={isPlaying}
      onClose={exit}
      size={isFullscreen ? 'fullscreen' : 'large'}
      closeOnEsc={!isFullscreen}
      closeOnOverlayClick={false}
      showCloseButton={!isFullscreen}
      className="setlist-player"
    >
      <div className="player-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div className="player-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0
        }}>
          <button onClick={exit} className="back-button" style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}>
            ← Back
          </button>
          
          <div className="song-info" style={{ textAlign: 'center', flex: 1 }}>
            <h2 style={{ 
              margin: '0 0 0.25rem 0', 
              fontSize: '1.25rem', 
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              {currentArrangement.arrangement?.name || 'Unknown Song'}
            </h2>
            <span className="position" style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)' 
            }}>
              {currentIndex + 1} of {setlist.arrangements.length}
            </span>
          </div>
          
          <button onClick={toggleFullscreen} className="fullscreen-button" style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
        
        {/* Progress */}
        <ProgressIndicator
          current={currentIndex}
          total={setlist.arrangements.length}
          onJumpTo={jumpTo}
        />
        
        {/* Arrangement Info Bar */}
        {(currentArrangement.keyOverride || currentArrangement.notes) && (
          <div className="arrangement-info" style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-muted)',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0
          }}>
            {currentArrangement.keyOverride && (
              <span className="key-info" style={{
                fontSize: '0.875rem',
                marginRight: '1rem',
                color: 'var(--text-primary)'
              }}>
                Key: {currentArrangement.arrangement.key} → {currentArrangement.keyOverride}
              </span>
            )}
            {currentArrangement.notes && (
              <div className="performance-notes" style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginTop: currentArrangement.keyOverride ? '0.25rem' : '0'
              }}>
                <strong>Notes:</strong> {currentArrangement.notes}
              </div>
            )}
          </div>
        )}
        
        {/* Arrangement Display */}
        <div 
          ref={scrollContainerRef}
          className="arrangement-display"
          style={{ 
            fontSize: `${fontSize}px`,
            flex: 1,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <ChordSheetViewer
            chordProText={currentArrangement.arrangement?.chordProText || currentArrangement.arrangement?.chordData || ''}
            isStageMode={isFullscreen}
            transposition={0} // TODO: Implement key transposition logic
            isScrolling={autoScroll}
            scrollSpeed={scrollSpeed}
          />
        </div>
        
        {/* Controls */}
        <PlayerControls
          onPrevious={previous}
          onNext={next}
          canGoPrevious={currentIndex > 0}
          canGoNext={currentIndex < setlist.arrangements.length - 1}
          autoScroll={autoScroll}
          onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          scrollSpeed={scrollSpeed}
          onScrollSpeedChange={setScrollSpeed}
        />
      </div>
    </Modal>
  )
}