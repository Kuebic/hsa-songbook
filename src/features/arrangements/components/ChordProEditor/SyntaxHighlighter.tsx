import React, { useMemo } from 'react'
import { highlightChordPro } from './utils/syntaxHighlighting'
import type { Theme } from '@shared/contexts/ThemeContext'

interface SyntaxHighlighterProps {
  content: string
  theme?: Theme
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