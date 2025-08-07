import { Request, Response } from 'express'
import { Webhook } from 'svix'
import { userService } from './user.service'
import { catchAsync } from '../../shared/utils/catchAsync'
import config from '../../shared/config/env'
import { createLogger } from '../../shared/services/logger'

const logger = createLogger('WebhookController')

interface ClerkWebhookEvent {
  data: any
  object: string
  type: string
}

/**
 * Handle Clerk webhook events
 */
export const handleClerkWebhook = catchAsync(async (
  req: Request,
  res: Response
) => {
  // Verify webhook signature
  const webhookSecret = config.clerkWebhookSecret
  
  if (!webhookSecret) {
    logger.error('CLERK_WEBHOOK_SECRET not set')
    return res.status(500).json({
      success: false,
      message: 'Webhook secret not configured'
    })
  }

  // Get Svix headers
  const svixId = req.headers['svix-id'] as string
  const svixTimestamp = req.headers['svix-timestamp'] as string
  const svixSignature = req.headers['svix-signature'] as string

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({
      success: false,
      message: 'Missing svix headers'
    })
  }

  // Get raw body (required for signature verification)
  const payload = req.body

  // Verify webhook
  const wh = new Webhook(webhookSecret)
  let evt: ClerkWebhookEvent

  try {
    evt = wh.verify(JSON.stringify(payload), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch (err) {
    logger.error('Webhook verification failed', err as Error)
    return res.status(400).json({
      success: false,
      message: 'Invalid webhook signature'
    })
  }

  // Handle the event
  const { type, data } = evt

  logger.info('Received Clerk webhook', { type, userId: data.id })

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(data)
        break

      case 'user.updated':
        await handleUserUpdated(data)
        break

      case 'user.deleted':
        await handleUserDeleted(data)
        break

      case 'session.created':
        await handleSessionCreated(data)
        break

      default:
        logger.debug('Unhandled webhook event type', { type })
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    })
  } catch (error) {
    logger.error(`Error handling webhook ${type}`, error as Error, { type, data })
    res.status(500).json({
      success: false,
      message: 'Error processing webhook'
    })
  }
})

/**
 * Handle user.created event
 */
async function handleUserCreated(data: any) {
  const userData = {
    clerkId: data.id,
    email: data.email_addresses[0]?.email_address,
    username: data.username || data.email_addresses[0]?.email_address.split('@')[0],
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || undefined,
    profileImageUrl: data.profile_image_url
  }

  await userService.createFromClerk(userData)
  logger.info('User created from Clerk webhook', { 
    clerkId: userData.clerkId,
    email: userData.email 
  })
}

/**
 * Handle user.updated event
 */
async function handleUserUpdated(data: any) {
  const userData = {
    email: data.email_addresses[0]?.email_address,
    username: data.username,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || undefined,
    profileImageUrl: data.profile_image_url
  }

  await userService.updateFromClerk(data.id, userData)
  logger.info('User updated from Clerk webhook', { clerkId: data.id })
}

/**
 * Handle user.deleted event
 */
async function handleUserDeleted(data: any) {
  await userService.deleteFromClerk(data.id)
  logger.info('User deleted from Clerk webhook', { clerkId: data.id })
}

/**
 * Handle session.created event (update last login)
 */
async function handleSessionCreated(data: any) {
  if (data.user_id) {
    await userService.updateLastLogin(data.user_id)
    logger.debug('User login recorded', { clerkId: data.user_id })
  }
}