import { describe, it, expect } from 'vitest'
import {
  generateInitialChordPro,
  generateBasicChordProTemplate,
  updateChordProMetadata
} from '../chordProGenerator'
import type { ArrangementFormData } from '../../validation/schemas/arrangementSchema'

describe('chordProGenerator', () => {
  describe('generateInitialChordPro', () => {
    it('should generate basic template with no parameters', () => {
      const result = generateInitialChordPro({})
      
      expect(result).toContain('[Intro]')
      expect(result).toContain('[Verse 1]')
      expect(result).toContain('[Chorus]')
      expect(result).toContain('[Verse 2]')
      expect(result).toContain('[Bridge]')
      expect(result).toContain('[Outro]')
    })

    it('should include title directive when songTitle is provided', () => {
      const result = generateInitialChordPro({}, 'Amazing Grace')
      
      expect(result).toContain('{title: Amazing Grace}')
    })

    it('should include subtitle directive when arrangement name is provided', () => {
      const formData: Partial<ArrangementFormData> = {
        name: 'Amazing Grace - Acoustic Version'
      }
      const result = generateInitialChordPro(formData, 'Amazing Grace')
      
      expect(result).toContain('{subtitle: Acoustic Version}')
    })

    it('should include key directive when key is provided', () => {
      const formData: Partial<ArrangementFormData> = {
        key: 'C'
      }
      const result = generateInitialChordPro(formData)
      
      expect(result).toContain('{key: C}')
    })

    it('should include tempo directive when tempo is provided', () => {
      const formData: Partial<ArrangementFormData> = {
        tempo: 120
      }
      const result = generateInitialChordPro(formData)
      
      expect(result).toContain('{tempo: 120}')
    })

    it('should include time signature directive when provided', () => {
      const formData: Partial<ArrangementFormData> = {
        timeSignature: '4/4'
      }
      const result = generateInitialChordPro(formData)
      
      expect(result).toContain('{time: 4/4}')
    })

    it('should convert Nashville numbers to actual chords for major keys', () => {
      const formData: Partial<ArrangementFormData> = {
        key: 'C'
      }
      const result = generateInitialChordPro(formData)
      
      // Check chord conversions in content
      expect(result).toContain('[C]')  // I
      expect(result).toContain('[F]')  // IV
      expect(result).toContain('[G]')  // V
      expect(result).toContain('[Am]') // vi
    })

    it('should convert Nashville numbers to actual chords for minor keys', () => {
      const formData: Partial<ArrangementFormData> = {
        key: 'Am'
      }
      const result = generateInitialChordPro(formData)
      
      // Check chord conversions for A minor
      expect(result).toContain('[Am]') // i (minor tonic)
      expect(result).toContain('[D]')  // IV (major subdominant)
      expect(result).toContain('[E]')  // V (major dominant)
      expect(result).toContain('[F#]') // VI (F# is the relative major of Am)
    })

    it('should handle sharp keys correctly', () => {
      const formData: Partial<ArrangementFormData> = {
        key: 'F#'
      }
      const result = generateInitialChordPro(formData)
      
      expect(result).toContain('[F#]')  // I
      expect(result).toContain('[B]')   // IV
      expect(result).toContain('[C#]')  // V
      expect(result).toContain('[D#m]') // vi
    })

    it('should handle enharmonic equivalents correctly', () => {
      const formData: Partial<ArrangementFormData> = {
        key: 'Db'
      }
      const result = generateInitialChordPro(formData)
      
      // Db is normalized to C# internally for calculations
      expect(result).toContain('{key: Db}')
      expect(result).toContain('[Db]')  // I (keeps original key)
      expect(result).toContain('[F#]')  // IV (calculated from C#)
      expect(result).toContain('[G#]')  // V (calculated from C#)
      expect(result).toContain('[A#m]') // vi (calculated from C#)
    })

    it('should include chord grid notation with display hack', () => {
      const result = generateInitialChordPro({})
      
      // Check for the display hack notation
      expect(result).toContain('[| ][I][] | ][I][] |]')     // Intro
      expect(result).toContain('[| ][vi][] | ][IV][] | ][I][] |]') // Outro
    })

    it('should handle unknown keys gracefully', () => {
      const formData: Partial<ArrangementFormData> = {
        key: 'X'
      }
      const result = generateInitialChordPro(formData)
      
      expect(result).toContain('{key: X}')
      // Should fall back to Nashville numbers
      expect(result).toContain('[X]')  // Uses the key as-is
      expect(result).toContain('[IV]') // Keeps Nashville numbers
      expect(result).toContain('[V]')
      expect(result).toContain('[vi]')
    })

    it('should generate all directives with complete form data', () => {
      const formData: Partial<ArrangementFormData> = {
        name: 'Test Song - Jazz Version',
        key: 'G',
        tempo: 140,
        timeSignature: '3/4'
      }
      const result = generateInitialChordPro(formData, 'Test Song')
      
      expect(result).toContain('{title: Test Song}')
      expect(result).toContain('{subtitle: Jazz Version}')
      expect(result).toContain('{key: G}')
      expect(result).toContain('{tempo: 140}')
      expect(result).toContain('{time: 3/4}')
    })
  })

  describe('generateBasicChordProTemplate', () => {
    it('should generate minimal template with no parameters', () => {
      const result = generateBasicChordProTemplate()
      
      expect(result).toContain('[Verse 1]')
      expect(result).toContain('[Chorus]')
      expect(result).toContain('[Verse 2]')
      expect(result).toContain('Add your lyrics here...')
      expect(result).toContain('Chorus lyrics here...')
    })

    it('should include title when provided', () => {
      const result = generateBasicChordProTemplate('My Song')
      
      expect(result).toContain('{title: My Song}')
    })

    it('should include subtitle when provided', () => {
      const result = generateBasicChordProTemplate('My Song', 'Acoustic')
      
      expect(result).toContain('{title: My Song}')
      expect(result).toContain('{subtitle: Acoustic}')
    })

    it('should include both title and subtitle when provided', () => {
      const result = generateBasicChordProTemplate('Test', 'Version 2')
      
      expect(result.startsWith('{title: Test}\n{subtitle: Version 2}')).toBe(true)
    })
  })

  describe('updateChordProMetadata', () => {
    const existingContent = `{title: Old Song}
{key: C}
[Verse 1]
[C]This is the [G]content`

    it('should update existing title', () => {
      const result = updateChordProMetadata(
        existingContent,
        {},
        'New Song'
      )
      
      expect(result).toContain('{title: New Song}')
      expect(result).not.toContain('{title: Old Song}')
    })

    it('should add title if not present', () => {
      const content = '[Verse 1]\n[C]Content'
      const result = updateChordProMetadata(
        content,
        {},
        'New Title'
      )
      
      expect(result.startsWith('{title: New Title}')).toBe(true)
    })

    it('should update existing key', () => {
      const formData: Partial<ArrangementFormData> = {
        key: 'G'
      }
      const result = updateChordProMetadata(existingContent, formData)
      
      expect(result).toContain('{key: G}')
      expect(result).not.toContain('{key: C}')
    })

    it('should add key if not present', () => {
      const content = '{title: Song}\n[Verse 1]'
      const formData: Partial<ArrangementFormData> = {
        key: 'D'
      }
      const result = updateChordProMetadata(content, formData)
      
      expect(result).toContain('{key: D}')
    })

    it('should update existing tempo', () => {
      const content = '{title: Song}\n{tempo: 100}\n[Verse 1]'
      const formData: Partial<ArrangementFormData> = {
        tempo: 120
      }
      const result = updateChordProMetadata(content, formData)
      
      expect(result).toContain('{tempo: 120}')
      expect(result).not.toContain('{tempo: 100}')
    })

    it('should add tempo if not present', () => {
      const formData: Partial<ArrangementFormData> = {
        tempo: 90
      }
      const result = updateChordProMetadata(existingContent, formData)
      
      expect(result).toContain('{tempo: 90}')
    })

    it('should update existing time signature', () => {
      const content = '{title: Song}\n{time: 4/4}\n[Verse 1]'
      const formData: Partial<ArrangementFormData> = {
        timeSignature: '3/4'
      }
      const result = updateChordProMetadata(content, formData)
      
      expect(result).toContain('{time: 3/4}')
      expect(result).not.toContain('{time: 4/4}')
    })

    it('should add subtitle after title', () => {
      const formData: Partial<ArrangementFormData> = {
        name: 'Old Song - Live Version'
      }
      const result = updateChordProMetadata(
        existingContent,
        formData,
        'Old Song'
      )
      
      expect(result).toContain('{title: Old Song}\n{subtitle: Live Version}')
    })

    it('should handle arrangement name without song title', () => {
      const formData: Partial<ArrangementFormData> = {
        name: 'Solo Arrangement'
      }
      const result = updateChordProMetadata(existingContent, formData)
      
      expect(result).toContain('{subtitle: Solo Arrangement}')
    })

    it('should preserve content after directives', () => {
      const formData: Partial<ArrangementFormData> = {
        key: 'A',
        tempo: 110
      }
      const result = updateChordProMetadata(existingContent, formData)
      
      expect(result).toContain('[Verse 1]')
      expect(result).toContain('[C]This is the [G]content')
    })

    it('should handle multiple updates at once', () => {
      const formData: Partial<ArrangementFormData> = {
        name: 'New Song - Rock Version',
        key: 'E',
        tempo: 150,
        timeSignature: '6/8'
      }
      const result = updateChordProMetadata(
        existingContent,
        formData,
        'New Song'
      )
      
      expect(result).toContain('{title: New Song}')
      expect(result).toContain('{subtitle: Rock Version}')
      expect(result).toContain('{key: E}')
      expect(result).toContain('{tempo: 150}')
      expect(result).toContain('{time: 6/8}')
    })

    it('should handle empty existing content', () => {
      const formData: Partial<ArrangementFormData> = {
        key: 'F'
      }
      const result = updateChordProMetadata('', formData, 'Empty Song')
      
      expect(result.trim()).toBe('{title: Empty Song}\n{key: F}')
    })
  })

  describe('Nashville chord conversion edge cases', () => {
    it('should handle all major keys', () => {
      const majorKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']
      
      majorKeys.forEach(key => {
        const formData: Partial<ArrangementFormData> = { key }
        const result = generateInitialChordPro(formData)
        
        expect(result).toContain(`{key: ${key}}`)
        // Should not contain Nashville numbers
        expect(result).not.toContain('[I]')
        expect(result).not.toContain('[IV]')
        expect(result).not.toContain('[V]')
        expect(result).not.toContain('[vi]')
      })
    })

    it('should handle all minor keys', () => {
      const minorKeys = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']
      
      minorKeys.forEach(key => {
        const formData: Partial<ArrangementFormData> = { key }
        const result = generateInitialChordPro(formData)
        
        expect(result).toContain(`{key: ${key}}`)
        // Should not contain Nashville numbers
        expect(result).not.toContain('[I]')
        expect(result).not.toContain('[IV]')
        expect(result).not.toContain('[V]')
        expect(result).not.toContain('[vi]')
      })
    })

    it('should keep Nashville numbers when no key is provided', () => {
      const result = generateInitialChordPro({})
      
      // Check that Nashville numbers are preserved in non-grid sections
      expect(result).toContain('[I]Add your lyrics')
      expect(result).toContain('[V]chords')
      expect(result).toContain('[vi]Each line')
      expect(result).toContain('[IV]changes')
    })
  })
})