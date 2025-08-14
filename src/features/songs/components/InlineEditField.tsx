import { useRef, useEffect, type KeyboardEvent } from 'react'
import { useInlineEdit } from '../hooks/useInlineEdit'
import { z } from 'zod'

interface InlineEditFieldProps {
  value: string
  onSave: (value: string) => Promise<void>
  validator?: z.ZodSchema<string>
  placeholder?: string
  ariaLabel: string
  canEdit: boolean
}

export function InlineEditField({
  value,
  onSave,
  validator = z.string().min(1, 'Required').max(200),
  placeholder = 'Enter value...',
  ariaLabel,
  canEdit
}: InlineEditFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const {
    value: currentValue,
    isEditing,
    isPending,
    error,
    startEdit,
    cancelEdit,
    saveEdit,
    updateValue
  } = useInlineEdit({
    initialValue: value,
    validator,
    onSave
  })
  
  // Focus management
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    } else if (!isEditing && buttonRef.current) {
      buttonRef.current.focus()
    }
  }, [isEditing])
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }
  
  if (!canEdit) {
    return (
      <span title="Sign in to edit this field" style={{ cursor: 'not-allowed' }}>
        {value}
      </span>
    )
  }
  
  if (isEditing) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          ref={inputRef}
          type="text"
          value={currentValue}
          onChange={(e) => updateValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          disabled={isPending}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={!!error}
          aria-describedby={error ? 'edit-error' : 'edit-hint'}
          style={{
            fontSize: 'inherit',
            fontWeight: 'inherit',
            padding: '0.25rem 0.5rem',
            border: error ? '2px solid var(--status-error)' : '2px solid var(--status-info)',
            borderRadius: '4px',
            outline: 'none',
            background: isPending ? 'var(--color-secondary)' : 'var(--color-background)'
          }}
        />
        <span id="edit-hint" className="visually-hidden">
          Press Enter to save, Escape to cancel
        </span>
        {error && (
          <span id="edit-error" role="alert" style={{ color: 'var(--status-error)', fontSize: '0.875rem' }}>
            {error}
          </span>
        )}
      </div>
    )
  }
  
  return (
    <button
      ref={buttonRef}
      onClick={startEdit}
      aria-label={`${ariaLabel}. Click to edit.`}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
        cursor: 'pointer',
        textAlign: 'inherit',
        color: 'inherit',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'opacity 0.2s'
      }}
      className="inline-edit-button"
    >
      <span>{currentValue}</span>
      <span 
        className="edit-icon"
        style={{
          opacity: 0,
          transition: 'opacity 0.2s',
          fontSize: '0.875em',
          color: 'var(--status-info)'
        }}
      >
        ✏️
      </span>
      <style>{`
        .inline-edit-button:hover .edit-icon,
        .inline-edit-button:focus .edit-icon {
          opacity: 1;
        }
      `}</style>
    </button>
  )
}