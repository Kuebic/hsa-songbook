import React, { useState, useRef } from 'react'

interface SimpleChordEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function SimpleChordEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "ChordPro content (with song title and key pre-filled)...\n\nExample:\n{title: Amazing Grace}\n{key: G}\n{tempo: 90}\n\n[Verse]\n[G]Amazing [C]grace how [D]sweet the [G]sound\nThat [G]saved a [D]wretch like [G]me\n\n[Chorus]\n[C]How [G]sweet the [D]sound..."
}: SimpleChordEditorProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fieldStyles: React.CSSProperties = {
    marginBottom: '16px'
  }

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  }

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '200px',
    padding: '12px',
    fontSize: '13px',
    fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    border: '2px solid',
    borderColor: isDragOver ? '#3b82f6' : '#e2e8f0',
    borderRadius: '8px',
    backgroundColor: disabled ? '#f9fafb' : '#ffffff',
    transition: 'border-color 0.15s ease-in-out',
    outline: 'none',
    resize: 'vertical',
    lineHeight: '1.5'
  }

  const helperStyles: React.CSSProperties = {
    marginTop: '8px',
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.4'
  }

  const toolbarStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    padding: '8px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    fontSize: '12px'
  }

  const buttonStyles: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '11px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#374151'
  }

  const insertText = (textToInsert: string) => {
    if (!textareaRef.current || disabled) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.substring(0, start) + textToInsert + value.substring(end)
    
    onChange(newValue)
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedText = e.dataTransfer.getData('text/plain')
    if (droppedText) {
      onChange(value + '\n' + droppedText)
    }
  }

  const quickInserts = [
    { label: 'Verse', text: '\n[Verse]\n' },
    { label: 'Chorus', text: '\n[Chorus]\n' },
    { label: 'Bridge', text: '\n[Bridge]\n' },
    { label: 'Outro', text: '\n[Outro]\n' },
    { label: 'Key: C', text: '{key: C}\n' },
    { label: 'Key: G', text: '{key: G}\n' },
    { label: 'Tempo: 120', text: '{tempo: 120}\n' }
  ]

  return (
    <div style={fieldStyles}>
      <label htmlFor="chord-editor" style={labelStyles}>
        Chord & Lyrics (ChordPro Format) <span style={{ color: '#ef4444' }}>*</span>
      </label>
      
      {!disabled && (
        <div style={toolbarStyles}>
          <span style={{ fontSize: '11px', color: '#6b7280', marginRight: '8px' }}>Quick insert:</span>
          {quickInserts.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => insertText(item.text)}
              style={buttonStyles}
              title={`Insert ${item.label}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      
      <textarea
        ref={textareaRef}
        id="chord-editor"
        name="chordEditor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={textareaStyles}
        spellCheck={false}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-describedby="chord-editor-help"
      />

      <div id="chord-editor-help" style={helperStyles}>
        <div><strong>ChordPro Format:</strong></div>
        <div>• Use <code>[C]</code> for chords above lyrics</div>
        <div>• Use <code>{`{key: C}`}</code>, <code>{`{tempo: 120}`}</code> for musical info</div>
        <div>• Use <code>[Verse]</code>, <code>[Chorus]</code> for section labels</div>
        <div>• Song title and basic structure are pre-filled for you</div>
        {value.length > 0 && (
          <div style={{ marginTop: '4px', fontSize: '11px' }}>
            {value.length} characters • {value.split('\n').length} lines
          </div>
        )}
      </div>
    </div>
  )
}