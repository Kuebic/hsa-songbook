import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { Arrangement } from '../arrangement.model'
import { Song } from '../../songs/song.model'
import { arrangementService } from '../arrangement.service'
import { extractChordProMetadata, compressChordData, decompressChordData } from '../utils/chordProUtils'

let mongoServer: MongoMemoryServer
let testSong: any // eslint-disable-line @typescript-eslint/no-explicit-any

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

beforeEach(async () => {
  await Arrangement.deleteMany({})
  await Song.deleteMany({})
  
  // Create a test song
  testSong = await Song.create({
    title: 'Test Song',
    slug: 'test-song',
    themes: ['worship'],
    metadata: {
      createdBy: new mongoose.Types.ObjectId(),
      isPublic: true,
      ratings: { average: 0, count: 0 },
      views: 0
    }
  })
})

describe('Arrangement Model', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString()

  it('should create arrangement with ChordPro content', async () => {
    const chordProContent = `{title: Amazing Grace}
{key: G}
{tempo: 90}

[G]Amazing [G/B]grace how [C]sweet the [G]sound
That [G]saved a [D]wretch like [G]me`

    const arrangementData = {
      songId: testSong._id,
      title: 'Standard Arrangement',
      key: 'G',
      chordProContent,
      metadata: {
        createdBy: mockUserId,
        isPublic: true
      }
    }

    const arrangement = await Arrangement.create(arrangementData)
    
    expect(arrangement.songId.toString()).toBe(testSong._id.toString())
    expect(arrangement.title).toBe('Standard Arrangement')
    expect(arrangement.key).toBe('G')
    expect(arrangement.chordProContent).toBe(chordProContent)
    expect(arrangement.metadata.isPublic).toBe(true)
  })

  it('should auto-extract metadata from ChordPro', async () => {
    const chordProContent = `{title: Amazing Grace}
{artist: John Newton}
{key: D}
{tempo: 85}
{capo: 2}

[D]Amazing [D/F#]grace how [G]sweet the [D]sound`

    const metadata = extractChordProMetadata(chordProContent)
    
    expect(metadata.title).toBe('Amazing Grace')
    expect(metadata.artist).toBe('John Newton')
    expect(metadata.key).toBe('D')
    expect(metadata.tempo).toBe(85)
    expect(metadata.capo).toBe(2)
  })

  it('should compress and decompress chord data', async () => {
    const originalData = {
      chords: ['G', 'C', 'D', 'Em'],
      progression: ['G', 'C', 'G', 'D', 'G']
    }

    const compressed = compressChordData(originalData)
    expect(compressed).toBeInstanceOf(Buffer)

    const decompressed = decompressChordData(compressed)
    expect(decompressed).toEqual(originalData)
  })

  it('should validate arrangement structure', async () => {
    const invalidArrangement = {
      // Missing required songId
      title: 'Invalid Arrangement',
      chordProContent: '[C]Test'
    }

    await expect(Arrangement.create(invalidArrangement)).rejects.toThrow()
  })
})

describe('Arrangement Service', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString()

  it('should create arrangement with auto-extracted metadata', async () => {
    const chordProContent = `{title: How Great Thou Art}
{key: C}
{tempo: 76}

[C]O Lord my [F]God, when [C]I in awesome [G]wonder
Consider [C]all the [F]works Thy [C]hands have [G]made`

    const arrangementData = {
      songId: testSong._id.toString(),
      title: 'Hymnal Arrangement',
      chordProContent,
      isPublic: true
    }

    const arrangement = await arrangementService.create(arrangementData, mockUserId)
    
    expect(arrangement.title).toBe('Hymnal Arrangement')
    expect(arrangement.key).toBe('C') // Should be auto-extracted
    expect(arrangement.tempo).toBe(76) // Should be auto-extracted
    expect(arrangement.metadata.createdBy).toBe(mockUserId)
  })

  it('should find arrangements by song', async () => {
    // Create multiple arrangements for the same song
    await arrangementService.create({
      songId: testSong._id.toString(),
      title: 'Arrangement 1',
      key: 'G',
      chordProContent: '[G]Test content'
    }, mockUserId)

    await arrangementService.create({
      songId: testSong._id.toString(),
      title: 'Arrangement 2',
      key: 'C',
      chordProContent: '[C]Test content'
    }, mockUserId)

    const arrangements = await arrangementService.findBySong(testSong._id.toString())
    
    expect(arrangements).toHaveLength(2)
    expect(arrangements.map(a => a.title)).toContain('Arrangement 1')
    expect(arrangements.map(a => a.title)).toContain('Arrangement 2')
  })

  it('should update arrangement', async () => {
    const arrangement = await arrangementService.create({
      songId: testSong._id.toString(),
      title: 'Original Title',
      key: 'G',
      chordProContent: '[G]Original'
    }, mockUserId)

    const updated = await arrangementService.update(arrangement._id.toString(), {
      title: 'Updated Title',
      key: 'C',
      chordProContent: '[C]Updated content'
    }, mockUserId)
    
    expect(updated.title).toBe('Updated Title')
    expect(updated.key).toBe('C')
    expect(updated.chordProContent).toBe('[C]Updated content')
  })

  it('should delete arrangement', async () => {
    const arrangement = await arrangementService.create({
      songId: testSong._id.toString(),
      title: 'To Be Deleted',
      chordProContent: '[G]Delete me'
    }, mockUserId)

    await arrangementService.delete(arrangement._id.toString(), mockUserId)
    
    const found = await Arrangement.findById(arrangement._id)
    expect(found).toBeNull()
  })

  it('should transpose arrangement', async () => {
    const originalChordPro = `{key: G}
[G]Amazing [C]grace how [D]sweet the [G]sound`

    const arrangement = await arrangementService.create({
      songId: testSong._id.toString(),
      title: 'Original Key',
      key: 'G',
      chordProContent: originalChordPro
    }, mockUserId)

    const transposed = await arrangementService.transpose(
      arrangement._id.toString(),
      'C', // Target key
      mockUserId
    )
    
    expect(transposed.key).toBe('C')
    expect(transposed.chordProContent).toContain('{key: C}')
    expect(transposed.chordProContent).toContain('[C]Amazing [F]grace')
  })

  it('should validate user permissions', async () => {
    const otherUserId = new mongoose.Types.ObjectId().toString()
    
    const arrangement = await arrangementService.create({
      songId: testSong._id.toString(),
      title: 'Private Arrangement',
      chordProContent: '[G]Private'
    }, mockUserId)

    // Try to update with different user
    await expect(arrangementService.update(
      arrangement._id.toString(),
      { title: 'Hacked' },
      otherUserId
    )).rejects.toThrow('Permission denied')
  })

  it('should parse chord progressions', async () => {
    const chordProContent = `{title: Test Song}
[Verse]
[G]Line 1 with [C]chords and [D]more [G]chords
[Em]Line 2 with [C]different [D]progression

[Chorus]
[C]Chorus [G]line [D]here [G]now`

    const arrangement = await arrangementService.create({
      songId: testSong._id.toString(),
      title: 'Chord Analysis',
      chordProContent
    }, mockUserId)

    // The service should extract and analyze chord progressions
    const chords = arrangement.chords
    expect(chords).toContain('G')
    expect(chords).toContain('C')
    expect(chords).toContain('D')
    expect(chords).toContain('Em')
  })
})