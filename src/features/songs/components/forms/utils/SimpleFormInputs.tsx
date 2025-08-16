import React from 'react'

// Simple Input component that accepts value/onChange directly
interface SimpleInputProps {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search' | 'number'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  min?: number
  max?: number
  helperText?: string
  showCharacterCount?: boolean
}

export function SimpleInput({
  name,
  label,
  value,
  onChange,
  error = '',
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
  maxLength,
  minLength,
  pattern,
  min,
  max,
  helperText,
  showCharacterCount = false
}: SimpleInputProps) {
  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid',
    borderColor: error ? 'var(--color-destructive)' : 'var(--color-border)',
    borderRadius: '6px',
    backgroundColor: disabled ? 'var(--color-muted)' : 'var(--color-card)',
    color: 'var(--text-primary)',
    transition: 'border-color 0.15s ease-in-out',
    outline: 'none'
  }

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)'
  }

  const errorStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--color-destructive)'
  }

  const helperStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
  }

  const fieldStyles: React.CSSProperties = {
    marginBottom: '16px'
  }

  const characterCountStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textAlign: 'right'
  }

  return (
    <div style={fieldStyles}>
      <label htmlFor={name} style={labelStyles}>
        {label}
        {required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        min={min}
        max={max}
        style={inputStyles}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {showCharacterCount && maxLength && (
        <div style={characterCountStyles}>
          {value.length}/{maxLength}
        </div>
      )}
      {helperText && !error && (
        <div style={helperStyles}>{helperText}</div>
      )}
      {error && (
        <div id={`${name}-error`} style={errorStyles} role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

// Simple Textarea component
interface SimpleTextareaProps {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  maxLength?: number
  helperText?: string
  showCharacterCount?: boolean
  autoResize?: boolean
}

export function SimpleTextarea({
  name,
  label,
  value,
  onChange,
  error = '',
  placeholder = '',
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  helperText,
  showCharacterCount = false,
  autoResize = false
}: SimpleTextareaProps) {
  const textareaStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid',
    borderColor: error ? 'var(--color-destructive)' : 'var(--color-border)',
    borderRadius: '6px',
    backgroundColor: disabled ? 'var(--color-muted)' : 'var(--color-card)',
    color: 'var(--text-primary)',
    transition: 'border-color 0.15s ease-in-out',
    outline: 'none',
    resize: autoResize ? 'vertical' : 'none',
    fontFamily: 'inherit'
  }

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)'
  }

  const errorStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--color-destructive)'
  }

  const helperStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
  }

  const fieldStyles: React.CSSProperties = {
    marginBottom: '16px'
  }

  const characterCountStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textAlign: 'right'
  }

  return (
    <div style={fieldStyles}>
      <label htmlFor={name} style={labelStyles}>
        {label}
        {required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        style={textareaStyles}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {showCharacterCount && maxLength && (
        <div style={characterCountStyles}>
          {value.length}/{maxLength}
        </div>
      )}
      {helperText && !error && (
        <div style={helperStyles}>{helperText}</div>
      )}
      {error && (
        <div id={`${name}-error`} style={errorStyles} role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

// Simple Checkbox component
interface SimpleCheckboxProps {
  name: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  disabled?: boolean
  helperText?: string
}

export function SimpleCheckbox({
  name,
  label,
  checked,
  onChange,
  error = '',
  disabled = false,
  helperText
}: SimpleCheckboxProps) {
  const containerStyles: React.CSSProperties = {
    marginBottom: '16px'
  }

  const labelStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: 'var(--text-primary)',
    cursor: disabled ? 'not-allowed' : 'pointer'
  }

  const checkboxStyles: React.CSSProperties = {
    marginRight: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer'
  }

  const errorStyles: React.CSSProperties = {
    marginTop: '4px',
    fontSize: '12px',
    color: 'var(--color-destructive)'
  }

  const helperStyles: React.CSSProperties = {
    marginTop: '4px',
    marginLeft: '24px',
    fontSize: '12px',
    color: 'var(--text-secondary)'
  }

  return (
    <div style={containerStyles}>
      <label style={labelStyles}>
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={checkboxStyles}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {label}
      </label>
      {helperText && !error && (
        <div style={helperStyles}>{helperText}</div>
      )}
      {error && (
        <div id={`${name}-error`} style={errorStyles} role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

// Row component for side-by-side layout
interface SimpleRowProps {
  children: React.ReactNode
}

export function SimpleRow({ children }: SimpleRowProps) {
  const rowStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '16px'
  }

  return <div style={rowStyles}>{children}</div>
}

// Section component
interface SimpleSectionProps {
  title: string
  children: React.ReactNode
}

export function SimpleSection({ title, children }: SimpleSectionProps) {
  const sectionStyles: React.CSSProperties = {
    marginBottom: '24px'
  }

  const titleStyles: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--color-border)'
  }

  return (
    <div style={sectionStyles}>
      <h3 style={titleStyles}>{title}</h3>
      {children}
    </div>
  )
}