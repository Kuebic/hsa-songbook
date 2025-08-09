# Song Validation & Schemas Implementation PRP

## Executive Summary
Implement comprehensive Zod validation schemas for song forms, including duplicate detection, theme normalization, and unique slug generation with collision handling. This will ensure data integrity and prevent duplicate entries in the HSA Songbook.

**Confidence Score: 9/10** - High confidence due to existing Zod infrastructure and clear validation requirements.

## Context and Research Findings

### Current State Analysis
**Existing Validation:**
- Basic field schemas in `src/shared/validation/schemas.ts`
- Song field validation in `src/features/songs/utils/songFieldValidation.ts`
- Backend validation in `server/features/songs/song.validation.ts`

**Missing Validation:**
- Duplicate song detection algorithm
- Theme normalization and controlled vocabulary
- Slug uniqueness with collision handling
- Arrangement-specific fields (key, tempo, difficulty)
- CCLI number format validation

### Requirements from Documentation
From `claude_md_files/song-form.md`:
- Normalize titles for duplicate detection (remove punctuation, lowercase)
- Levenshtein distance < 3 for similarity detection
- Unique slug generation: `title-artist-initials-randomid`
- Theme normalization with controlled vocabulary
- Source dropdown from predefined list

### Vertical Slice Architecture
```
src/features/songs/validation/
├── schemas/
│   ├── songFormSchema.ts       # Complete form validation
│   ├── arrangementSchema.ts    # Arrangement validation
│   └── index.ts                # Schema exports
├── utils/
│   ├── duplicateDetection.ts   # Duplicate checking logic
│   ├── slugGeneration.ts       # Unique slug generator
│   ├── themeNormalization.ts   # Theme vocabulary control
│   └── levenshtein.ts          # String similarity algorithm
├── constants/
│   ├── themes.ts                # Normalized theme mappings
│   ├── sources.ts               # Valid song sources
│   └── musicalKeys.ts           # Valid musical keys
└── __tests__/
    ├── songFormSchema.test.ts
    ├── duplicateDetection.test.ts
    └── slugGeneration.test.ts
```

## Implementation Blueprint

### Phase 1: Core Constants and Types

```typescript
// src/features/songs/validation/constants/themes.ts
export const NORMALIZED_THEMES = {
  'christmas': ['Christmas', 'xmas', 'x-mas', 'Xmas', 'X-mas', 'nativity', 'advent'],
  'easter': ['Easter', 'resurrection', 'passover', 'holy week'],
  'worship': ['Worship', 'praise', 'adoration', 'exaltation'],
  'prayer': ['Prayer', 'supplication', 'intercession', 'petition'],
  'thanksgiving': ['Thanksgiving', 'gratitude', 'thankfulness', 'grateful'],
  'salvation': ['Salvation', 'redemption', 'saved', 'born again'],
  'grace': ['Grace', 'mercy', 'forgiveness', 'pardon'],
  'faith': ['Faith', 'belief', 'trust', 'confidence'],
  'hope': ['Hope', 'expectation', 'anticipation'],
  'love': ['Love', 'charity', 'agape', 'compassion'],
  'peace': ['Peace', 'shalom', 'tranquility', 'calm'],
  'joy': ['Joy', 'happiness', 'gladness', 'rejoicing'],
  'healing': ['Healing', 'restoration', 'wholeness', 'recovery'],
  'comfort': ['Comfort', 'consolation', 'encouragement'],
  'guidance': ['Guidance', 'direction', 'leading', 'wisdom'],
  'holy-spirit': ['Holy Spirit', 'spirit', 'comforter', 'advocate'],
  'trinity': ['Trinity', 'triune', 'godhead'],
  'baptism': ['Baptism', 'immersion', 'christening'],
  'communion': ['Communion', 'eucharist', 'lord\'s supper', 'breaking bread'],
  'missions': ['Missions', 'evangelism', 'outreach', 'witness'],
  'children': ['Children', 'kids', 'youth', 'young'],
  'traditional': ['Traditional', 'hymn', 'classic', 'heritage'],
  'contemporary': ['Contemporary', 'modern', 'current', 'new'],
  'patriotic': ['Patriotic', 'national', 'country', 'america']
} as const

export type NormalizedTheme = keyof typeof NORMALIZED_THEMES

// src/features/songs/validation/constants/sources.ts
export const SONG_SOURCES = [
  'Traditional-Holy',
  'New-Holy',
  'American-Pioneer',
  'Adapted-Secular',
  'Secular-General',
  'Contemporary-Christian',
  'Classic-Hymn',
  'Original-Interchurch',
  'Modern-Worship',
  'Gospel',
  'Spiritual',
  'Custom-Arrangement'
] as const

export type SongSource = typeof SONG_SOURCES[number]

// src/features/songs/validation/constants/musicalKeys.ts
export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm',
  'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'
] as const

export type MusicalKey = typeof MUSICAL_KEYS[number]

export const TIME_SIGNATURES = [
  '2/2', '2/4', '3/4', '4/4', '5/4', '6/4', '7/4',
  '3/8', '6/8', '9/8', '12/8'
] as const

export type TimeSignature = typeof TIME_SIGNATURES[number]
```

