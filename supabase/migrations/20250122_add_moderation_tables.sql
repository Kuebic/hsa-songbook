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
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

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