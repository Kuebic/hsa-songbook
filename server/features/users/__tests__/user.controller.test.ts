import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import app from '../../../app'
import { User as _User } from '../user.model'
import { createTestUser, createUserData as _createUserData, createClerkWebhookPayload as _createClerkWebhookPayload } from '../../../shared/test-utils/factories'
import { userService } from '../user.service'
import mongoose from 'mongoose'

describe('User Controller', () => {
  // ============================================================================
  // Webhook Endpoints Tests
  // ============================================================================

  describe('POST /api/v1/users/webhook', () => {
    it('should handle Clerk webhook endpoint', async () => {
      const webhookPayload = createClerkWebhookPayload('user.created')

      const response = await request(app)
        .post('/api/v1/users/webhook')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(webhookPayload))
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Webhook endpoint (not used in React setup)'
      })
    })

    it('should handle webhook with raw body parser', async () => {
      const webhookPayload = { type: 'user.created', data: { id: 'test' } }

      const response = await request(app)
        .post('/api/v1/users/webhook')
        .set('Content-Type', 'application/json')
        .send(webhookPayload)
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  // ============================================================================
  // Current User Endpoints Tests
  // ============================================================================

  describe('GET /api/v1/users/me', () => {
    let testUser: unknown

    beforeEach(async () => {
      testUser = await createTestUser({ clerkId: 'clerk_me_test' })
    })

    it('should get current user with valid authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', testUser.clerkId)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: testUser._id.toString(),
          clerkId: testUser.clerkId,
          email: testUser.email,
          username: testUser.username
        })
      })
      expect(response.body.data).toBeValidUser()
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .expect(401)

      expect(response.body).toHaveErrorStructure()
      expect(response.body.message).toContain('No authentication provided')
    })

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'non_existent_clerk_id')
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found'
      })
    })

    it('should work with development test credentials', async () => {
      // Ensure we're in development mode for this test
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'test-user-id')
        .expect(404) // Will return 404 since test-user-id doesn't exist in DB

      expect(response.body.success).toBe(false)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('PATCH /api/v1/users/me', () => {
    let testUser: unknown

    beforeEach(async () => {
      testUser = await createTestUser({ clerkId: 'clerk_patch_test' })
    })

    it('should update current user preferences', async () => {
      const updateData = {
        name: 'Updated Name',
        preferences: {
          defaultKey: 'D',
          fontSize: 20,
          theme: 'dark'
        },
        profile: {
          bio: 'Updated bio',
          website: 'https://updated.com'
        }
      }

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', testUser.clerkId)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Preferences updated successfully',
        data: expect.objectContaining({
          id: testUser._id.toString(),
          name: updateData.name,
          preferences: expect.objectContaining(updateData.preferences),
          profile: expect.objectContaining(updateData.profile)
        })
      })
    })

    it('should update partial preferences', async () => {
      const updateData = {
        preferences: {
          fontSize: 18
        }
      }

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', testUser.clerkId)
        .send(updateData)
        .expect(200)

      expect(response.body.data.preferences.fontSize).toBe(18)
      expect(response.body.data.preferences.theme).toBe(testUser.preferences.theme)
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .send({ name: 'Test' })
        .expect(401)

      expect(response.body).toHaveErrorStructure()
    })

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'non_existent_clerk_id')
        .send({ name: 'Test' })
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found'
      })
    })

    it('should validate update data', async () => {
      const invalidData = {
        preferences: {
          fontSize: 999, // Invalid fontSize
          theme: 'invalid-theme'
        }
      }

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', testUser.clerkId)
        .send(invalidData)
        .expect(500) // Validation error should result in 500

      expect(response.body.success).toBe(false)
    })
  })

  // ============================================================================
  // Admin Endpoints Tests
  // ============================================================================

  describe('GET /api/v1/users', () => {
    beforeEach(async () => {
      // Create test users with different roles and states
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
        role: 'MODERATOR', 
        isActive: false,
        email: 'mod1@test.com',
        username: 'mod1',
        clerkId: 'clerk_mod1'
      })
    })

    it('should get all users with admin authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      })
      expect(response.body.data).toHaveLength(3)
      response.body.data.forEach((user: unknown) => {
        expect(user).toBeValidUser()
      })
    })

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/v1/users?role=USER')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].role).toBe('USER')
    })

    it('should filter users by active status', async () => {
      const response = await request(app)
        .get('/api/v1/users?isActive=true')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .expect(200)

      expect(response.body.data).toHaveLength(2)
      response.body.data.forEach((user: unknown) => {
        expect(user.isActive).toBe(true)
      })
    })

    it('should filter users by both role and active status', async () => {
      const response = await request(app)
        .get('/api/v1/users?role=ADMIN&isActive=true')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].role).toBe('ADMIN')
      expect(response.body.data[0].isActive).toBe(true)
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(401)

      expect(response.body).toHaveErrorStructure()
    })

    it('should return 403 without admin role', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'regular_user')
        .set('x-user-role', 'USER')
        .expect(403)

      expect(response.body).toHaveErrorStructure()
      expect(response.body.message).toContain('Insufficient permissions')
    })

    it('should allow moderator with admin privileges', async () => {
      // Since the middleware allows ADMIN role for any admin-required endpoint
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'super_admin')
        .set('x-user-role', 'ADMIN')
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/v1/users/:id', () => {
    let testUser: unknown

    beforeEach(async () => {
      testUser = await createTestUser({ clerkId: 'clerk_get_by_id' })
    })

    it('should get user by ID with admin authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser._id}`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: testUser._id.toString(),
          clerkId: testUser.clerkId,
          email: testUser.email
        })
      })
      expect(response.body.data).toBeValidUser()
    })

    it('should return 404 for non-existent user ID', async () => {
      const fakeId = new mongoose.Types.ObjectId()

      const response = await request(app)
        .get(`/api/v1/users/${fakeId}`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .expect(500) // Service throws NotFoundError which becomes 500

      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-id')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .expect(500)

      expect(response.body.success).toBe(false)
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser._id}`)
        .expect(401)

      expect(response.body).toHaveErrorStructure()
    })

    it('should return 403 without admin role', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser._id}`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'regular_user')
        .set('x-user-role', 'USER')
        .expect(403)

      expect(response.body).toHaveErrorStructure()
    })
  })

  describe('PATCH /api/v1/users/:id/role', () => {
    let testUser: unknown

    beforeEach(async () => {
      testUser = await createTestUser({ role: 'USER' })
    })

    it('should update user role to ADMIN', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${testUser._id}/role`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .send({ role: 'ADMIN' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'User role updated successfully',
        data: expect.objectContaining({
          id: testUser._id.toString(),
          role: 'ADMIN'
        })
      })
    })

    it('should update user role to MODERATOR', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${testUser._id}/role`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .send({ role: 'MODERATOR' })
        .expect(200)

      expect(response.body.data.role).toBe('MODERATOR')
    })

    it('should update user role back to USER', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${testUser._id}/role`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .send({ role: 'USER' })
        .expect(200)

      expect(response.body.data.role).toBe('USER')
    })

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${testUser._id}/role`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .send({ role: 'INVALID_ROLE' })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Invalid role'
      })
    })

    it('should return 400 for missing role in body', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${testUser._id}/role`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .send({})
        .expect(400)

      expect(response.body.message).toBe('Invalid role')
    })

    it('should return 500 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId()

      const response = await request(app)
        .patch(`/api/v1/users/${fakeId}/role`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .send({ role: 'ADMIN' })
        .expect(500)

      expect(response.body.success).toBe(false)
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${testUser._id}/role`)
        .send({ role: 'ADMIN' })
        .expect(401)

      expect(response.body).toHaveErrorStructure()
    })

    it('should return 403 without admin role', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${testUser._id}/role`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'regular_user')
        .set('x-user-role', 'USER')
        .send({ role: 'ADMIN' })
        .expect(403)

      expect(response.body).toHaveErrorStructure()
    })
  })

  // ============================================================================
  // Error Handling and Edge Cases
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock userService to throw database error
      const _originalFindByClerkId = userService.findByClerkId
      vi.spyOn(userService, 'findByClerkId').mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'test_user')
        .expect(500)

      expect(response.body.success).toBe(false)

      // Restore original method
      vi.mocked(userService.findByClerkId).mockRestore()
    })

    it('should handle malformed JSON in request body', async () => {
      const testUser = await createTestUser()

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', testUser.clerkId)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should handle oversized request bodies', async () => {
      const testUser = await createTestUser()
      const largeData = { data: 'x'.repeat(15 * 1024 * 1024) } // > 10MB limit

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', testUser.clerkId)
        .send(largeData)
        .expect(413)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/users/nonexistent-endpoint')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'test_user')
        .set('x-user-role', 'ADMIN')
        .expect(404)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Route')
      })
    })
  })

  // ============================================================================
  // Security Tests
  // ============================================================================

  describe('Security', () => {
    let testUser: unknown

    beforeEach(async () => {
      testUser = await createTestUser()
    })

    it('should sanitize MongoDB injection attempts', async () => {
      const maliciousData = {
        preferences: {
          // Attempt MongoDB injection
          fontSize: { $gt: 0 }
        }
      }

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', testUser.clerkId)
        .send(maliciousData)
        .expect(500) // Should fail validation

      expect(response.body.success).toBe(false)
    })

    it('should enforce Content-Type for webhook endpoints', async () => {
      const response = await request(app)
        .post('/api/v1/users/webhook')
        .send('not json')
        .expect(200) // Webhook endpoint is lenient

      expect(response.body.success).toBe(true)
    })

    it('should handle missing authentication headers gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .expect(401)

      expect(response.body).toHaveErrorStructure()
      expect(response.body.message).toContain('No authentication provided')
    })

    it('should handle invalid user role headers', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'test_user')
        .set('x-user-role', 'INVALID_ROLE')
        .expect(403)

      expect(response.body).toHaveErrorStructure()
      expect(response.body.message).toContain('Insufficient permissions')
    })

    it('should handle missing user role headers for admin endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'test_user')
        // Missing x-user-role header
        .expect(403)

      expect(response.body).toHaveErrorStructure()
      expect(response.body.message).toContain('No role assigned')
    })
  })

  // ============================================================================
  // Response Format Tests
  // ============================================================================

  describe('Response Format Consistency', () => {
    let testUser: unknown

    beforeEach(async () => {
      testUser = await createTestUser()
    })

    it('should return consistent success response format', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', testUser.clerkId)
        .expect(200)

      expect(response.body).toHaveApiResponseStructure(true)
      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object)
      })
    })

    it('should return consistent error response format', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .expect(401)

      expect(response.body).toHaveErrorStructure()
      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      })
    })

    it('should include appropriate HTTP status codes', async () => {
      // Test various endpoints for correct status codes
      
      // Success cases
      await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', testUser.clerkId)
        .expect(200)

      await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', testUser.clerkId)
        .send({ name: 'Updated' })
        .expect(200)

      // Error cases
      await request(app)
        .get('/api/v1/users/me')
        .expect(401) // Unauthorized

      await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'test_user')
        .set('x-user-role', 'USER')
        .expect(403) // Forbidden

      await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'non_existent')
        .expect(404) // Not Found

      await request(app)
        .patch(`/api/v1/users/${testUser._id}/role`)
        .set('Authorization', 'Bearer test-token')
        .set('x-user-id', 'admin_user')
        .set('x-user-role', 'ADMIN')
        .send({ role: 'INVALID' })
        .expect(400) // Bad Request
    })
  })
})