### Phase 2: Utility Functions

```typescript
// src/features/songs/validation/utils/levenshtein.ts
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// src/features/songs/validation/utils/themeNormalization.ts
import { NORMALIZED_THEMES, type NormalizedTheme } from '../constants/themes'

export function normalizeTheme(input: string): string {
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()
  
  // Check if it's already a normalized theme
  if (lower in NORMALIZED_THEMES) {
    return lower
  }
  
  // Find matching normalized theme
  for (const [normalized, variants] of Object.entries(NORMALIZED_THEMES)) {
    if (variants.some(v => v.toLowerCase() === lower)) {
      return normalized
    }
  }
  
  // Return original if no match found (for custom themes)
  return trimmed
}

export function normalizeThemes(themes: string[]): string[] {
  const normalized = themes.map(normalizeTheme)
  // Remove duplicates
  return Array.from(new Set(normalized))
}

export function suggestThemes(input: string): string[] {
  const lower = input.toLowerCase()
  const suggestions: string[] = []
  
  // Add exact matches first
  for (const [normalized, variants] of Object.entries(NORMALIZED_THEMES)) {
    if (normalized.startsWith(lower)) {
      suggestions.push(normalized)
    }
  }
  
  // Add partial matches
  for (const [normalized, variants] of Object.entries(NORMALIZED_THEMES)) {
    if (!suggestions.includes(normalized)) {
      if (variants.some(v => v.toLowerCase().includes(lower))) {
        suggestions.push(normalized)
      }
    }
  }
  
  return suggestions.slice(0, 10) // Limit to 10 suggestions
}

// src/features/songs/validation/utils/duplicateDetection.ts
import { levenshteinDistance } from './levenshtein'
import type { Song } from '@features/songs/types/song.types'

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')         // Normalize spaces
    .trim()
}

export interface SimilarSong {
  song: Song
  similarity: 'exact' | 'very-similar' | 'similar'
  distance: number
}

export function findSimilarSongs(
  title: string,
  existingSongs: Song[],
  artist?: string
): SimilarSong[] {
  const normalizedTitle = normalizeTitle(title)
  const normalizedArtist = artist ? normalizeTitle(artist) : ''
  
  const similar: SimilarSong[] = []
  
  for (const song of existingSongs) {
    const songNormalizedTitle = normalizeTitle(song.title)
    const songNormalizedArtist = song.artist ? normalizeTitle(song.artist) : ''
    
    // Check title similarity
    const titleDistance = levenshteinDistance(songNormalizedTitle, normalizedTitle)
    
    // Exact match
    if (titleDistance === 0) {
      // Check if same artist
      if (normalizedArtist && songNormalizedArtist) {
        const artistDistance = levenshteinDistance(songNormalizedArtist, normalizedArtist)
        if (artistDistance === 0) {
          similar.push({ song, similarity: 'exact', distance: 0 })
          continue
        }
      } else {
        similar.push({ song, similarity: 'exact', distance: 0 })
        continue
      }
    }
    
    // Very similar (< 3 character difference)
    if (titleDistance < 3) {
      similar.push({ song, similarity: 'very-similar', distance: titleDistance })
    }
    // Similar (< 5 character difference for longer titles)
    else if (normalizedTitle.length > 10 && titleDistance < 5) {
      similar.push({ song, similarity: 'similar', distance: titleDistance })
    }
  }
  
  // Sort by distance (most similar first)
  return similar.sort((a, b) => a.distance - b.distance)
}

// src/features/songs/validation/utils/slugGeneration.ts
export interface SlugOptions {
  title: string
  artist?: string
  existingSlugs?: string[]
  maxAttempts?: number
}

export async function generateUniqueSlug({
  title,
  artist,
  existingSlugs = [],
  maxAttempts = 10
}: SlugOptions): Promise<string> {
  // Generate base slug from title
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
  
  // Generate artist initials
  const initials = artist
    ? artist
        .split(/\s+/)
        .map(word => word[0])
        .join('')
        .toLowerCase()
    : ''
  
  // Try to generate unique slug
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomId = Math.random().toString(36).substring(2, 7)
    const slug = initials 
      ? `${baseSlug}-${initials}-${randomId}`
      : `${baseSlug}-${randomId}`
    
    if (!existingSlugs.includes(slug)) {
      return slug
    }
  }
  
  // Fallback with timestamp if all attempts fail
  const timestamp = Date.now().toString(36)
  return initials
    ? `${baseSlug}-${initials}-${timestamp}`
    : `${baseSlug}-${timestamp}`
}
```

