import { useParams } from 'react-router-dom'
import { useArrangementViewer } from '../hooks/useArrangementViewer'
import { useMinimalMode } from '../hooks/useMinimalMode'
import { useTransposition } from '../hooks/useTransposition'
import { useChordSheetSettings } from '../hooks/useChordSheetSettings'
import { ViewerHeader } from '../components/ViewerHeader'
import { ViewerControls } from '../components/ViewerControls'
import { ChordSheetViewer } from '../components/ChordSheetViewer'

export function ArrangementViewerPage() {
  const { slug } = useParams<{ slug: string }>()
  const { arrangement, loading, error } = useArrangementViewer(slug!)
  const { isMinimal: isMinimalMode, toggleMinimal } = useMinimalMode()
  const { 
    fontSize, 
    scrollSpeed, 
    isScrolling,
    setFontSize,
    setScrollSpeed,
    toggleScroll
  } = useChordSheetSettings()
  
  // Use transposition hook only when arrangement is loaded
  const { currentKey } = useTransposition()
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.125rem',
        color: '#64748b'
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
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h2 style={{
            color: '#991b1b',
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            Error loading arrangement
          </h2>
          <p style={{
            color: '#dc2626',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
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
        color: '#64748b'
      }}>
        Arrangement not found
      </div>
    )
  }
  
  const handleTranspose = (semitones: number) => {
    // This would need to be implemented to handle transposition
    console.log('Transpose by', semitones)
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isMinimalMode ? '#000000' : '#f9fafb',
      color: isMinimalMode ? '#ffffff' : '#1e293b'
    }}>
      {!isMinimalMode && (
        <ViewerHeader arrangement={arrangement} />
      )}
      
      <main style={{
        padding: isMinimalMode ? '1rem' : '2rem',
        maxWidth: isMinimalMode ? '100%' : '1200px',
        margin: '0 auto'
      }}>
        <ChordSheetViewer
          chordProText={arrangement.chordProText}
          className={isMinimalMode ? 'dark-mode' : ''}
        />
      </main>
      
      <ViewerControls
        currentKey={currentKey || arrangement.key || 'C'}
        onTranspose={handleTranspose}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        scrollSpeed={scrollSpeed}
        onScrollSpeedChange={setScrollSpeed}
        isScrolling={isScrolling}
        onToggleScroll={toggleScroll}
        isMinimalMode={isMinimalMode}
        onToggleMinimalMode={toggleMinimal}
      />
    </div>
  )
}