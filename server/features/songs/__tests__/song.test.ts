import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { Song } from '../song.model'
import { songService } from '../song.service'

let mongoServer: MongoMemoryServer

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
  await Song.deleteMany({})
})

describe('Song Model', () => {
  it('should create a song with valid data', async () => {
    const songData = {
      title: 'Amazing Grace',
      artist: 'John Newton',
      slug: 'amazing-grace',
      compositionYear: 1772,
      themes: ['grace', 'salvation'],
      metadata: {
        createdBy: new mongoose.Types.ObjectId(),
        isPublic: true,
        ratings: { average: 0, count: 0 },
        views: 0
      }
    }

    const song = await Song.create(songData)
    
    expect(song.title).toBe('Amazing Grace')
    expect(song.artist).toBe('John Newton')
    expect(song.slug).toBe('amazing-grace')
    expect(song.themes).toContain('grace')
  })

  it('should generate slug automatically if not provided', async () => {
    const songData = {
      title: 'How Great Thou Art',
      metadata: {
        createdBy: new mongoose.Types.ObjectId(),
        isPublic: true,
        ratings: { average: 0, count: 0 },
        views: 0
      }
    }

    const song = await Song.create(songData)
    
    expect(song.slug).toBe('how-great-thou-art')
  })

  it('should enforce unique slug constraint', async () => {
    const songData = {
      title: 'Test Song',
      slug: 'test-song',
      metadata: {
        createdBy: new mongoose.Types.ObjectId(),
        isPublic: true,
        ratings: { average: 0, count: 0 },
        views: 0
      }
    }

    await Song.create(songData)
    
    await expect(Song.create(songData)).rejects.toThrow()
  })
})

describe('Song Service', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString()

  it('should create a song', async () => {
    const songData = {
      title: 'Test Song',
      artist: 'Test Artist',
      themes: ['worship', 'praise'],
      isPublic: true
    }

    const song = await songService.create(songData, mockUserId)
    
    expect(song.title).toBe('Test Song')
    expect(song.artist).toBe('Test Artist')
    expect(song.themes).toContain('worship')
    expect(song.metadata.isPublic).toBe(true)
  })

  it('should find all songs with pagination', async () => {
    // Create test songs
    for (let i = 1; i <= 5; i++) {
      await songService.create({
        title: `Song ${i}`,
        isPublic: true
      }, mockUserId)
    }

    const result = await songService.findAll({
      page: 1,
      limit: 3,
      isPublic: true
    })
    
    expect(result.songs).toHaveLength(3)
    expect(result.pagination.total).toBe(5)
    expect(result.pagination.totalPages).toBe(2)
  })

  it('should find song by slug', async () => {
    const created = await songService.create({
      title: 'Find Me',
      slug: 'find-me'
    }, mockUserId)

    const found = await songService.findBySlug('find-me')
    
    expect(found.id).toBe(created.id)
    expect(found.title).toBe('Find Me')
  })

  it('should update song rating', async () => {
    const song = await songService.create({
      title: 'Rate Me'
    }, mockUserId)

    const updated = await songService.updateRating(song.id, 5)
    
    expect(updated.metadata.ratings.average).toBe(5)
    expect(updated.metadata.ratings.count).toBe(1)

    const updated2 = await songService.updateRating(song.id, 3)
    
    expect(updated2.metadata.ratings.average).toBe(4)
    expect(updated2.metadata.ratings.count).toBe(2)
  })
})