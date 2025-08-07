import { Schema, model } from 'mongoose'
import { IUser } from './user.types'

const userSchema = new Schema<IUser>({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN', 'MODERATOR'],
    default: 'USER'
  },
  preferences: {
    defaultKey: {
      type: String,
      enum: ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
    },
    fontSize: {
      type: Number,
      default: 16,
      min: 12,
      max: 24
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'stage'],
      default: 'light'
    }
  },
  profile: {
    bio: {
      type: String,
      maxlength: 500
    },
    website: {
      type: String,
      maxlength: 200
    },
    location: {
      type: String,
      maxlength: 100
    }
  },
  stats: {
    songsCreated: {
      type: Number,
      default: 0,
      min: 0
    },
    arrangementsCreated: {
      type: Number,
      default: 0,
      min: 0
    },
    setlistsCreated: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: Date
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

// Indexes
// Note: email already has an index from unique: true
userSchema.index({ isActive: 1 })
userSchema.index({ role: 1 })

// Instance methods
userSchema.methods.incrementStat = async function(stat: 'songsCreated' | 'arrangementsCreated' | 'setlistsCreated') {
  this.stats[stat] += 1
  return this.save()
}

userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date()
  return this.save()
}

// Static methods
userSchema.statics.findByClerkId = async function(clerkId: string) {
  return this.findOne({ clerkId })
}

userSchema.statics.findActiveUsers = async function() {
  return this.find({ isActive: true })
}

export const User = model<IUser>('User', userSchema)