import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useReporting } from '../hooks/useReporting'
import { reportSchema, type ReportFormData } from '../validation/moderationSchemas'
import type { ContentType } from '../types/moderation.types'

interface ReportModalProps {
  /** ID of the content to report */
  contentId: string
  /** Type of content (song or arrangement) */
  contentType: ContentType
  /** Callback fired when modal should close */
  onClose: () => void
  /** Callback fired when report is successfully submitted */
  onReportSubmitted: () => void
}

/**
 * Modal for submitting content reports
 */
export function ReportModal({
  contentId,
  contentType,
  onClose,
  onReportSubmitted
}: ReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { submitReport } = useReporting()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      contentId,
      contentType,
      reason: 'inappropriate',
      description: ''
    }
  })

  const onSubmit = async (data: ReportFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await submitReport(data)
      reset()
      onReportSubmitted()
    } catch (error) {
      console.error('Failed to submit report:', error)
      // Error handling would be done by the notification system
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Report {contentType === 'song' ? 'Song' : 'Arrangement'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Help us maintain quality by reporting inappropriate content.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for reporting *
            </label>
            <select
              {...register('reason')}
              id="reason"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="inappropriate">Inappropriate content</option>
              <option value="copyright">Copyright violation</option>
              <option value="spam">Spam or irrelevant</option>
              <option value="incorrect">Incorrect information</option>
              <option value="other">Other</option>
            </select>
            {errors.reason && (
              <p className="text-red-600 text-sm mt-1">{errors.reason.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Additional details (optional)
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              placeholder="Please provide more details about why you're reporting this content..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}