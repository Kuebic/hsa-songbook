import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { useInlineEdit } from '../useInlineEdit'

describe('useInlineEdit', () => {
  const validator = z.string().min(1)
  const mockSave = vi.fn()
  
  it('should initialize with provided value', () => {
    const { result } = renderHook(() => 
      useInlineEdit({
        initialValue: 'Test',
        validator,
        onSave: mockSave
      })
    )
    
    expect(result.current.value).toBe('Test')
    expect(result.current.isEditing).toBe(false)
  })
  
  it('should handle edit lifecycle', async () => {
    const { result } = renderHook(() => 
      useInlineEdit({
        initialValue: 'Test',
        validator,
        onSave: mockSave
      })
    )
    
    // Start editing
    act(() => {
      result.current.startEdit()
    })
    expect(result.current.isEditing).toBe(true)
    
    // Update value
    act(() => {
      result.current.updateValue('Updated')
    })
    expect(result.current.value).toBe('Updated')
    
    // Save
    mockSave.mockResolvedValueOnce(undefined)
    await act(async () => {
      await result.current.saveEdit()
    })
    
    expect(mockSave).toHaveBeenCalledWith('Updated')
    expect(result.current.isEditing).toBe(false)
  })
  
  it('should validate before saving', async () => {
    const { result } = renderHook(() => 
      useInlineEdit({
        initialValue: 'Test',
        validator,
        onSave: mockSave
      })
    )
    
    act(() => {
      result.current.startEdit()
      result.current.updateValue('') // Invalid empty string
    })
    
    await act(async () => {
      await result.current.saveEdit()
    })
    
    expect(result.current.error).toBeTruthy()
    expect(mockSave).not.toHaveBeenCalled()
  })
  
  it('should handle save errors', async () => {
    const mockError = new Error('Network error')
    mockSave.mockRejectedValueOnce(mockError)
    
    const { result } = renderHook(() => 
      useInlineEdit({
        initialValue: 'Test',
        validator,
        onSave: mockSave
      })
    )
    
    act(() => {
      result.current.startEdit()
      result.current.updateValue('Valid')
    })
    
    await act(async () => {
      await result.current.saveEdit()
    })
    
    expect(result.current.error).toBe('Network error')
    expect(result.current.isEditing).toBe(true) // Stay in edit mode on error
  })
  
  it('should cancel edit and restore original value', () => {
    const { result } = renderHook(() => 
      useInlineEdit({
        initialValue: 'Original',
        validator,
        onSave: mockSave
      })
    )
    
    act(() => {
      result.current.startEdit()
      result.current.updateValue('Modified')
    })
    
    expect(result.current.value).toBe('Modified')
    
    act(() => {
      result.current.cancelEdit()
    })
    
    expect(result.current.value).toBe('Original')
    expect(result.current.isEditing).toBe(false)
  })
})