### Phase 3: Zod Schemas

```typescript
// src/features/songs/validation/schemas/arrangementSchema.ts
import { z } from 'zod'
import { MUSICAL_KEYS, TIME_SIGNATURES } from '../constants/musicalKeys'

export const arrangementSchema = z.object({
  name: z.string()
    .min(1, 'Arrangement name is required')
    .max(100, 'Arrangement name must be less than 100 characters'),
  
  key: z.enum(MUSICAL_KEYS as readonly [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid musical key' })
  }).optional(),
  
  tempo: z.number()
    .min(40, 'Tempo must be at least 40 BPM')
    .max(300, 'Tempo must be less than 300 BPM')
    .optional(),
  
  timeSignature: z.enum(TIME_SIGNATURES as readonly [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid time signature' })
  }).optional(),
  
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Please select a difficulty level' })
  }).optional(),
  
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  
  chordData: z.string()
    .min(1, 'Chord data is required')
    .max(50000, 'Chord data is too large')
})

export type ArrangementFormData = z.infer<typeof arrangementSchema>

// src/features/songs/validation/schemas/songFormSchema.ts
import { z } from 'zod'
import { SONG_SOURCES } from '../constants/sources'
import { arrangementSchema } from './arrangementSchema'

// CCLI validation regex (numeric, 5-7 digits)
const ccliRegex = /^\d{5,7}$/

// Year validation
const currentYear = new Date().getFullYear()

export const songFormSchema = z.object({
  // Basic Information
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  
  artist: z.string()
    .max(100, 'Artist name must be less than 100 characters')
    .trim()
    .optional()
    .transform(val => val || undefined), // Convert empty string to undefined
  
  compositionYear: z.number()
    .min(1000, 'Year must be after 1000')
    .max(currentYear, `Year cannot be in the future`)
    .optional()
    .nullable()
    .transform(val => val || undefined),
  
  ccli: z.string()
    .regex(ccliRegex, 'CCLI must be 5-7 digits')
    .optional()
    .or(z.literal(''))
    .transform(val => val || undefined),
  
  // Categorization
  source: z.enum(SONG_SOURCES as readonly [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid source' })
  }).optional(),
  
  themes: z.array(z.string().min(1).max(50))
    .min(1, 'At least one theme is required')
    .max(10, 'Maximum 10 themes allowed')
    .transform(themes => {
      // Normalize themes during validation
      const { normalizeThemes } = require('../utils/themeNormalization')
      return normalizeThemes(themes)
    }),
  
  // Additional Information
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .transform(val => val || undefined),
  
  // Metadata
  isPublic: z.boolean().default(false),
  
  // Optional arrangement
  arrangement: arrangementSchema.optional()
})

export type SongFormData = z.infer<typeof songFormSchema>

// Update form schema (for editing existing songs)
export const updateSongFormSchema = songFormSchema.partial().extend({
  id: z.string().min(1, 'Song ID is required')
})

export type UpdateSongFormData = z.infer<typeof updateSongFormSchema>

// Field-level schemas for inline editing
export const songFieldSchemas = {
  title: songFormSchema.shape.title,
  artist: songFormSchema.shape.artist,
  compositionYear: songFormSchema.shape.compositionYear,
  ccli: songFormSchema.shape.ccli,
  source: songFormSchema.shape.source,
  themes: songFormSchema.shape.themes,
  notes: songFormSchema.shape.notes,
  isPublic: songFormSchema.shape.isPublic
} as const

export type SongFieldName = keyof typeof songFieldSchemas
```

