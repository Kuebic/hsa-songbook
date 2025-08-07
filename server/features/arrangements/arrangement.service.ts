import { Arrangement } from './arrangement.model'
import { 
  IArrangement,
  CreateArrangementDto, 
  UpdateArrangementDto, 
  ArrangementFilter, 
  ArrangementResponse 
} from './arrangement.types'
import { NotFoundError, ConflictError } from '../../shared/utils/errors'
import { compressionService } from '../../shared/services/compressionService'
import { Types } from 'mongoose'
import { ArrangementQuery, SortOptions } from '../../shared/types/database.types'
import { PAGINATION, DEFAULTS } from '../../shared/constants'
import { createLogger } from '../../shared/services/logger'

const logger = createLogger('ArrangementService')

export class ArrangementService {
  /**
   * Get all arrangements with filtering and pagination
   * @param filter - Filter options including songId, difficulty, tags, etc.
   * @returns Paginated list of arrangements without chord data
   */
  async findAll(filter: ArrangementFilter): Promise<{
    arrangements: ArrangementResponse[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const {
      songId,
      createdBy,
      difficulty,
      key,
      tags,
      isPublic = true,
      isMashup,
      page = PAGINATION.DEFAULT_PAGE,
      limit = Math.min(filter.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filter

    // Build strongly typed query
    const query: ArrangementQuery = {}

    if (isPublic !== undefined) {
      query['metadata.isPublic'] = isPublic
    }

    if (songId) {
      query.songIds = new Types.ObjectId(songId)
    }

    if (createdBy) {
      query.createdBy = createdBy
    }

    if (difficulty) {
      query.difficulty = difficulty
    }

    if (key) {
      query.key = key
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags }
    }

    if (isMashup !== undefined) {
      query['metadata.isMashup'] = isMashup
    }

    // Build sort
    const sort: SortOptions = {}
    if (sortBy === 'rating') {
      sort['metadata.ratings.average'] = sortOrder === 'asc' ? 1 : -1
    } else if (sortBy === 'views') {
      sort['metadata.views'] = sortOrder === 'asc' ? 1 : -1
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    }

    // Execute query with pagination
    const [arrangements, total] = await Promise.all([
      Arrangement.find(query)
        .select('-chordData -documentSize')
        .populate('songIds', 'title artist')
        .limit(limit)
        .skip((page - 1) * limit)
        .sort(sort)
        .lean(),
      Arrangement.countDocuments(query)
    ])

    return {
      arrangements: arrangements.map(arr => this.formatArrangementResponse(arr, false)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Get a single arrangement by ID with decompressed chord data
   * @param id - Arrangement ID
   * @param includeChordData - Whether to decompress and include chord data
   * @returns Arrangement with optional chord data and compression metrics
   * @throws {NotFoundError} If arrangement doesn't exist
   */
  async findById(id: string, includeChordData = true): Promise<ArrangementResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Arrangement')
    }

    const arrangement = await Arrangement.findById(id)
      .populate('songIds', 'title artist')
      .lean()

    if (!arrangement) {
      throw new NotFoundError('Arrangement')
    }

    // Increment views
    await Arrangement.findByIdAndUpdate(id, {
      $inc: { 'metadata.views': 1 }
    })

    // Decompress chord data if requested
    let chordProText: string | undefined
    let compressionMetrics = undefined

    if (includeChordData && arrangement.chordData) {
      chordProText = await compressionService.decompressChordPro(arrangement.chordData)
      compressionMetrics = compressionService.calculateMetrics(chordProText, arrangement.chordData)
    }

    return this.formatArrangementResponse(arrangement, includeChordData, chordProText, compressionMetrics)
  }

  /**
   * Get a single arrangement by slug
   */
  async findBySlug(slug: string, includeChordData = true): Promise<ArrangementResponse> {
    const arrangement = await Arrangement.findOne({ slug })
      .populate('songIds', 'title artist')
      .lean()

    if (!arrangement) {
      throw new NotFoundError('Arrangement')
    }

    // Increment views
    await Arrangement.findOneAndUpdate({ slug }, {
      $inc: { 'metadata.views': 1 }
    })

    // Decompress chord data if requested
    let chordProText: string | undefined
    let compressionMetrics = undefined

    if (includeChordData && arrangement.chordData) {
      chordProText = await compressionService.decompressChordPro(arrangement.chordData)
      compressionMetrics = compressionService.calculateMetrics(chordProText, arrangement.chordData)
    }

    return this.formatArrangementResponse(arrangement, includeChordData, chordProText, compressionMetrics)
  }

  /**
   * Get arrangements by song ID
   */
  async findBySongId(songId: string): Promise<ArrangementResponse[]> {
    if (!Types.ObjectId.isValid(songId)) {
      throw new NotFoundError('Song')
    }

    const arrangements = await Arrangement.find({ songIds: songId })
      .select('-chordData -documentSize')
      .populate('songIds', 'title artist')
      .lean()

    return arrangements.map(arr => this.formatArrangementResponse(arr, false))
  }

  /**
   * Create a new arrangement with compressed chord data
   */
  async create(data: CreateArrangementDto, userId: string): Promise<ArrangementResponse> {
    // Check if slug already exists
    if (data.slug) {
      const existing = await Arrangement.findOne({ slug: data.slug })
      if (existing) {
        throw new ConflictError('An arrangement with this slug already exists')
      }
    }

    // Compress the chord data
    const compressedData = await compressionService.compressChordPro(data.chordProText)
    const compressionMetrics = compressionService.calculateMetrics(data.chordProText, compressedData)

    logger.info('Arrangement compressed', {
      ratio: `${compressionMetrics.ratio}%`,
      savedBytes: compressionMetrics.savings,
      originalSize: data.chordProText.length,
      compressedSize: compressedData.length
    })

    // Prepare arrangement data
    const arrangementData: Partial<IArrangement> = {
      name: data.name,
      songIds: data.songIds.map(id => new Types.ObjectId(id)),
      slug: data.slug,
      createdBy: new Types.ObjectId(userId),
      chordData: compressedData,
      key: data.key,
      tempo: data.tempo,
      timeSignature: data.timeSignature,
      difficulty: data.difficulty,
      description: data.description,
      tags: data.tags || [],
      metadata: {
        isMashup: data.songIds.length > 1,
        mashupSections: data.mashupSections?.map(section => ({
          songId: new Types.ObjectId(section.songId),
          title: section.title
        })),
        isPublic: data.isPublic || false,
        ratings: { average: DEFAULTS.RATING, count: 0 },
        views: DEFAULTS.VIEWS
      }
    }

    const arrangement = await Arrangement.create(arrangementData)
    await arrangement.populate('songIds', 'title artist')

    return this.formatArrangementResponse(
      arrangement.toObject(), 
      false, 
      undefined, 
      compressionMetrics
    )
  }

  /**
   * Update an arrangement
   */
  async update(id: string, data: UpdateArrangementDto, _userId: string): Promise<ArrangementResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Arrangement')
    }

    // Check if new slug already exists
    if (data.slug) {
      const existing = await Arrangement.findOne({
        slug: data.slug,
        _id: { $ne: id }
      })
      if (existing) {
        throw new ConflictError('An arrangement with this slug already exists')
      }
    }

    const updateData: Partial<IArrangement> & Partial<UpdateArrangementDto> = { ...data }
    let compressionMetrics = undefined

    // If chord data is being updated, compress it
    if (data.chordProText) {
      const compressedData = await compressionService.compressChordPro(data.chordProText)
      compressionMetrics = compressionService.calculateMetrics(data.chordProText, compressedData)
      updateData.chordData = compressedData
      delete updateData.chordProText

      logger.info('Arrangement updated with compression', {
        ratio: `${compressionMetrics.ratio}%`,
        savedBytes: compressionMetrics.savings
      })
    }

    // Handle metadata updates
    if (data.isPublic !== undefined) {
      updateData['metadata.isPublic'] = data.isPublic
      delete updateData.isPublic
    }

    if (data.songIds) {
      updateData.songIds = data.songIds.map(id => new Types.ObjectId(id))
      updateData['metadata.isMashup'] = data.songIds.length > 1
    }

    if (data.mashupSections) {
      updateData['metadata.mashupSections'] = data.mashupSections.map(section => ({
        songId: new Types.ObjectId(section.songId),
        title: section.title
      }))
      delete updateData.mashupSections
    }

    const arrangement = await Arrangement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('songIds', 'title artist').lean()

    if (!arrangement) {
      throw new NotFoundError('Arrangement')
    }

    return this.formatArrangementResponse(arrangement, false, undefined, compressionMetrics)
  }

  /**
   * Delete an arrangement
   */
  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Arrangement')
    }

