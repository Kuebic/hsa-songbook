import { faker } from '@faker-js/faker'
import type { Song, Arrangement, SongMetadata } from '@features/songs/types/song.types'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'
import type { ArrangementFormData } from '@features/songs/validation/schemas/arrangementSchema'

/**
 * Factory for creating test Song objects
 */
export const songFactory = {
  /**
   * Build a single song with optional overrides
   */
  build: (overrides?: Partial<Song>): Song => ({
    id: faker.string.uuid(),
    title: faker.music.songName(),
    artist: faker.person.fullName(),
    slug: faker.helpers.slugify(faker.music.songName()).toLowerCase(),
    compositionYear: faker.date.past({ years: 100 }).getFullYear(),
    ccli: faker.string.numeric({ length: 6 }), // Ensure 6 digits for valid CCLI
    themes: faker.helpers.arrayElements(
      ['worship', 'praise', 'prayer', 'salvation', 'grace', 'christmas', 'easter', 'communion', 'thanksgiving', 'faith'],
      { min: 1, max: 3 } // At least one theme required
    ),
    source: faker.helpers.arrayElement([
      'Traditional-Holy',
      'Contemporary-Christian',
      'Modern-Worship',
      'Original-Interchurch' // Use valid source instead of 'Original-Composition'
    ]),
    notes: faker.lorem.sentence(),
    defaultArrangementId: faker.string.uuid(),
    metadata: {
      createdBy: faker.string.uuid(),
      lastModifiedBy: faker.string.uuid(),
      isPublic: faker.datatype.boolean(),
      ratings: {
        average: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
        count: faker.number.int({ min: 0, max: 100 })
      },
      views: faker.number.int({ min: 0, max: 1000 })
    },
    ...overrides
  }),
  
  /**
   * Build a list of songs
   */
  buildList: (count: number, overrides?: Partial<Song>): Song[] => {
    return Array.from({ length: count }, () => songFactory.build(overrides))
  },
  
  /**
   * Build form data for creating/editing a song
   */
  buildFormData: (overrides?: Partial<SongFormData>): SongFormData => ({
    title: faker.music.songName(),
    artist: faker.person.fullName(),
    compositionYear: faker.date.past({ years: 50 }).getFullYear(),
    ccli: faker.string.numeric({ length: 6 }), // Ensure 6 digits for valid CCLI
    themes: faker.helpers.arrayElements(
      ['worship', 'praise', 'prayer'],
      { min: 1, max: 3 } // At least one theme required
    ),
    source: faker.helpers.arrayElement([
      'Traditional-Holy',
      'Contemporary-Christian',
      'Modern-Worship',
      'Original-Interchurch' // Use valid source instead of 'Original-Composition'
    ]),
    notes: faker.lorem.sentence(),
    isPublic: false,
    ...overrides
  }),
  
  /**
   * Build a minimal song (only required fields)
   */
  buildMinimal: (overrides?: Partial<Song>): Song => ({
    id: faker.string.uuid(),
    title: faker.music.songName(),
    artist: faker.person.fullName(),
    slug: faker.helpers.slugify(faker.music.songName()).toLowerCase(),
    themes: ['worship'],
    metadata: {
      isPublic: false,
      views: 0
    },
    ...overrides
  }),
  
  /**
   * Build a song with rich metadata
   */
  buildWithRichMetadata: (overrides?: Partial<Song>): Song => {
    const song = songFactory.build(overrides)
    return {
      ...song,
      metadata: {
        ...song.metadata,
        createdBy: faker.string.uuid(),
        lastModifiedBy: faker.string.uuid(),
        ratings: {
          average: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
          count: faker.number.int({ min: 10, max: 500 })
        },
        views: faker.number.int({ min: 100, max: 10000 })
      }
    }
  }
}

/**
 * Factory for creating test Arrangement objects
 */
export const arrangementFactory = {
  /**
   * Build a single arrangement
   */
  build: (overrides?: Partial<Arrangement>): Arrangement => ({
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(['Key of G', 'Acoustic Version', 'Original', 'Simplified', 'Full Band']),
    songIds: [faker.string.uuid()],
    key: faker.helpers.arrayElement(['C', 'G', 'D', 'A', 'E', 'F', 'B', 'Bb', 'Eb', 'Ab']),
    tempo: faker.number.int({ min: 60, max: 180 }),
    timeSignature: faker.helpers.arrayElement(['4/4', '3/4', '6/8']),
    difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
    tags: faker.helpers.arrayElements(
      ['acoustic', 'simple', 'youth', 'contemporary', 'traditional', 'piano', 'guitar'],
      faker.number.int({ min: 1, max: 3 })
    ),
    chordData: `{title: ${faker.music.songName()}}
{key: G}
{tempo: 120}

Verse 1:
[G]This is a [C]test [D]song
[Em]With some [Am]chord [D]changes
[G]To demonstrate [C]the [D]format
[G]Of ChordPro [D]data [G]

Chorus:
[C]This is the [G]chorus
[D]It repeats [G]twice
[C]Simple chord [G]progression
[D]Sounds really [G]nice`,
    ...overrides
  }),
  
  /**
   * Build arrangement form data
   */
  buildFormData: (overrides?: Partial<ArrangementFormData>): ArrangementFormData => ({
    name: faker.helpers.arrayElement(['Key of G', 'Acoustic Version', 'Original']),
    key: faker.helpers.arrayElement(['C', 'G', 'D', 'A', 'E']),
    tempo: faker.number.int({ min: 60, max: 180 }),
    timeSignature: '4/4',
    difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
    tags: faker.helpers.arrayElements(['acoustic', 'simple', 'youth'], 2),
    chordData: `{title: Test Song}
{key: G}

[G]Test [C]chord [D]data`,
    ...overrides
  }),
  
  /**
   * Build a list of arrangements
   */
  buildList: (count: number, overrides?: Partial<Arrangement>): Arrangement[] => {
    return Array.from({ length: count }, () => arrangementFactory.build(overrides))
  },
  
  /**
   * Build arrangement for specific song
   */
  buildForSong: (songId: string, overrides?: Partial<Arrangement>): Arrangement => {
    return arrangementFactory.build({
      ...overrides,
      songIds: [songId]
    })
  }
}

