import mongoose from 'mongoose'
import { User } from '../../features/users/user.model'
import { Song } from '../../features/songs/song.model'
import { Arrangement } from '../../features/arrangements/arrangement.model'
import { compressionService } from '../services/compressionService'
import { IUser, CreateUserFromClerkDto } from '../../features/users/user.types'

// ============================================================================
// User Factories
// ============================================================================

/**
 * Create basic user data for testing
 */
export const createUserData = (overrides: Partial<IUser> = {}): Partial<IUser> => ({
  clerkId: `clerk_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  email: `test-${Date.now()}@example.com`,
  username: `testuser${Date.now()}`,
  name: 'Test User',
  role: 'USER',
  preferences: {
    fontSize: 16,
    theme: 'light'
  },
  profile: {
    bio: 'Test user biography',
    website: 'https://test.example.com',
    location: 'Test City'
  },
  stats: {
    songsCreated: 0,
    arrangementsCreated: 0,
    setlistsCreated: 0
  },
  isActive: true,
  ...overrides
})

/**
 * Create and save a test user to database
 */
export const createTestUser = async (overrides: Partial<IUser> = {}): Promise<IUser> => {
  const userData = createUserData(overrides)
  return await User.create(userData)
}

/**
 * Create multiple test users
 */
export const createTestUsers = async (count: number, overrides: Partial<IUser> = {}): Promise<IUser[]> => {
  const users: IUser[] = []
  
  for (let i = 0; i < count; i++) {
    const userData = createUserData({
      ...overrides,
      email: `test-${Date.now()}-${i}@example.com`,
      username: `testuser${Date.now()}-${i}`,
      clerkId: `clerk_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`
    })
    
    const user = await User.create(userData)
    users.push(user)
  }
  
  return users
}

/**
 * Create Clerk webhook payload data
 */
export const createClerkWebhookPayload = (
  eventType: 'user.created' | 'user.updated' | 'user.deleted',
  overrides: Partial<CreateUserFromClerkDto> = {}
): any => {
  const baseData = {
    clerkId: `clerk_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    email: `clerk-${Date.now()}@example.com`,
    username: `clerkuser${Date.now()}`,
    name: 'Clerk Test User',
    ...overrides
  }

  return {
    type: eventType,
    data: {
      id: baseData.clerkId,
      email_addresses: [
        {
          email_address: baseData.email,
          id: 'email_id',
          verification: { status: 'verified' }
        }
      ],
      username: baseData.username,
      first_name: baseData.name?.split(' ')[0] || 'Test',
      last_name: baseData.name?.split(' ')[1] || 'User',
      image_url: 'https://test.example.com/avatar.jpg',
      created_at: Date.now(),
      updated_at: Date.now()
    }
  }
}

// ============================================================================
// Song Factories
// ============================================================================

/**
 * Create basic song data for testing
 */
export const createSongData = (overrides: any = {}): any => ({
  title: `Test Song ${Date.now()}`,
  artist: 'Test Artist',
  slug: `test-song-${Date.now()}`,
  compositionYear: 2024,
  themes: ['worship', 'praise'],
  metadata: {
    createdBy: new mongoose.Types.ObjectId(),
    isPublic: true,
    ratings: { average: 0, count: 0 },
    views: 0
  },
  ...overrides
})

/**
 * Create and save a test song to database
 */
export const createTestSong = async (overrides: any = {}): Promise<any> => {
  const songData = createSongData(overrides)
  return await Song.create(songData)
}

/**
 * Create multiple test songs
 */
export const createTestSongs = async (count: number, overrides: any = {}): Promise<any[]> => {
  const songs = []
  
  for (let i = 0; i < count; i++) {
    const songData = createSongData({
      ...overrides,
      title: `Test Song ${Date.now()}-${i}`,
      slug: `test-song-${Date.now()}-${i}`
    })
    
    const song = await Song.create(songData)
    songs.push(song)
  }
  
  return songs
}

// ============================================================================
// Arrangement Factories
// ============================================================================

/**
 * Sample ChordPro data for testing
 */