    const result = await Arrangement.findByIdAndDelete(id)
    
    if (!result) {
      throw new NotFoundError('Arrangement')
    }
  }

  /**
   * Update arrangement rating
   */
  async updateRating(id: string, rating: number): Promise<ArrangementResponse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Arrangement')
    }

    const arrangement = await Arrangement.findById(id)
    
    if (!arrangement) {
      throw new NotFoundError('Arrangement')
    }

    await arrangement.updateRating(rating)
    await arrangement.populate('songIds', 'title artist')

    return this.formatArrangementResponse(arrangement.toObject(), false)
  }

  /**
   * Format arrangement response
   */
  private formatArrangementResponse(
    arrangement: IArrangement, 
    includeChordData: boolean,
    chordProText?: string,
    compressionMetrics?: { originalSize: number, compressedSize: number, ratio: number, savings: number }
  ): ArrangementResponse {
    const response: ArrangementResponse = {
      id: arrangement._id.toString(),
      name: arrangement.name,
      songIds: arrangement.songIds.map((song: Types.ObjectId) => song.toString()),
      slug: arrangement.slug,
      createdBy: arrangement.createdBy.toString(),
      key: arrangement.key,
      tempo: arrangement.tempo,
      timeSignature: arrangement.timeSignature,
      difficulty: arrangement.difficulty,
      description: arrangement.description,
      tags: arrangement.tags,
      metadata: arrangement.metadata,
      createdAt: arrangement.createdAt,
      updatedAt: arrangement.updatedAt
    }

    if (includeChordData && chordProText) {
      response.chordData = chordProText
    }

    if (compressionMetrics) {
      response.compressionMetrics = compressionMetrics
    }

    return response
  }
}

// Export singleton instance
export const arrangementService = new ArrangementService()