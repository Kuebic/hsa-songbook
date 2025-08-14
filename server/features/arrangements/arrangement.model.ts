import { Schema, model } from 'mongoose'
import { IArrangement } from './arrangement.types'

const arrangementSchema = new Schema<IArrangement>({
  name: {
    type: String,
    required: [true, 'Arrangement name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  songIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Song',
    required: true
  }],
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  createdBy: {
    type: String,  // Store Clerk user ID as string
    required: true,
    index: true
  },
  chordData: {
    type: Buffer,
    required: [true, 'Chord data is required']
  },
  key: {
    type: String,
    enum: ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'],
    trim: true
  },
  tempo: {
    type: Number,
    min: [40, 'Tempo must be at least 40 BPM'],
    max: [240, 'Tempo cannot exceed 240 BPM']
  },
  timeSignature: {
    type: String,
    enum: ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8', '9/8'],
    default: '4/4'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Difficulty level is required']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  metadata: {
    isMashup: {
      type: Boolean,
      default: false
    },
    mashupSections: [{
      songId: {
        type: Schema.Types.ObjectId,
        ref: 'Song'
      },
      title: String
    }],
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
    transform: (_doc, ret) => {
      const { _id, __v, ...cleanRet } = ret
      return {
        id: _id,
        ...cleanRet
      }
    }
  }
})

// Indexes for performance
arrangementSchema.index({ songIds: 1 })
arrangementSchema.index({ 'metadata.isPublic': 1, difficulty: 1 })
arrangementSchema.index({ createdBy: 1, createdAt: -1 })
arrangementSchema.index({ tags: 1 })
arrangementSchema.index({ key: 1, difficulty: 1 })
arrangementSchema.index({ 'metadata.views': -1 })
arrangementSchema.index({ 'metadata.ratings.average': -1 })

// Pre-save middleware
arrangementSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug && this.name) {
    // Create slug from name and add random suffix
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    this.slug = `${baseSlug}-${randomSuffix}`
  }

  // Set isMashup flag based on songIds
  if (this.songIds && this.songIds.length > 1) {
    this.metadata.isMashup = true
  }

  // Calculate document size (compressed size)
  if (this.chordData) {
    this.documentSize = this.chordData.length
  }
  
  next()
})

// Instance method to increment views
arrangementSchema.methods.incrementViews = async function() {
  this.metadata.views += 1
  return this.save()
}

// Instance method to update rating
arrangementSchema.methods.updateRating = async function(newRating: number) {
  const currentTotal = this.metadata.ratings.average * this.metadata.ratings.count
  const newCount = this.metadata.ratings.count + 1
  const newAverage = (currentTotal + newRating) / newCount
  
  this.metadata.ratings.average = Math.round(newAverage * 10) / 10
  this.metadata.ratings.count = newCount
  
  return this.save()
}

// Static method to find arrangements by song
arrangementSchema.statics.findBySongId = async function(songId: string) {
  return this.find({ songIds: songId })
}

// Static method to find public arrangements
arrangementSchema.statics.findPublic = async function(filter: Record<string, unknown> = {}) {
  return this.find({ ...filter, 'metadata.isPublic': true })
}

export const Arrangement = model<IArrangement>('Arrangement', arrangementSchema)