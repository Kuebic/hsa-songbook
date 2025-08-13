import { describe, it, expect, beforeEach } from 'vitest'
import { CustomChordProRenderer, type ParsedSong } from '../customChordProRenderer'

describe('CustomChordProRenderer', () => {
  let renderer: CustomChordProRenderer

  beforeEach(() => {
    renderer = new CustomChordProRenderer()
  })

  describe('parse', () => {
    it('parses basic metadata correctly', () => {
      const content = `{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 120}
{capo: 3}

[G]Amazing [C]grace`

      const parsed = renderer.parse(content)

      expect(parsed.title).toBe('Amazing Grace')
      expect(parsed.artist).toBe('John Newton')
      expect(parsed.key).toBe('G')
      expect(parsed.tempo).toBe('120')
      expect(parsed.capo).toBe('3')
      expect(parsed.sections).toHaveLength(1)
    })

    it('handles sections correctly', () => {
      const content = `{title: Test Song}

{start_of_verse: Verse 1}
[G]Line one
[C]Line two
{end_of_verse}

{start_of_chorus}
[Am]Chorus line
{end_of_chorus}

[F]Another verse line`

      const parsed = renderer.parse(content)

      expect(parsed.sections).toHaveLength(3)
      
      const verse = parsed.sections[0]
      expect(verse.type).toBe('verse')
      expect(verse.label).toBe('Verse 1')
      expect(verse.lines).toHaveLength(2)

      const chorus = parsed.sections[1]
      expect(chorus.type).toBe('chorus')
      expect(chorus.label).toBe('Chorus')
      expect(chorus.lines).toHaveLength(1)

      const implicitVerse = parsed.sections[2]
      expect(implicitVerse.type).toBe('verse')
      expect(implicitVerse.lines).toHaveLength(1)
    })

    it('handles empty lines within sections', () => {
      const content = `{start_of_verse}
[G]First line

[C]Third line
{end_of_verse}`

      const parsed = renderer.parse(content)

      expect(parsed.sections).toHaveLength(1)
      expect(parsed.sections[0].lines).toHaveLength(3)
      expect(parsed.sections[0].lines[1]).toBe('<div class="chord-line-container"></div>')
    })

    it('handles content with no metadata', () => {
      const content = `[G]Simple line
[C]Another line`

      const parsed = renderer.parse(content)

      expect(parsed.title).toBeUndefined()
      expect(parsed.artist).toBeUndefined()
      expect(parsed.sections).toHaveLength(1)
      expect(parsed.sections[0].type).toBe('verse')
    })

    it('handles complex directives with colons in values', () => {
      const content = `{title: Song: A Subtitle}
{artist: Band: The Artists}
[G]Line`

      const parsed = renderer.parse(content)

      expect(parsed.title).toBe('Song: A Subtitle')
      expect(parsed.artist).toBe('Band: The Artists')
    })

    it('handles multiple implicit verse sections', () => {
      const content = `[G]First verse line

[C]Second verse line

[Am]Third verse line`

      const parsed = renderer.parse(content)

      expect(parsed.sections).toHaveLength(1)
      expect(parsed.sections[0].type).toBe('verse')
      expect(parsed.sections[0].lines).toHaveLength(3)
    })

    it('parses the encyclopedia case correctly', () => {
      const content = `{title: Test Song}
encyclo[D]pedia line`

      const parsed = renderer.parse(content)

      expect(parsed.sections).toHaveLength(1)
      expect(parsed.sections[0].lines[0]).toContain('data-chord="D">p</span>')
    })

    it('handles unclosed sections gracefully', () => {
      const content = `{start_of_verse}
[G]Line one
[C]Line two`

      const parsed = renderer.parse(content)

      expect(parsed.sections).toHaveLength(1)
      expect(parsed.sections[0].type).toBe('verse')
      expect(parsed.sections[0].lines).toHaveLength(2)
    })
  })

  describe('renderChordLine', () => {
    it('renders simple chord line correctly', () => {
      const html = renderer['renderChordLine']('[G]Hello [C]world')

      expect(html).toContain('class="chord-line-container"')
      expect(html).toContain('class="lyric-with-chords"')
      expect(html).toContain('<span class="chord-anchor" data-chord="G">H</span>')
      expect(html).toContain('<span class="chord-anchor" data-chord="C">w</span>')
    })

    it('renders line with no chords', () => {
      const html = renderer['renderChordLine']('Just plain text')

      expect(html).toBe('<div class="chord-line-container">Just plain text</div>')
    })

    it('renders the encyclopedia case correctly', () => {
      const html = renderer['renderChordLine']('encyclo[D]pedia')

      expect(html).toContain('<span class="chord-anchor" data-chord="D">p</span>')
      expect(html).toContain('encyclo')
      expect(html).toContain('edia')
    })

    it('handles complex chord progressions', () => {
      const html = renderer['renderChordLine']('[Cmaj7]Amazing [G/B]grace, how [Dm7]sweet')

      expect(html).toContain('data-chord="Cmaj7">A</span>')
      expect(html).toContain('data-chord="G/B">g</span>')
      expect(html).toContain('data-chord="Dm7">s</span>')
    })
  })

  describe('render', () => {
    it('renders complete song with all metadata', () => {
      const parsedSong: ParsedSong = {
        title: 'Amazing Grace',
        artist: 'John Newton',
        key: 'G',
        tempo: '120',
        capo: '3',
        sections: [
          {
            type: 'verse',
            lines: ['<div class="chord-line-container">Test line</div>']
          }
        ]
      }

      const html = renderer.render(parsedSong)

      expect(html).toContain('<h1 class="song-title">Amazing Grace</h1>')
      expect(html).toContain('<p class="song-artist">John Newton</p>')
      expect(html).toContain('<span class="metadata-label">Key:</span> G')
      expect(html).toContain('<span class="metadata-label">Tempo:</span> 120')
      expect(html).toContain('<span class="metadata-label">Capo:</span> 3')
      expect(html).toContain('Test line')
    })

    it('renders song with only title', () => {
      const parsedSong: ParsedSong = {
        title: 'Simple Song',
        sections: [
          {
            type: 'verse',
            lines: ['<div class="chord-line-container">Test line</div>']
          }
        ]
      }

      const html = renderer.render(parsedSong)

      expect(html).toContain('<h1 class="song-title">Simple Song</h1>')
      expect(html).not.toContain('<p class="song-artist">')
      expect(html).not.toContain('metadata-item')
    })

    it('renders song without metadata', () => {
      const parsedSong: ParsedSong = {
        sections: [
          {
            type: 'verse',
            lines: ['<div class="chord-line-container">Test line</div>']
          }
        ]
      }

      const html = renderer.render(parsedSong)

      expect(html).not.toContain('chord-sheet-header')
      expect(html).toContain('chord-sheet-content')
      expect(html).toContain('Test line')
    })

    it('renders sections with labels', () => {
      const parsedSong: ParsedSong = {
        sections: [
          {
            type: 'verse',
            label: 'Verse 1',
            lines: ['<div class="chord-line-container">Verse line</div>']
          },
          {
            type: 'chorus',
            label: 'Chorus',
            lines: ['<div class="chord-line-container">Chorus line</div>']
          }
        ]
      }

      const html = renderer.render(parsedSong)

      // Verse sections don't show labels by default
      expect(html).not.toContain('<div class="paragraph-label section-label">Verse 1</div>')
      
      // Other sections do show labels
      expect(html).toContain('<div class="paragraph-label section-label">Chorus</div>')
      
      expect(html).toContain('<div class="paragraph verse">')
      expect(html).toContain('<div class="paragraph chorus">')
    })

    it('handles partial metadata correctly', () => {
      const parsedSong: ParsedSong = {
        title: 'Test Song',
        key: 'Am',
        sections: []
      }

      const html = renderer.render(parsedSong)

      expect(html).toContain('<h1 class="song-title">Test Song</h1>')
      expect(html).not.toContain('<p class="song-artist">')
      expect(html).toContain('<span class="metadata-label">Key:</span> Am')
      expect(html).not.toContain('Tempo:')
      expect(html).not.toContain('Capo:')
    })
  })

  describe('parseAndRender', () => {
    it('parses and renders in one step', () => {
      const content = `{title: Test Song}
{artist: Test Artist}

[G]Amazing [C]grace
how [D]sweet the [Am]sound`

      const html = renderer.parseAndRender(content)

      expect(html).toContain('<h1 class="song-title">Test Song</h1>')
      expect(html).toContain('<p class="song-artist">Test Artist</p>')
      expect(html).toContain('data-chord="G">A</span>')
      expect(html).toContain('data-chord="C">g</span>')
      expect(html).toContain('data-chord="D">s</span>')
      expect(html).toContain('data-chord="Am">s</span>')
    })

    it('handles the encyclopedia case end-to-end', () => {
      const content = `{title: Encyclopedia Song}
This is an encyclo[D]pedia example`

      const html = renderer.parseAndRender(content)

      expect(html).toContain('<h1 class="song-title">Encyclopedia Song</h1>')
      expect(html).toContain('This is an encyclo<span class="chord-anchor" data-chord="D">p</span>edia example')
    })

    it('handles empty content gracefully', () => {
      const html = renderer.parseAndRender('')

      expect(html).toContain('<div class="chord-sheet-content">')
      expect(html).not.toContain('chord-sheet-header')
    })

    it('handles complex song structure', () => {
      const content = `{title: Complex Song}
{artist: The Band}
{key: C}

{start_of_verse: Verse 1}
[C]In the [G]beginning
was the [Am]word and the [F]word was
{end_of_verse}

{start_of_chorus}
[F]Sing it [C]loud, sing it [G]proud
[Am]Let the whole world [F]know
{end_of_chorus}

{start_of_bridge}
[Dm]Bridge section [G]here
{end_of_bridge}`

      const html = renderer.parseAndRender(content)

      expect(html).toContain('<h1 class="song-title">Complex Song</h1>')
      expect(html).toContain('<p class="song-artist">The Band</p>')
      expect(html).toContain('<span class="metadata-label">Key:</span> C')
      
      expect(html).toContain('<div class="paragraph verse">')
      expect(html).toContain('<div class="paragraph chorus">')
      expect(html).toContain('<div class="paragraph bridge">')
      
      expect(html).toContain('<div class="paragraph-label section-label">Chorus</div>')
      expect(html).toContain('<div class="paragraph-label section-label">Bridge</div>')
      expect(html).not.toContain('<div class="paragraph-label section-label">Verse 1</div>')
    })
  })

  describe('edge cases and error handling', () => {
    it('handles malformed directives', () => {
      const content = `{malformed directive
{title: Valid Title}
[G]Test line`

      const parsed = renderer.parse(content)

      expect(parsed.title).toBe('Valid Title')
      expect(parsed.sections).toHaveLength(1)
    })

    it('handles special characters in content', () => {
      const content = `{title: Café & Naïve}
[G]Special chars: ñ, ü, ç, é`

      const html = renderer.parseAndRender(content)

      expect(html).toContain('Café & Naïve')
      // Check for the special characters, accounting for the chord span
      expect(html).toContain('pecial chars: ñ, ü, ç, é') // Missing 'S' because it's in the chord span
    })

    it('handles very long content', () => {
      const longTitle = 'A'.repeat(200)
      const content = `{title: ${longTitle}}
${'[G]Line '.repeat(100)}`

      const parsed = renderer.parse(content)

      expect(parsed.title).toBe(longTitle)
      expect(parsed.sections[0].lines.length).toBeGreaterThan(0)
    })

    it('preserves HTML entities in output', () => {
      const content = `{title: Song with & symbols}
[G]Lyrics with < and > symbols`

      const html = renderer.parseAndRender(content)

      // Current implementation doesn't escape HTML entities
      expect(html).toContain('Song with & symbols')
      // Lyrics content should preserve the text as-is, accounting for chord span
      expect(html).toContain('yrics with < and > symbols') // Missing 'L' because it's in the chord span
    })

    it('handles mixed case directives', () => {
      const content = `{Title: Mixed Case}
{ARTIST: UPPERCASE ARTIST}
{Key: lowercase key}
[G]Test`

      const parsed = renderer.parse(content)

      expect(parsed.title).toBe('Mixed Case')
      expect(parsed.artist).toBe('UPPERCASE ARTIST')
      expect(parsed.key).toBe('lowercase key')
    })
  })
})