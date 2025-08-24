name: "RBAC Phase 3 - Moderator Tools"
description: |
  Implementation of moderation interface for content management, including review queue, bulk actions, and reporting system

---

## Goal

**Feature Goal**: Enable moderators to efficiently manage user-generated content and maintain quality standards

**Deliverable**: Moderation dashboard with content queue, bulk actions, and integrated reporting system

**Success Definition**: Moderators can review, edit, and moderate content without accessing admin functions

## User Persona

**Target User**: Content Moderators

**Use Case**: Reviewing user submissions, managing inappropriate content, and maintaining song database quality

**User Journey**: 
1. Moderator accesses moderation dashboard
2. Reviews queue of flagged/new content
3. Takes action (approve, edit, reject)
4. Processes multiple items via bulk actions
5. Reviews moderation statistics

**Pain Points Addressed**: 
- No dedicated interface for content moderation
- Cannot efficiently review multiple submissions
- No visibility into content requiring attention
- No way for users to report issues

## Why

- Scales content management beyond admin capacity
- Improves content quality and consistency
- Reduces inappropriate content exposure
- Enables community-driven quality control

## What

Build comprehensive moderation interface with content queue, bulk operations, and reporting integration, accessible to both moderators and admins.

### Success Criteria

- [ ] Moderation dashboard accessible to moderators and admins
- [ ] Queue shows all content requiring review
- [ ] Bulk actions for efficient processing
- [ ] User reporting system integrated
- [ ] Moderation statistics and metrics visible

## All Needed Context

### Context Completeness Check

_This PRP contains all patterns for building moderation features, integrating with existing song/arrangement systems._

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/features/songs/components/SongCard.tsx
  why: Pattern for content display cards
  pattern: Card structure, action buttons, state management
  gotcha: Must maintain existing card interactions

- file: src/features/songs/services/songService.ts
  why: Pattern for content CRUD operations
  pattern: Update, delete, approval methods
  gotcha: Cache invalidation after modifications

- file: src/features/setlists/components/SetlistManager.tsx
  why: Pattern for drag-and-drop and bulk selections
  pattern: Multi-select, bulk operations UI
  gotcha: Use @dnd-kit for drag operations

- file: src/features/admin/components/UserList.tsx
  why: Pattern for data tables from Phase 2
  pattern: Table structure, filtering, pagination
  gotcha: Reuse table patterns for consistency

- docfile: PRPs/rbac-phase1-database-auth-infrastructure.md
  why: Role system implementation
  section: Data models, permission checks

- docfile: PRPs/rbac-phase2-admin-dashboard.md
  why: Admin UI patterns to follow
  section: Component patterns, service structure
```

### Current Codebase tree

```bash
hsa-songbook/
├── src/
│   ├── features/
│   │   ├── admin/  # Added in Phase 2
│   │   │   └── components/
│   │   ├── songs/
│   │   │   ├── components/
│   │   │   └── services/
│   │   └── arrangements/
│   │       └── services/
└── supabase/
    └── migrations/
        └── 20250121_add_rbac_infrastructure.sql  # From Phase 1
```

### Desired Codebase tree with files to be added

```bash
hsa-songbook/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   └── ModerationDashboard.tsx  # NEW: Main moderation page
│   │   └── App.tsx  # MODIFIED: Add moderation route
│   ├── features/
│   │   └── moderation/  # NEW: Moderation feature module
│   │       ├── components/
│   │       │   ├── ModerationQueue.tsx  # NEW: Content review queue
│   │       │   ├── ModerationQueue.module.css
│   │       │   ├── ContentReviewCard.tsx  # NEW: Individual content card
│   │       │   ├── ContentReviewCard.module.css
│   │       │   ├── BulkActions.tsx  # NEW: Bulk operation controls
│   │       │   ├── BulkActions.module.css
│   │       │   ├── ModerationStats.tsx  # NEW: Statistics dashboard
│   │       │   ├── ReportModal.tsx  # NEW: User reporting interface
│   │       │   └── ReportButton.tsx  # NEW: Report button component
│   │       ├── services/
│   │       │   └── moderationService.ts  # NEW: Moderation API
│   │       ├── hooks/
│   │       │   ├── useModerationQueue.ts  # NEW: Queue management
│   │       │   ├── useContentModeration.ts  # NEW: Moderation actions
│   │       │   └── useReporting.ts  # NEW: Report handling
│   │       ├── types/
│   │       │   └── moderation.types.ts  # NEW: Moderation types
│   │       └── validation/
│   │           └── moderationSchemas.ts  # NEW: Form schemas
│   ├── shared/
│   │   └── components/
│   │       └── PermissionGate.tsx  # NEW: Generic permission wrapper
└── supabase/
    └── migrations/
        └── 20250122_add_moderation_tables.sql  # NEW: Moderation schema
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: Content visibility during moderation
// - Keep content accessible while under review
// - Show moderation status to users
// - Don't break existing links

