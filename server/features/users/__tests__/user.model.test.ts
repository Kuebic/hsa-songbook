import { describe, it, expect, beforeEach } from 'vitest'
import { User } from '../user.model'
import { createUserData, createTestUser } from '../../../shared/test-utils/factories'
import { testTimeout } from '../../../shared/test-utils/timeout-config'
import mongoose from 'mongoose'

describe('User Model', () => {
  // ============================================================================
  // Schema Validation Tests
  // ============================================================================

  describe('Schema Validation', () => {
    it('should create a user with valid required fields', async () => {
      const userData = createUserData()
      const user = await User.create(userData)
      
      expect(user).toBeValidUser()
      expect(user.clerkId).toBe(userData.clerkId)
      expect(user.email).toBe(userData.email)
      expect(user.username).toBe(userData.username)
      expect(user.role).toBe('USER')
      expect(user.isActive).toBe(true)
      expect(user).toHaveMongoFields(['_id', 'createdAt', 'updatedAt'])
    })

    it('should require clerkId field', async () => {
      const userData = createUserData({ clerkId: undefined })
      
      await expect(User.create(userData)).rejects.toThrow('Path `clerkId` is required')
    })

    it('should require email field', async () => {
      const userData = createUserData({ email: undefined })
      
      await expect(User.create(userData)).rejects.toThrow('Path `email` is required')
    })

    it('should require username field', async () => {
      const userData = createUserData({ username: undefined })
      
      await expect(User.create(userData)).rejects.toThrow('Path `username` is required')
    })

    it('should convert email to lowercase', async () => {
      const userData = createUserData({ email: 'TEST@EXAMPLE.COM' })
      const user = await User.create(userData)
      
      expect(user.email).toBe('test@example.com')
    })

    it('should trim whitespace from email and username', async () => {
      const userData = createUserData({ 
        email: '  test@example.com  ',
        username: '  testuser  '
      })
      const user = await User.create(userData)
      
      expect(user.email).toBe('test@example.com')
      expect(user.username).toBe('testuser')
    })

    it('should default role to USER', async () => {
      const userData = createUserData({ role: undefined })
      const user = await User.create(userData)
      
      expect(user.role).toBe('USER')
    })

    it('should validate role enum values', async () => {
      const userData = createUserData({ role: 'INVALID' as any })
      
      await expect(User.create(userData)).rejects.toThrow('`INVALID` is not a valid enum value')
    })

    it('should accept valid role values', async () => {
      for (const role of ['USER', 'ADMIN', 'MODERATOR']) {
        const userData = createUserData({ 
          role: role as any,
          email: `${role.toLowerCase()}@example.com`,
          username: `${role.toLowerCase()}user`,
          clerkId: `clerk_${role}_${Date.now()}`
        })
        const user = await User.create(userData)
        expect(user.role).toBe(role)
      }
    })
  })

  // ============================================================================
  // Unique Constraints Tests
  // ============================================================================

  describe('Unique Constraints', () => {
    it('should enforce unique clerkId', async () => {
      const clerkId = 'clerk_unique_test'
      
      await User.create(createUserData({ 
        clerkId,
        email: 'test1@example.com',
        username: 'testuser1'
      }))
      
      await expect(User.create(createUserData({ 
        clerkId,
        email: 'test2@example.com',
        username: 'testuser2'
      }))).rejects.toThrow()
    })

    it('should enforce unique email', async () => {
      const email = 'duplicate@example.com'
      
      await User.create(createUserData({ 
        email,
        clerkId: 'clerk1',
        username: 'testuser1'
      }))
      
      await expect(User.create(createUserData({ 
        email,
        clerkId: 'clerk2',
        username: 'testuser2'
      }))).rejects.toThrow()
    })

    it('should enforce unique username', async () => {
      const username = 'duplicateuser'
      
      await User.create(createUserData({ 
        username,
        clerkId: 'clerk1',
        email: 'test1@example.com'
      }))
      
      await expect(User.create(createUserData({ 
        username,
        clerkId: 'clerk2',
        email: 'test2@example.com'
      }))).rejects.toThrow()
    })
  })

  // ============================================================================
  // Preferences Validation Tests
  // ============================================================================

  describe('Preferences Validation', () => {
    it('should accept valid key values', async () => {
      const validKeys = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
      
      for (const key of validKeys) {
        const userData = createUserData({ 
          preferences: { defaultKey: key, fontSize: 16, theme: 'light' },
          email: `test-${key}@example.com`,
          username: `testuser-${key}`,
          clerkId: `clerk_${key}_${Date.now()}`
        })
        const user = await User.create(userData)
        expect(user.preferences.defaultKey).toBe(key)
      }
    })

    it('should reject invalid key values', async () => {
      const userData = createUserData({ 
        preferences: { defaultKey: 'H' as any, fontSize: 16, theme: 'light' }
      })
      
      await expect(User.create(userData)).rejects.toThrow('`H` is not a valid enum value')
    })

    it('should default fontSize to 16', async () => {
      const userData = createUserData({ preferences: { theme: 'light' } })
      const user = await User.create(userData)
      
      expect(user.preferences.fontSize).toBe(16)
    })

    it('should validate fontSize min/max values', async () => {
      const userDataMin = createUserData({ 
        preferences: { fontSize: 11, theme: 'light' }
      })
      await expect(User.create(userDataMin)).rejects.toThrow()

      const userDataMax = createUserData({ 
        preferences: { fontSize: 25, theme: 'light' }
      })
      await expect(User.create(userDataMax)).rejects.toThrow()
    })

    it('should accept valid fontSize range', async () => {
      for (const fontSize of [12, 16, 20, 24]) {
        const userData = createUserData({ 
          preferences: { fontSize, theme: 'light' },
          email: `test-font-${fontSize}@example.com`,
          username: `testuser-font-${fontSize}`,
          clerkId: `clerk_font_${fontSize}_${Date.now()}`
        })
        const user = await User.create(userData)
        expect(user.preferences.fontSize).toBe(fontSize)
      }
    })

    it('should default theme to light', async () => {
      const userData = createUserData({ preferences: { fontSize: 16 } })
      const user = await User.create(userData)
      
      expect(user.preferences.theme).toBe('light')
    })

    it('should accept valid theme values', async () => {
      for (const theme of ['light', 'dark', 'stage']) {
        const userData = createUserData({ 
          preferences: { fontSize: 16, theme: theme as any },
          email: `test-${theme}@example.com`,
          username: `testuser-${theme}`,
          clerkId: `clerk_${theme}_${Date.now()}`
        })
        const user = await User.create(userData)
        expect(user.preferences.theme).toBe(theme)
      }
    })

    it('should reject invalid theme values', async () => {
      const userData = createUserData({ 
        preferences: { fontSize: 16, theme: 'rainbow' as any }
      })
      
      await expect(User.create(userData)).rejects.toThrow('`rainbow` is not a valid enum value')
    })
  })

  // ============================================================================
  // Profile Validation Tests
  // ============================================================================

  describe('Profile Validation', () => {
    it('should validate bio maxlength', async () => {
      const userData = createUserData({ 
        profile: { bio: 'x'.repeat(501) }
      })
      
      await expect(User.create(userData)).rejects.toThrow()
    })

    it('should accept valid bio length', async () => {
      const bio = 'This is a valid bio that is under 500 characters.'
      const userData = createUserData({ profile: { bio } })
      const user = await User.create(userData)
      
      expect(user.profile.bio).toBe(bio)
    })

    it('should validate website maxlength', async () => {
      const userData = createUserData({ 
        profile: { website: 'x'.repeat(201) }
      })
      
      await expect(User.create(userData)).rejects.toThrow()
    })

    it('should accept valid website length', async () => {
      const website = 'https://example.com'
      const userData = createUserData({ profile: { website } })
      const user = await User.create(userData)
      
      expect(user.profile.website).toBe(website)
    })

    it('should validate location maxlength', async () => {
      const userData = createUserData({ 
        profile: { location: 'x'.repeat(101) }
      })
      
      await expect(User.create(userData)).rejects.toThrow()
    })

    it('should accept valid location length', async () => {
      const location = 'New York, NY'
      const userData = createUserData({ profile: { location } })
      const user = await User.create(userData)
      
      expect(user.profile.location).toBe(location)
    })
  })

  // ============================================================================
  // Stats Validation Tests
  // ============================================================================

  describe('Stats Validation', () => {
    it('should default stats to zero', async () => {
      const userData = createUserData({ stats: undefined })
      const user = await User.create(userData)
      
      expect(user.stats.songsCreated).toBe(0)
      expect(user.stats.arrangementsCreated).toBe(0)
      expect(user.stats.setlistsCreated).toBe(0)
    })

    it('should enforce minimum value of 0 for stats', async () => {
      const userData = createUserData({ 
        stats: { songsCreated: -1, arrangementsCreated: 0, setlistsCreated: 0 }
      })
      
      await expect(User.create(userData)).rejects.toThrow()
    })

    it('should accept valid stats values', async () => {
      const stats = { songsCreated: 5, arrangementsCreated: 3, setlistsCreated: 2 }
      const userData = createUserData({ stats })
      const user = await User.create(userData)
      
      expect(user.stats).toMatchObject(stats)
    })
  })

  // ============================================================================
  // Instance Methods Tests
  // ============================================================================

  describe('Instance Methods', () => {
    let user: any

    beforeEach(async () => {
      user = await createTestUser()
    })

    it('should increment songsCreated stat', async () => {
      const initialValue = user.stats.songsCreated
      
      await user.incrementStat('songsCreated')
      
      expect(user.stats.songsCreated).toBe(initialValue + 1)
    })

    it('should increment arrangementsCreated stat', async () => {
      const initialValue = user.stats.arrangementsCreated
      
      await user.incrementStat('arrangementsCreated')
      
      expect(user.stats.arrangementsCreated).toBe(initialValue + 1)
    })

    it('should increment setlistsCreated stat', async () => {
      const initialValue = user.stats.setlistsCreated
      
      await user.incrementStat('setlistsCreated')
      
      expect(user.stats.setlistsCreated).toBe(initialValue + 1)
    })

    it('should handle concurrent stat increments', async () => {
      // Simulate concurrent increments
      const promises = Array(10).fill(0).map(() => 
        user.incrementStat('songsCreated')
      )
      
      await Promise.all(promises)
      
      // Reload user from database to get latest state
      await user.reload()
      
      expect(user.stats.songsCreated).toBe(10)
    }, testTimeout('DATABASE')) // Database operations need more time

    it('should update lastLoginAt timestamp', async () => {
      const beforeLogin = new Date()
      
      await user.updateLastLogin()
      
      expect(user.lastLoginAt).toBeInstanceOf(Date)
      expect(user.lastLoginAt.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime())
    })

    it('should update lastLoginAt multiple times', async () => {
      await user.updateLastLogin()
      const firstLogin = user.lastLoginAt
      
      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1))
      
      await user.updateLastLogin()
      const secondLogin = user.lastLoginAt
      
      expect(secondLogin.getTime()).toBeGreaterThan(firstLogin.getTime())
    })
  })

  // ============================================================================
  // Static Methods Tests
  // ============================================================================

  describe('Static Methods', () => {
    it('should find user by clerkId', async () => {
      const userData = createUserData({ clerkId: 'clerk_find_test' })
      const createdUser = await User.create(userData)
      
      const foundUser = await User.findByClerkId('clerk_find_test')
      
      expect(foundUser).toBeTruthy()
      expect(foundUser!.clerkId).toBe(createdUser.clerkId)
      expect(foundUser!.email).toBe(createdUser.email)
    })

    it('should return null for non-existent clerkId', async () => {
      const foundUser = await User.findByClerkId('non_existent_clerk_id')
      
      expect(foundUser).toBeNull()
    })

    it('should find active users', async () => {
      // Create active and inactive users
      await createTestUser({ isActive: true, email: 'active1@test.com', username: 'active1', clerkId: 'clerk_active1' })
      await createTestUser({ isActive: true, email: 'active2@test.com', username: 'active2', clerkId: 'clerk_active2' })
      await createTestUser({ isActive: false, email: 'inactive1@test.com', username: 'inactive1', clerkId: 'clerk_inactive1' })
      
      const activeUsers = await User.findActiveUsers()
      
      expect(activeUsers).toHaveLength(2)
      activeUsers.forEach(user => {
        expect(user.isActive).toBe(true)
      })
    })

    it('should return empty array when no active users exist', async () => {
      await createTestUser({ isActive: false })
      
      const activeUsers = await User.findActiveUsers()
      
      expect(activeUsers).toHaveLength(0)
    })
  })

  // ============================================================================
  // Index Tests
  // ============================================================================

  describe('Database Indexes', () => {
    it('should have index on clerkId', async () => {
      const indexes = await User.collection.getIndexes()
      
      const clerkIdIndex = Object.keys(indexes).find(indexName => 
        indexes[indexName].some((field: any) => field[0] === 'clerkId')
      )
      
      expect(clerkIdIndex).toBeDefined()
    })

    it('should have index on email', async () => {
      const indexes = await User.collection.getIndexes()
      
      const emailIndex = Object.keys(indexes).find(indexName => 
        indexes[indexName].some((field: any) => field[0] === 'email')
      )
      
      expect(emailIndex).toBeDefined()
    })

    it('should have index on username', async () => {
      const indexes = await User.collection.getIndexes()
      
      const usernameIndex = Object.keys(indexes).find(indexName => 
        indexes[indexName].some((field: any) => field[0] === 'username')
      )
      
      expect(usernameIndex).toBeDefined()
    })

    it('should have index on isActive', async () => {
      const indexes = await User.collection.getIndexes()
      
      const isActiveIndex = Object.keys(indexes).find(indexName => 
        indexes[indexName].some((field: any) => field[0] === 'isActive')
      )
      
      expect(isActiveIndex).toBeDefined()
    })

    it('should have index on role', async () => {
      const indexes = await User.collection.getIndexes()
      
      const roleIndex = Object.keys(indexes).find(indexName => 
        indexes[indexName].some((field: any) => field[0] === 'role')
      )
      
      expect(roleIndex).toBeDefined()
    })
  })

  // ============================================================================
  // JSON Transformation Tests
  // ============================================================================

  describe('JSON Transformation', () => {
    it('should transform _id to id in JSON output', async () => {
      const user = await createTestUser()
      const userJson = user.toJSON()
      
      expect(userJson.id).toBeDefined()
      expect(userJson._id).toBeUndefined()
      expect(userJson.__v).toBeUndefined()
    })

    it('should include virtuals in JSON output', async () => {
      const user = await createTestUser()
      const userJson = user.toJSON()
      
      expect(userJson.id).toBeValidObjectId()
    })
  })
})