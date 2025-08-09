import { describe, it, expect } from 'vitest'
import {
  songFormSchema,
  updateSongFormSchema,
  songFieldSchemas,
  songSearchSchema,
  songValidationHelpers,
  createSongSchema
} from '../schemas/songFormSchema'

describe('songFormSchema', () => {
  describe('basic validation', () => {
    it('should validate a complete valid song', () => {
      const validSong = {
        title: 'Amazing Grace',
        artist: 'John Newton',
        compositionYear: 1779,
        ccli: '12345',
        source: 'Classic-Hymn',
        themes: ['Grace', 'Salvation'],
        notes: 'Traditional hymn',
        isPublic: true
      }

      const result = songFormSchema.safeParse(validSong)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Amazing Grace')
        expect(result.data.themes).toContain('Grace')
      }
    })

    it('should validate minimal valid song', () => {
      const minimalSong = {
        title: 'Test Song',
        themes: ['Worship'],
        isPublic: false
      }

      const result = songFormSchema.safeParse(minimalSong)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const invalidSong = {
        title: '',
        themes: ['Worship'],
        isPublic: false
      }

      const result = songFormSchema.safeParse(invalidSong)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required')
      }
    })

    it('should reject whitespace-only title', () => {
      const invalidSong = {
        title: '   ',
        themes: ['Worship'],
        isPublic: false
      }

      const result = songFormSchema.safeParse(invalidSong)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes('whitespace'))).toBe(true)
      }
    })

    it('should reject empty themes array', () => {
      const invalidSong = {
        title: 'Test Song',
        themes: [],
        isPublic: false
      }

      const result = songFormSchema.safeParse(invalidSong)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one theme')
      }
    })
  })

  describe('field transformations', () => {
    it('should trim title', () => {
      const song = {
        title: '  Test Song  ',
        themes: ['Worship'],
        isPublic: false
      }

      const result = songFormSchema.parse(song)
      expect(result.title).toBe('Test Song')
    })

    it('should transform empty strings to undefined', () => {
      const song = {
        title: 'Test Song',
        artist: '',
        notes: '',
        ccli: '',
        themes: ['Worship'],
        isPublic: false
      }

      const result = songFormSchema.parse(song)
      expect(result.artist).toBeUndefined()
      expect(result.notes).toBeUndefined()
      expect(result.ccli).toBeUndefined()
    })

    it('should normalize themes', () => {
      const song = {
        title: 'Test Song',
        themes: ['worship', 'PRAISE', 'thankfulness'],
        isPublic: false
      }

      const result = songFormSchema.parse(song)
      expect(result.themes).toEqual(['Worship', 'Praise', 'Thanksgiving'])
    })
  })

  describe('CCLI validation', () => {
    it('should accept valid CCLI numbers', () => {
      const validCCLIs = ['12345', '123456', '1234567']
      
      validCCLIs.forEach(ccli => {
        const song = {
          title: 'Test Song',
          ccli,
          themes: ['Worship'],
          isPublic: false
        }
        
        const result = songFormSchema.safeParse(song)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid CCLI numbers', () => {
      const invalidCCLIs = ['1234', '12345678', 'abcde', '12 345']
      
      invalidCCLIs.forEach(ccli => {
        const song = {
          title: 'Test Song',
          ccli,
          themes: ['Worship'],
          isPublic: false
        }
        
        const result = songFormSchema.safeParse(song)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('year validation', () => {
    const currentYear = new Date().getFullYear()

    it('should accept valid years', () => {
      const validYears = [1500, 2000, currentYear]
      
      validYears.forEach(year => {
        const song = {
          title: 'Test Song',
          compositionYear: year,
          themes: ['Worship'],
          isPublic: false
        }
        
        const result = songFormSchema.safeParse(song)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid years', () => {
      const invalidYears = [999, currentYear + 1, 1.5]
      
      invalidYears.forEach(year => {
        const song = {
          title: 'Test Song',
          compositionYear: year,
          themes: ['Worship'],
          isPublic: false
        }
        
        const result = songFormSchema.safeParse(song)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('slug validation', () => {
    it('should accept valid slugs', () => {
      const validSlugs = ['test-song', 'amazing-grace-jn-abc12', 'song123']
      
      validSlugs.forEach(slug => {
        const song = {
          title: 'Test Song',
          themes: ['Worship'],
          isPublic: false,
          slug
        }
        
        const result = songFormSchema.safeParse(song)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid slugs', () => {
      const invalidSlugs = ['Test-Song', 'test_song', 'test song', 'test-song-']
      
      invalidSlugs.forEach(slug => {
        const song = {
          title: 'Test Song',
          themes: ['Worship'],
          isPublic: false,
          slug
        }
        
        const result = songFormSchema.safeParse(song)
        expect(result.success).toBe(false)
      })
    })
  })
})

describe('updateSongFormSchema', () => {
  it('should require ID', () => {
    const update = {
      title: 'Updated Title'
    }
    
    const result = updateSongFormSchema.safeParse(update)
    expect(result.success).toBe(false)
  })

  it('should accept partial updates with ID', () => {
    const update = {
      id: 'song-123',
      title: 'Updated Title'
    }
    
    const result = updateSongFormSchema.safeParse(update)
    expect(result.success).toBe(true)
  })

  it('should require at least one field to update', () => {
    const update = {
      id: 'song-123'
    }
    
    const result = updateSongFormSchema.safeParse(update)
    expect(result.success).toBe(false)
  })
})

describe('songSearchSchema', () => {
  it('should validate search parameters', () => {
    const search = {
      query: 'amazing',
      themes: ['Grace'],
      sortBy: 'title',
      sortOrder: 'asc',
      page: 1,
      limit: 20
    }
    
    const result = songSearchSchema.parse(search)
    expect(result.query).toBe('amazing')
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('should use defaults', () => {
    const search = {}
    
    const result = songSearchSchema.parse(search)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('should validate year range', () => {
    const search = {
      year: {
        min: 1500,
        max: 2000
      }
    }
    
    const result = songSearchSchema.safeParse(search)
    expect(result.success).toBe(true)
  })
})

describe('songValidationHelpers', () => {
  describe('isValidCCLI', () => {
    it('should validate CCLI numbers', () => {
      expect(songValidationHelpers.isValidCCLI('12345')).toBe(true)
      expect(songValidationHelpers.isValidCCLI('1234567')).toBe(true)
      expect(songValidationHelpers.isValidCCLI('1234')).toBe(false)
      expect(songValidationHelpers.isValidCCLI('abcde')).toBe(false)
    })
  })

  describe('isValidYear', () => {
    it('should validate years', () => {
      expect(songValidationHelpers.isValidYear(2000)).toBe(true)
      expect(songValidationHelpers.isValidYear(999)).toBe(false)
      expect(songValidationHelpers.isValidYear(new Date().getFullYear() + 1)).toBe(false)
    })
  })

  describe('isValidSource', () => {
    it('should validate sources', () => {
      expect(songValidationHelpers.isValidSource('Classic-Hymn')).toBe(true)
      expect(songValidationHelpers.isValidSource('InvalidSource')).toBe(false)
    })
  })

  describe('sanitizeFormData', () => {
    it('should sanitize form data', () => {
      const data = {
        title: '  Test Song  ',
        artist: '',
        notes: '  Some notes  ',
        themes: 'not-an-array'
      }
      
      const sanitized = songValidationHelpers.sanitizeFormData(data)
      expect(sanitized.title).toBe('Test Song')
      expect(sanitized.artist).toBeUndefined()
      expect(sanitized.notes).toBe('Some notes')
      expect(sanitized.themes).toEqual([])
    })
  })
})

describe('createSongSchema', () => {
  it('should create schema with required artist', () => {
    const schema = createSongSchema({ requireArtist: true })
    
    const result = schema.safeParse({
      title: 'Test Song',
      themes: ['Worship'],
      isPublic: false
    })
    
    expect(result.success).toBe(false)
  })

  it('should create schema with custom theme limits', () => {
    const schema = createSongSchema({ minThemes: 2, maxThemes: 5 })
    
    const tooFew = schema.safeParse({
      title: 'Test Song',
      themes: ['Worship'],
      isPublic: false
    })
    expect(tooFew.success).toBe(false)
    
    const justRight = schema.safeParse({
      title: 'Test Song',
      themes: ['Worship', 'Praise'],
      isPublic: false
    })
    expect(justRight.success).toBe(true)
    
    const tooMany = schema.safeParse({
      title: 'Test Song',
      themes: ['A', 'B', 'C', 'D', 'E', 'F'],
      isPublic: false
    })
    expect(tooMany.success).toBe(false)
  })
})