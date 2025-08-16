import { useEffect } from 'react'
import { ViewerLayout } from '../../../arrangements/components/ViewerLayout'
import { ChordSheetViewer } from '../../../arrangements/components/ChordSheetViewer'
import { useTransposition } from '../../../arrangements/hooks/useTransposition'
import { PlaybackHeader } from './PlaybackHeader'
import { PlaybackControls } from './PlaybackControls'
import { PlaybackKeySelector } from './PlaybackKeySelector'
import { usePlaybackMode } from '../../hooks/usePlaybackMode'

interface PlaybackModeProps {
  setlistId: string
  initialIndex?: number
}

function getSemitonesFromKeys(originalKey?: string, targetKey?: string): number {
  if (!originalKey || !targetKey || originalKey === targetKey) return 0
  
  const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const fromIndex = KEYS.indexOf(originalKey.replace('m', ''))
  const toIndex = KEYS.indexOf(targetKey.replace('m', ''))
  
  let diff = toIndex - fromIndex
  if (diff > 6) diff -= 12
  if (diff < -6) diff += 12
  
  return diff
}

export function PlaybackMode({ setlistId, initialIndex = 0 }: PlaybackModeProps) {
  const {
    setlist,
    currentArrangement,
    currentIndex,
    totalCount,
    isLoading,
    error,
    canGoNext,
    canGoPrevious,
    navigateNext,
    navigatePrevious,
    jumpTo,
    exitPlayback,
    updateKey,
  } = usePlaybackMode(setlistId)
  
  // Transposition for current arrangement
  const transpositionState = useTransposition(
    currentArrangement?.arrangement?.key,
    {
      persist: true,
      persistKey: `playback-${currentArrangement?.arrangementId}`,
    }
  )
  
  // Set initial transposition based on playback key
  useEffect(() => {
    if (currentArrangement?.playbackKey && currentArrangement?.arrangement?.key) {
      const semitones = getSemitonesFromKeys(
        currentArrangement.arrangement.key,
        currentArrangement.playbackKey
      )
      transpositionState.setTransposition(semitones)
    }
  }, [currentArrangement?.arrangementId, currentArrangement?.playbackKey])
  
  // Handle key changes
  const handleKeyChange = (newKey: string) => {
    if (currentArrangement) {
      updateKey(currentArrangement.arrangementId, newKey)
      transpositionState.transposeToKey(newKey)
    }
  }
  
  // Jump to initial index on mount
  useEffect(() => {
    if (initialIndex > 0 && setlist) {
      jumpTo(initialIndex)
    }
  }, [initialIndex, setlist, jumpTo])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading playback mode...</div>
      </div>
    )
  }
  
  if (error || !currentArrangement) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">
          {error?.message || 'Failed to load arrangement'}
        </div>
        <button onClick={exitPlayback} className="ml-4 btn-secondary">
          Back to Setlist
        </button>
      </div>
    )
  }
  
  return (
    <ViewerLayout
      header={
        <PlaybackHeader
          setlistName={setlist?.name || ''}
          currentIndex={currentIndex}
          totalCount={totalCount}
          onExit={exitPlayback}
        />
      }
      toolbar={
        <div className="flex items-center gap-4 px-4 py-2">
          <PlaybackKeySelector
            currentKey={transpositionState.currentKey || currentArrangement.playbackKey}
            originalKey={currentArrangement.arrangement.key}
            onKeyChange={handleKeyChange}
          />
          <div className="text-sm text-muted">
            {currentArrangement.arrangement.name}
          </div>
        </div>
      }
      content={
        <ChordSheetViewer
          chordProText={currentArrangement.arrangement.content || ''}
          transposition={transpositionState.semitones}
        />
      }
      controls={
        <PlaybackControls
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          onNext={navigateNext}
          onPrevious={navigatePrevious}
          onJumpTo={jumpTo}
          arrangements={setlist?.arrangements || []}
          currentIndex={currentIndex}
        />
      }
    />
  )
}