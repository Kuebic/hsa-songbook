// src/features/moderation/types/moderation.types.ts
export type ContentType = 'song' | 'arrangement'
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged'
export type ReportReason = 'inappropriate' | 'copyright' | 'spam' | 'incorrect' | 'other'

export interface ModerationItem {
  id: string
  contentId: string
  contentType: ContentType
  title: string
  creator: {
    id: string
    email: string
    name: string | null
  }
  status: ModerationStatus
  reportCount: number
  createdAt: string
  lastModifiedAt: string
  moderatedBy?: string
  moderatedAt?: string
  moderationNote?: string
  content: Record<string, unknown>
}

export interface ContentReport {
  id: string
  contentId: string
  contentType: ContentType
  reportedBy: string
  reason: ReportReason
  description?: string
  createdAt: string
  status: 'open' | 'reviewed' | 'resolved'
  resolvedBy?: string
  resolvedAt?: string
  resolution?: string
}

export interface ModerationAction {
  contentIds: string[]
  action: 'approve' | 'reject' | 'flag' | 'unflag'
  note?: string
}

export interface ModerationStats {
  pendingCount: number
  flaggedCount: number
  approvedToday: number
  rejectedToday: number
  averageReviewTime: number
  topReporters: Array<{
    userId: string
    email: string
    reportCount: number
  }>
}

export interface ModerationFilter {
  status?: ModerationStatus | 'all'
  contentType?: ContentType | 'all'
  dateRange?: {
    start: string
    end: string
  }
  reportedOnly?: boolean
  search?: string
  page?: number
  limit?: number
}