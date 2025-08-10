import { useState, useCallback, useEffect } from 'react'
import { useDebounce } from './useDebounce'
import { useChordProValidation } from './useChordProValidation'

/**
 * Comprehensive editor state management hook with undo/redo functionality
 */
export function useChordEditor(initialContent: string) {
  const [content, setContent] = useState(initialContent)
  const [history, setHistory] = useState<string[]>([initialContent])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isDirty, setIsDirty] = useState(false)
  
  // Debounce content for validation to avoid excessive parsing
  const debouncedContent = useDebounce(content, 300)
  const validation = useChordProValidation(debouncedContent)
  
  // Update content with history tracking
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent)
    setIsDirty(newContent !== initialContent)
    
    // Update history for undo/redo
    setHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), newContent]
      // Limit history to 50 items to prevent memory issues
      if (newHistory.length > 50) {
        return newHistory.slice(-50)
      }
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
  }, [historyIndex, initialContent])
  
  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex])
      setIsDirty(history[newIndex] !== initialContent)
    }
  }, [history, historyIndex, initialContent])
  
  // Redo functionality
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex])
      setIsDirty(history[newIndex] !== initialContent)
    }
  }, [history, historyIndex, initialContent])
  
  // Reset dirty state when initial content changes
  useEffect(() => {
    setIsDirty(content !== initialContent)
  }, [initialContent, content])
  
  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])
  
  return {
    content,
    setContent: updateContent,
    isDirty,
    validation,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    reset: () => {
      setContent(initialContent)
      setHistory([initialContent])
      setHistoryIndex(0)
      setIsDirty(false)
    }
  }
}