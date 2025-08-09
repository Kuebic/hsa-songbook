import { describe, it, expect } from 'vitest'
import {
  extractChordProMetadata,
  parseChordProgression,
  transposeChords,
  validateChordProSyntax,
  compressChordData,
  decompressChordData,
  normalizeChordProContent,
  extractSections
} from '../chordProUtils'

describe('ChordPro Utilities', () => {
  describe('extractChordProMetadata', () => {
    it('extracts basic metadata directives', () => {
      const content = `{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 90}
{time: 3/4}
{capo: 2}`

      const metadata = extractChordProMetadata(content)
      
      expect(metadata.title).toBe('Amazing Grace')
      expect(metadata.artist).toBe('John Newton')
      expect(metadata.key).toBe('G')
      expect(metadata.tempo).toBe(90)
      expect(metadata.timeSignature).toBe('3/4')
      expect(metadata.capo).toBe(2)
    })

    it('handles alternative directive formats', () => {
      const content = `{t: Amazing Grace}
{subtitle: How Sweet the Sound}
{st: Hymn}
{composer: John Newton}
{lyricist: John Newton}`

      const metadata = extractChordProMetadata(content)
      
      expect(metadata.title).toBe('Amazing Grace')
      expect(metadata.subtitle).toBe('How Sweet the Sound')
      expect(metadata.composer).toBe('John Newton')
      expect(metadata.lyricist).toBe('John Newton')
    })

    it('ignores case in directive names', () => {
      const content = `{TITLE: Test Song}
{Artist: Test Artist}
{KEY: C}
{Tempo: 120}`

      const metadata = extractChordProMetadata(content)
      
      expect(metadata.title).toBe('Test Song')
      expect(metadata.artist).toBe('Test Artist')
      expect(metadata.key).toBe('C')
      expect(metadata.tempo).toBe(120)
    })

    it('handles missing or malformed directives', () => {
      const content = `{title: Test Song}
{tempo: not-a-number}
{invalid directive format
{key:}`

      const metadata = extractChordProMetadata(content)
      
      expect(metadata.title).toBe('Test Song')
      expect(metadata.tempo).toBeUndefined()
      expect(metadata.key).toBeUndefined()
    })

    it('extracts custom metadata fields', () => {
      const content = `{title: Test Song}
{album: Test Album}
{year: 2023}
{genre: Contemporary}
{copyright: © 2023 Test Publisher}`

      const metadata = extractChordProMetadata(content)
      
      expect(metadata.album).toBe('Test Album')
      expect(metadata.year).toBe(2023)
      expect(metadata.genre).toBe('Contemporary')
      expect(metadata.copyright).toBe('© 2023 Test Publisher')
    })
  })

  describe('parseChordProgression', () => {
    it('extracts chords from chord notation', () => {
      const content = `[G]Amazing [C]grace how [D]sweet the [G]sound
That [G]saved a [D]wretch like [G]me`

      const chords = parseChordProgression(content)
      
      expect(chords).toContain('G')
      expect(chords).toContain('C')
      expect(chords).toContain('D')
      expect(chords.length).toBe(3) // Unique chords only
    })

    it('handles complex chord notations', () => {
      const content = `[Cmaj7]Complex [G/B]slash [Am7b5]extended [Ddim]diminished
[F#m]Minor [Bb7sus4]suspended [C#°7]diminished seventh`

      const chords = parseChordProgression(content)
      
      expect(chords).toContain('Cmaj7')
      expect(chords).toContain('G/B')
      expect(chords).toContain('Am7b5')
      expect(chords).toContain('Ddim')
      expect(chords).toContain('F#m')
      expect(chords).toContain('Bb7sus4')
      expect(chords).toContain('C#°7')
    })

    it('ignores section markers and comments', () => {
      const content = `{comment: Verse 1}
[Verse]
[G]Line with [C]chords
{comment: This is a comment}
[Chorus]
[Am]Another [F]line with [G]chords`

      const chords = parseChordProgression(content)
      
      expect(chords).toContain('G')
      expect(chords).toContain('C')
      expect(chords).toContain('Am')
      expect(chords).toContain('F')
      expect(chords).not.toContain('Verse')
      expect(chords).not.toContain('Chorus')
    })

    it('handles empty or no-chord content', () => {
      const emptyContent = ''
      const noChordContent = 'Just lyrics with no chords'
      
      expect(parseChordProgression(emptyContent)).toEqual([])
      expect(parseChordProgression(noChordContent)).toEqual([])
    })

    it('preserves chord order of appearance', () => {
      const content = '[G]First [Am]second [C]third [G]first again'
      const chords = parseChordProgression(content)
      
      expect(chords.indexOf('G')).toBeLessThan(chords.indexOf('Am'))
      expect(chords.indexOf('Am')).toBeLessThan(chords.indexOf('C'))
    })
  })

  describe('transposeChords', () => {
    it('transposes major chords correctly', () => {
      const chords = ['C', 'F', 'G', 'Am']
      const transposed = transposeChords(chords, 'C', 'D')
      
      expect(transposed).toEqual(['D', 'G', 'A', 'Bm'])
    })

    it('transposes complex chords', () => {
      const chords = ['Cmaj7', 'F/A', 'G7sus4', 'Am7b5']
      const transposed = transposeChords(chords, 'C', 'F')
      
      expect(transposed).toEqual(['Fmaj7', 'Bb/D', 'C7sus4', 'Dm7b5'])
    })

    it('handles sharp and flat keys', () => {
      const chords = ['C', 'G', 'Am']
      const transposedSharp = transposeChords(chords, 'C', 'F#')
      const transposedFlat = transposeChords(chords, 'C', 'Bb')
      
      expect(transposedSharp).toEqual(['F#', 'C#', 'D#m'])
      expect(transposedFlat).toEqual(['Bb', 'F', 'Gm'])
    })

    it('handles edge cases and enharmonic equivalents', () => {
      const chords = ['B', 'E', 'F#']
      const transposed = transposeChords(chords, 'B', 'C')
      
      expect(transposed).toEqual(['C', 'F', 'G'])
    })

    it('preserves slash chords and bass notes', () => {
      const chords = ['C/E', 'F/A', 'G/B']
      const transposed = transposeChords(chords, 'C', 'G')
      
      expect(transposed).toEqual(['G/B', 'C/E', 'D/F#'])
    })

    it('handles invalid or unrecognized chords gracefully', () => {
      const chords = ['X', 'InvalidChord', 'C', '???']
      const transposed = transposeChords(chords, 'C', 'D')
      
      // Should transpose valid chords and leave invalid ones unchanged
      expect(transposed).toContain('D') // C -> D
      expect(transposed).toContain('X') // Invalid chord preserved
      expect(transposed).toContain('InvalidChord')
    })
  })

  describe('validateChordProSyntax', () => {
    it('validates correct ChordPro syntax', () => {
      const validContent = `{title: Test Song}
{key: G}

[Verse]
[G]Amazing [C]grace how [D]sweet the [G]sound

[Chorus]
[Em]Praise [C]God from [G]whom all [D]blessings [G]flow`

      const result = validateChordProSyntax(validContent)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('detects malformed directives', () => {
      const invalidContent = `{title Test Song missing colon}
{incomplete directive
{key:}
{: empty directive name}`

      const result = validateChordProSyntax(invalidContent)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.includes('malformed directive'))).toBe(true)
    })

    it('detects unmatched chord brackets', () => {
      const invalidContent = `[G]Start but no end
Missing start C]chord
[Am Incomplete chord bracket
[C]Valid [D]chord then [broken`

      const result = validateChordProSyntax(invalidContent)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('unmatched'))).toBe(true)
    })

    it('provides helpful error messages with line numbers', () => {
      const invalidContent = `{title: Valid}
Line 2 is fine
[G]Line 3 has [incomplete chord
{malformed directive on line 4`

      const result = validateChordProSyntax(invalidContent)
      
      expect(result.errors.some(e => e.includes('line 3'))).toBe(true)
      expect(result.errors.some(e => e.includes('line 4'))).toBe(true)
    })

    it('validates empty content as valid', () => {
      const result = validateChordProSyntax('')
      expect(result.isValid).toBe(true)
    })
  })

  describe('compressChordData and decompressChordData', () => {
    it('compresses and decompresses simple data', () => {
      const originalData = {
        chords: ['C', 'F', 'G', 'Am'],
        progression: ['C', 'F', 'C', 'G', 'C'],
        sections: ['verse', 'chorus', 'verse', 'chorus', 'bridge']
      }

      const compressed = compressChordData(originalData)
      expect(compressed).toBeInstanceOf(Buffer)
      expect(compressed.length).toBeGreaterThan(0)

      const decompressed = decompressChordData(compressed)
      expect(decompressed).toEqual(originalData)
    })

    it('handles large chord progression data', () => {
      const largeProgression = Array.from({ length: 1000 }, (_, i) => 
        ['C', 'F', 'G', 'Am'][i % 4]
      )
      
      const originalData = {
        chords: ['C', 'F', 'G', 'Am'],
        progression: largeProgression
      }

      const compressed = compressChordData(originalData)
      const decompressed = decompressChordData(compressed)
      
      expect(decompressed.progression).toEqual(largeProgression)
      expect(compressed.length).toBeLessThan(JSON.stringify(originalData).length)
    })

    it('handles complex nested data structures', () => {
      const complexData = {
        metadata: {
          title: 'Complex Song',
          key: 'C',
          tempo: 120,
          sections: {
            verse: { chords: ['C', 'F'], repeat: 2 },
            chorus: { chords: ['G', 'Am', 'F', 'C'], repeat: 4 }
          }
        },
        arrangements: [
          { key: 'C', chords: ['C', 'F', 'G'] },
          { key: 'G', chords: ['G', 'C', 'D'] }
        ]
      }

      const compressed = compressChordData(complexData)
      const decompressed = decompressChordData(compressed)
      
      expect(decompressed).toEqual(complexData)
    })

    it('handles empty or null data', () => {
      expect(compressChordData({})).toBeInstanceOf(Buffer)
      expect(decompressChordData(compressChordData({}))).toEqual({})
      
      const nullResult = compressChordData(null)
      expect(decompressChordData(nullResult)).toBeNull()
    })
  })

  describe('normalizeChordProContent', () => {
    it('normalizes line endings', () => {
      const content = 'Line 1\r\nLine 2\rLine 3\nLine 4'
      const normalized = normalizeChordProContent(content)
      
      expect(normalized.split('\n')).toHaveLength(4)
      expect(normalized.includes('\r')).toBe(false)
    })

    it('trims whitespace from lines', () => {
      const content = '  Line with leading spaces  \n\t\tTabbed line\t\t\n   '
      const normalized = normalizeChordProContent(content)
      
      const lines = normalized.split('\n')
      expect(lines[0]).toBe('Line with leading spaces')
      expect(lines[1]).toBe('Tabbed line')
    })

    it('removes empty lines at start and end', () => {
      const content = '\n\n{title: Test}\n[G]Chord line\n\n\n'
      const normalized = normalizeChordProContent(content)
      
      expect(normalized.startsWith('{title: Test}')).toBe(true)
      expect(normalized.endsWith('[G]Chord line')).toBe(true)
    })

    it('standardizes directive formatting', () => {
      const content = `{TITLE:Amazing Grace}
{  artist : John Newton  }
{key:G}
{ tempo : 90 }`

      const normalized = normalizeChordProContent(content)
      
      expect(normalized).toContain('{title: Amazing Grace}')
      expect(normalized).toContain('{artist: John Newton}')
      expect(normalized).toContain('{key: G}')
      expect(normalized).toContain('{tempo: 90}')
    })

    it('preserves chord and lyric structure', () => {
      const content = `[G]Amazing [C]grace how [D]sweet
The [G]sound that [D]saved a [G]wretch`

      const normalized = normalizeChordProContent(content)
      
      expect(normalized).toContain('[G]Amazing [C]grace')
      expect(normalized).toContain('[G]sound that [D]saved')
    })
  })

  describe('extractSections', () => {
    it('identifies standard song sections', () => {
      const content = `{title: Test Song}

[Verse 1]
[G]First verse line
[C]Second verse line

[Chorus]
[Am]Chorus line
[F]Another chorus line

[Verse 2]
[G]Second verse
[C]More lyrics

[Bridge]
[Dm]Bridge section
[G]Bridge continues`

      const sections = extractSections(content)
      
      expect(sections).toHaveLength(4)
      expect(sections[0].name).toBe('Verse 1')
      expect(sections[1].name).toBe('Chorus')
      expect(sections[2].name).toBe('Verse 2')
      expect(sections[3].name).toBe('Bridge')
    })

    it('handles sections without explicit markers', () => {
      const content = `{title: Test}

[G]First section without marker
[C]Continues here

[Verse]
[Am]Explicit verse section`

      const sections = extractSections(content)
      
      expect(sections.length).toBeGreaterThan(0)
      expect(sections.some(s => s.name === 'Verse')).toBe(true)
    })

    it('extracts chord progressions for each section', () => {
      const content = `[Verse]
[G]Amazing [C]grace
[D]How sweet [G]sound

[Chorus]
[Em]Praise [Am]God
[F]From whom [G]blessings`

      const sections = extractSections(content)
      
      const verse = sections.find(s => s.name === 'Verse')
      const chorus = sections.find(s => s.name === 'Chorus')
      
      expect(verse?.chords).toContain('G')
      expect(verse?.chords).toContain('C')
      expect(verse?.chords).toContain('D')
      
      expect(chorus?.chords).toContain('Em')
      expect(chorus?.chords).toContain('Am')
      expect(chorus?.chords).toContain('F')
    })

    it('handles empty or invalid sections gracefully', () => {
      const content = `[Empty Section]

[Section With No Chords]
Just lyrics here
No chords at all`

      const sections = extractSections(content)
      
      const emptySection = sections.find(s => s.name === 'Empty Section')
      const noChordSection = sections.find(s => s.name === 'Section With No Chords')
      
      expect(emptySection?.chords).toEqual([])
      expect(noChordSection?.chords).toEqual([])
    })
  })

  describe('error handling and edge cases', () => {
    it('handles malformed JSON in compressed data', () => {
      const invalidBuffer = Buffer.from('invalid compressed data')
      
      expect(() => decompressChordData(invalidBuffer)).toThrow()
    })

    it('handles very long chord progressions', () => {
      const longContent = '[C]' + 'word '.repeat(10000) + '[G]end'
      const chords = parseChordProgression(longContent)
      
      expect(chords).toContain('C')
      expect(chords).toContain('G')
    })

    it('handles special characters in metadata', () => {
      const content = `{title: Señor, Tú Eres El Rey}
{artist: Música Cristiana}
{copyright: © 2023 Música Publishing}`

      const metadata = extractChordProMetadata(content)
      
      expect(metadata.title).toBe('Señor, Tú Eres El Rey')
      expect(metadata.artist).toBe('Música Cristiana')
      expect(metadata.copyright).toBe('© 2023 Música Publishing')
    })

    it('handles extremely nested chord notations', () => {
      const complexChord = '[C(add9)/E(b5)]'
      const content = `${complexChord}Test content`
      
      const chords = parseChordProgression(content)
      expect(chords).toContain('C(add9)/E(b5)')
    })
  })
})