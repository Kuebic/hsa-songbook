import { useState } from 'react'
import { ReportModal } from './ReportModal'
import type { ContentType } from '../types/moderation.types'

interface ReportButtonProps {
  /** ID of the content to report */
  contentId: string
  /** Type of content (song or arrangement) */
  contentType: ContentType
  /** Optional custom button text or React node */
  buttonText?: React.ReactNode
  /** Optional CSS class for styling */
  className?: string
  /** Callback fired when report is successfully submitted */
  onReportSubmitted?: () => void
}

/**
 * Button component that opens the report modal for content reporting
 */
export function ReportButton({
  contentId,
  contentType,
  buttonText = "Report",
  className,
  onReportSubmitted
}: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleReportSubmitted = () => {
    setIsModalOpen(false)
    onReportSubmitted?.()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={className || "text-red-600 hover:text-red-800 text-sm font-medium"}
        title={`Report this ${contentType}`}
      >
        {buttonText}
      </button>

      {isModalOpen && (
        <ReportModal
          contentId={contentId}
          contentType={contentType}
          onClose={() => setIsModalOpen(false)}
          onReportSubmitted={handleReportSubmitted}
        />
      )}
    </>
  )
}