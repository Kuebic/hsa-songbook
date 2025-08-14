import { useState, useCallback } from 'react'
import { chordProService } from '../../../services/chordProService'

export interface EditorTranspositionState {
  previewSemitones: number      // For live preview only
  appliedSemitones: number      // Actually applied to content
  isPreviewMode: boolean        // Preview vs applied mode
  originalContent: string       // Preserve original
  transposedContent: string     // After applying
  currentKey?: string           // Current key of the song
}

export function useEditorTransposition(
  content: string,
  onChange?: (content: string) => void
) {
  // Extract key from content
  const extractKey = (chordProContent: string): string | undefined => {
    const keyMatch = chordProContent.match(/\{key:\s*([^}]+)\}/i)
    return keyMatch ? keyMatch[1] : undefined
  }
  
  const [state, setState] = useState<EditorTranspositionState>({
    previewSemitones: 0,
    appliedSemitones: 0,
    isPreviewMode: false,
    originalContent: content,
    transposedContent: content,
    currentKey: extractKey(content)
  })
  
  // Update original content when it changes externally
  const updateOriginalContent = useCallback((newContent: string) => {
    setState(prev => ({
      ...prev,
      originalContent: newContent,
      transposedContent: newContent,
      currentKey: extractKey(newContent),
      previewSemitones: 0,
      appliedSemitones: 0,
      isPreviewMode: false
    }))
  }, [])
  
  // Preview transpose (doesn't modify actual content)
  const previewTranspose = useCallback((steps: number) => {
    setState(prev => {
      const newSemitones = Math.max(-12, Math.min(12, prev.previewSemitones + steps))
      return {
        ...prev,
        previewSemitones: newSemitones,
        isPreviewMode: newSemitones !== 0
      }
    })
  }, [])
  
  // Set absolute preview semitones
  const setPreviewSemitones = useCallback((semitones: number) => {
    setState(prev => ({
      ...prev,
      previewSemitones: Math.max(-12, Math.min(12, semitones)),
      isPreviewMode: semitones !== 0
    }))
  }, [])
  
  // Apply transposition to actual content
  const applyTransposition = useCallback(() => {
    if (!onChange) return
    
    try {
      const transposed = chordProService.transpose(
        state.originalContent,
        state.previewSemitones
      )
      
      // Update key directive if present
      const newKey = state.currentKey ? transposeKeyDirective(state.currentKey, state.previewSemitones) : undefined
      let finalContent = transposed
      
      if (newKey) {
        // Update or add key directive
        if (finalContent.match(/\{key:\s*[^}]+\}/i)) {
          finalContent = finalContent.replace(
            /\{key:\s*[^}]+\}/i,
            `{key: ${newKey}}`
          )
        } else {
          // Add key directive after title if present, otherwise at the beginning
          const titleMatch = finalContent.match(/(\{title:[^}]+\})/i)
          if (titleMatch) {
            const insertIndex = titleMatch.index! + titleMatch[0].length
            finalContent = 
              finalContent.slice(0, insertIndex) + 
              `\n{key: ${newKey}}` + 
              finalContent.slice(insertIndex)
          } else {
            finalContent = `{key: ${newKey}}\n${finalContent}`
          }
        }
      }
      
      onChange(finalContent)
      
      setState(prev => ({
        ...prev,
        originalContent: finalContent,
        transposedContent: finalContent,
        appliedSemitones: prev.appliedSemitones + prev.previewSemitones,
        previewSemitones: 0,
        isPreviewMode: false,
        currentKey: newKey || prev.currentKey
      }))
    } catch (error) {
      console.error('Failed to apply transposition:', error)
    }
  }, [state.originalContent, state.previewSemitones, state.currentKey, onChange])
  
  // Reset preview (cancel without applying)
  const cancelPreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      previewSemitones: 0,
      isPreviewMode: false
    }))
  }, [])
  
  // Reset to original key
  const resetTransposition = useCallback(() => {
    if (!onChange || state.appliedSemitones === 0) return
    
    try {
      // Transpose back by negative of applied semitones
      const original = chordProService.transpose(
        state.transposedContent,
        -state.appliedSemitones
      )
      
      onChange(original)
      
      setState(prev => ({
        ...prev,
        originalContent: original,
        transposedContent: original,
        appliedSemitones: 0,
        previewSemitones: 0,
        isPreviewMode: false,
        currentKey: extractKey(original)
      }))
    } catch (error) {
      console.error('Failed to reset transposition:', error)
    }
  }, [state.transposedContent, state.appliedSemitones, onChange])
  
  // Helper function to transpose key
  const transposeKeyDirective = (key: string, semitones: number): string => {
    const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const KEY_ALIASES: Record<string, string> = {
      'Db': 'C#',
      'Eb': 'D#',
      'Gb': 'F#',
      'Ab': 'G#',
      'Bb': 'A#'
    }
    
    const isMinor = key.endsWith('m')
    const baseKey = isMinor ? key.slice(0, -1) : key
    const normalizedKey = KEY_ALIASES[baseKey] || baseKey
    
    const keyIndex = KEYS.indexOf(normalizedKey)
    if (keyIndex === -1) return key
    
    const newIndex = (keyIndex + semitones + 12 * 100) % 12
    const newKey = KEYS[newIndex]
    
    return isMinor ? `${newKey}m` : newKey
  }
  
  // Calculate if we can transpose
  const canTransposeUp = state.previewSemitones < 12
  const canTransposeDown = state.previewSemitones > -12
  const hasChanges = state.previewSemitones !== 0
  const isTransposed = state.appliedSemitones !== 0
  
  return {
    ...state,
    previewTranspose,
    setPreviewSemitones,
    applyTransposition,
    cancelPreview,
    resetTransposition,
    updateOriginalContent,
    canTransposeUp,
    canTransposeDown,
    hasChanges,
    isTransposed
  }
}