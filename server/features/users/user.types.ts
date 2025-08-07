import { Document, Types } from 'mongoose'

export interface IUser extends Document {
  clerkId: string  // Unique Clerk user ID
  email: string
  username: string
  name?: string
  role: 'USER' | 'ADMIN' | 'MODERATOR'
  preferences: {
    defaultKey?: string
    fontSize: number
    theme: 'light' | 'dark' | 'stage'
  }
  profile: {
    bio?: string
    website?: string
    location?: string
  }
  stats: {
    songsCreated: number
    arrangementsCreated: number
    setlistsCreated: number
  }
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserFromClerkDto {
  clerkId: string
  email: string
  username: string
  name?: string
  profileImageUrl?: string
}

export interface UpdateUserDto {
  name?: string
  preferences?: {
    defaultKey?: string
    fontSize?: number
    theme?: 'light' | 'dark' | 'stage'
  }
  profile?: {
    bio?: string
    website?: string
    location?: string
  }
}

export interface UserResponse {
  id: string
  clerkId: string
  email: string
  username: string
  name?: string
  role: string
  preferences: {
    defaultKey?: string
    fontSize: number
    theme: string
  }
  profile: {
    bio?: string
    website?: string
    location?: string
  }
  stats: {
    songsCreated: number
    arrangementsCreated: number
    setlistsCreated: number
  }
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}