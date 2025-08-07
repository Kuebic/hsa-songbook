import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userService } from '../user.service'
import { User } from '../user.model'
import { createTestUser, _createUserData, _createClerkWebhookPayload } from '../../../shared/test-utils/factories'
import { NotFoundError, ConflictError } from '../../../shared/utils/errors'
import mongoose from 'mongoose'

describe('User Service', () => {
  // ============================================================================
  // Clerk Webhook Processing Tests
  // ============================================================================

  describe('Clerk Webhook Processing', () => {
    describe('createFromClerk', () => {
      it('should create new user from Clerk webhook data', async () => {
        const clerkData = {
          clerkId: 'clerk_test_create',
          email: 'clerk-new@example.com',
          username: 'clerknewuser',
          name: 'Clerk New User'
        }

        const result = await userService.createFromClerk(clerkData)

        expect(result).toBeValidUser()
        expect(result.clerkId).toBe(clerkData.clerkId)
        expect(result.email).toBe(clerkData.email)
        expect(result.username).toBe(clerkData.username)
        expect(result.name).toBe(clerkData.name)
        expect(result.role).toBe('USER')
        expect(result.isActive).toBe(true)
        expect(result.preferences.fontSize).toBe(16)
        expect(result.preferences.theme).toBe('light')
        expect(result.stats.songsCreated).toBe(0)
        expect(result.stats.arrangementsCreated).toBe(0)
        expect(result.stats.setlistsCreated).toBe(0)
      })

      it('should return existing user if clerkId already exists', async () => {
        const existingUser = await createTestUser({ clerkId: 'clerk_existing' })

        const clerkData = {
          clerkId: 'clerk_existing',
          email: 'different@example.com',
          username: 'differentuser',
          name: 'Different Name'
        }

        const result = await userService.createFromClerk(clerkData)

        expect(result.clerkId).toBe(existingUser.clerkId)
        expect(result.email).toBe(existingUser.email) // Should keep original email
        expect(result.username).toBe(existingUser.username) // Should keep original username
      })

      it('should throw ConflictError if email already exists with different clerkId', async () => {
        await createTestUser({ 
          clerkId: 'clerk_existing',
          email: 'duplicate@example.com'
        })

        const clerkData = {
          clerkId: 'clerk_different',
          email: 'duplicate@example.com',
          username: 'newuser',
          name: 'New User'
        }

        await expect(userService.createFromClerk(clerkData))
          .rejects.toThrow(ConflictError)
        await expect(userService.createFromClerk(clerkData))
          .rejects.toThrow('User with this email or username already exists')
      })

      it('should throw ConflictError if username already exists with different clerkId', async () => {
        await createTestUser({ 
          clerkId: 'clerk_existing',
          username: 'duplicateuser'
        })

        const clerkData = {
          clerkId: 'clerk_different',
          email: 'new@example.com',
          username: 'duplicateuser',
          name: 'New User'
        }

        await expect(userService.createFromClerk(clerkData))
          .rejects.toThrow(ConflictError)
        await expect(userService.createFromClerk(clerkData))
          .rejects.toThrow('User with this email or username already exists')
      })

      it('should handle Clerk data without optional name field', async () => {
        const clerkData = {
          clerkId: 'clerk_no_name',
          email: 'noname@example.com',
          username: 'nonameuser'
        }

        const result = await userService.createFromClerk(clerkData)

        expect(result.name).toBeUndefined()
        expect(result.clerkId).toBe(clerkData.clerkId)
        expect(result.email).toBe(clerkData.email)
        expect(result.username).toBe(clerkData.username)
      })
    })

    describe('updateFromClerk', () => {
      let existingUser: unknown

      beforeEach(async () => {
        existingUser = await createTestUser({ clerkId: 'clerk_update_test' })
      })

      it('should update existing user from Clerk webhook', async () => {
        const updateData = {
          email: 'updated@example.com',
          username: 'updateduser',
          name: 'Updated Name'
        }

        const result = await userService.updateFromClerk(existingUser.clerkId, updateData)

        expect(result.clerkId).toBe(existingUser.clerkId)
        expect(result.email).toBe(updateData.email)
        expect(result.username).toBe(updateData.username)
        expect(result.name).toBe(updateData.name)
      })

      it('should update only provided fields', async () => {
        const originalEmail = existingUser.email
        const originalUsername = existingUser.username

        const updateData = {
          name: 'Only Name Updated'
        }

        const result = await userService.updateFromClerk(existingUser.clerkId, updateData)

        expect(result.name).toBe(updateData.name)
        expect(result.email).toBe(originalEmail)
        expect(result.username).toBe(originalUsername)
      })

      it('should throw NotFoundError for non-existent clerkId', async () => {
        const updateData = {
          email: 'updated@example.com'
        }

        await expect(userService.updateFromClerk('non_existent_clerk', updateData))
          .rejects.toThrow(NotFoundError)
        await expect(userService.updateFromClerk('non_existent_clerk', updateData))
          .rejects.toThrow('User not found')
      })

      it('should handle empty update data', async () => {
        const result = await userService.updateFromClerk(existingUser.clerkId, {})

        expect(result.clerkId).toBe(existingUser.clerkId)
        expect(result.email).toBe(existingUser.email)
        expect(result.username).toBe(existingUser.username)
      })
    })

    describe('deleteFromClerk', () => {
      let existingUser: unknown

      beforeEach(async () => {
        existingUser = await createTestUser({ clerkId: 'clerk_delete_test' })
      })

      it('should soft delete user by setting isActive to false', async () => {
        await userService.deleteFromClerk(existingUser.clerkId)

        const updatedUser = await User.findById(existingUser._id)
        expect(updatedUser!.isActive).toBe(false)
        expect(updatedUser!.clerkId).toBe(existingUser.clerkId) // User still exists
      })

      it('should throw NotFoundError for non-existent clerkId', async () => {
        await expect(userService.deleteFromClerk('non_existent_clerk'))
          .rejects.toThrow(NotFoundError)
        await expect(userService.deleteFromClerk('non_existent_clerk'))
          .rejects.toThrow('User not found')
      })

      it('should handle multiple deletion attempts gracefully', async () => {
        await userService.deleteFromClerk(existingUser.clerkId)
        
        // Second deletion should still work
        await expect(userService.deleteFromClerk(existingUser.clerkId))
          .resolves.toBeUndefined()
      })
    })
  })

  // ============================================================================
  // User Retrieval Tests
  // ============================================================================

  describe('User Retrieval', () => {
    describe('findByClerkId', () => {
      it('should find user by clerkId', async () => {
        const user = await createTestUser({ clerkId: 'clerk_find_test' })

        const result = await userService.findByClerkId('clerk_find_test')

        expect(result).toBeTruthy()
        expect(result!.clerkId).toBe(user.clerkId)
        expect(result!.email).toBe(user.email)
        expect(result!.id).toBe(user._id.toString())
      })

      it('should return null for non-existent clerkId', async () => {
        const result = await userService.findByClerkId('non_existent_clerk')

        expect(result).toBeNull()
      })

      it('should return formatted user response', async () => {
        const user = await createTestUser()

        const result = await userService.findByClerkId(user.clerkId)

        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('clerkId')
        expect(result).toHaveProperty('preferences')
        expect(result).toHaveProperty('stats')
        expect(result).toHaveProperty('createdAt')
        expect(result).toHaveProperty('updatedAt')
      })
    })

    describe('findById', () => {
      it('should find user by MongoDB _id', async () => {
        const user = await createTestUser()

        const result = await userService.findById(user._id.toString())

        expect(result.id).toBe(user._id.toString())
        expect(result.clerkId).toBe(user.clerkId)
        expect(result.email).toBe(user.email)
      })

      it('should throw NotFoundError for non-existent id', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString()

        await expect(userService.findById(fakeId))
          .rejects.toThrow(NotFoundError)
        await expect(userService.findById(fakeId))
          .rejects.toThrow('User not found')
      })

      it('should handle invalid ObjectId format', async () => {
        await expect(userService.findById('invalid_id'))
          .rejects.toThrow()
      })
    })

    describe('findAll', () => {
      beforeEach(async () => {
        // Create test users with different roles and active states
        await createTestUser({ 
          role: 'USER', 
          isActive: true,
          email: 'user1@test.com',
          username: 'user1',
          clerkId: 'clerk_user1'
        })
        await createTestUser({ 
          role: 'ADMIN', 
          isActive: true,
          email: 'admin1@test.com',
          username: 'admin1',
          clerkId: 'clerk_admin1'
        })
        await createTestUser({ 
          role: 'USER', 
          isActive: false,
          email: 'inactive1@test.com',
          username: 'inactive1',
          clerkId: 'clerk_inactive1'
        })
        await createTestUser({ 
          role: 'MODERATOR', 
          isActive: true,
          email: 'mod1@test.com',
          username: 'mod1',
          clerkId: 'clerk_mod1'
        })
      })

      it('should return all users when no filter provided', async () => {
        const result = await userService.findAll()

        expect(result).toHaveLength(4)
        result.forEach(user => {
          expect(user).toBeValidUser()
        })
      })

      it('should filter users by role', async () => {
        const userResult = await userService.findAll({ role: 'USER' })
        expect(userResult).toHaveLength(2)
        userResult.forEach(user => {
          expect(user.role).toBe('USER')
        })

        const adminResult = await userService.findAll({ role: 'ADMIN' })
        expect(adminResult).toHaveLength(1)
        expect(adminResult[0].role).toBe('ADMIN')

        const modResult = await userService.findAll({ role: 'MODERATOR' })
        expect(modResult).toHaveLength(1)
        expect(modResult[0].role).toBe('MODERATOR')
      })

      it('should filter users by active status', async () => {
        const activeResult = await userService.findAll({ isActive: true })
        expect(activeResult).toHaveLength(3)
        activeResult.forEach(user => {
          expect(user.isActive).toBe(true)
        })

        const inactiveResult = await userService.findAll({ isActive: false })
        expect(inactiveResult).toHaveLength(1)
        expect(inactiveResult[0].isActive).toBe(false)
      })

      it('should filter by both role and active status', async () => {
        const result = await userService.findAll({ role: 'USER', isActive: true })
        
        expect(result).toHaveLength(1)
        expect(result[0].role).toBe('USER')
        expect(result[0].isActive).toBe(true)
      })

      it('should return empty array when no users match filter', async () => {
        const result = await userService.findAll({ role: 'ADMIN', isActive: false })
        
        expect(result).toHaveLength(0)
      })
    })
  })

  // ============================================================================
  // User Update Tests
  // ============================================================================

  describe('User Updates', () => {
    let testUser: unknown

    beforeEach(async () => {
      testUser = await createTestUser()
    })

    describe('update', () => {
      it('should update user name', async () => {
        const updateData = { name: 'Updated Name' }

        const result = await userService.update(testUser._id.toString(), updateData)

        expect(result.name).toBe(updateData.name)
        expect(result.id).toBe(testUser._id.toString())
      })

      it('should update user preferences', async () => {
        const updateData = {
          preferences: {
            defaultKey: 'D',
            fontSize: 20,
            theme: 'dark' as const
          }
        }

        const result = await userService.update(testUser._id.toString(), updateData)

        expect(result.preferences.defaultKey).toBe('D')
        expect(result.preferences.fontSize).toBe(20)
        expect(result.preferences.theme).toBe('dark')
      })

      it('should update partial preferences', async () => {
        const originalPreferences = testUser.preferences

        const updateData = {
          preferences: {
            fontSize: 18
          }
        }

        const result = await userService.update(testUser._id.toString(), updateData)

        expect(result.preferences.fontSize).toBe(18)
        expect(result.preferences.theme).toBe(originalPreferences.theme)
        expect(result.preferences.defaultKey).toBe(originalPreferences.defaultKey)
      })

      it('should update user profile', async () => {
        const updateData = {
          profile: {
            bio: 'Updated bio',
            website: 'https://updated.com',
            location: 'Updated Location'
          }
        }

        const result = await userService.update(testUser._id.toString(), updateData)

        expect(result.profile.bio).toBe(updateData.profile.bio)
        expect(result.profile.website).toBe(updateData.profile.website)
        expect(result.profile.location).toBe(updateData.profile.location)
      })

      it('should update partial profile', async () => {
        const updateData = {
          profile: {
            bio: 'Only bio updated'
          }
        }

        const result = await userService.update(testUser._id.toString(), updateData)

        expect(result.profile.bio).toBe('Only bio updated')
        expect(result.profile.website).toBe(testUser.profile.website)
        expect(result.profile.location).toBe(testUser.profile.location)
      })

      it('should update multiple fields at once', async () => {
        const updateData = {
          name: 'Multi Update',
          preferences: {
            fontSize: 22
          },
          profile: {
            bio: 'Multi bio'
          }
        }

        const result = await userService.update(testUser._id.toString(), updateData)

        expect(result.name).toBe('Multi Update')
        expect(result.preferences.fontSize).toBe(22)
        expect(result.profile.bio).toBe('Multi bio')
      })

      it('should throw NotFoundError for non-existent user', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString()
        const updateData = { name: 'Test' }

        await expect(userService.update(fakeId, updateData))
          .rejects.toThrow(NotFoundError)
      })

      it('should validate updated data', async () => {
        const updateData = {
          preferences: {
            fontSize: 999 // Invalid fontSize
          }
        }

        await expect(userService.update(testUser._id.toString(), updateData))
          .rejects.toThrow()
      })
    })

    describe('updateRole', () => {
      it('should update user role to ADMIN', async () => {
        const result = await userService.updateRole(testUser._id.toString(), 'ADMIN')

        expect(result.role).toBe('ADMIN')
        expect(result.id).toBe(testUser._id.toString())
      })

      it('should update user role to MODERATOR', async () => {
        const result = await userService.updateRole(testUser._id.toString(), 'MODERATOR')

        expect(result.role).toBe('MODERATOR')
      })

      it('should update user role back to USER', async () => {
        const result = await userService.updateRole(testUser._id.toString(), 'USER')

        expect(result.role).toBe('USER')
      })

      it('should throw NotFoundError for non-existent user', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString()

        await expect(userService.updateRole(fakeId, 'ADMIN'))
          .rejects.toThrow(NotFoundError)
      })
    })
  })

  // ============================================================================
  // Statistics Management Tests
  // ============================================================================

  describe('Statistics Management', () => {
    let testUser: unknown

    beforeEach(async () => {
      testUser = await createTestUser()
    })

    describe('incrementStat', () => {
      it('should increment songsCreated stat', async () => {
        await userService.incrementStat(testUser._id.toString(), 'songsCreated')

        const updatedUser = await User.findById(testUser._id)
        expect(updatedUser!.stats.songsCreated).toBe(1)
      })

      it('should increment arrangementsCreated stat', async () => {
        await userService.incrementStat(testUser._id.toString(), 'arrangementsCreated')

        const updatedUser = await User.findById(testUser._id)
        expect(updatedUser!.stats.arrangementsCreated).toBe(1)
      })

      it('should increment setlistsCreated stat', async () => {
        await userService.incrementStat(testUser._id.toString(), 'setlistsCreated')

        const updatedUser = await User.findById(testUser._id)
        expect(updatedUser!.stats.setlistsCreated).toBe(1)
      })

      it('should handle multiple increments correctly', async () => {
        for (let i = 0; i < 5; i++) {
          await userService.incrementStat(testUser._id.toString(), 'songsCreated')
        }

        const updatedUser = await User.findById(testUser._id)
        expect(updatedUser!.stats.songsCreated).toBe(5)
      })

      it('should handle concurrent increments', async () => {
        const promises = Array(10).fill(0).map(() => 
          userService.incrementStat(testUser._id.toString(), 'songsCreated')
        )

        await Promise.all(promises)

        const updatedUser = await User.findById(testUser._id)
        expect(updatedUser!.stats.songsCreated).toBe(10)
      })

      it('should handle non-existent user gracefully', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString()
        
        // Should not throw but also should not increment
        await expect(userService.incrementStat(fakeId, 'songsCreated'))
          .resolves.toBeUndefined()
      })
    })

    describe('updateLastLogin', () => {
      it('should update lastLoginAt timestamp', async () => {
        const beforeLogin = new Date()

        await userService.updateLastLogin(testUser.clerkId)

        const updatedUser = await User.findById(testUser._id)
        expect(updatedUser!.lastLoginAt).toBeInstanceOf(Date)
        expect(updatedUser!.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime())
      })

      it('should update lastLoginAt multiple times', async () => {
        await userService.updateLastLogin(testUser.clerkId)
        const firstLogin = (await User.findById(testUser._id))!.lastLoginAt

        // Wait 1ms to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 1))

        await userService.updateLastLogin(testUser.clerkId)
        const secondLogin = (await User.findById(testUser._id))!.lastLoginAt

        expect(secondLogin!.getTime()).toBeGreaterThan(firstLogin!.getTime())
      })

      it('should handle non-existent clerkId gracefully', async () => {
        // Should not throw
        await expect(userService.updateLastLogin('non_existent_clerk'))
          .resolves.toBeUndefined()
      })
    })
  })

  // ============================================================================
  // Response Formatting Tests
  // ============================================================================

  describe('Response Formatting', () => {
    it('should format user response correctly', async () => {
      const user = await createTestUser()

      const result = await userService.findById(user._id.toString())

      // Check that response has correct structure
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('clerkId')
      expect(result).toHaveProperty('email')
      expect(result).toHaveProperty('username')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('role')
      expect(result).toHaveProperty('preferences')
      expect(result).toHaveProperty('profile')
      expect(result).toHaveProperty('stats')
      expect(result).toHaveProperty('isActive')
      expect(result).toHaveProperty('createdAt')
      expect(result).toHaveProperty('updatedAt')

      // Check that _id is transformed to id
      expect(result.id).toBe(user._id.toString())

      // Check that ObjectId is converted to string
      expect(typeof result.id).toBe('string')
    })

    it('should handle users without optional fields', async () => {
      const user = await createTestUser({ 
        name: undefined, 
        lastLoginAt: undefined 
      })

      const result = await userService.findById(user._id.toString())

      expect(result.name).toBeUndefined()
      expect(result.lastLoginAt).toBeUndefined()
      expect(result.id).toBeDefined()
      expect(result.preferences).toBeDefined()
    })
  })

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock mongoose to throw connection error
      const _originalFindOne = User.findOne
      vi.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('Database connection failed'))

      await expect(userService.findByClerkId('test'))
        .rejects.toThrow('Database connection failed')

      // Restore original method
      vi.mocked(User.findOne).mockRestore()
    })

    it('should handle validation errors in user creation', async () => {
      const invalidData = {
        clerkId: '', // Invalid: empty string
        email: 'invalid-email', // Invalid: not a proper email
        username: 'u', // Potentially invalid if there are username constraints
      }

      await expect(userService.createFromClerk(invalidData))
        .rejects.toThrow()
    })
  })
})