// CRITICAL: Bulk operations
// - Batch database operations for performance
// - Show progress for long-running operations
// - Handle partial failures gracefully

// CRITICAL: Caching considerations
// - Invalidate song/arrangement caches after moderation
// - Update optimistic UI for better UX
```

## Implementation Blueprint

### Data models and structure

```typescript
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
  content: {
    // Polymorphic - either Song or Arrangement data
    [key: string]: any
  }
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
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE supabase/migrations/20250122_add_moderation_tables.sql
  - IMPLEMENT: Database schema for moderation
  - TABLES: content_reports, moderation_log
  - COLUMNS: Add moderation_status to songs and arrangements
  - INDEXES: For performance on queue queries
  - RLS: Policies for moderator access
  - PLACEMENT: supabase/migrations/

Task 2: REGENERATE database types after migration
  - RUN: npx supabase db push --local
  - RUN: npx supabase gen types typescript --local > src/lib/database.types.ts
  - VERIFY: New moderation tables in types
  - PLACEMENT: src/lib/database.types.ts

Task 3: CREATE src/features/moderation/types/moderation.types.ts
  - IMPLEMENT: TypeScript interfaces for moderation
  - INCLUDE: All types from data models section
  - PLACEMENT: Moderation types directory

Task 4: CREATE src/features/moderation/validation/moderationSchemas.ts
  - IMPLEMENT: Zod schemas for forms
  - SCHEMAS: reportSchema, moderationActionSchema
  - FOLLOW pattern: Existing validation schemas
  - PLACEMENT: Moderation validation directory

Task 5: CREATE src/features/moderation/services/moderationService.ts
  - IMPLEMENT: API service for moderation
  - FOLLOW pattern: adminService from Phase 2
  - METHODS: getQueue, moderateContent, bulkModerate, getReports
  - INCLUDE: Caching, error handling
  - PLACEMENT: Moderation services directory

Task 6: CREATE src/shared/components/PermissionGate.tsx
  - IMPLEMENT: Reusable permission checking component
  - PROPS: requiredRole, requiredPermission, children
  - USE: useAuth hook for permission checks
  - PLACEMENT: Shared components directory

Task 7: CREATE src/features/moderation/components/ReportButton.tsx
  - IMPLEMENT: Button to trigger report modal
  - INTEGRATE: Into existing SongCard and ArrangementViewer
  - PROPS: contentId, contentType, onReport
  - PLACEMENT: Moderation components directory

Task 8: CREATE src/features/moderation/components/ReportModal.tsx
  - IMPLEMENT: Modal for submitting reports
  - FORM: react-hook-form with Zod validation
  - FIELDS: Reason dropdown, description textarea
  - PLACEMENT: Moderation components directory

Task 9: CREATE src/features/moderation/hooks/useReporting.ts
  - IMPLEMENT: Hook for report submission
  - METHODS: submitReport mutation
  - OPTIMISTIC: Show immediate feedback
  - PLACEMENT: Moderation hooks directory

Task 10: CREATE src/features/moderation/components/ContentReviewCard.tsx and .module.css
  - IMPLEMENT: Card for reviewing content
  - DISPLAY: Content preview, report details, action buttons
  - ACTIONS: Approve, reject, edit, view full
  - PLACEMENT: Moderation components directory

Task 11: CREATE src/features/moderation/components/BulkActions.tsx and .module.css
  - IMPLEMENT: Bulk selection and actions UI
  - FEATURES: Select all, action dropdown, confirmation
  - PATTERN: Similar to SetlistManager bulk operations
  - PLACEMENT: Moderation components directory