/**
 * Factory for creating test metadata
 */
export const metadataFactory = {
  /**
   * Build song metadata
   */
  build: (overrides?: Partial<SongMetadata>): SongMetadata => ({
    createdBy: faker.string.uuid(),
    lastModifiedBy: faker.string.uuid(),
    isPublic: faker.datatype.boolean(),
    ratings: {
      average: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      count: faker.number.int({ min: 0, max: 100 })
    },
    views: faker.number.int({ min: 0, max: 1000 }),
    ...overrides
  }),
  
  /**
   * Build private metadata
   */
  buildPrivate: (overrides?: Partial<SongMetadata>): SongMetadata => ({
    ...metadataFactory.build(overrides),
    isPublic: false
  }),
  
  /**
   * Build public metadata
   */
  buildPublic: (overrides?: Partial<SongMetadata>): SongMetadata => ({
    ...metadataFactory.build(overrides),
    isPublic: true
  })
}

/**
 * Factory for creating duplicate/similar songs
 */
export const duplicateFactory = {
  /**
   * Create exact duplicate
   */
  createExactDuplicate: (original: Song): Song => {
    return {
      ...original,
      id: faker.string.uuid(),
      slug: `${original.slug}-${faker.string.numeric(4)}`
    }
  },
  
  /**
   * Create similar song (same title, different artist)
   */
  createSimilarTitle: (original: Song): Song => {
    return songFactory.build({
      title: original.title,
      artist: faker.person.fullName()
    })
  },
  
  /**
   * Create similar song (slight title variation)
   */
  createSlightVariation: (original: Song): Song => {
    const variations = [
      `${original.title} (Live)`,
      `${original.title} - Acoustic`,
      original.title.replace(/The /, ''),
      `The ${original.title}`
    ]
    
    return songFactory.build({
      title: faker.helpers.arrayElement(variations),
      artist: original.artist
    })
  },
  
  /**
   * Create list of similar songs with varying similarity
   */
  createSimilarSongs: (original: Song, count: number = 5): Song[] => {
    const similar: Song[] = []
    
    // Add exact duplicate
    if (count > 0) {
      similar.push(duplicateFactory.createExactDuplicate(original))
    }
    
    // Add similar titles
    if (count > 1) {
      similar.push(duplicateFactory.createSimilarTitle(original))
    }
    
    // Add variations
    for (let i = similar.length; i < count; i++) {
      similar.push(duplicateFactory.createSlightVariation(original))
    }
    
    return similar
  }
}

/**
 * Factory for creating test scenarios
 */
export const scenarioFactory = {
  /**
   * Create a worship service setlist scenario
   */
  createWorshipService: () => {
    const songs = [
      songFactory.build({ 
        title: 'Opening Song',
        themes: ['praise', 'worship']
      }),
      songFactory.build({ 
        title: 'Worship Song 1',
        themes: ['worship', 'prayer']
      }),
      songFactory.build({ 
        title: 'Worship Song 2',
        themes: ['worship', 'salvation']
      }),
      songFactory.build({ 
        title: 'Communion Song',
        themes: ['communion', 'grace']
      }),
      songFactory.build({ 
        title: 'Closing Song',
        themes: ['praise', 'thanksgiving']
      })
    ]
    
    const arrangements = songs.map(song => 
      arrangementFactory.buildForSong(song.id)
    )
    
    return { songs, arrangements }
  },
  
  /**
   * Create a search results scenario
   */
  createSearchResults: (query: string, count: number = 10) => {
    return songFactory.buildList(count).map(song => ({
      ...song,
      title: `${query} ${faker.music.songName()}`,
      _score: faker.number.float({ min: 0, max: 1, fractionDigits: 2 })
    }))
  },
  
  /**
   * Create a user's personal songbook
   */
  createPersonalSongbook: (userId: string) => {
    const songs = songFactory.buildList(20).map(song => ({
      ...song,
      metadata: {
        ...song.metadata,
        createdBy: userId,
        isPublic: false
      }
    }))
    
    return songs
  }
}

/**
 * Utility to reset faker seed for deterministic tests
 */
export function resetFakerSeed(seed: number = 123) {
  faker.seed(seed)
}