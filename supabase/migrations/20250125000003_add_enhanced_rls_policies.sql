-- Migration: Enhanced Row Level Security Policies
-- Description: Adds comprehensive RLS policies for all tables
-- Author: HSA Songbook Team
-- Date: 2025-01-25

BEGIN;

-- ==========================================
-- DROP EXISTING POLICIES (to replace with enhanced versions)
-- ==========================================

-- Drop existing basic policies on songs table
DROP POLICY IF EXISTS "Public songs are viewable by everyone" ON public.songs;
DROP POLICY IF EXISTS "Authenticated users can insert songs" ON public.songs;
DROP POLICY IF EXISTS "Users can update own songs" ON public.songs;

-- Drop existing basic policies on arrangements table (if any)
DROP POLICY IF EXISTS "arrangements_public_read" ON public.arrangements;
DROP POLICY IF EXISTS "arrangements_owner_all" ON public.arrangements;
DROP POLICY IF EXISTS "arrangements_moderator_all" ON public.arrangements;

-- ==========================================
-- ENHANCED SONGS TABLE POLICIES
-- ==========================================

-- Public read access for approved/null moderation status
CREATE POLICY "songs_public_read_approved" 
  ON public.songs FOR SELECT 
  USING (
    is_public = true 
    AND (moderation_status IS NULL OR moderation_status NOT IN ('rejected', 'flagged'))
  );

-- Authenticated users can create songs
CREATE POLICY "songs_authenticated_create" 
  ON public.songs FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND created_by IS NOT NULL
  );

-- Owners can update their own songs
CREATE POLICY "songs_owner_update" 
  ON public.songs FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Owners can delete their own songs (if not referenced)
CREATE POLICY "songs_owner_delete" 
  ON public.songs FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by
    AND NOT EXISTS (
      SELECT 1 FROM public.arrangements 
      WHERE song_id = public.songs.id
    )
  );

-- Moderators can view all songs
CREATE POLICY "songs_moderator_read_all" 
  ON public.songs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
      AND is_active = true
    )
  );

-- Moderators can update songs (for moderation)
CREATE POLICY "songs_moderator_update" 
  ON public.songs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
      AND is_active = true
    )
  );

-- Admins can delete any song
CREATE POLICY "songs_admin_delete" 
  ON public.songs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- ==========================================
-- ENHANCED ARRANGEMENTS TABLE POLICIES
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE public.arrangements ENABLE ROW LEVEL SECURITY;

-- Public read access for approved arrangements
CREATE POLICY "arrangements_public_read_approved" 
  ON public.arrangements FOR SELECT 
  USING (
    is_public = true 
    AND (moderation_status IS NULL OR moderation_status NOT IN ('rejected', 'flagged'))
  );

-- Authenticated users can create arrangements
CREATE POLICY "arrangements_authenticated_create" 
  ON public.arrangements FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND created_by IS NOT NULL
  );

-- Owners can update their own arrangements
CREATE POLICY "arrangements_owner_update" 
  ON public.arrangements FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Owners can delete their own arrangements
CREATE POLICY "arrangements_owner_delete" 
  ON public.arrangements FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Moderators can manage all arrangements
CREATE POLICY "arrangements_moderator_all" 
  ON public.arrangements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
      AND is_active = true
    )
  );

-- ==========================================
-- SETLISTS TABLE POLICIES
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

-- Public setlists are viewable by everyone
CREATE POLICY "setlists_public_read" 
  ON public.setlists FOR SELECT 
  USING (is_public = true);

-- Shared setlists are viewable by share_id
CREATE POLICY "setlists_shared_read" 
  ON public.setlists FOR SELECT 
  USING (share_id IS NOT NULL);

-- Authenticated users can create setlists
CREATE POLICY "setlists_authenticated_create" 
  ON public.setlists FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Owners can manage their own setlists
CREATE POLICY "setlists_owner_all" 
  ON public.setlists FOR ALL
  TO authenticated
  USING (auth.uid() = created_by);

-- ==========================================
-- SETLIST_ITEMS TABLE POLICIES
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;

-- Setlist items inherit visibility from parent setlist
CREATE POLICY "setlist_items_inherit_read" 
  ON public.setlist_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists
      WHERE id = setlist_items.setlist_id
      AND (
        is_public = true 
        OR share_id IS NOT NULL 
        OR created_by = auth.uid()
      )
    )
  );

-- Setlist owners can manage items
CREATE POLICY "setlist_items_owner_all" 
  ON public.setlist_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists
      WHERE id = setlist_items.setlist_id
      AND created_by = auth.uid()
    )
  );

-- ==========================================
-- CONTENT_REPORTS TABLE POLICIES
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "content_reports_own_read" 
  ON public.content_reports FOR SELECT 
  TO authenticated
  USING (reported_by = auth.uid());

-- Authenticated users can create reports
CREATE POLICY "content_reports_authenticated_create" 
  ON public.content_reports FOR INSERT 
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Moderators can view and manage all reports
CREATE POLICY "content_reports_moderator_all" 
  ON public.content_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
      AND is_active = true
    )
  );

-- ==========================================
-- MODERATION_LOG TABLE POLICIES
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- Moderators can view all moderation logs
CREATE POLICY "moderation_log_moderator_read" 
  ON public.moderation_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
      AND is_active = true
    )
  );

-- Moderators can create moderation log entries
CREATE POLICY "moderation_log_moderator_insert" 
  ON public.moderation_log FOR INSERT
  TO authenticated
  WITH CHECK (
    performed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
      AND is_active = true
    )
  );

-- ==========================================
-- USER_ROLES TABLE POLICIES
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "user_roles_own_read" 
  ON public.user_roles FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "user_roles_admin_read_all" 
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.is_active = true
    )
  );

-- Admins can manage all roles
CREATE POLICY "user_roles_admin_manage" 
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.is_active = true
    )
  );

-- ==========================================
-- REVIEWS TABLE POLICIES
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are publicly readable
CREATE POLICY "reviews_public_read" 
  ON public.reviews FOR SELECT 
  USING (true);

-- Authenticated users can create reviews
CREATE POLICY "reviews_authenticated_create" 
  ON public.reviews FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "reviews_owner_update" 
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY "reviews_owner_delete" 
  ON public.reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Moderators can manage all reviews
CREATE POLICY "reviews_moderator_manage" 
  ON public.reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin')
      AND is_active = true
    )
  );

-- ==========================================
-- ROLE_AUDIT_LOG TABLE POLICIES
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view role audit logs
CREATE POLICY "role_audit_log_admin_read" 
  ON public.role_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- System can insert audit logs (through functions)
CREATE POLICY "role_audit_log_system_insert" 
  ON public.role_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    performed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

COMMIT;