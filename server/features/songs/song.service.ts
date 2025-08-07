import { Song } from './song.model'
import { ISong, CreateSongDto, UpdateSongDto, SongFilter, SongResponse } from './song.types'
import { NotFoundError, ConflictError } from '../../shared/utils/errors'
import { Types } from 'mongoose'
import { SongQuery, SortOptions } from '../../shared/types/database.types'
import { PAGINATION, DEFAULTS } from '../../shared/constants'

export class SongService {
  /**
   * Get all songs with filtering and pagination
   * @param filter - Filter options including search, themes, pagination
   * @returns Paginated list of songs with metadata
   * @example
   * const result = await songService.findAll({
   *   searchQuery: 'amazing',
   *   themes: ['worship'],
   *   page: 1,
   *   limit: 20
   * })
   */
  async findAll(filter: SongFilter): Promise<{
    songs: SongResponse[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const {
      searchQuery,
      themes,
      isPublic = true,
      createdBy,
      page = PAGINATION.DEFAULT_PAGE,
      limit = Math.min(filter.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filter

    // Build strongly typed query
    const query: SongQuery = {}

    // Public filter (unless explicitly set to undefined)
    if (isPublic !== undefined) {
      query['metadata.isPublic'] = isPublic
    }

    // Themes filter
    if (themes && themes.length > 0) {
      query.themes = { $in: themes }
    }

    // Created by filter
    if (createdBy) {
      query['metadata.createdBy'] = createdBy
    }

    // Text search
    if (searchQuery) {
      query.$text = { $search: searchQuery }
    }

    // Build sort
    const sort: SortOptions = {}
    if (searchQuery) {
      // If searching, sort by relevance first
      sort.score = { $meta: 'textScore' }
    }
    
    // Add secondary sort
    if (sortBy === 'rating') {
      sort['metadata.ratings.average'] = sortOrder === 'asc' ? 1 : -1
    } else if (sortBy === 'views') {
      sort['metadata.views'] = sortOrder === 'asc' ? 1 : -1
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    }

    // Execute query with pagination
    const [songs, total] = await Promise.all([
      Song.find(query)
        .select('-documentSize')
        .limit(limit)
        .skip((page - 1) * limit)
        .sort(sort)
        .lean(),
      Song.countDocuments(query)
    ])

    return {
      songs: songs.map(this.formatSongResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Get a single song by ID
   * @param id - MongoDB ObjectId as string
   * @returns Song data with incremented view count
   * @throws {NotFoundError} If song doesn't exist or invalid ID
   */
  async findById(id: string): Promise<SongResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Song')
    }

    const song = await Song.findById(id)
      .select('-documentSize')
      .lean()

    if (!song) {
      throw new NotFoundError('Song')
    }

    // Increment views
    await Song.findByIdAndUpdate(id, {
      $inc: { 'metadata.views': 1 }
    })

    return this.formatSongResponse(song)
  }

  /**
   * Get a single song by slug
   * @param slug - URL-friendly song identifier
   * @returns Song data with incremented view count
   * @throws {NotFoundError} If song doesn't exist
   */
  async findBySlug(slug: string): Promise<SongResponse> {
    const song = await Song.findOne({ slug })
      .select('-documentSize')
      .lean()

    if (!song) {
      throw new NotFoundError('Song')
    }

    // Increment views
    await Song.findOneAndUpdate({ slug }, {
      $inc: { 'metadata.views': 1 }
    })

    return this.formatSongResponse(song)
  }

  /**
   * Create a new song
   * @param data - Song creation data
   * @param userId - ID of the user creating the song
   * @returns Created song data
   * @throws {ConflictError} If slug already exists
   */
  async create(data: CreateSongDto, userId: string): Promise<SongResponse> {
    // Check if slug already exists
    if (data.slug) {
      const existing = await Song.findOne({ slug: data.slug })
      if (existing) {
        throw new ConflictError('A song with this slug already exists')
      }
    }

    const songData = {
      ...data,
      metadata: {
        createdBy: new Types.ObjectId(userId),
        isPublic: data.isPublic || DEFAULTS.IS_PUBLIC,
        ratings: { average: DEFAULTS.RATING, count: 0 },
        views: DEFAULTS.VIEWS
      }
    }

    const song = await Song.create(songData)
    return this.formatSongResponse(song.toObject())
  }

  /**
   * Update a song
   * @param id - Song ID to update
   * @param data - Partial song data to update
   * @param userId - ID of the user performing the update
   * @returns Updated song data
   * @throws {NotFoundError} If song doesn't exist
   * @throws {ConflictError} If new slug already exists
   */
  async update(id: string, data: UpdateSongDto, userId: string): Promise<SongResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Song')
    }

    // Check if new slug already exists
    if (data.slug) {
      const existing = await Song.findOne({
        slug: data.slug,
        _id: { $ne: id }
      })
      if (existing) {
        throw new ConflictError('A song with this slug already exists')
      }
    }

    const updateData: Partial<ISong> & Partial<UpdateSongDto> = { ...data }
    
    // Handle metadata update
    if (data.isPublic !== undefined) {
      updateData['metadata.isPublic'] = data.isPublic
      delete updateData.isPublic
    }
    
    updateData['metadata.lastModifiedBy'] = new Types.ObjectId(userId)

    const song = await Song.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-documentSize').lean()

    if (!song) {
      throw new NotFoundError('Song')
    }

    return this.formatSongResponse(song)
  }

  /**
   * Delete a song
   * @param id - Song ID to delete
   * @throws {NotFoundError} If song doesn't exist
   */
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Song')
    }

    const result = await Song.findByIdAndDelete(id)
    
    if (!result) {
      throw new NotFoundError('Song')
    }
  }

  /**
   * Update song rating
   * @param id - Song ID to rate
   * @param rating - Rating value (1-5)
   * @returns Updated song with new rating
   * @throws {NotFoundError} If song doesn't exist
   */
  async updateRating(id: string, rating: number): Promise<SongResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Song')
    }

    const song = await Song.findById(id)
    
    if (!song) {
      throw new NotFoundError('Song')
    }

    await song.updateRating(rating)
    return this.formatSongResponse(song.toObject())
  }

  /**
   * Format song response
   * @param song - Raw song document from MongoDB
   * @returns Formatted song response object
   * @private
   */
  private formatSongResponse(song: ISong): SongResponse {
    return {
      id: song._id.toString(),
      title: song.title,
      artist: song.artist,
      slug: song.slug,
      compositionYear: song.compositionYear,
      ccli: song.ccli,
      themes: song.themes,
      source: song.source,
      notes: song.notes,
      defaultArrangementId: song.defaultArrangementId?.toString(),
      metadata: {
        isPublic: song.metadata.isPublic,
        ratings: song.metadata.ratings,
        views: song.metadata.views
      },
      createdAt: song.createdAt,
      updatedAt: song.updatedAt
    }
  }
}

// Export singleton instance
export const songService = new SongService()