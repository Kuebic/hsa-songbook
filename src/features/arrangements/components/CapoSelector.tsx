/**
 * @file CapoSelector.tsx
 * @description Capo position selector with chord shape suggestions
 */

import { useMemo } from 'react'
import { cn } from '../../../lib/utils'

interface CapoOption {
  position: number
  playKey: string
  chordShape: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface CapoSelectorProps {
  currentCapo: number
  currentKey?: string
  targetKey?: string
  onCapoChange: (capo: number) => void
  showChordShapes?: boolean
  className?: string
}

const COMMON_SHAPES = ['G', 'C', 'D', 'A', 'E', 'Em', 'Am', 'Dm']
const KEY_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function transposeKey(key: string, semitones: number): string {
  const isMinor = key.endsWith('m')
  const baseKey = isMinor ? key.slice(0, -1) : key
  
  const keyIndex = KEY_NOTES.indexOf(baseKey)
  if (keyIndex === -1) return key
  
  const newIndex = (keyIndex + semitones + 12 * 100) % 12
  const newKey = KEY_NOTES[newIndex]
  
  return isMinor ? `${newKey}m` : newKey
}

function getShapeDifficulty(shape: string): 'easy' | 'medium' | 'hard' {
  const easyShapes = ['G', 'C', 'D', 'Em', 'Am']
  const mediumShapes = ['A', 'E', 'Dm']
  
  if (easyShapes.includes(shape)) return 'easy'
  if (mediumShapes.includes(shape)) return 'medium'
  return 'hard'
}

function calculateCapoOptions(_originalKey: string, targetKey: string): CapoOption[] {
  const options: CapoOption[] = []
  
  for (const shape of COMMON_SHAPES) {
    for (let capo = 0; capo <= 11; capo++) {
      const resultKey = transposeKey(shape, capo)
      if (resultKey === targetKey) {
        options.push({
          position: capo,
          playKey: shape,
          chordShape: shape,
          difficulty: getShapeDifficulty(shape)
        })
      }
    }
  }
  
  return options.sort((a, b) => {
    // Sort by capo position first, then by difficulty
    if (a.position !== b.position) return a.position - b.position
    const difficultyOrder = { easy: 0, medium: 1, hard: 2 }
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
  })
}

export function CapoSelector({
  currentCapo,
  currentKey,
  targetKey,
  onCapoChange,
  showChordShapes = false,
  className
}: CapoSelectorProps) {
  const capoOptions = useMemo(() => {
    if (!currentKey || !targetKey) return []
    return calculateCapoOptions(currentKey, targetKey)
  }, [currentKey, targetKey])
  
  if (!showChordShapes) {
    // Simple capo position selector
    return (
      <div className={cn('capo-selector', className)}>
        <label className="capo-label text-sm font-medium">
          Capo:
          <select
            value={currentCapo}
            onChange={(e) => onCapoChange(Number(e.target.value))}
            className="ml-2 px-2 py-1 border rounded-md text-sm"
          >
            <option value={0}>None</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(pos => (
              <option key={pos} value={pos}>
                Fret {pos}
              </option>
            ))}
          </select>
        </label>
      </div>
    )
  }
  
  // Advanced capo calculator with chord shapes
  return (
    <div className={cn('capo-calculator', className)}>
      <h3 className="text-sm font-semibold mb-2">
        Capo Options {targetKey && `for ${targetKey}`}
      </h3>
      <div className="capo-options-grid grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {capoOptions.length > 0 ? (
          capoOptions.map((option, index) => (
            <button
              key={`${option.position}-${option.playKey}-${index}`}
              onClick={() => onCapoChange(option.position)}
              className={cn(
                'capo-option p-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800',
                'transition-colors duration-200',
                currentCapo === option.position && 'bg-blue-50 border-blue-300 dark:bg-blue-900'
              )}
            >
              <div className="capo-position font-semibold text-sm">
                Capo {option.position || 'None'}
              </div>
              <div className="play-key text-xs text-gray-600 dark:text-gray-400">
                Play {option.playKey}
              </div>
              <div className={cn(
                'chord-shape text-xs',
                option.difficulty === 'easy' && 'text-green-600',
                option.difficulty === 'medium' && 'text-yellow-600',
                option.difficulty === 'hard' && 'text-red-600'
              )}>
                {option.chordShape} shape
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full text-sm text-gray-500">
            No capo options available
          </div>
        )}
      </div>
    </div>
  )
}