Task 12: CREATE src/features/moderation/hooks/useModerationQueue.ts
  - IMPLEMENT: Queue fetching and filtering
  - FEATURES: Real-time updates, pagination
  - USE: TanStack Query with WebSocket subscription
  - PLACEMENT: Moderation hooks directory

Task 13: CREATE src/features/moderation/hooks/useContentModeration.ts
  - IMPLEMENT: Moderation action mutations
  - METHODS: approve, reject, flag mutations
  - OPTIMISTIC: Update queue immediately
  - PLACEMENT: Moderation hooks directory

Task 14: CREATE src/features/moderation/components/ModerationQueue.tsx and .module.css
  - IMPLEMENT: Main queue interface
  - COMPOSE: ContentReviewCard, BulkActions
  - FEATURES: Filtering, sorting, search
  - PLACEMENT: Moderation components directory

Task 15: CREATE src/features/moderation/components/ModerationStats.tsx
  - IMPLEMENT: Statistics dashboard
  - DISPLAY: Metrics, charts, top reporters
  - REALTIME: Update stats as actions occur
  - PLACEMENT: Moderation components directory

Task 16: CREATE src/app/pages/ModerationDashboard.tsx
  - IMPLEMENT: Main moderation page
  - COMPOSE: Queue, stats, filters
  - PROTECT: With moderator permission check
  - PLACEMENT: App pages directory

Task 17: MODIFY src/app/App.tsx
  - ADD: Route for moderation dashboard
  - PATH: /moderation
  - PROTECT: Require moderator or admin role
  - PLACEMENT: App routing

Task 18: MODIFY existing content components
  - UPDATE: src/features/songs/components/SongCard.tsx
  - UPDATE: src/features/arrangements/pages/ArrangementViewerPage.tsx
  - ADD: ReportButton component
  - SHOW: Moderation status badges
  - PLACEMENT: Existing component files
```

### Implementation Patterns & Key Details

```sql
-- Task 1: Migration (20250122_add_moderation_tables.sql)
-- Migration: Moderation System
-- Date: 2025-01-22
-- Description: Adds content moderation and reporting system

-- Add moderation status to content tables
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' 
  CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderation_note TEXT;

ALTER TABLE arrangements
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderation_note TEXT;

-- Content reports table
CREATE TABLE IF NOT EXISTS public.content_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('song', 'arrangement')),
    reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'copyright', 'spam', 'incorrect', 'other')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved')),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution TEXT,
    UNIQUE(content_id, content_type, reported_by)
);

-- Moderation activity log
CREATE TABLE IF NOT EXISTS public.moderation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'flag', 'unflag', 'edit')),
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    previous_status TEXT,
    new_status TEXT,
    note TEXT,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_songs_moderation_status ON songs(moderation_status) 
  WHERE moderation_status != 'approved';
CREATE INDEX IF NOT EXISTS idx_arrangements_moderation_status ON arrangements(moderation_status)
  WHERE moderation_status != 'approved';
CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_content ON content_reports(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_log_content ON moderation_log(content_id, content_type);

-- Helper function for moderation queue
CREATE OR REPLACE FUNCTION get_moderation_queue(
    filter_status TEXT DEFAULT NULL,
    filter_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content_id UUID,
    content_type TEXT,
    title TEXT,
    creator_id UUID,
    creator_email TEXT,
    status TEXT,
    report_count BIGINT,
    created_at TIMESTAMPTZ,
    last_modified TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH content_union AS (
        SELECT 
            s.id,
            'song'::TEXT as content_type,
            s.title,
            s.created_by,
            s.moderation_status,
            s.created_at,
            s.updated_at
        FROM songs s
        WHERE (filter_type IS NULL OR filter_type = 'song')
          AND (filter_status IS NULL OR s.moderation_status = filter_status)
        
        UNION ALL
        
        SELECT 
            a.id,
            'arrangement'::TEXT as content_type,
            a.name as title,
            a.created_by,
            a.moderation_status,
            a.created_at,
            a.updated_at
        FROM arrangements a
        WHERE (filter_type IS NULL OR filter_type = 'arrangement')
          AND (filter_status IS NULL OR a.moderation_status = filter_status)
    )
    SELECT 
        gen_random_uuid() as id,
        cu.id as content_id,
        cu.content_type,
        cu.title,
        cu.created_by as creator_id,
        u.email as creator_email,
        cu.moderation_status as status,
        COALESCE(r.report_count, 0) as report_count,
        cu.created_at,
        cu.updated_at as last_modified
    FROM content_union cu
    LEFT JOIN users u ON cu.created_by = u.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as report_count
        FROM content_reports cr
        WHERE cr.content_id = cu.id 
          AND cr.content_type = cu.content_type
          AND cr.status != 'resolved'
    ) r ON true
    ORDER BY 
        CASE cu.moderation_status 
            WHEN 'flagged' THEN 1
            WHEN 'pending' THEN 2
            ELSE 3
        END,
        report_count DESC,
        cu.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policies
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports" ON content_reports
    FOR INSERT USING (auth.uid() = reported_by);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON content_reports
    FOR SELECT USING (auth.uid() = reported_by);

-- Moderators can view all reports
CREATE POLICY "Moderators can view all reports" ON content_reports
    FOR SELECT USING (
        (auth.jwt() ->> 'user_role') IN ('moderator', 'admin')
    );

-- Moderators can update reports
CREATE POLICY "Moderators can update reports" ON content_reports
    FOR UPDATE USING (
        (auth.jwt() ->> 'user_role') IN ('moderator', 'admin')
    );

-- Moderation log is read-only for moderators
CREATE POLICY "Moderators can view moderation log" ON moderation_log
    FOR SELECT USING (
        (auth.jwt() ->> 'user_role') IN ('moderator', 'admin')
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON content_reports TO authenticated;
GRANT SELECT ON moderation_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_moderation_queue TO authenticated;
```

```typescript
// Task 5: Moderation Service (src/features/moderation/services/moderationService.ts)
import { supabase } from '../../../lib/supabase'
import type { ModerationItem, ModerationAction, ContentReport } from '../types/moderation.types'

export const moderationService = {
  async getQueue(filter?: ModerationFilter): Promise<ModerationItem[]> {
    try {
      // Use the database function for efficient querying
      const { data, error } = await supabase
        .rpc('get_moderation_queue', {
          filter_status: filter?.status === 'all' ? null : filter?.status,
          filter_type: filter?.contentType === 'all' ? null : filter?.contentType
        })

      if (error) throw error

      // Map and enrich with full content data
      const items = await Promise.all(
        data.map(async (item) => {
          // Fetch full content based on type
          const contentQuery = item.content_type === 'song'
            ? supabase.from('songs').select('*').eq('id', item.content_id).single()
            : supabase.from('arrangements').select('*').eq('id', item.content_id).single()

          const { data: content } = await contentQuery

          return {
            id: item.id,
            contentId: item.content_id,
            contentType: item.content_type,
            title: item.title,
            creator: {
              id: item.creator_id,
              email: item.creator_email,
              name: null
            },
            status: item.status,
            reportCount: item.report_count,
            createdAt: item.created_at,
            lastModifiedAt: item.last_modified,
            content
          }
        })
      )

      return items
    } catch (error) {
      console.error('Error fetching moderation queue:', error)
      throw error
    }
  },

  async moderateContent(action: ModerationAction): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Authentication required')

      // Process each content item
      for (const contentId of action.contentIds) {
        // Determine table based on content type
        const { data: songCheck } = await supabase
          .from('songs')
          .select('id')
          .eq('id', contentId)
          .single()

        const table = songCheck ? 'songs' : 'arrangements'
        const contentType = songCheck ? 'song' : 'arrangement'

        // Update moderation status
        const newStatus = action.action === 'approve' ? 'approved' :
                         action.action === 'reject' ? 'rejected' :
                         action.action === 'flag' ? 'flagged' : 'pending'

        const { error: updateError } = await supabase
          .from(table)
          .update({
            moderation_status: newStatus,
            moderated_by: user.id,
            moderated_at: new Date().toISOString(),
            moderation_note: action.note
          })
          .eq('id', contentId)

        if (updateError) throw updateError

        // Log the action
        const { error: logError } = await supabase
          .from('moderation_log')
          .insert({
            content_id: contentId,
            content_type: contentType,
            action: action.action,
            performed_by: user.id,
            new_status: newStatus,
            note: action.note
          })

        if (logError) console.error('Failed to log moderation action:', logError)

        // Resolve related reports if approving/rejecting
        if (action.action === 'approve' || action.action === 'reject') {
          await supabase
            .from('content_reports')
            .update({
              status: 'resolved',
              resolved_by: user.id,
              resolved_at: new Date().toISOString(),
              resolution: `Content ${action.action}ed`
            })
            .eq('content_id', contentId)
            .eq('status', 'open')
        }
      }

      // Clear relevant caches
      clearCache()
    } catch (error) {
      console.error('Error moderating content:', error)
      throw error
    }
  },

  async submitReport(report: Omit<ContentReport, 'id' | 'createdAt' | 'status'>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Authentication required')

      const { error } = await supabase
        .from('content_reports')
        .insert({
          content_id: report.contentId,
          content_type: report.contentType,
          reported_by: user.id,
          reason: report.reason,
          description: report.description
        })

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('You have already reported this content')
        }
        throw error
      }

      // Update content to flagged if multiple reports
      const { count } = await supabase
        .from('content_reports')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', report.contentId)
        .eq('content_type', report.contentType)
        .eq('status', 'open')

      if (count && count >= 3) {
        // Auto-flag content with 3+ reports
        const table = report.contentType === 'song' ? 'songs' : 'arrangements'
        await supabase
          .from(table)
          .update({ moderation_status: 'flagged' })
          .eq('id', report.contentId)
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      throw error
    }
  }
}

