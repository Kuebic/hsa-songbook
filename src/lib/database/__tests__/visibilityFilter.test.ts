/**
 * Unit tests for visibility filtering logic
 * Tests different user permission scenarios and visibility rules
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  forPublicUser,
  forAuthenticatedUser,
  forModerator,
  applyFilter,
  isRecordVisible,
  buildVisibilitySQL,
  createClientFilter,
  type UserPermissions
} from '../visibilityFilter'

describe('visibilityFilter', () => {
  let mockQuery: {
    eq: ReturnType<typeof vi.fn>
    or: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockQuery = {
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
    }
  })

  describe('forPublicUser', () => {
    it('should filter for public records only', () => {
      const result = forPublicUser(mockQuery)

      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
      expect(mockQuery.or).toHaveBeenCalledWith('moderation_status.is.null,moderation_status.in.(approved,pending,flagged)')
      expect(result).toBe(mockQuery)
    })

    it('should return modified query object', () => {
      const result = forPublicUser(mockQuery)
      expect(result).toBe(mockQuery)
    })
  })

  describe('forAuthenticatedUser', () => {
    it('should filter for public records and user-owned records', () => {
      const userId = 'user123'
      const result = forAuthenticatedUser(mockQuery, userId)

      expect(mockQuery.or).toHaveBeenCalledWith(
        `and(is_public.neq.false,or(moderation_status.is.null,moderation_status.in.(approved,pending,flagged))),created_by.eq.user123`
      )
      expect(result).toBe(mockQuery)
    })

    it('should sanitize userId to prevent SQL injection', () => {
      const maliciousUserId = "user123'; DROP TABLE songs; --"
      const sanitizedUserId = "user123''; DROP TABLE songs; --"
      
      forAuthenticatedUser(mockQuery, maliciousUserId)

      expect(mockQuery.or).toHaveBeenCalledWith(
        `and(is_public.neq.false,or(moderation_status.is.null,moderation_status.in.(approved,pending,flagged))),created_by.eq.${sanitizedUserId}`
      )
    })

    it('should handle userId with single quotes', () => {
      const userIdWithQuotes = "user'test'123"
      const expected = "user''test''123"
      
      forAuthenticatedUser(mockQuery, userIdWithQuotes)

      expect(mockQuery.or).toHaveBeenCalledWith(
        `and(is_public.neq.false,or(moderation_status.is.null,moderation_status.in.(approved,pending,flagged))),created_by.eq.${expected}`
      )
    })

    it('should handle empty userId', () => {
      const result = forAuthenticatedUser(mockQuery, '')

      expect(mockQuery.or).toHaveBeenCalledWith(
        `and(is_public.neq.false,or(moderation_status.is.null,moderation_status.in.(approved,pending,flagged))),created_by.eq.`
      )
      expect(result).toBe(mockQuery)
    })
  })

  describe('forModerator', () => {
    it('should return unmodified query for moderators', () => {
      const result = forModerator(mockQuery)

      expect(mockQuery.eq).not.toHaveBeenCalled()
      expect(mockQuery.or).not.toHaveBeenCalled()
      expect(result).toBe(mockQuery)
    })
  })

  describe('applyFilter', () => {
    it('should apply moderator filter for users with canModerate', () => {
      const permissions: UserPermissions = {
        userId: 'user123',
        roles: ['moderator'],
        canModerate: true,
        canAdmin: false
      }

      const result = applyFilter(mockQuery, permissions)

      expect(mockQuery.eq).not.toHaveBeenCalled()
      expect(mockQuery.or).not.toHaveBeenCalled()
      expect(result).toBe(mockQuery)
    })

    it('should apply moderator filter for users with canAdmin', () => {
      const permissions: UserPermissions = {
        userId: 'user123',
        roles: ['admin'],
        canModerate: false,
        canAdmin: true
      }

      const result = applyFilter(mockQuery, permissions)

      expect(mockQuery.eq).not.toHaveBeenCalled()
      expect(mockQuery.or).not.toHaveBeenCalled()
      expect(result).toBe(mockQuery)
    })

    it('should apply authenticated user filter for regular users', () => {
      const permissions: UserPermissions = {
        userId: 'user123',
        roles: ['user'],
        canModerate: false,
        canAdmin: false
      }

      applyFilter(mockQuery, permissions)

      expect(mockQuery.or).toHaveBeenCalledWith(
        `and(is_public.neq.false,or(moderation_status.is.null,moderation_status.in.(approved,pending,flagged))),created_by.eq.user123`
      )
    })

    it('should apply public user filter for anonymous users', () => {
      const permissions: UserPermissions = {
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      applyFilter(mockQuery, permissions)

      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
      expect(mockQuery.or).toHaveBeenCalledWith('moderation_status.is.null,moderation_status.in.(approved,pending,flagged)')
    })

    it('should handle user with empty userId as anonymous', () => {
      const permissions: UserPermissions = {
        userId: '',
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      applyFilter(mockQuery, permissions)

      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
    })
  })

  describe('isRecordVisible', () => {
    const publicApprovedRecord = {
      is_public: true,
      moderation_status: 'approved',
      created_by: 'other_user'
    }

    const publicPendingRecord = {
      is_public: true,
      moderation_status: 'pending',
      created_by: 'other_user'
    }

    const publicRejectedRecord = {
      is_public: true,
      moderation_status: 'rejected',
      created_by: 'other_user'
    }

    const privateRecord = {
      is_public: false,
      moderation_status: 'approved',
      created_by: 'other_user'
    }

    const userOwnedRecord = {
      is_public: false,
      moderation_status: 'rejected',
      created_by: 'user123'
    }

    describe('for moderators', () => {
      const moderatorPermissions: UserPermissions = {
        userId: 'mod123',
        roles: ['moderator'],
        canModerate: true,
        canAdmin: false
      }

      it('should see all records', () => {
        expect(isRecordVisible(publicApprovedRecord, moderatorPermissions)).toBe(true)
        expect(isRecordVisible(publicRejectedRecord, moderatorPermissions)).toBe(true)
        expect(isRecordVisible(privateRecord, moderatorPermissions)).toBe(true)
        expect(isRecordVisible(userOwnedRecord, moderatorPermissions)).toBe(true)
      })
    })

    describe('for admins', () => {
      const adminPermissions: UserPermissions = {
        userId: 'admin123',
        roles: ['admin'],
        canModerate: false,
        canAdmin: true
      }

      it('should see all records', () => {
        expect(isRecordVisible(publicApprovedRecord, adminPermissions)).toBe(true)
        expect(isRecordVisible(publicRejectedRecord, adminPermissions)).toBe(true)
        expect(isRecordVisible(privateRecord, adminPermissions)).toBe(true)
        expect(isRecordVisible(userOwnedRecord, adminPermissions)).toBe(true)
      })
    })

    describe('for authenticated users', () => {
      const userPermissions: UserPermissions = {
        userId: 'user123',
        roles: ['user'],
        canModerate: false,
        canAdmin: false
      }

      it('should see public approved records', () => {
        expect(isRecordVisible(publicApprovedRecord, userPermissions)).toBe(true)
      })

      it('should see public pending records', () => {
        expect(isRecordVisible(publicPendingRecord, userPermissions)).toBe(true)
      })

      it('should see public records with null moderation status', () => {
        const nullStatusRecord = { ...publicApprovedRecord, moderation_status: null }
        expect(isRecordVisible(nullStatusRecord, userPermissions)).toBe(true)
      })

      it('should not see public rejected records', () => {
        expect(isRecordVisible(publicRejectedRecord, userPermissions)).toBe(false)
      })

      it('should not see private records from others', () => {
        expect(isRecordVisible(privateRecord, userPermissions)).toBe(false)
      })

      it('should see own records regardless of status', () => {
        expect(isRecordVisible(userOwnedRecord, userPermissions)).toBe(true)
      })

      it('should see own private records', () => {
        const ownPrivateRecord = { ...privateRecord, created_by: 'user123' }
        expect(isRecordVisible(ownPrivateRecord, userPermissions)).toBe(true)
      })
    })

    describe('for anonymous users', () => {
      const anonymousPermissions: UserPermissions = {
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      it('should see public approved records', () => {
        expect(isRecordVisible(publicApprovedRecord, anonymousPermissions)).toBe(true)
      })

      it('should see public pending records', () => {
        expect(isRecordVisible(publicPendingRecord, anonymousPermissions)).toBe(true)
      })

      it('should see public records with null moderation status', () => {
        const nullStatusRecord = { ...publicApprovedRecord, moderation_status: null }
        expect(isRecordVisible(nullStatusRecord, anonymousPermissions)).toBe(true)
      })

      it('should not see public rejected records', () => {
        expect(isRecordVisible(publicRejectedRecord, anonymousPermissions)).toBe(false)
      })

      it('should not see private records', () => {
        expect(isRecordVisible(privateRecord, anonymousPermissions)).toBe(false)
      })

      it('should not see user-owned private records', () => {
        expect(isRecordVisible(userOwnedRecord, anonymousPermissions)).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle records with null is_public as visible', () => {
        const record = { is_public: null, moderation_status: 'approved', created_by: 'other' }
        const anonymousPermissions: UserPermissions = { roles: [], canModerate: false, canAdmin: false }

        // null is_public should be treated as truthy (visible)
        expect(isRecordVisible(record, anonymousPermissions)).toBe(true)
      })

      it('should handle records with undefined fields', () => {
        const record = {}
        const anonymousPermissions: UserPermissions = { roles: [], canModerate: false, canAdmin: false }

        // Records with undefined fields are treated as public (truthy)
        expect(isRecordVisible(record, anonymousPermissions)).toBe(true)
      })

      it('should handle records with explicit false is_public', () => {
        const record = { is_public: false, moderation_status: null, created_by: null }
        const userPermissions: UserPermissions = { userId: 'user123', roles: [], canModerate: false, canAdmin: false }

        expect(isRecordVisible(record, userPermissions)).toBe(false)
      })
    })
  })

  describe('buildVisibilitySQL', () => {
    it('should return no filtering for moderators', () => {
      const permissions: UserPermissions = {
        userId: 'mod123',
        roles: ['moderator'],
        canModerate: true,
        canAdmin: false
      }

      const sql = buildVisibilitySQL(permissions)
      expect(sql).toBe('1=1')
    })

    it('should return no filtering for admins', () => {
      const permissions: UserPermissions = {
        userId: 'admin123',
        roles: ['admin'],
        canModerate: false,
        canAdmin: true
      }

      const sql = buildVisibilitySQL(permissions)
      expect(sql).toBe('1=1')
    })

    it('should return authenticated user SQL filter', () => {
      const permissions: UserPermissions = {
        userId: 'user123',
        roles: ['user'],
        canModerate: false,
        canAdmin: false
      }

      const sql = buildVisibilitySQL(permissions)
      const expected = `(
      (is_public != false AND (moderation_status IS NULL OR moderation_status IN ('approved', 'pending', 'flagged')))
      OR created_by = 'user123'
    )`

      expect(sql).toBe(expected)
    })

    it('should return public user SQL filter', () => {
      const permissions: UserPermissions = {
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      const sql = buildVisibilitySQL(permissions)
      const expected = `(
    is_public = true 
    AND (moderation_status IS NULL OR moderation_status IN ('approved', 'pending', 'flagged'))
  )`

      expect(sql).toBe(expected)
    })

    it('should sanitize userId in SQL', () => {
      const permissions: UserPermissions = {
        userId: "user'test'123",
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      const sql = buildVisibilitySQL(permissions)
      expect(sql).toContain("created_by = 'user''test''123'")
    })
  })

  describe('createClientFilter', () => {
    it('should create a filter function for moderators', () => {
      const permissions: UserPermissions = {
        userId: 'mod123',
        roles: ['moderator'],
        canModerate: true,
        canAdmin: false
      }

      const filter = createClientFilter(permissions)
      
      // Should return true for any record
      const publicRecord = { is_public: true, moderation_status: 'approved', created_by: 'other' }
      const rejectedRecord = { is_public: true, moderation_status: 'rejected', created_by: 'other' }
      
      expect(filter(publicRecord)).toBe(true)
      expect(filter(rejectedRecord)).toBe(true)
    })

    it('should create a filter function for authenticated users', () => {
      const permissions: UserPermissions = {
        userId: 'user123',
        roles: ['user'],
        canModerate: false,
        canAdmin: false
      }

      const filter = createClientFilter(permissions)

      // Should filter based on visibility rules
      const publicRecord = { is_public: true, moderation_status: 'approved', created_by: 'other' }
      const rejectedRecord = { is_public: true, moderation_status: 'rejected', created_by: 'other' }
      const ownRecord = { is_public: false, moderation_status: 'rejected', created_by: 'user123' }

      expect(filter(publicRecord)).toBe(true)
      expect(filter(rejectedRecord)).toBe(false)
      expect(filter(ownRecord)).toBe(true)
    })

    it('should create a filter function for anonymous users', () => {
      const permissions: UserPermissions = {
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      const filter = createClientFilter(permissions)

      const publicRecord = { is_public: true, moderation_status: 'approved', created_by: 'other' }
      const rejectedRecord = { is_public: true, moderation_status: 'rejected', created_by: 'other' }
      const privateRecord = { is_public: false, moderation_status: 'approved', created_by: 'other' }

      expect(filter(publicRecord)).toBe(true)
      expect(filter(rejectedRecord)).toBe(false)
      expect(filter(privateRecord)).toBe(false)
    })

    it('should return a function that can be used with array filter', () => {
      const permissions: UserPermissions = {
        roles: [],
        canModerate: false,
        canAdmin: false
      }

      const filter = createClientFilter(permissions)
      const records = [
        { is_public: true, moderation_status: 'approved', created_by: 'user1' },
        { is_public: true, moderation_status: 'rejected', created_by: 'user2' },
        { is_public: false, moderation_status: 'approved', created_by: 'user3' },
        { is_public: true, moderation_status: 'pending', created_by: 'user4' }
      ]

      const filtered = records.filter(filter)

      expect(filtered).toHaveLength(2)
      expect(filtered[0].created_by).toBe('user1')
      expect(filtered[1].created_by).toBe('user4')
    })
  })
})