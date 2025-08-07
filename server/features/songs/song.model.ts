import { Schema, model } from 'mongoose'
import { ISong } from './song.types'

const songSchema = new Schema<ISong>({
  title: {
    type: String,
    required: [true, 'Song title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  artist: {
    type: String,
    trim: true,
    maxlength: [100, 'Artist name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  compositionYear: {
    type: Number,
    min: [1000, 'Year must be after 1000'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  ccli: {
    type: String,
    sparse: true,
    index: true,
    trim: true
  },
  themes: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  source: {
    type: String,
    trim: true,
    maxlength: [200, 'Source cannot exceed 200 characters']
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  defaultArrangementId: {
    type: Schema.Types.ObjectId,
    ref: 'Arrangement'
  },
  metadata: {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  documentSize: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      delete ret.documentSize
      return ret
    }
  }
})

// Indexes for performance
songSchema.index({ title: 'text', artist: 'text', themes: 'text' })
songSchema.index({ 'metadata.isPublic': 1, themes: 1 })
songSchema.index({ 'metadata.createdBy': 1, createdAt: -1 })
songSchema.index({ 'metadata.views': -1 })
songSchema.index({ 'metadata.ratings.average': -1 })

// Pre-save middleware to calculate document size
songSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Calculate document size for monitoring
  this.documentSize = JSON.stringify(this.toObject()).length
  
  next()
})

// Static method for text search
songSchema.statics.searchSongs = async function(query: string, filter: any = {}) {
  const searchFilter = {
    $text: { $search: query },
    ...filter
  }
  
  return this.find(searchFilter)
    .select({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
}

// Instance method to increment views
songSchema.methods.incrementViews = async function() {
  this.metadata.views += 1
  return this.save()
}

// Instance method to update rating
songSchema.methods.updateRating = async function(newRating: number) {
  const currentTotal = this.metadata.ratings.average * this.metadata.ratings.count
  const newCount = this.metadata.ratings.count + 1
  const newAverage = (currentTotal + newRating) / newCount
  
  this.metadata.ratings.average = Math.round(newAverage * 10) / 10
  this.metadata.ratings.count = newCount
  
  return this.save()
}

export const Song = model<ISong>('Song', songSchema)