// Task 10: Content Review Card (src/features/moderation/components/ContentReviewCard.tsx)
import { useState } from 'react'
import { PermissionGate } from '@shared/components/PermissionGate'
import { useContentModeration } from '../hooks/useContentModeration'
import type { ModerationItem } from '../types/moderation.types'
import styles from './ContentReviewCard.module.css'

interface ContentReviewCardProps {
  item: ModerationItem
  selected: boolean
  onSelect: (id: string) => void
  onModerate: () => void
}

export function ContentReviewCard({ item, selected, onSelect, onModerate }: ContentReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { approve, reject, flag, isProcessing } = useContentModeration()

  const handleApprove = async () => {
    await approve({ contentIds: [item.contentId], action: 'approve' })
    onModerate()
  }

  const handleReject = async () => {
    const note = prompt('Reason for rejection:')
    if (note) {
      await reject({ contentIds: [item.contentId], action: 'reject', note })
      onModerate()
    }
  }

  const handleFlag = async () => {
    await flag({ contentIds: [item.contentId], action: 'flag' })
    onModerate()
  }

  return (
    <div className={`${styles.card} ${selected ? styles.selected : ''}`}>
      <div className={styles.header}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(item.contentId)}
          className={styles.checkbox}
        />
        
        <div className={styles.titleSection}>
          <h3>{item.title}</h3>
          <span className={styles.type}>{item.contentType}</span>
          <span className={`${styles.status} ${styles[`status-${item.status}`]}`}>
            {item.status}
          </span>
        </div>

        <div className={styles.metadata}>
          <span>By: {item.creator.email}</span>
          <span>{item.reportCount} reports</span>
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className={styles.preview} onClick={() => setExpanded(!expanded)}>
        {/* Content preview based on type */}
        {item.contentType === 'song' ? (
          <div>
            <p>Artist: {item.content.artist}</p>
            <p>Category: {item.content.category}</p>
            {expanded && <pre>{item.content.lyrics?.en || 'No lyrics'}</pre>}
          </div>
        ) : (
          <div>
            <p>Key: {item.content.key}</p>
            <p>Tempo: {item.content.tempo}</p>
            {expanded && <pre>{item.content.chord_data?.substring(0, 500)}</pre>}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className={styles.approveBtn}
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          disabled={isProcessing}
          className={styles.rejectBtn}
        >
          Reject
        </button>
        <button
          onClick={handleFlag}
          disabled={isProcessing}
          className={styles.flagBtn}
        >
          Flag
        </button>
        <a
          href={`/${item.contentType}s/${item.contentId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.viewBtn}
        >
          View Full
        </a>
      </div>
    </div>
  )
}

// Task 16: Moderation Dashboard (src/app/pages/ModerationDashboard.tsx)
import { useState } from 'react'
import { PermissionGate } from '@shared/components/PermissionGate'
import { ModerationQueue, ModerationStats, BulkActions } from '@features/moderation/components'
import type { ModerationFilter } from '@features/moderation/types'

export function ModerationDashboard() {
  const [filter, setFilter] = useState<ModerationFilter>({
    status: 'pending',
    contentType: 'all'
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  return (
    <PermissionGate requiredPermission="moderate">
      <div className="moderation-dashboard">
        <h1>Content Moderation</h1>
        
        <ModerationStats />
        
        <div className="moderation-controls">
          <div className="filters">
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              value={filter.contentType}
              onChange={(e) => setFilter({ ...filter, contentType: e.target.value as any })}
            >
              <option value="all">All Types</option>
              <option value="song">Songs</option>
              <option value="arrangement">Arrangements</option>
            </select>
            
            <label>
              <input
                type="checkbox"
                checked={filter.reportedOnly}
                onChange={(e) => setFilter({ ...filter, reportedOnly: e.target.checked })}
              />
              Reported Only
            </label>
          </div>
          
          {selectedItems.length > 0 && (
            <BulkActions
              selectedCount={selectedItems.length}
              onAction={(action) => {
                // Handle bulk action
                setSelectedItems([])
              }}
            />
          )}
        </div>
        
        <ModerationQueue
          filter={filter}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      </div>
    </PermissionGate>
  )
}
```

### Integration Points

```yaml
DATABASE:
  - migration: "supabase/migrations/20250122_add_moderation_tables.sql"
  - function: "get_moderation_queue for efficient queries"
  - policies: "RLS for moderator access"

ROUTING:
  - add to: "src/app/App.tsx"
  - path: "/moderation"
  - protect: "Require moderator or admin role"

EXISTING COMPONENTS:
  - modify: "SongCard to add ReportButton"
  - modify: "ArrangementViewer to add ReportButton"
  - add: "Moderation status badges"

PERMISSIONS:
  - use: "JWT claims from Phase 1"
  - check: "can_moderate permission"
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating components
npm run lint
npm run build

# Expected: Zero errors
```

### Level 2: Unit Tests (Component Validation)

```bash
# Test services
npm run test -- src/features/moderation/services/

# Test hooks
npm run test -- src/features/moderation/hooks/

# Test components
npm run test -- src/features/moderation/components/

# Expected: All tests pass
```

### Level 3: Integration Testing (System Validation)

```bash
# Apply migration
npx supabase db push --local

# Start dev server
npm run dev

# Manual testing:
# 1. Log in as moderator
# 2. Navigate to /moderation
# 3. Test queue filtering
# 4. Test content approval/rejection
# 5. Test bulk operations
# 6. Test report submission

# Expected: All functions work
```

### Level 4: Moderation-Specific Validation

```bash
# Create test moderator
npx supabase db query "
  INSERT INTO user_roles (user_id, role, is_active)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'mod@test.com'),
    'moderator',
    true
  )
" --local

# Test report threshold
# 1. Report content 3 times from different users
# 2. Check if auto-flagged
# Expected: Content flagged after 3 reports

# Test moderation log
npx supabase db query "
  SELECT * FROM moderation_log 
  ORDER BY performed_at DESC 
  LIMIT 10
" --local
# Expected: All moderation actions logged

# Test queue function
npx supabase db query "
  SELECT * FROM get_moderation_queue('pending', 'song')
" --local
# Expected: Returns pending songs
```

## Final Validation Checklist

### Technical Validation

- [ ] Database migration applied successfully
- [ ] All TypeScript compiles without errors
- [ ] Tests pass with good coverage
- [ ] RLS policies working correctly
- [ ] Queue function performs well

### Feature Validation

- [ ] Moderation queue displays correctly
- [ ] Content preview works for songs and arrangements
- [ ] Bulk actions process successfully
- [ ] Reports can be submitted and reviewed
- [ ] Statistics update in real-time

### Code Quality Validation

- [ ] Follows existing patterns
- [ ] Proper error handling
- [ ] Loading states implemented
- [ ] Mobile responsive
- [ ] Accessibility considerations

### Documentation & Deployment

- [ ] Moderation workflow documented
- [ ] Report thresholds configurable
- [ ] Admin can override moderator actions
- [ ] Audit trail complete

---

## Anti-Patterns to Avoid

- ❌ Don't auto-delete reported content
- ❌ Don't expose reporter identities to content creators
- ❌ Don't skip confirmation for destructive actions
- ❌ Don't allow moderators to moderate own content
- ❌ Don't forget to invalidate caches after moderation
- ❌ Don't ignore partial failures in bulk operations
- ❌ Don't bypass audit logging