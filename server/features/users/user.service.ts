import { User } from './user.model'
import { IUser, CreateUserFromClerkDto, UpdateUserDto, UserResponse } from './user.types'
import { NotFoundError, ConflictError } from '../../shared/utils/errors'

export class UserService {
  /**
   * Create user from Clerk webhook data
   */
  async createFromClerk(data: CreateUserFromClerkDto): Promise<UserResponse> {
    // Check if user already exists
    const existing = await User.findOne({
      $or: [
        { clerkId: data.clerkId },
        { email: data.email },
        { username: data.username }
      ]
    })

    if (existing) {
      if (existing.clerkId === data.clerkId) {
        // User already synced, just return it
        return this.formatUserResponse(existing.toObject())
      }
      throw new ConflictError('User with this email or username already exists')
    }

    const user = await User.create({
      clerkId: data.clerkId,
      email: data.email,
      username: data.username,
      name: data.name,
      role: 'USER',
      preferences: {
        fontSize: 16,
        theme: 'light'
      },
      stats: {
        songsCreated: 0,
        arrangementsCreated: 0,
        setlistsCreated: 0
      },
      isActive: true
    })

    return this.formatUserResponse(user.toObject())
  }

  /**
   * Update user from Clerk webhook
   */
  async updateFromClerk(clerkId: string, data: Partial<CreateUserFromClerkDto>): Promise<UserResponse> {
    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        ...(data.email && { email: data.email }),
        ...(data.username && { username: data.username }),
        ...(data.name && { name: data.name })
      },
      { new: true }
    )

    if (!user) {
      throw new NotFoundError('User')
    }

    return this.formatUserResponse(user.toObject())
  }

  /**
   * Delete user from Clerk webhook
   */
  async deleteFromClerk(clerkId: string): Promise<void> {
    const user = await User.findOneAndUpdate(
      { clerkId },
      { isActive: false },
      { new: true }
    )

    if (!user) {
      throw new NotFoundError('User')
    }
  }

  /**
   * Find user by Clerk ID
   */
  async findByClerkId(clerkId: string): Promise<UserResponse | null> {
    const user = await User.findOne({ clerkId }).lean()
    return user ? this.formatUserResponse(user) : null
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserResponse> {
    const user = await User.findById(id).lean()

    if (!user) {
      throw new NotFoundError('User')
    }

    return this.formatUserResponse(user)
  }

  /**
   * Update user preferences and profile
   */
  async update(id: string, data: UpdateUserDto): Promise<UserResponse> {
    const updateData: any = {}

    if (data.name) updateData.name = data.name
    if (data.preferences) {
      Object.keys(data.preferences).forEach(key => {
        updateData[`preferences.${key}`] = data.preferences![key as keyof typeof data.preferences]
      })
    }
    if (data.profile) {
      Object.keys(data.profile).forEach(key => {
        updateData[`profile.${key}`] = data.profile![key as keyof typeof data.profile]
      })
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean()

    if (!user) {
      throw new NotFoundError('User')
    }

    return this.formatUserResponse(user)
  }

  /**
   * Get all users (admin only)
   */
  async findAll(filter: { role?: string; isActive?: boolean } = {}): Promise<UserResponse[]> {
    const query: any = {}
    
    if (filter.role) query.role = filter.role
    if (filter.isActive !== undefined) query.isActive = filter.isActive

    const users = await User.find(query).lean()
    return users.map(this.formatUserResponse)
  }

  /**
   * Update user role (admin only)
   */
  async updateRole(id: string, role: 'USER' | 'ADMIN' | 'MODERATOR'): Promise<UserResponse> {
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).lean()

    if (!user) {
      throw new NotFoundError('User')
    }

    return this.formatUserResponse(user)
  }

  /**
   * Increment user stats
   */
  async incrementStat(userId: string, stat: 'songsCreated' | 'arrangementsCreated' | 'setlistsCreated'): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $inc: { [`stats.${stat}`]: 1 }
    })
  }

  /**
   * Update last login
   */
  async updateLastLogin(clerkId: string): Promise<void> {
    await User.findOneAndUpdate(
      { clerkId },
      { lastLoginAt: new Date() }
    )
  }

  /**
   * Format user response
   */
  private formatUserResponse(user: any): UserResponse {
    return {
      id: user._id.toString(),
      clerkId: user.clerkId,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      preferences: user.preferences,
      profile: user.profile,
      stats: user.stats,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }
}

// Export singleton instance
export const userService = new UserService()