### Phase 4: Integration Hooks

```typescript
// src/features/songs/validation/hooks/useDuplicateDetection.ts
import { useState, useCallback } from 'react'
import { useSongs } from '@features/songs/hooks/useSongs'
import { findSimilarSongs, type SimilarSong } from '../utils/duplicateDetection'

export function useDuplicateDetection() {
  const { songs } = useSongs()
  const [similarSongs, setSimilarSongs] = useState<SimilarSong[]>([])
  const [isChecking, setIsChecking] = useState(false)
  
  const checkForDuplicates = useCallback(async (
    title: string,
    artist?: string
  ): Promise<SimilarSong[]> => {
    setIsChecking(true)
    
    try {
      // In production, this would be an API call
      const similar = findSimilarSongs(title, songs, artist)
      setSimilarSongs(similar)
      return similar
    } finally {
      setIsChecking(false)
    }
  }, [songs])
  
  const clearSimilarSongs = useCallback(() => {
    setSimilarSongs([])
  }, [])
  
  return {
    similarSongs,
    isChecking,
    checkForDuplicates,
    clearSimilarSongs
  }
}

// src/features/songs/validation/hooks/useSlugGeneration.ts
import { useCallback } from 'react'
import { useSongs } from '@features/songs/hooks/useSongs'
import { generateUniqueSlug } from '../utils/slugGeneration'

export function useSlugGeneration() {
  const { songs } = useSongs()
  
  const generateSlug = useCallback(async (
    title: string,
    artist?: string
  ): Promise<string> => {
    const existingSlugs = songs.map(s => s.slug)
    
    return generateUniqueSlug({
      title,
      artist,
      existingSlugs
    })
  }, [songs])
  
  return { generateSlug }
}
```

### Phase 5: Comprehensive Tests

```typescript
// src/features/songs/validation/__tests__/duplicateDetection.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeTitle, findSimilarSongs } from '../utils/duplicateDetection'
import { levenshteinDistance } from '../utils/levenshtein'

describe('Duplicate Detection', () => {
  describe('normalizeTitle', () => {
    it('normalizes titles correctly', () => {
      expect(normalizeTitle('Amazing Grace')).toBe('amazing grace')
      expect(normalizeTitle('As the Deer')).toBe('as the deer')
      expect(normalizeTitle('As The Deer!')).toBe('as the deer')
      expect(normalizeTitle('  Multiple   Spaces  ')).toBe('multiple spaces')
      expect(normalizeTitle('Punctuation!@#$%')).toBe('punctuation')
    })
  })
  
  describe('levenshteinDistance', () => {
    it('calculates distance correctly', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
      expect(levenshteinDistance('saturday', 'sunday')).toBe(3)
      expect(levenshteinDistance('', '')).toBe(0)
      expect(levenshteinDistance('abc', 'abc')).toBe(0)
      expect(levenshteinDistance('abc', '')).toBe(3)
    })
  })
  
  describe('findSimilarSongs', () => {
    const mockSongs = [
      { id: '1', title: 'Amazing Grace', artist: 'John Newton' },
      { id: '2', title: 'As the Deer', artist: 'Martin Nystrom' },
      { id: '3', title: 'As The Deer', artist: 'Unknown' },
      { id: '4', title: 'How Great Thou Art', artist: 'Stuart Hine' }
    ]
    
    it('finds exact matches', () => {
      const similar = findSimilarSongs('Amazing Grace', mockSongs as any)
      expect(similar).toHaveLength(1)
      expect(similar[0].similarity).toBe('exact')
      expect(similar[0].song.id).toBe('1')
    })
    
    it('finds very similar songs', () => {
      const similar = findSimilarSongs('As the Dear', mockSongs as any)
      expect(similar.length).toBeGreaterThan(0)
      expect(similar[0].similarity).toBe('very-similar')
    })
    
    it('handles different capitalizations', () => {
      const similar = findSimilarSongs('as THE deer', mockSongs as any)
      expect(similar.length).toBe(2)
      expect(similar.every(s => s.similarity === 'exact')).toBe(true)
    })
  })
})

// src/features/songs/validation/__tests__/songFormSchema.test.ts
import { describe, it, expect } from 'vitest'
import { songFormSchema } from '../schemas/songFormSchema'

describe('Song Form Schema', () => {
  it('validates valid song data', () => {
    const validData = {
      title: 'Amazing Grace',
      artist: 'John Newton',
      compositionYear: 1772,
      ccli: '22025',
      source: 'Traditional-Holy',
      themes: ['grace', 'salvation'],
      notes: 'Traditional hymn',
      isPublic: true
    }
    
    const result = songFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
  
  it('requires title', () => {
    const invalidData = {
      themes: ['test']
    }
    
    const result = songFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path[0] === 'title')).toBe(true)
    }
  })
  
  it('validates CCLI format', () => {
    const invalidCCLI = {
      title: 'Test',
      themes: ['test'],
      ccli: 'ABC123' // Should be numeric
    }
    
    const result = songFormSchema.safeParse(invalidCCLI)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('CCLI'))).toBe(true)
    }
  })
  
  it('normalizes themes', () => {
    const data = {
      title: 'Test Song',
      themes: ['Christmas', 'WORSHIP', 'prayer']
    }
    
    const result = songFormSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.themes).toEqual(['christmas', 'worship', 'prayer'])
    }
  })
  
  it('limits themes to 10', () => {
    const data = {
      title: 'Test',
      themes: Array(11).fill('theme')
    }
    
    const result = songFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('Maximum 10 themes'))).toBe(true)
    }
  })
})
```

