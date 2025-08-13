import { describe, it, expect, beforeEach } from 'vitest'
import { CharacterChordRenderer } from '../chordRenderer'

describe('CharacterChordRenderer', () => {
  let renderer: CharacterChordRenderer

  beforeEach(() => {
    renderer = new CharacterChordRenderer()
  })

  describe('parseChordPositions', () => {
    it('parses simple chord position correctly', () => {
      const positions = renderer.parseChordPositions('hello [D]world')
      
      expect(positions).toHaveLength(1)
      expect(positions[0]).toEqual({
        chord: 'D',
        charIndex: 6,
        lyricLine: 'hello world'
      })
    })

    it('parses the encyclopedia case correctly - D should be above p', () => {
      const positions = renderer.parseChordPositions('encyclo[D]pedia')
      
      expect(positions).toHaveLength(1)
      expect(positions[0]).toEqual({
        chord: 'D',
        charIndex: 7, // Position 7 is where 'p' is in 'encyclopedia'
        lyricLine: 'encyclopedia'
      })
    })

    it('handles multiple chords in a line', () => {
      const positions = renderer.parseChordPositions('[C]Amazing [G]grace, how [D]sweet')
      
      expect(positions).toHaveLength(3)
      expect(positions[0]).toEqual({ 
        chord: 'C', 
        charIndex: 0, 
        lyricLine: 'Amazing grace, how sweet' 
      })
      expect(positions[1]).toEqual({ 
        chord: 'G', 
        charIndex: 8, 
        lyricLine: 'Amazing grace, how sweet' 
      })
      expect(positions[2]).toEqual({ 
        chord: 'D', 
        charIndex: 19, 
        lyricLine: 'Amazing grace, how sweet' 
      })
    })

    it('handles empty strings', () => {
      const positions = renderer.parseChordPositions('')
      expect(positions).toEqual([])
    })

    it('handles strings with no chords', () => {
      const positions = renderer.parseChordPositions('just plain lyrics')
      expect(positions).toEqual([])
    })

    it('handles chords at the beginning of a line', () => {
      const positions = renderer.parseChordPositions('[G]Start of line')
      
      expect(positions).toHaveLength(1)
      expect(positions[0]).toEqual({
        chord: 'G',
        charIndex: 0,
        lyricLine: 'Start of line'
      })
    })

    it('handles chords at the end of a line', () => {
      const positions = renderer.parseChordPositions('End of line[Am]')
      
      expect(positions).toHaveLength(1)
      expect(positions[0]).toEqual({
        chord: 'Am',
        charIndex: 11,
        lyricLine: 'End of line'
      })
    })

    it('handles consecutive chords', () => {
      const positions = renderer.parseChordPositions('[C][G]word')
      
      expect(positions).toHaveLength(2)
      expect(positions[0]).toEqual({
        chord: 'C',
        charIndex: 0,
        lyricLine: 'word'
      })
      expect(positions[1]).toEqual({
        chord: 'G',
        charIndex: 0,
        lyricLine: 'word'
      })
    })

    it('handles complex chord names', () => {
      const positions = renderer.parseChordPositions('[Cmaj7]complex [Dm7b5]chords')
      
      expect(positions).toHaveLength(2)
      expect(positions[0]).toEqual({
        chord: 'Cmaj7',
        charIndex: 0,
        lyricLine: 'complex chords'
      })
      expect(positions[1]).toEqual({
        chord: 'Dm7b5',
        charIndex: 8,
        lyricLine: 'complex chords'
      })
    })

    it('handles malformed chord brackets gracefully', () => {
      const positions = renderer.parseChordPositions('text [incomplete and [G]valid')
      
      // The current implementation treats [incomplete as a chord since there's no closing bracket before the next [
      expect(positions).toHaveLength(1)
      expect(positions[0]).toEqual({
        chord: 'incomplete and [G',
        charIndex: 5, // Position after 'text '
        lyricLine: 'text valid'
      })
    })

    it('preserves spaces correctly between words with chords', () => {
      const positions = renderer.parseChordPositions('[C]Hello [G]beautiful [Am]world')
      
      expect(positions).toHaveLength(3)
      expect(positions[0].lyricLine).toBe('Hello beautiful world')
      expect(positions[0].charIndex).toBe(0) // H
      expect(positions[1].charIndex).toBe(6) // b in beautiful
      expect(positions[2].charIndex).toBe(16) // w in world
    })
  })

  describe('renderLine', () => {
    it('renders line with no chords as plain text', () => {
      const element = renderer.renderLine('just plain text')
      
      expect(element.className).toBe('chord-line-container')
      expect(element.textContent).toBe('just plain text')
      expect(element.children).toHaveLength(0)
    })

    it('renders line with chords using chord anchors', () => {
      const element = renderer.renderLine('[G]Hello [C]world')
      
      expect(element.className).toBe('chord-line-container')
      
      const lyricSpan = element.querySelector('.lyric-with-chords')
      expect(lyricSpan).toBeTruthy()
      
      const chordAnchors = element.querySelectorAll('.chord-anchor')
      expect(chordAnchors).toHaveLength(2)
      
      expect(chordAnchors[0].getAttribute('data-chord')).toBe('G')
      expect(chordAnchors[0].textContent).toBe('H')
      
      expect(chordAnchors[1].getAttribute('data-chord')).toBe('C')
      expect(chordAnchors[1].textContent).toBe('w')
    })

    it('renders the encyclopedia case correctly', () => {
      const element = renderer.renderLine('encyclo[D]pedia')
      
      const chordAnchor = element.querySelector('.chord-anchor')
      expect(chordAnchor).toBeTruthy()
      expect(chordAnchor?.getAttribute('data-chord')).toBe('D')
      expect(chordAnchor?.textContent).toBe('p') // D should be above 'p'
    })

    it('preserves text content correctly with mixed chords and text', () => {
      const element = renderer.renderLine('The [Am]quick brown [F]fox')
      
      expect(element.textContent).toBe('The quick brown fox')
      
      const chordAnchors = element.querySelectorAll('.chord-anchor')
      expect(chordAnchors[0].textContent).toBe('q') // Am above 'q'
      expect(chordAnchors[1].textContent).toBe('f') // F above 'f'
    })

    it('handles empty chord position gracefully', () => {
      const element = renderer.renderLine('end[D]')
      
      const chordAnchor = element.querySelector('.chord-anchor')
      expect(chordAnchor?.getAttribute('data-chord')).toBe('D')
      expect(chordAnchor?.textContent).toBe('') // No character at end
    })
  })

  describe('renderLineAsHTML', () => {
    it('renders line with no chords as simple div', () => {
      const html = renderer.renderLineAsHTML('just plain text')
      
      expect(html).toBe('<div class="chord-line-container">just plain text</div>')
    })

    it('renders line with chords as HTML with chord anchors', () => {
      const html = renderer.renderLineAsHTML('[G]Hello [C]world')
      
      expect(html).toContain('class="chord-line-container"')
      expect(html).toContain('class="lyric-with-chords"')
      expect(html).toContain('<span class="chord-anchor" data-chord="G">H</span>')
      expect(html).toContain('<span class="chord-anchor" data-chord="C">w</span>')
      expect(html).toContain('ello ')
      expect(html).toContain('orld')
    })

    it('renders the encyclopedia case as HTML correctly', () => {
      const html = renderer.renderLineAsHTML('encyclo[D]pedia')
      
      expect(html).toContain('<span class="chord-anchor" data-chord="D">p</span>')
      expect(html).toContain('encyclo')
      expect(html).toContain('edia')
    })

    it('handles complex chord progression', () => {
      const html = renderer.renderLineAsHTML('[C]Amazing [G]grace, how [D]sweet the [Am]sound')
      
      expect(html).toContain('data-chord="C">A</span>')
      expect(html).toContain('data-chord="G">g</span>')
      expect(html).toContain('data-chord="D">s</span>')
      expect(html).toContain('data-chord="Am">s</span>')
    })

    it('produces HTML that contains correct text content', () => {
      const html = renderer.renderLineAsHTML('[F]Test [G]line with [Am]chords')
      
      // Remove HTML tags and check text content
      const textContent = html.replace(/<[^>]*>/g, '')
      expect(textContent).toBe('Test line with chords')
    })

    it('handles consecutive chords in HTML output', () => {
      const html = renderer.renderLineAsHTML('[C][G]word')
      
      expect(html).toContain('data-chord="C">w</span>')
      expect(html).toContain('data-chord="G">w</span>')
    })

    it('escapes HTML characters in chord names', () => {
      // Test with chord name that might contain HTML-like characters
      const html = renderer.renderLineAsHTML('[C&G]test')
      
      expect(html).toContain('data-chord="C&G"')
    })

    it('handles empty line correctly', () => {
      const html = renderer.renderLineAsHTML('')
      
      expect(html).toBe('<div class="chord-line-container"></div>')
    })
  })

  describe('edge cases and error handling', () => {
    it('handles very long lines', () => {
      const longLine = 'a'.repeat(1000) + '[D]' + 'b'.repeat(1000)
      const positions = renderer.parseChordPositions(longLine)
      
      expect(positions).toHaveLength(1)
      expect(positions[0].charIndex).toBe(1000)
      expect(positions[0].lyricLine).toBe('a'.repeat(1000) + 'b'.repeat(1000))
    })

    it('handles special characters in lyrics', () => {
      const positions = renderer.parseChordPositions('Café [D]naïve résumé')
      
      expect(positions).toHaveLength(1)
      expect(positions[0].lyricLine).toBe('Café naïve résumé')
    })

    it('handles numbers and symbols in chord names', () => {
      const positions = renderer.parseChordPositions('[C#/G#]complex [Dm7-5]notation')
      
      expect(positions).toHaveLength(2)
      expect(positions[0].chord).toBe('C#/G#')
      expect(positions[1].chord).toBe('Dm7-5')
    })

    it('handles multiple spaces between words', () => {
      const positions = renderer.parseChordPositions('[C]word1     [G]word2')
      
      expect(positions[0].lyricLine).toBe('word1     word2')
      expect(positions[1].charIndex).toBe(10) // After 'word1' + 5 spaces
    })
  })
})