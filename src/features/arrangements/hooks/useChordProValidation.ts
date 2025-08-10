import { useMemo } from 'react'
import ChordSheetJS from 'chordsheetjs'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metadata?: {
    title?: string
    artist?: string
    key?: string
    tempo?: string
    time?: string
    capo?: string
  }
}

/**
 * Hook for validating ChordPro content and extracting metadata
 */
export function useChordProValidation(chordProText: string): ValidationResult {
  return useMemo(() => {
    const errors: string[] = []
    const warnings: string[] = []
    let metadata: ValidationResult['metadata'] = {}
    
    if (!chordProText || !chordProText.trim()) {
      return {
        isValid: true,
        errors: [],
        warnings: ['No content provided'],
        metadata: {}
      }
    }
    
    try {
      // Try to parse with ChordSheetJS
      const parser = new ChordSheetJS.ChordProParser()
      const song = parser.parse(chordProText)
      
      // Extract metadata from parsed song
      if (song.metadata) {
        metadata = {
          title: song.metadata.title || undefined,
          artist: Array.isArray(song.metadata.artist) ? song.metadata.artist.join(', ') : song.metadata.artist || undefined,
          key: song.metadata.key || undefined,
          tempo: song.metadata.tempo || undefined,
          time: Array.isArray(song.metadata.time) ? song.metadata.time.join(', ') : song.metadata.time || undefined,
          capo: Array.isArray(song.metadata.capo) ? song.metadata.capo.join(', ') : song.metadata.capo || undefined
        }
      }
      
      // Validation checks
      const lines = chordProText.split('\n')
      let hasChords = false
      let hasLyrics = false
      
      lines.forEach((line, index) => {
        const lineNum = index + 1
        
        // Check for chords
        if (/\[[A-G][#b]?(?:m|maj|dim|aug|sus|add)?[0-9]*(?:\/[A-G][#b]?)?\]/g.test(line)) {
          hasChords = true
        }
        
        // Check for lyrics (non-empty lines without only directives or chords)
        const withoutDirectives = line.replace(/\{[^}]*\}/g, '')
        const withoutChords = withoutDirectives.replace(/\[[^\]]*\]/g, '')
        if (withoutChords.trim().length > 0) {
          hasLyrics = true
        }
        
        // Check for unclosed brackets
        const openBrackets = (line.match(/\[/g) || []).length
        const closeBrackets = (line.match(/\]/g) || []).length
        if (openBrackets !== closeBrackets) {
          errors.push(`Line ${lineNum}: Unclosed bracket`)
        }
        
        // Check for unclosed braces
        const openBraces = (line.match(/\{/g) || []).length
        const closeBraces = (line.match(/\}/g) || []).length
        if (openBraces !== closeBraces) {
          errors.push(`Line ${lineNum}: Unclosed brace in directive`)
        }
        
        // Check for invalid chord formats
        const chordMatches = line.matchAll(/\[([^\]]+)\]/g)
        for (const match of chordMatches) {
          const chord = match[1]
          if (!/^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9])*(?:\/[A-G][#b]?)?$/.test(chord)) {
            // Check if it's not a section marker
            if (!/^(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Ending|Instrumental|Interlude|Vamp|Breakdown|Refrain)(\s+\d+)?$/i.test(chord)) {
              warnings.push(`Line ${lineNum}: Possibly invalid chord format: [${chord}]`)
            }
          }
        }
      })
      
      // Add warnings for missing common elements
      if (!metadata?.title) {
        warnings.push('No title specified (use {title: ...} or {t: ...})')
      }
      
      if (!hasChords && hasLyrics) {
        warnings.push('No chords found in the document')
      }
      
      if (hasChords && !hasLyrics) {
        warnings.push('No lyrics found in the document')
      }
      
      if (!metadata?.key && hasChords) {
        warnings.push('Consider adding key information (use {key: ...})')
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Failed to parse ChordPro content'],
        warnings: [],
        metadata: {}
      }
    }
  }, [chordProText])
}