## Validation Gates

### Level 1: Type Checking & Linting
```bash
npm run lint
npm run type-check
```

### Level 2: Unit Tests
```bash
npm run test -- src/features/songs/validation/
```

### Level 3: Schema Validation Tests
```bash
# Test with various input combinations
npm run test -- --coverage src/features/songs/validation/
```

### Level 4: Integration Tests
```bash
# Test with actual form components
npm run test -- src/features/songs/components/__tests__/
```

## File Creation Order

1. `src/features/songs/validation/constants/themes.ts`
2. `src/features/songs/validation/constants/sources.ts`
3. `src/features/songs/validation/constants/musicalKeys.ts`
4. `src/features/songs/validation/utils/levenshtein.ts`
5. `src/features/songs/validation/utils/themeNormalization.ts`
6. `src/features/songs/validation/utils/duplicateDetection.ts`
7. `src/features/songs/validation/utils/slugGeneration.ts`
8. `src/features/songs/validation/schemas/arrangementSchema.ts`
9. `src/features/songs/validation/schemas/songFormSchema.ts`
10. `src/features/songs/validation/hooks/useDuplicateDetection.ts`
11. `src/features/songs/validation/hooks/useSlugGeneration.ts`
12. Test files for all components

## Success Metrics

- ✅ All validation schemas properly typed
- ✅ 100% test coverage for validation utilities
- ✅ Duplicate detection accuracy > 95%
- ✅ Slug generation always unique
- ✅ Theme normalization consistent
- ✅ CCLI validation correct
- ✅ Zero false positives in duplicate detection
- ✅ Performance: validation < 50ms

## Common Pitfalls to Avoid

1. **Case sensitivity** - Always normalize before comparison
2. **Empty strings vs undefined** - Transform consistently
3. **Theme spelling variations** - Cover all common variants
4. **Slug collisions** - Always check uniqueness
5. **CCLI format** - Some may have leading zeros
6. **Year validation** - Handle future years gracefully
7. **Array validation** - Ensure min/max limits
8. **Performance** - Cache normalized values

## External Resources

- [Zod Documentation](https://zod.dev/)
- [Levenshtein Distance Algorithm](https://en.wikipedia.org/wiki/Levenshtein_distance)
- [CCLI Format Guidelines](https://us.ccli.com/)
- [ChordPro Format](https://www.chordpro.org/)

## Conclusion

This comprehensive validation system ensures data integrity while providing helpful features like duplicate detection and theme normalization. The modular structure allows for easy testing and maintenance.

**Confidence Score: 9/10** - Solid implementation with proven algorithms and thorough validation coverage.