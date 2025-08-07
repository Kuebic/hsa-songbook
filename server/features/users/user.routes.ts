import { Router } from 'express'
import express from 'express'
import { requireAuth, requireRole } from '../../shared/middleware/auth'
import { handleClerkWebhook } from './webhook.controller'
import { userService } from './user.service'
import { catchAsync } from '../../shared/utils/catchAsync'
import { AuthRequest } from '../../shared/middleware/auth'

const router = Router()

// Webhook route - MUST use raw body for signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleClerkWebhook
)

// Get current user
router.get(
  '/me',
  requireAuth,
  catchAsync(async (req: AuthRequest, res) => {
    const user = await userService.findByClerkId(req.auth!.userId)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: user
    })
  })
)

// Update current user preferences
router.patch(
  '/me',
  requireAuth,
  catchAsync(async (req: AuthRequest, res) => {
    const user = await userService.findByClerkId(req.auth!.userId)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const updated = await userService.update(user.id, req.body)

    res.json({
      success: true,
      data: updated,
      message: 'Preferences updated successfully'
    })
  })
)

// Admin routes

// Get all users
router.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(async (req, res) => {
    const users = await userService.findAll(req.query as any)

    res.json({
      success: true,
      data: users
    })
  })
)

// Get user by ID
router.get(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(async (req, res) => {
    const user = await userService.findById(req.params.id)

    res.json({
      success: true,
      data: user
    })
  })
)

// Update user role
router.patch(
  '/:id/role',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(async (req, res) => {
    const { role } = req.body

    if (!['USER', 'ADMIN', 'MODERATOR'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      })
    }

    const user = await userService.updateRole(req.params.id, role)

    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully'
    })
  })
)

export default router