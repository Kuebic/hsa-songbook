import { useMutation, useQueryClient } from '@tanstack/react-query'
import { moderationService } from '../services/moderationService'
import type { ContentReport } from '../types/moderation.types'
import type { ReportFormData } from '../validation/moderationSchemas'

/**
 * Hook for handling content reporting functionality
 */
export function useReporting() {
  const queryClient = useQueryClient()

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const report: Omit<ContentReport, 'id' | 'createdAt' | 'status'> = {
        contentId: data.contentId,
        contentType: data.contentType,
        reportedBy: '', // Will be set by the service using current user
        reason: data.reason,
        description: data.description || undefined
      }
      
      await moderationService.submitReport(report)
    },
    onSuccess: () => {
      // Invalidate moderation queue to reflect new report counts
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] })
      
      // Show success notification (would be handled by notification system)
      console.log('Report submitted successfully')
    },
    onError: (error) => {
      console.error('Failed to submit report:', error)
      // Error would be handled by notification system
    }
  })

  return {
    /** Submit a content report */
    submitReport: submitReportMutation.mutateAsync,
    /** Whether a report is currently being submitted */
    isSubmitting: submitReportMutation.isPending,
    /** Error from report submission */
    error: submitReportMutation.error
  }
}