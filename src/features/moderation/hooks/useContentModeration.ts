import { useMutation, useQueryClient } from '@tanstack/react-query'
import { moderationService } from '../services/moderationService'
import type { ModerationAction } from '../types/moderation.types'

/**
 * Hook for handling content moderation actions
 */
export function useContentModeration() {
  const queryClient = useQueryClient()

  // Main moderation action mutation
  const moderationMutation = useMutation({
    mutationFn: async (action: ModerationAction) => {
      await moderationService.moderateContent(action)
    },
    onSuccess: () => {
      // Invalidate all moderation-related queries
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] })
      queryClient.invalidateQueries({ queryKey: ['songs'] })
      queryClient.invalidateQueries({ queryKey: ['arrangements'] })
      
      console.log('Content moderated successfully')
    },
    onError: (error) => {
      console.error('Failed to moderate content:', error)
    }
  })

  // Individual action helpers
  const approve = async (action: Omit<ModerationAction, 'action'>) => {
    return moderationMutation.mutateAsync({ ...action, action: 'approve' })
  }

  const reject = async (action: Omit<ModerationAction, 'action'>) => {
    return moderationMutation.mutateAsync({ ...action, action: 'reject' })
  }

  const flag = async (action: Omit<ModerationAction, 'action'>) => {
    return moderationMutation.mutateAsync({ ...action, action: 'flag' })
  }

  const unflag = async (action: Omit<ModerationAction, 'action'>) => {
    return moderationMutation.mutateAsync({ ...action, action: 'unflag' })
  }

  return {
    /** Perform any moderation action */
    moderate: moderationMutation.mutateAsync,
    /** Approve content */
    approve,
    /** Reject content */
    reject,
    /** Flag content */
    flag,
    /** Unflag content */
    unflag,
    /** Whether a moderation action is in progress */
    isProcessing: moderationMutation.isPending,
    /** Error from moderation action */
    error: moderationMutation.error
  }
}