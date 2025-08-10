import { useCallback, useEffect, useState, useRef } from 'react'
import { cn } from '../../../lib/utils'

interface ChordSyntaxEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function ChordSyntaxEditor({
  value,
  onChange,
  className,
  placeholder = "Enter ChordPro format...\n\nExample:\n{title: Song Title}\n{key: C}\n{tempo: 120}\n\n[Verse]\n[C]This is a [F]sample [G]chord [C]sheet",
  disabled = false
}: ChordSyntaxEditorProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  // Update highlighted HTML when value changes
  useEffect(() => {
    const highlighted = highlightChordPro(value || '')
    setHighlightedHtml(highlighted)
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  // Sync scroll between textarea and highlight layer
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  return (
    <div className={cn("h-full", className)}>
      <div className="relative h-full rounded-md border border-input bg-white overflow-hidden">
        {/* Syntax highlighting layer - behind the textarea */}
        <div 
          ref={highlightRef}
          className="absolute inset-0 p-4 overflow-auto whitespace-pre-wrap break-words pointer-events-none select-none"
          style={{
            fontSize: 14,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", "Menlo", monospace',
            lineHeight: '1.5',
            color: 'transparent',
          }}
          aria-hidden="true"
        >
          <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        </div>
        
        {/* Actual textarea - with visible text */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "absolute inset-0 w-full h-full p-4 resize-none",
            "bg-transparent",
            "font-mono text-sm leading-relaxed",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md",
            "placeholder:text-muted-foreground/50",
            "text-gray-900",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{
            fontSize: 14,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", "Menlo", monospace',
            lineHeight: '1.5',
            color: 'rgba(31, 41, 55, 0.8)', // Semi-transparent so highlights show through
            caretColor: '#1f2937',
            mixBlendMode: 'multiply', // Blend text with highlights
          }}
          spellCheck={false}
        />
      </div>
      
      <style>{`
        /* Selection styling */
        textarea::selection {
          background-color: rgba(59, 130, 246, 0.3) !important;
        }
        
        /* ChordPro syntax colors - using background colors for highlighting */
        .chordpro-directive {
          background: linear-gradient(to right, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.15));
          padding: 0 2px;
          border-radius: 2px;
        }
        
        .chordpro-chord {
          background: linear-gradient(to right, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.15));
          padding: 0 2px;
          border-radius: 2px;
          font-weight: 600;
        }
        
        .chordpro-section {
          background: linear-gradient(to right, rgba(5, 150, 105, 0.15), rgba(5, 150, 105, 0.15));
          padding: 0 2px;
          border-radius: 2px;
          font-weight: 600;
        }
        
        .chordpro-comment {
          background: linear-gradient(to right, rgba(107, 114, 128, 0.1), rgba(107, 114, 128, 0.1));
          padding: 0 2px;
          font-style: italic;
        }
        
        .chordpro-text {
          /* No special styling for regular text */
        }
      `}</style>
    </div>
  )
}

// Custom ChordPro syntax highlighter
function highlightChordPro(text: string): string {
  if (!text) return ''
  
  // Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Process line by line for better control
  const lines = html.split('\n')
  const highlightedLines = lines.map(line => {
    if (!line) return '<span>&nbsp;</span>' // Preserve empty lines
    
    // Comments (lines starting with #)
    if (line.startsWith('#')) {
      return `<span class="chordpro-comment">${line}</span>`
    }
    
    let processedLine = line
    
    // Directives {key: value}
    processedLine = processedLine.replace(
      /\{([^:}]+):\s*([^}]*)\}/g,
      '<span class="chordpro-directive">{$1: $2}</span>'
    )
    
    // Section markers [Verse], [Chorus], etc.
    processedLine = processedLine.replace(
      /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|Instrumental|Interlude|Vamp|Breakdown|Refrain)(\s+\d+)?\]/gi,
      '<span class="chordpro-section">[$1$2]</span>'
    )
    
    // Chord symbols [C], [Am7], [G/B], etc.
    processedLine = processedLine.replace(
      /\[([A-G][#b]?(?:maj|min|m|M|sus|dim|aug|add)?[0-9]*(?:\/[A-G][#b]?)?)\]/g,
      '<span class="chordpro-chord">[$1]</span>'
    )
    
    return processedLine
  })
  
  return highlightedLines.join('\n')
}