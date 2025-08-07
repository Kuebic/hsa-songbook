import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { Arrangement } from '../arrangement.model'
import { arrangementService } from '../arrangement.service'
import { compressionService } from '../../../shared/services/compressionService'

let mongoServer: MongoMemoryServer

const sampleChordPro = `
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
})

describe('Arrangement Model', () => {
  it('should create an arrangement with compressed chord data', async () => {
    const compressed = await compressionService.compressChordPro(sampleChordPro)
    
    const arrangementData = {
      name: 'Amazing Grace - Key of G',
      songIds: [new mongoose.Types.ObjectId()],
      slug: 'amazing-grace-g',
      createdBy: new mongoose.Types.ObjectId(),
      chordData: compressed,
      key: 'G',
      tempo: 72,
      timeSignature: '3/4',
      difficulty: 'beginner' as const,
      tags: ['traditional', 'hymn'],
      metadata: {
        isPublic: true,
        ratings: { average: 0, count: 0 },
        views: 0
      }
    }

    const arrangement = await Arrangement.create(arrangementData)
    
    expect(arrangement.name).toBe('Amazing Grace - Key of G')
    expect(arrangement.chordData).toBeInstanceOf(Buffer)
    expect(arrangement.documentSize).toBe(compressed.length)
    expect(arrangement.difficulty).toBe('beginner')
  })

  it('should generate slug automatically if not provided', async () => {
    const compressed = await compressionService.compressChordPro(sampleChordPro)
    
    const arrangementData = {
      name: 'Test Arrangement',
      songIds: [new mongoose.Types.ObjectId()],
      createdBy: new mongoose.Types.ObjectId(),
      chordData: compressed,
      difficulty: 'intermediate' as const,
      metadata: {
        isPublic: false,
        ratings: { average: 0, count: 0 },
        views: 0
      }
    }

    const arrangement = await Arrangement.create(arrangementData)
    
    expect(arrangement.slug).toMatch(/^test-arrangement-[a-z0-9]{6}$/)
  })

  it('should set isMashup flag for multiple songs', async () => {
    const compressed = await compressionService.compressChordPro(sampleChordPro)
    
    const arrangementData = {
      name: 'Worship Mashup',
      songIds: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      createdBy: new mongoose.Types.ObjectId(),
      chordData: compressed,
      difficulty: 'advanced' as const,
      metadata: {
        isPublic: true,
        ratings: { average: 0, count: 0 },
        views: 0
      }
    }

    const arrangement = await Arrangement.create(arrangementData)
    
    expect(arrangement.metadata.isMashup).toBe(true)
  })
})

describe('Arrangement Service', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString()
  const mockSongId = new mongoose.Types.ObjectId().toString()

  it('should create an arrangement with ZSTD compression', async () => {
    const arrangementData = {
      name: 'Test Arrangement',
      songIds: [mockSongId],
      chordProText: sampleChordPro,
      key: 'G' as const,
      tempo: 120,
      difficulty: 'intermediate' as const,
      tags: ['worship', 'contemporary'],
      isPublic: true
    }

    const arrangement = await arrangementService.create(arrangementData, mockUserId)
    
    expect(arrangement.name).toBe('Test Arrangement')
    expect(arrangement.compressionMetrics).toBeDefined()
    expect(arrangement.compressionMetrics!.ratio).toBeGreaterThan(30) // Expect at least 30% compression
    expect(arrangement.compressionMetrics!.originalSize).toBe(Buffer.byteLength(sampleChordPro))
  })

  it('should decompress chord data when fetching arrangement', async () => {
    const created = await arrangementService.create({
      name: 'Decompress Test',
      songIds: [mockSongId],
      chordProText: sampleChordPro,
      difficulty: 'beginner' as const
    }, mockUserId)

    const fetched = await arrangementService.findById(created.id, true)
    
    expect(fetched.chordData).toBe(sampleChordPro)
    expect(fetched.compressionMetrics).toBeDefined()
    expect(fetched.compressionMetrics!.ratio).toBeGreaterThan(30)
  })

  it('should not include chord data when fetching list', async () => {
    await arrangementService.create({
      name: 'List Test',
      songIds: [mockSongId],
      chordProText: sampleChordPro,
      difficulty: 'beginner' as const
    }, mockUserId)

    const result = await arrangementService.findAll({
      page: 1,
      limit: 10
    })
    
    expect(result.arrangements).toHaveLength(1)
    expect(result.arrangements[0].chordData).toBeUndefined()
  })

  it('should update arrangement with new compressed chord data', async () => {
    const created = await arrangementService.create({
      name: 'Update Test',
      songIds: [mockSongId],
      chordProText: sampleChordPro,
      difficulty: 'beginner' as const
    }, mockUserId)

    const newChordPro = sampleChordPro + '\n\n{verse: 2}\nNew verse here'
    
    const updated = await arrangementService.update(created.id, {
      chordProText: newChordPro
    }, mockUserId)
    
    expect(updated.compressionMetrics).toBeDefined()
    expect(updated.compressionMetrics!.originalSize).toBeGreaterThan(
      Buffer.byteLength(sampleChordPro)
    )

    // Verify the update
    const fetched = await arrangementService.findById(created.id, true)
    expect(fetched.chordData).toBe(newChordPro)
  })

  it('should achieve significant compression for large chord sheets', async () => {
    // Create a larger chord sheet by repeating
    const largeChordPro = Array(20).fill(sampleChordPro).join('\n\n')
    
    const arrangement = await arrangementService.create({
      name: 'Large Sheet Test',
      songIds: [mockSongId],
      chordProText: largeChordPro,
      difficulty: 'advanced' as const
    }, mockUserId)
    
    expect(arrangement.compressionMetrics!.ratio).toBeGreaterThan(50) // Expect >50% compression for repetitive data
    expect(arrangement.compressionMetrics!.savings).toBeGreaterThan(1000) // Significant byte savings
  })
})

describe('Compression Service', () => {
  it('should compress and decompress ChordPro accurately', async () => {
    const compressed = await compressionService.compressChordPro(sampleChordPro)
    const decompressed = await compressionService.decompressChordPro(compressed)
    
    expect(decompressed).toBe(sampleChordPro)
  })

  it('should handle special characters in ChordPro', async () => {
    const specialChordPro = '{title: Café ♪♫} [C#m7b5]Special chars: é à ñ'
    
    const compressed = await compressionService.compressChordPro(specialChordPro)
    const decompressed = await compressionService.decompressChordPro(compressed)
    
    expect(decompressed).toBe(specialChordPro)
  })

  it('should provide accurate compression metrics', async () => {
    const compressed = await compressionService.compressChordPro(sampleChordPro)
    const metrics = compressionService.calculateMetrics(sampleChordPro, compressed)
    
    expect(metrics.originalSize).toBe(Buffer.byteLength(sampleChordPro))
    expect(metrics.compressedSize).toBe(compressed.length)
    expect(metrics.ratio).toBeGreaterThan(0)
    expect(metrics.savings).toBe(metrics.originalSize - metrics.compressedSize)
  })
})