export const getSampleChordPro = (): string => `
{title: Amazing Grace}
{artist: John Newton}
{key: G}
{tempo: 72}
{time: 3/4}

{verse: 1}
A[G]mazing [G/B]grace how [C]sweet the [G]sound
That [G]saved a [G/B]wretch like [D]me
I [G]once was [G/B]lost but [C]now am [G]found
Was [Em]blind but [D]now I [G]see

{chorus}
[G]Amazing [C]grace, [G]amazing [D]grace
How [G]sweet the [C]sound
That [G]saved a [D]wretch like [G]me
`.trim()

/**
 * Generate large chord sheet for performance testing
 */
export const generateLargeChordSheet = (sizeInKB: number): string => {
  const baseChordPro = getSampleChordPro()
  const targetSize = sizeInKB * 1024
  const currentSize = Buffer.byteLength(baseChordPro, 'utf-8')
  const repetitions = Math.ceil(targetSize / currentSize)
  
  const verses = []
  for (let i = 1; i <= repetitions; i++) {
    verses.push(`{verse: ${i}}`)
    verses.push('A[G]mazing [G/B]grace how [C]sweet the [G]sound')
    verses.push('That [G]saved a [G/B]wretch like [D]me')
    verses.push('I [G]once was [G/B]lost but [C]now am [G]found')
    verses.push('Was [Em]blind but [D]now I [G]see')
    verses.push('')
  }
  
  return `{title: Large Test Song}
{artist: Test Artist}
{key: G}
{tempo: 120}

${verses.join('\n')}`
}

/**
 * Create basic arrangement data for testing
 */
export const createArrangementData = (songIds: string[] = [], overrides: any = {}): any => ({
  name: `Test Arrangement ${Date.now()}`,
  songIds: songIds.length > 0 ? songIds : [new mongoose.Types.ObjectId().toString()],
  slug: `test-arrangement-${Date.now()}`,
  createdBy: new mongoose.Types.ObjectId(),
  key: 'G',
  tempo: 120,
  timeSignature: '4/4',
  difficulty: 'intermediate',
  tags: ['worship', 'contemporary'],
  metadata: {
    isPublic: true,
    ratings: { average: 0, count: 0 },
    views: 0
  },
  ...overrides
})

/**
 * Create and save a test arrangement to database (with compression)
 */
export const createTestArrangement = async (
  songIds: string[] = [],
  chordProText: string = getSampleChordPro(),
  overrides: any = {}
): Promise<any> => {
  const compressed = await compressionService.compressChordPro(chordProText)
  const metrics = compressionService.calculateMetrics(chordProText, compressed)
  
  const arrangementData = {
    ...createArrangementData(songIds, overrides),
    chordData: compressed,
    documentSize: compressed.length,
    compressionMetrics: {
      originalSize: metrics.originalSize,
      compressedSize: metrics.compressedSize,
      ratio: metrics.ratio,
      savings: metrics.savings
    }
  }
  
  return await Arrangement.create(arrangementData)
}

/**
 * Create multiple test arrangements
 */
export const createTestArrangements = async (
  count: number,
  songIds: string[] = [],
  overrides: any = {}
): Promise<any[]> => {
  const arrangements = []
  
  for (let i = 0; i < count; i++) {
    const arrangement = await createTestArrangement(
      songIds,
      getSampleChordPro(),
      {
        ...overrides,
        name: `Test Arrangement ${Date.now()}-${i}`,
        slug: `test-arrangement-${Date.now()}-${i}`
      }
    )
    
    arrangements.push(arrangement)
  }
  
  return arrangements
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a complete test ecosystem (user, song, arrangement)
 */
export const createTestEcosystem = async () => {
  const user = await createTestUser()
  const song = await createTestSong({ 'metadata.createdBy': user._id })
  const arrangement = await createTestArrangement([song._id.toString()], getSampleChordPro(), {
    createdBy: user._id
  })
  
  return { user, song, arrangement }
}

/**
 * Generate random ObjectId string
 */
export const randomObjectId = (): string => {
  return new mongoose.Types.ObjectId().toString()
}