/**
 * Database Query Type Definitions
 * Strongly typed MongoDB query interfaces
 */

import { Types } from 'mongoose'

/**
 * MongoDB text search query
 */
interface TextSearchQuery {
  $text?: {
    $search: string
  }
}

/**
 * MongoDB array query operators
 */
interface ArrayQuery<T> {
  $in?: T[]
  $nin?: T[]
  $all?: T[]
  $elemMatch?: Partial<T>
}

/**
 * Song collection query interface
 */
export interface SongQuery extends TextSearchQuery {
  _id?: Types.ObjectId | { $ne: Types.ObjectId }
  title?: string | RegExp
  artist?: string | RegExp
  slug?: string | { $ne: string }
  themes?: string[] | ArrayQuery<string>
  'metadata.isPublic'?: boolean
  'metadata.createdBy'?: Types.ObjectId | string
  'metadata.lastModifiedBy'?: Types.ObjectId
  'metadata.views'?: number | { $gte?: number; $lte?: number }
  'metadata.ratings.average'?: number | { $gte?: number; $lte?: number }
}

/**
 * Arrangement collection query interface
 */
export interface ArrangementQuery extends TextSearchQuery {
  _id?: Types.ObjectId | { $ne: Types.ObjectId }
  name?: string | RegExp
  slug?: string | { $ne: string }
  songIds?: Types.ObjectId | ArrayQuery<Types.ObjectId>
  createdBy?: Types.ObjectId | string
  key?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  tags?: string[] | ArrayQuery<string>
  'metadata.isPublic'?: boolean
  'metadata.isMashup'?: boolean
  'metadata.views'?: number | { $gte?: number; $lte?: number }
  'metadata.ratings.average'?: number | { $gte?: number; $lte?: number }
}

/**
 * User collection query interface
 */
export interface UserQuery {
  _id?: Types.ObjectId | { $ne: Types.ObjectId }
  clerkId?: string
  email?: string | RegExp
  username?: string | RegExp
  'preferences.songbookIds'?: Types.ObjectId | ArrayQuery<Types.ObjectId>
  'statistics.songsViewed'?: number | { $gte?: number; $lte?: number }
  'statistics.setlistsCreated'?: number | { $gte?: number; $lte?: number }
  isActive?: boolean
  createdAt?: Date | { $gte?: Date; $lte?: Date }
}

/**
 * Setlist collection query interface
 */
export interface SetlistQuery {
  _id?: Types.ObjectId | { $ne: Types.ObjectId }
  name?: string | RegExp
  createdBy?: Types.ObjectId | string
  eventDate?: Date | { $gte?: Date; $lte?: Date }
  isTemplate?: boolean
  'metadata.isPublic'?: boolean
  'metadata.isArchived'?: boolean
  tags?: string[] | ArrayQuery<string>
}

/**
 * Review collection query interface
 */
export interface ReviewQuery {
  _id?: Types.ObjectId | { $ne: Types.ObjectId }
  songId?: Types.ObjectId
  arrangementId?: Types.ObjectId
  userId?: Types.ObjectId
  rating?: number | { $gte?: number; $lte?: number }
  isVerified?: boolean
  createdAt?: Date | { $gte?: Date; $lte?: Date }
}

/**
 * Generic sort options
 */
export interface SortOptions {
  [key: string]: 1 | -1 | { $meta: 'textScore' }
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number
  limit: number
  skip: number
}

/**
 * MongoDB aggregation pipeline stage types
 */
export interface AggregationPipeline {
  $match?: Record<string, unknown>
  $sort?: SortOptions
  $limit?: number
  $skip?: number
  $project?: Record<string, 0 | 1 | unknown>
  $lookup?: {
    from: string
    localField: string
    foreignField: string
    as: string
  }
  $unwind?: string | {
    path: string
    preserveNullAndEmptyArrays?: boolean
  }
  $group?: {
    _id: unknown
    [key: string]: unknown
  }
}