import { Request, Response } from 'express'
import { catchAsync } from '../../shared/utils/catchAsync'

/**
 * Placeholder webhook controller
 * In a React app with Clerk, webhooks are not needed
 * User sync happens on the frontend
 */
export const handleClerkWebhook = catchAsync(async (
  _req: Request,
  res: Response
) => {
  // This endpoint exists for compatibility but doesn't process webhooks
  // User management is handled by Clerk on the frontend
  
  res.status(200).json({
    success: true,
    message: 'Webhook endpoint (not used in React setup)'
  })
})