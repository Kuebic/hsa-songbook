import React, { useMemo } from 'react'
import { highlightChordPro, type EditorTheme } from './utils/syntaxHighlighting'

interface SyntaxHighlighterProps {
  content: string
  theme?: EditorTheme
  className?: string
}

/**
 * Enhanced syntax highlighter for ChordPro notation
 * Supports multiple themes and improved pattern recognition
 */
export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ 
  content, 
  theme = 'light',
  className = ''
}) => {
  const highlightedContent = useMemo(() => {
    return highlightChordPro(content, theme)
  }, [content, theme])
  
  return (
    <div 
      className={`syntax-highlighter ${className}`}
      dangerouslySetInnerHTML={{ __html: highlightedContent }}
      aria-hidden="true"
      data-theme={theme}
    />
  )
}