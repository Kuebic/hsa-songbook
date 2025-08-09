import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { Review } from '../review.model'
import { Song } from '../../songs/song.model'
import { reviewService } from '../review.service'

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
  await Review.deleteMany({})
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

describe('Review Model', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString()

  it('should create a review with valid data', async () => {
    const reviewData = {
      songId: testSong._id,
      userId: mockUserId,
      rating: 5,
      comment: 'Amazing song!',
      metadata: {
        isPublic: true,
        isVerified: false
      }
    }

    const review = await Review.create(reviewData)
    
    expect(review.songId.toString()).toBe(testSong._id.toString())
    expect(review.userId).toBe(mockUserId)
    expect(review.rating).toBe(5)
    expect(review.comment).toBe('Amazing song!')
    expect(review.metadata.isPublic).toBe(true)
  })

  it('should validate rating range', async () => {
    const reviewData = {
      songId: testSong._id,
      userId: mockUserId,
      rating: 6, // Invalid rating
      comment: 'Test comment'
    }

    await expect(Review.create(reviewData)).rejects.toThrow()
  })

  it('should require songId and userId', async () => {
    const reviewData = {
      rating: 5,
      comment: 'Test comment'
    }

    await expect(Review.create(reviewData)).rejects.toThrow()
  })

  it('should update song ratings automatically after save', async () => {
    const mockUserId1 = new mongoose.Types.ObjectId().toString()
    const mockUserId2 = new mongoose.Types.ObjectId().toString()

    // Create first review
    await Review.create({
      songId: testSong._id,
      userId: mockUserId1,
      rating: 5,
      comment: 'Great!'
    })

    // Create second review
    await Review.create({
      songId: testSong._id,
      userId: mockUserId2,
      rating: 3,
      comment: 'Good'
    })

    // Check that song ratings were updated
    const updatedSong = await Song.findById(testSong._id)
    expect(updatedSong.metadata.ratings.average).toBe(4) // (5+3)/2
    expect(updatedSong.metadata.ratings.count).toBe(2)
  })
})

describe('Review Service', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString()

  it('should create a review', async () => {
    const reviewData = {
      songId: testSong._id.toString(),
      rating: 4,
      comment: 'Nice song',
      isPublic: true
    }

    const review = await reviewService.create(reviewData, mockUserId)
    
    expect(review.songId.toString()).toBe(testSong._id.toString())
    expect(review.userId).toBe(mockUserId)
    expect(review.rating).toBe(4)
    expect(review.comment).toBe('Nice song')
  })

  it('should find reviews by song', async () => {
    const mockUserId1 = new mongoose.Types.ObjectId().toString()
    const mockUserId2 = new mongoose.Types.ObjectId().toString()

    // Create reviews
    await reviewService.create({
      songId: testSong._id.toString(),
      rating: 5,
      comment: 'Excellent!'
    }, mockUserId1)

    await reviewService.create({
      songId: testSong._id.toString(),
      rating: 4,
      comment: 'Very good'
    }, mockUserId2)

    const result = await reviewService.findBySong(testSong._id.toString(), {
      page: 1,
      limit: 10
    })
    
    expect(result.reviews).toHaveLength(2)
    expect(result.pagination.total).toBe(2)
    expect(result.stats.averageRating).toBe(4.5)
  })

  it('should update a review', async () => {
    const review = await reviewService.create({
      songId: testSong._id.toString(),
      rating: 3,
      comment: 'Original comment'
    }, mockUserId)

    const updated = await reviewService.update(review._id.toString(), {
      rating: 5,
      comment: 'Updated comment'
    }, mockUserId)
    
    expect(updated.rating).toBe(5)
    expect(updated.comment).toBe('Updated comment')
  })

  it('should delete a review', async () => {
    const review = await reviewService.create({
      songId: testSong._id.toString(),
      rating: 4,
      comment: 'Will be deleted'
    }, mockUserId)

    await reviewService.delete(review._id.toString(), mockUserId)
    
    const found = await Review.findById(review._id)
    expect(found).toBeNull()
  })

  it('should prevent duplicate reviews from same user', async () => {
    // Create first review
    await reviewService.create({
      songId: testSong._id.toString(),
      rating: 4,
      comment: 'First review'
    }, mockUserId)

    // Try to create second review from same user
    await expect(reviewService.create({
      songId: testSong._id.toString(),
      rating: 3,
      comment: 'Second review'
    }, mockUserId)).rejects.toThrow('already reviewed')
  })

  it('should filter by rating', async () => {
    const mockUserId1 = new mongoose.Types.ObjectId().toString()
    const mockUserId2 = new mongoose.Types.ObjectId().toString()
    const mockUserId3 = new mongoose.Types.ObjectId().toString()

    // Create reviews with different ratings
    await reviewService.create({
      songId: testSong._id.toString(),
      rating: 5,
      comment: 'Excellent!'
    }, mockUserId1)

    await reviewService.create({
      songId: testSong._id.toString(),
      rating: 3,
      comment: 'Good'
    }, mockUserId2)

    await reviewService.create({
      songId: testSong._id.toString(),
      rating: 5,
      comment: 'Amazing!'
    }, mockUserId3)

    const result = await reviewService.findBySong(testSong._id.toString(), {
      page: 1,
      limit: 10,
      minRating: 5
    })
    
    expect(result.reviews).toHaveLength(2)
    expect(result.reviews.every(r => r.rating === 5)).toBe(true)
  })
})