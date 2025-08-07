import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError, ForbiddenError } from '../utils/errors'
import config from '../config/env'

export interface AuthRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  auth?: {
    userId: string
    sessionId?: string
    sessionClaims?: any
  }
}

/**
 * Middleware to require authentication
 * For React apps with Clerk, we accept the user ID from the frontend
 * The frontend handles actual authentication with Clerk
 */
export const requireAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get user ID from header (sent by frontend after Clerk auth)
    const userId = req.headers['x-user-id'] as string
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    // In development, allow test credentials
    if (config.nodeEnv === 'development') {
      if (token === 'test-token' || userId === 'test-user-id') {
        req.auth = {
          userId: userId || 'test-user-id',
          sessionId: 'test-session-id',
          sessionClaims: { role: 'USER' }
        }
        return next()
      }
    }
    
    // For production, just check that a user ID is provided
    // The frontend handles actual authentication with Clerk
    if (!userId && !token) {
      throw new UnauthorizedError('No authentication provided')
    }

    req.auth = {
      userId: userId || 'anonymous',
      sessionId: `session-${userId || 'anonymous'}`
    }
    
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware to optionally parse authentication
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    // In development, allow test credentials
    if (config.nodeEnv === 'development' && (token === 'test-token' || userId === 'test-user-id')) {
      req.auth = {
        userId: userId || 'test-user-id',
        sessionId: 'test-session-id',
        sessionClaims: { role: 'USER' }
      }
      return next()
    }
    
    // If user ID is provided, set auth
    if (userId) {
      req.auth = {
        userId,
        sessionId: `session-${userId}`
      }
    }
    
    next()
  } catch (error) {
    // Optional auth should never fail
    next()
  }
}

/**
 * Middleware to require a specific role
 * Roles are checked on the frontend and passed via headers
 */
export const requireRole = (role: string) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new UnauthorizedError('Authentication required'))
    }

    // Get role from header (set by frontend after Clerk check)
    const userRole = req.headers['x-user-role'] as string

    // In development, allow test user to have any role
    if (config.nodeEnv === 'development' && req.auth.userId === 'test-user-id') {
      return next()
    }

    if (!userRole) {
      return next(new ForbiddenError('No role assigned'))
    }

    if (userRole !== role && userRole !== 'ADMIN') {
      return next(new ForbiddenError('Insufficient permissions'))
    }

    next()
  }
}

/**
 * Middleware to require specific permission
 * Permissions are checked on the frontend and passed via headers
 */
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new UnauthorizedError('Authentication required'))
    }

    // Get permissions from header (comma-separated list)
    const permissionsHeader = req.headers['x-user-permissions'] as string
    const permissions = permissionsHeader ? permissionsHeader.split(',') : []
    const userRole = req.headers['x-user-role'] as string

    // In development, allow test user to have any permission
    if (config.nodeEnv === 'development' && req.auth.userId === 'test-user-id') {
      return next()
    }

    if (!permissions.includes(permission) && userRole !== 'ADMIN') {
      return next(new ForbiddenError(`Missing permission: ${permission}`))
    }

    next()
  }
}