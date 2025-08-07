import { Request, Response, NextFunction } from 'express'
import { clerkClient, verifyToken } from '@clerk/clerk-sdk-node'
import { UnauthorizedError, ForbiddenError } from '../utils/errors'
import config from '../config/env'

export interface AuthRequest extends Request {
  auth?: {
    userId: string
    sessionId?: string
    sessionClaims?: any
  }
}

/**
 * Middleware to require authentication
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      throw new UnauthorizedError('No authentication token provided')
    }

    // In development, allow a test token for easier testing
    if (config.nodeEnv === 'development' && token === 'test-token') {
      req.auth = {
        userId: 'test-user-id',
        sessionId: 'test-session-id',
        sessionClaims: { role: 'USER' }
      }
      return next()
    }

    // Verify the token with Clerk
    const payload = await verifyToken(token, {
      secretKey: config.clerkSecretKey
    })

    req.auth = {
      userId: payload.sub,
      sessionId: payload.sid,
      sessionClaims: payload
    }

    next()
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'))
  }
}

/**
 * Middleware to optionally parse authentication
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return next()
    }

    const payload = await verifyToken(token, {
      secretKey: config.clerkSecretKey
    })

    req.auth = {
      userId: payload.sub,
      sessionId: payload.sid,
      sessionClaims: payload
    }

    next()
  } catch (error) {
    // Invalid token, but continue without auth
    next()
  }
}

/**
 * Middleware to require a specific role
 */
export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new UnauthorizedError('Authentication required'))
    }

    const userRole = req.auth.sessionClaims?.metadata?.role

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
 */
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new UnauthorizedError('Authentication required'))
    }

    const permissions = req.auth.sessionClaims?.metadata?.permissions || []

    if (!permissions.includes(permission) && req.auth.sessionClaims?.metadata?.role !== 'ADMIN') {
      return next(new ForbiddenError(`Missing permission: ${permission}`))
    }

    next()
  }
}