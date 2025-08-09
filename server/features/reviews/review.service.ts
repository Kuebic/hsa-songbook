import { Review } from './review.model'
import { Song } from '../songs/song.model'
import { Arrangement } from '../arrangements/arrangement.model'
import { 
  CreateReviewDto, 
  UpdateReviewDto, 
  ReviewFilter, 
  ReviewResponse 
} from './review.types'
import { 
  AppError, 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '../../shared/utils/errors'
import { Types } from 'mongoose'

class ReviewService {
  async createReview(data: CreateReviewDto): Promise<ReviewResponse> {
    // Validate that song exists
    const song = await Song.findById(data.songId)
    if (!song) {
      throw new NotFoundError('Song')
    }

    // Validate arrangement if provided
    if (data.arrangementId) {
      const arrangement = await Arrangement.findById(data.arrangementId)
      if (!arrangement) {
        throw new NotFoundError('Arrangement')
      }
      
      // Ensure arrangement belongs to the song
      const arrangementBelongsToSong = arrangement.songIds.some(
        songId => songId.toString() === data.songId
      )
      if (!arrangementBelongsToSong) {
        throw new ValidationError('Arrangement does not belong to the specified song')
      }
    }

    // Check for existing review
    const existingQuery: Record<string, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
      songId: data.songId, 
      userId: data.userId 
    }
    
    if (data.arrangementId) {
      existingQuery.arrangementId = data.arrangementId
    } else {
      existingQuery.arrangementId = { $exists: false }
    }

    const existingReview = await Review.findOne(existingQuery)
    if (existingReview) {
      throw new ConflictError('You have already reviewed this song/arrangement')
    }

    // Create the review
    const review = new Review({
      songId: new Types.ObjectId(data.songId),
      arrangementId: data.arrangementId ? new Types.ObjectId(data.arrangementId) : undefined,
      userId: data.userId,
      userName: data.userName,
      rating: data.rating,
      comment: data.comment?.trim()
    })

    const savedReview = await review.save()
    
    // Return the response format
    return {
      id: savedReview._id.toString(),
      songId: savedReview.songId.toString(),
      arrangementId: savedReview.arrangementId?.toString(),
      userId: savedReview.userId,
      userName: savedReview.userName,
      rating: savedReview.rating,
      comment: savedReview.comment,
      helpful: savedReview.helpful,
      notHelpful: savedReview.notHelpful,
      createdAt: savedReview.createdAt,
      updatedAt: savedReview.updatedAt
    }
  }

  async getReviews(filter: ReviewFilter = {}): Promise<{
    reviews: ReviewResponse[]
    total: number
    page: number
    pages: number
  }> {
    const {
      songId,
      arrangementId,
      userId,
      rating,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filter

    // Build query
    const query: Record<string, any> = {} // eslint-disable-line @typescript-eslint/no-explicit-any
    
    if (songId) {
      query.songId = new Types.ObjectId(songId)
    }
    
    if (arrangementId) {
      query.arrangementId = new Types.ObjectId(arrangementId)
    }
    
    if (userId) {
      query.userId = userId
    }
    
    if (rating) {
      query.rating = rating
    }

    // Build sort options
    const sortOptions: Record<string, any> = {} // eslint-disable-line @typescript-eslint/no-explicit-any
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    
    // Add secondary sort by helpful count for better ordering
    if (sortBy !== 'helpful') {
      sortOptions.helpful = -1
    }

    // Execute paginated query
    const skip = (page - 1) * limit
    
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query)
    ])

    const pages = Math.ceil(total / limit)

    return {
      reviews: reviews.map(review => ({
        id: review._id.toString(),
        songId: review.songId.toString(),
        arrangementId: review.arrangementId?.toString(),
        userId: review.userId,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        helpful: review.helpful,
        notHelpful: review.notHelpful,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      })),
      total,
      page,
      pages
    }
  }

  async getReviewById(reviewId: string): Promise<ReviewResponse> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new ValidationError('Invalid review ID')
    }

    const review = await Review.findById(reviewId).lean()
    if (!review) {
      throw new NotFoundError('Review')
    }

    return {
      id: review._id.toString(),
      songId: review.songId.toString(),
      arrangementId: review.arrangementId?.toString(),
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      helpful: review.helpful,
      notHelpful: review.notHelpful,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }
  }

  async updateReview(
    reviewId: string, 
    userId: string, 
    data: UpdateReviewDto
  ): Promise<ReviewResponse> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new ValidationError('Invalid review ID')
    }

    const review = await Review.findById(reviewId)
    if (!review) {
      throw new NotFoundError('Review')
    }

    // Check ownership
    if (review.userId !== userId) {
      throw new AppError('You can only update your own reviews', 403)
    }

    // Update fields
    if (data.rating !== undefined) {
      review.rating = data.rating
    }
    
    if (data.comment !== undefined) {
      review.comment = data.comment.trim()
    }

    const updatedReview = await review.save()

    return {
      id: updatedReview._id.toString(),
      songId: updatedReview.songId.toString(),
      arrangementId: updatedReview.arrangementId?.toString(),
      userId: updatedReview.userId,
      userName: updatedReview.userName,
      rating: updatedReview.rating,
      comment: updatedReview.comment,
      helpful: updatedReview.helpful,
      notHelpful: updatedReview.notHelpful,
      createdAt: updatedReview.createdAt,
      updatedAt: updatedReview.updatedAt
    }
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new ValidationError('Invalid review ID')
    }

    const review = await Review.findById(reviewId)
    if (!review) {
      throw new NotFoundError('Review')
    }

    // Check ownership (users can only delete their own reviews)
    if (review.userId !== userId) {
      throw new AppError('You can only delete your own reviews', 403)
    }

    await Review.findByIdAndDelete(reviewId)
  }

  async markHelpful(reviewId: string, helpful: boolean): Promise<ReviewResponse> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new ValidationError('Invalid review ID')
    }

    const review = await Review.findById(reviewId)
    if (!review) {
      throw new NotFoundError('Review')
    }

    // Update helpful/not helpful counts
    if (helpful) {
      review.helpful += 1
    } else {
      review.notHelpful += 1
    }

    const updatedReview = await review.save()

    return {
      id: updatedReview._id.toString(),
      songId: updatedReview.songId.toString(),
      arrangementId: updatedReview.arrangementId?.toString(),
      userId: updatedReview.userId,
      userName: updatedReview.userName,
      rating: updatedReview.rating,
      comment: updatedReview.comment,
      helpful: updatedReview.helpful,
      notHelpful: updatedReview.notHelpful,
      createdAt: updatedReview.createdAt,
      updatedAt: updatedReview.updatedAt
    }
  }

  async getReviewStats(songId: string): Promise<{
    averageRating: number
    totalReviews: number
    ratingBreakdown: Record<string, number>
  }> {
    if (!Types.ObjectId.isValid(songId)) {
      throw new ValidationError('Invalid song ID')
    }

    // Verify song exists
    const song = await Song.findById(songId)
    if (!song) {
      throw new NotFoundError('Song')
    }

    // Use the static method from the model
    return await Review.getReviewStats(songId)
  }

  async getUserReview(songId: string, userId: string, arrangementId?: string): Promise<ReviewResponse | null> {
    if (!Types.ObjectId.isValid(songId)) {
      throw new ValidationError('Invalid song ID')
    }

    if (arrangementId && !Types.ObjectId.isValid(arrangementId)) {
      throw new ValidationError('Invalid arrangement ID')
    }

    const query: Record<string, any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
      songId: new Types.ObjectId(songId), 
      userId 
    }
    
    if (arrangementId) {
      query.arrangementId = new Types.ObjectId(arrangementId)
    } else {
      query.arrangementId = { $exists: false }
    }

    const review = await Review.findOne(query).lean()
    
    if (!review) {
      return null
    }

    return {
      id: review._id.toString(),
      songId: review.songId.toString(),
      arrangementId: review.arrangementId?.toString(),
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      helpful: review.helpful,
      notHelpful: review.notHelpful,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }
  }

  // Admin methods
  async deleteReviewAsAdmin(reviewId: string): Promise<void> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new ValidationError('Invalid review ID')
    }

    const review = await Review.findById(reviewId)
    if (!review) {
      throw new NotFoundError('Review')
    }

    await Review.findByIdAndDelete(reviewId)
  }

  async getFlaggedReviews(): Promise<ReviewResponse[]> {
    // Get reviews with negative net helpfulness
    const flaggedReviews = await Review.find({
      $expr: {
        $lt: [
          { $subtract: ['$helpful', '$notHelpful'] },
          -5 // Threshold for flagging
        ]
      }
    })
    .sort({ helpful: 1, notHelpful: -1 })
    .lean()

    return flaggedReviews.map(review => ({
      id: review._id.toString(),
      songId: review.songId.toString(),
      arrangementId: review.arrangementId?.toString(),
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      helpful: review.helpful,
      notHelpful: review.notHelpful,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }))
  }
}

export const reviewService = new ReviewService()