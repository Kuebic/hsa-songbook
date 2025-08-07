import { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'

interface UseInlineEditOptions<T> {
  initialValue: T
  validator: z.ZodSchema<T>
  onSave: (value: T) => Promise<void>
  onError?: (error: Error) => void
}

interface UseInlineEditReturn<T> {
  value: T
  isEditing: boolean
  isPending: boolean
  error: string | null
  startEdit: () => void
  cancelEdit: () => void
  saveEdit: () => Promise<void>
  updateValue: (value: T) => void
}

export function useInlineEdit<T>({
  initialValue,
  validator,
  onSave,
  onError
}: UseInlineEditOptions<T>): UseInlineEditReturn<T> {
  const [value, setValue] = useState<T>(initialValue)
  const [originalValue, setOriginalValue] = useState<T>(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Update original value when initialValue changes
  useEffect(() => {
    setValue(initialValue)
    setOriginalValue(initialValue)
  }, [initialValue])
  
  const startEdit = useCallback(() => {
    setIsEditing(true)
    setError(null)
  }, [])
  
  const cancelEdit = useCallback(() => {
    setValue(originalValue)
    setIsEditing(false)
    setError(null)
  }, [originalValue])
  
  const saveEdit = useCallback(async () => {
    const validation = validator.safeParse(value)
    
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Validation failed')
      return
    }
    
    setIsPending(true)
    setError(null)
    
    try {
      await onSave(validation.data)
      setOriginalValue(validation.data)
      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed'
      setError(message)
      onError?.(err as Error)
    } finally {
      setIsPending(false)
    }
  }, [value, validator, onSave, onError])
  
  const updateValue = useCallback((newValue: T) => {
    setValue(newValue)
    setError(null)
  }, [])
  
  return {
    value,
    isEditing,
    isPending,
    error,
    startEdit,
    cancelEdit,
    saveEdit,
    updateValue
  }
}