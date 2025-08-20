import { describe, it, expect } from 'vitest'
import { 
  arrangementSchema, 
  updateArrangementSchema,
  arrangementFieldSchemas,
  chordProValidation,
  createArrangementSchema,
  type ArrangementFormData,
  type UpdateArrangementFormData
} from '../arrangementSchema'

describe('arrangementSchema', () => {
  describe('basic validation', () => {
    it('should validate minimal valid arrangement data', () => {
      const validData: ArrangementFormData = {
        name: 'Test Arrangement',
        key: 'C',
        difficulty: 'beginner',
        tags: [],
        chordProText: '',
        notes: undefined
      }

      const result = arrangementSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require arrangement name', () => {
      const invalidData = {
        difficulty: 'beginner'
      }

      const result = arrangementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Arrangement name is required')
      }
    })

    it('should require difficulty', () => {
      const invalidData = {
        name: 'Test Arrangement'
      }

      const result = arrangementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a valid difficulty level')
      }
    })
  })

  describe('name validation', () => {
    it('should accept valid arrangement names', () => {
      const validNames = [
        'Simple Arrangement',
        'A',
        'Amazing Grace - Acoustic Version',
        'How Great Thou Art (Capo 3)',
        'Arrangement with Numbers 123'
      ]

      validNames.forEach(name => {
        const result = arrangementSchema.safeParse({
          name,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject empty or whitespace-only names', () => {
      const invalidNames = ['', '   ', '\t\n']

      invalidNames.forEach(name => {
        const result = arrangementSchema.safeParse({
          name,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(false)
      })
    })

    it('should reject names longer than 100 characters', () => {
      const longName = 'A'.repeat(101)
      const result = arrangementSchema.safeParse({
        name: longName,
        difficulty: 'beginner'
      })
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Arrangement name must be less than 100 characters')
      }
    })

    it('should trim whitespace from names', () => {
      const result = arrangementSchema.safeParse({
        name: '  Test Arrangement  ',
        difficulty: 'beginner'
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Arrangement')
      }
    })
  })

  describe('slug validation', () => {
    it('should accept valid slugs', () => {
      const validSlugs = [
        'simple-arrangement',
        'amazing-grace-acoustic',
        'arrangement-123',
        'test',
        'a-very-long-slug-name-with-many-words'
      ]

      validSlugs.forEach(slug => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          slug,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid slug characters', () => {
      const invalidSlugs = [
        'Invalid Slug',
        'slug_with_underscores',
        'UPPERCASE-SLUG',
        'slug.with.dots',
        'slug with spaces',
        'slug@with#symbols'
      ]

      invalidSlugs.forEach(slug => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          slug,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Slug must contain only lowercase letters, numbers, and hyphens')
        }
      })
    })

    it('should make slug optional', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        difficulty: 'beginner'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('musical key validation', () => {
    it('should accept valid major keys', () => {
      const majorKeys = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']

      majorKeys.forEach(key => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          key,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should accept valid minor keys', () => {
      const minorKeys = ['Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm']

      minorKeys.forEach(key => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          key,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid keys', () => {
      const invalidKeys = ['H', 'Cb', 'E#', 'Fb', 'B#', 'Cm7', 'Dmaj', 'invalid']

      invalidKeys.forEach(key => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          key,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Please select a valid musical key')
        }
      })
    })

    it('should make key optional', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        difficulty: 'beginner'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('tempo validation', () => {
    it('should accept valid tempo ranges', () => {
      const validTempos = [40, 60, 120, 180, 240]

      validTempos.forEach(tempo => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          tempo,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject tempo below minimum', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        tempo: 39,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tempo must be at least 40 BPM')
      }
    })

    it('should reject tempo above maximum', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        tempo: 241,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tempo must be less than 240 BPM')
      }
    })

    it('should reject non-integer tempos', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        tempo: 120.5,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tempo must be a whole number')
      }
    })

    it('should make tempo optional', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        difficulty: 'beginner'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('time signature validation', () => {
    it('should accept valid time signatures', () => {
      const validTimeSignatures = ['2/2', '2/4', '3/4', '4/4', '5/4', '6/4', '7/4', '3/8', '6/8', '9/8', '12/8']

      validTimeSignatures.forEach(timeSignature => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          timeSignature,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid time signatures', () => {
      const invalidTimeSignatures = ['1/4', '8/4', '5/8', '10/16', 'invalid']

      invalidTimeSignatures.forEach(timeSignature => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          timeSignature,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Please select a valid time signature')
        }
      })
    })

    it('should make time signature optional', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        difficulty: 'beginner'
      })
      expect(result.success).toBe(true)
    })
  })

  describe('difficulty validation', () => {
    it('should accept valid difficulty levels', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced']

      validDifficulties.forEach(difficulty => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          difficulty
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid difficulty levels', () => {
      const invalidDifficulties = ['easy', 'hard', 'expert', 'novice', 'professional']

      invalidDifficulties.forEach(difficulty => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          difficulty
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Please select a valid difficulty level')
        }
      })
    })
  })

  describe('tags validation', () => {
    it('should accept valid tag arrays', () => {
      const validTagArrays = [
        [],
        ['acoustic'],
        ['acoustic', 'fingerpicking'],
        ['acoustic', 'fingerpicking', 'capo', 'beginner', 'folk']
      ]

      validTagArrays.forEach(tags => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          tags,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject empty tags', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        tags: [''],
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tag cannot be empty')
      }
    })

    it('should reject tags longer than 50 characters', () => {
      const longTag = 'A'.repeat(51)
      const result = arrangementSchema.safeParse({
        name: 'Test',
        tags: [longTag],
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Tag must be less than 50 characters')
      }
    })

    it('should reject more than 10 tags', () => {
      const manyTags = Array.from({ length: 11 }, (_, i) => `tag${i + 1}`)
      const result = arrangementSchema.safeParse({
        name: 'Test',
        tags: manyTags,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum 10 tags allowed')
      }
    })

    it('should trim whitespace from tags', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        tags: ['  acoustic  ', '  fingerpicking  '],
        difficulty: 'beginner'
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tags).toEqual(['acoustic', 'fingerpicking'])
      }
    })

    it('should default to empty array when tags not provided', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        difficulty: 'beginner'
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tags).toEqual([])
      }
    })
  })

  describe('ChordPro text validation', () => {
    it('should accept valid ChordPro text', () => {
      const validChordProTexts = [
        '',
        '{title: Amazing Grace}',
        '{title: Test}\n{key: C}\n[C]Amazing [F]grace',
        'A'.repeat(1000) // Well within 50KB limit
      ]

      validChordProTexts.forEach(chordProText => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          chordProText,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject ChordPro text exceeding size limit', () => {
      const largeText = 'A'.repeat(50001) // Exceeds 50KB limit
      const result = arrangementSchema.safeParse({
        name: 'Test',
        chordProText: largeText,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Chord data is too large (max 50KB)')
      }
    })

    it('should default to empty string when not provided', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        difficulty: 'beginner'
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.chordProText).toBe('')
      }
    })
  })

  describe('description validation', () => {
    it('should accept valid descriptions', () => {
      const validDescriptions = [
        undefined,
        '',
        'Short description',
        'A'.repeat(1000) // At the limit
      ]

      validDescriptions.forEach(description => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          description,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject descriptions longer than 1000 characters', () => {
      const longDescription = 'A'.repeat(1001)
      const result = arrangementSchema.safeParse({
        name: 'Test',
        description: longDescription,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must be less than 1000 characters')
      }
    })
  })

  describe('capo validation', () => {
    it('should accept valid capo positions', () => {
      const validCapos = [0, 1, 5, 12]

      validCapos.forEach(capo => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          capo,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject negative capo positions', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        capo: -1,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Capo position cannot be negative')
      }
    })

    it('should reject capo positions greater than 12', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        capo: 13,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Capo position must be 12 or less')
      }
    })

    it('should reject non-integer capo positions', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        capo: 3.5,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Capo position must be a whole number')
      }
    })
  })

  describe('duration validation', () => {
    it('should accept valid durations', () => {
      const validDurations = [1, 60, 180, 300, 3600]

      validDurations.forEach(duration => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          duration,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject duration less than 1 second', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        duration: 0,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Duration must be at least 1 second')
      }
    })

    it('should reject duration greater than 1 hour', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        duration: 3601,
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Duration must be less than 1 hour')
      }
    })
  })

  describe('songIds validation', () => {
    it('should accept valid songIds arrays', () => {
      const validSongIds = [
        ['song-123'],
        ['song-123', 'song-456'],
        undefined // Optional field
      ]

      validSongIds.forEach(songIds => {
        const result = arrangementSchema.safeParse({
          name: 'Test',
          songIds,
          difficulty: 'beginner'
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject empty songIds array when provided', () => {
      const result = arrangementSchema.safeParse({
        name: 'Test',
        songIds: [],
        difficulty: 'beginner'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one song ID is required')
      }
    })
  })
})

describe('updateArrangementSchema', () => {
  it('should validate update data with ID', () => {
    const updateData: UpdateArrangementFormData = {
      id: 'arrangement-123',
      name: 'Updated Name'
    }

    const result = updateArrangementSchema.safeParse(updateData)
    expect(result.success).toBe(true)
  })

  it('should require ID for updates', () => {
    const updateData = {
      name: 'Updated Name'
    }

    const result = updateArrangementSchema.safeParse(updateData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Arrangement ID is required')
    }
  })

  it('should allow partial updates', () => {
    const updateData: UpdateArrangementFormData = {
      id: 'arrangement-123',
      tempo: 140
    }

    const result = updateArrangementSchema.safeParse(updateData)
    expect(result.success).toBe(true)
  })
})

describe('arrangementFieldSchemas', () => {
  it('should provide individual field schemas', () => {
    expect(arrangementFieldSchemas.name).toBeDefined()
    expect(arrangementFieldSchemas.key).toBeDefined()
    expect(arrangementFieldSchemas.tempo).toBeDefined()
    expect(arrangementFieldSchemas.difficulty).toBeDefined()
    expect(arrangementFieldSchemas.tags).toBeDefined()
  })

  it('should validate individual fields correctly', () => {
    const nameResult = arrangementFieldSchemas.name.safeParse('Valid Name')
    expect(nameResult.success).toBe(true)

    const invalidNameResult = arrangementFieldSchemas.name.safeParse('')
    expect(invalidNameResult.success).toBe(false)
  })
})

describe('chordProValidation', () => {
  describe('hasDirectives', () => {
    it('should detect ChordPro directives', () => {
      expect(chordProValidation.hasDirectives('{title: Test}')).toBe(true)
      expect(chordProValidation.hasDirectives('{key: C}')).toBe(true)
      expect(chordProValidation.hasDirectives('{start_of_chorus}')).toBe(true)
      expect(chordProValidation.hasDirectives('Regular text')).toBe(false)
      expect(chordProValidation.hasDirectives('')).toBe(false)
    })
  })

  describe('hasChords', () => {
    it('should detect chord notations', () => {
      expect(chordProValidation.hasChords('[C]')).toBe(true)
      expect(chordProValidation.hasChords('[Am]')).toBe(true)
      expect(chordProValidation.hasChords('[F#maj7]')).toBe(true)
      expect(chordProValidation.hasChords('Regular text')).toBe(false)
      expect(chordProValidation.hasChords('')).toBe(false)
    })
  })

  describe('extractTitle', () => {
    it('should extract title from ChordPro', () => {
      expect(chordProValidation.extractTitle('{title: Amazing Grace}')).toBe('Amazing Grace')
      expect(chordProValidation.extractTitle('{t: Short Title}')).toBe('Short Title')
      expect(chordProValidation.extractTitle('No title here')).toBe(null)
    })
  })

  describe('extractKey', () => {
    it('should extract key from ChordPro', () => {
      expect(chordProValidation.extractKey('{key: C}')).toBe('C')
      expect(chordProValidation.extractKey('{key: F#m}')).toBe('F#m')
      expect(chordProValidation.extractKey('No key here')).toBe(null)
    })
  })

  describe('isValid', () => {
    it('should validate ChordPro structure', () => {
      expect(chordProValidation.isValid('{title: Test}')).toBe(true)
      expect(chordProValidation.isValid('[C]Amazing grace')).toBe(true)
      expect(chordProValidation.isValid('{title: Test}\n[C]Amazing [F]grace')).toBe(true)
      expect(chordProValidation.isValid('')).toBe(false)
      expect(chordProValidation.isValid('Just plain text')).toBe(false)
    })
  })
})

describe('createArrangementSchema', () => {
  it('should create schema with required key', () => {
    const schema = createArrangementSchema({ requireKey: true })
    
    const resultWithKey = schema.safeParse({
      name: 'Test',
      key: 'C',
      difficulty: 'beginner'
    })
    expect(resultWithKey.success).toBe(true)

    const resultWithoutKey = schema.safeParse({
      name: 'Test',
      difficulty: 'beginner'
    })
    expect(resultWithoutKey.success).toBe(false)
  })

  it('should create schema with required tempo', () => {
    const schema = createArrangementSchema({ requireTempo: true })
    
    const resultWithTempo = schema.safeParse({
      name: 'Test',
      tempo: 120,
      difficulty: 'beginner'
    })
    expect(resultWithTempo.success).toBe(true)

    const resultWithoutTempo = schema.safeParse({
      name: 'Test',
      difficulty: 'beginner'
    })
    expect(resultWithoutTempo.success).toBe(false)
  })

  it('should create schema with required difficulty', () => {
    const schema = createArrangementSchema({ requireDifficulty: true })
    
    const resultWithDifficulty = schema.safeParse({
      name: 'Test',
      difficulty: 'beginner'
    })
    expect(resultWithDifficulty.success).toBe(true)

    const resultWithoutDifficulty = schema.safeParse({
      name: 'Test'
    })
    expect(resultWithoutDifficulty.success).toBe(false)
  })

  it('should create schema with custom chord data size limit', () => {
    const schema = createArrangementSchema({ maxChordDataSize: 100 })
    
    const resultWithSmallData = schema.safeParse({
      name: 'Test',
      chordData: 'Small data',
      difficulty: 'beginner'
    })
    expect(resultWithSmallData.success).toBe(true)

    const resultWithLargeData = schema.safeParse({
      name: 'Test',
      chordData: 'A'.repeat(101),
      difficulty: 'beginner'
    })
    expect(resultWithLargeData.success).toBe(false)
  })

  it('should combine multiple requirements', () => {
    const schema = createArrangementSchema({
      requireKey: true,
      requireTempo: true,
      requireDifficulty: true
    })
    
    const completeData = {
      name: 'Test',
      key: 'C',
      tempo: 120,
      difficulty: 'beginner'
    }
    expect(schema.safeParse(completeData).success).toBe(true)

    const incompleteData = {
      name: 'Test',
      key: 'C'
      // Missing tempo and difficulty
    }
    expect(schema.safeParse(incompleteData).success).toBe(false)
  })
})

describe('edge cases and transformations', () => {
  it('should handle empty string to undefined transformation', () => {
    const result = arrangementSchema.safeParse({
      name: 'Test',
      notes: '',
      difficulty: 'beginner'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBeUndefined()
    }
  })

  it('should preserve non-empty notes', () => {
    const result = arrangementSchema.safeParse({
      name: 'Test',
      notes: 'Important notes',
      difficulty: 'beginner'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('Important notes')
    }
  })

  it('should handle complex valid arrangement', () => {
    const complexArrangement: ArrangementFormData = {
      name: 'Complex Arrangement',
      slug: 'complex-arrangement',
      key: 'F#',
      tempo: 85,
      timeSignature: '6/8',
      difficulty: 'advanced',
      tags: ['jazz', 'complex', 'fingerpicking'],
      chordProText: '{title: Complex}\n{key: F#}\n[F#]Complex [B]chord [C#]progression',
      chordData: 'Alternative chord data',
      description: 'A very complex jazz arrangement',
      songIds: ['song-123', 'song-456'],
      notes: 'Requires advanced techniques',
      capo: 2,
      duration: 275
    }

    const result = arrangementSchema.safeParse(complexArrangement)
    expect(result.success).toBe(true)
  })
})