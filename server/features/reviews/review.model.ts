import { Schema, model } from 'mongoose'
import { IReview } from './review.types'

const reviewSchema = new Schema<IReview>({
  songId: {
    type: Schema.Types.ObjectId,
    ref: 'Song',
    required: [true, 'Song ID is required'],
    index: true
  },
  arrangementId: {
    type: Schema.Types.ObjectId,
    ref: 'Arrangement',
    index: true
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  userName: {
    type: String,
    trim: true,
    maxlength: [100, 'Username cannot exceed 100 characters']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v)
      },
      message: 'Rating must be a whole number between 1 and 5'
    }
  },
  comment: {
    type: String,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    trim: true
  },
  helpful: {
    type: Number,
    default: 0,
    min: [0, 'Helpful count cannot be negative']
  },
  notHelpful: {
    type: Number,
    default: 0,
    min: [0, 'Not helpful count cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      const { _id, __v, ...cleanRet } = ret
      return {
        id: _id,
        ...cleanRet
      }
    }
  }
})

// Compound indexes to prevent duplicate reviews and optimize queries
reviewSchema.index({ songId: 1, userId: 1 }, { unique: true })
reviewSchema.index({ arrangementId: 1, userId: 1 }, { 
  unique: true,
  partialFilterExpression: { arrangementId: { $exists: true } }
})

// Additional indexes for performance
reviewSchema.index({ songId: 1, createdAt: -1 })
reviewSchema.index({ songId: 1, rating: -1 })
reviewSchema.index({ userId: 1, createdAt: -1 })

// Update song rating after review save
reviewSchema.post('save', async function(doc) {
  const Song = model('Song')
  
  if (doc.songId) {
    try {
      // Aggregate all reviews for this song
      const ratingStats = await model('Review').aggregate([
        { $match: { songId: doc.songId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ])
      
      if (ratingStats.length > 0) {
        const stats = ratingStats[0]
        await Song.findByIdAndUpdate(doc.songId, {
          'metadata.ratings': {
            average: Math.round(stats.averageRating * 10) / 10,
            count: stats.totalReviews
          }
        })
      }
    } catch (error) {
      console.error('Error updating song rating after review save:', error)
    }
  }
})

// Update song rating after review update
reviewSchema.post('findOneAndUpdate', async function() {
  const updatedReview = await this.model.findOne(this.getQuery())
  
  if (updatedReview && updatedReview.songId) {
    const Song = model('Song')
    
    try {
      const ratingStats = await model('Review').aggregate([
        { $match: { songId: updatedReview.songId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ])
      
      if (ratingStats.length > 0) {
        const stats = ratingStats[0]
        await Song.findByIdAndUpdate(updatedReview.songId, {
          'metadata.ratings': {
            average: Math.round(stats.averageRating * 10) / 10,
            count: stats.totalReviews
          }
        })
      }
    } catch (error) {
      console.error('Error updating song rating after review update:', error)
    }
  }
})

// Update song rating after review delete
reviewSchema.post('findOneAndDelete', async function() {
  const deletedReview = this.getQuery()
  
  if (deletedReview && deletedReview.songId) {
    const Song = model('Song')
    
    try {
      const ratingStats = await model('Review').aggregate([
        { $match: { songId: deletedReview.songId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ])
      
      if (ratingStats.length > 0) {
        const stats = ratingStats[0]
        await Song.findByIdAndUpdate(deletedReview.songId, {
          'metadata.ratings': {
            average: Math.round(stats.averageRating * 10) / 10,
            count: stats.totalReviews
          }
        })
      } else {
        // No reviews left, reset to 0
        await Song.findByIdAndUpdate(deletedReview.songId, {
          'metadata.ratings': {
            average: 0,
            count: 0
          }
        })
      }
    } catch (error) {
      console.error('Error updating song rating after review delete:', error)
    }
  }
})

// Static method to get review statistics for a song
reviewSchema.statics.getReviewStats = async function(songId: string) {
  const stats = await this.aggregate([
    { $match: { songId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        _id: 0,
        averageRating: { $round: ['$averageRating', 1] },
        totalReviews: 1,
        ratingBreakdown: {
          1: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } },
          2: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
          3: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
          4: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
          5: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } }
        }
      }
    }
  ])
  
  return stats.length > 0 ? stats[0] : {
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  }
}

// Virtual for net helpfulness score
reviewSchema.virtual('netHelpfulness').get(function() {
  return this.helpful - this.notHelpful
})

export const Review = model<IReview>('Review', reviewSchema)