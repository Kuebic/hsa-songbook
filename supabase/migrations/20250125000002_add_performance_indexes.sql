-- Migration: Add Performance Indexes
-- Description: Creates indexes to optimize common query patterns
-- Author: HSA Songbook Team
-- Date: 2025-01-25

BEGIN;

-- ==========================================
-- ARRANGEMENTS TABLE INDEXES
-- ==========================================

-- Index for public/moderated arrangements visibility queries
CREATE INDEX IF NOT EXISTS idx_arrangements_visibility 
  ON public.arrangements(is_public, moderation_status) 
  WHERE is_public = true;

-- Index for user content queries
CREATE INDEX IF NOT EXISTS idx_arrangements_created_by 
  ON public.arrangements(created_by) 
  WHERE created_by IS NOT NULL;

-- Index for pending moderation queries
CREATE INDEX IF NOT EXISTS idx_arrangements_moderation_pending 
  ON public.arrangements(moderation_status) 
  WHERE moderation_status = 'pending';

-- Index for song_id lookups (foreign key performance)
CREATE INDEX IF NOT EXISTS idx_arrangements_song_id 
  ON public.arrangements(song_id);

-- ==========================================
-- SONGS TABLE INDEXES
-- ==========================================

-- GIN index for title text search
CREATE INDEX IF NOT EXISTS idx_songs_title_gin
  ON public.songs USING gin(title gin_trgm_ops);

-- GIN index for artist text search  
CREATE INDEX IF NOT EXISTS idx_songs_artist_gin
  ON public.songs USING gin(artist gin_trgm_ops);

-- GIN index for alternative titles array
CREATE INDEX IF NOT EXISTS idx_songs_alt_titles
  ON public.songs USING gin(alternative_titles);

-- Index for theme-based searches (GIN for array columns)
CREATE INDEX IF NOT EXISTS idx_songs_themes 
  ON public.songs USING gin(themes)
  WHERE themes IS NOT NULL;

-- Index for public songs queries
CREATE INDEX IF NOT EXISTS idx_songs_public 
  ON public.songs(is_public) 
  WHERE is_public = true;

-- Index for pending moderation
CREATE INDEX IF NOT EXISTS idx_songs_moderation_pending 
  ON public.songs(moderation_status) 
  WHERE moderation_status = 'pending';

-- Index for CCLI lookups
CREATE INDEX IF NOT EXISTS idx_songs_ccli 
  ON public.songs(ccli) 
  WHERE ccli IS NOT NULL;

-- Index for slug lookups (already unique, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_songs_slug 
  ON public.songs(slug);

-- ==========================================
-- CONTENT_REPORTS TABLE INDEXES
-- ==========================================

-- Index for pending reports
CREATE INDEX IF NOT EXISTS idx_content_reports_status 
  ON public.content_reports(status) 
  WHERE status = 'pending';

-- Composite index for content lookups
CREATE INDEX IF NOT EXISTS idx_content_reports_content 
  ON public.content_reports(content_type, content_id);

-- Index for user report history
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_by 
  ON public.content_reports(reported_by) 
  WHERE reported_by IS NOT NULL;

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at 
  ON public.content_reports(created_at DESC);

-- ==========================================
-- MODERATION_LOG TABLE INDEXES
-- ==========================================

-- Composite index for content history lookups
CREATE INDEX IF NOT EXISTS idx_moderation_log_content 
  ON public.moderation_log(content_type, content_id);

-- Index for moderator activity queries
CREATE INDEX IF NOT EXISTS idx_moderation_log_performed_by 
  ON public.moderation_log(performed_by) 
  WHERE performed_by IS NOT NULL;

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_moderation_log_performed_at 
  ON public.moderation_log(performed_at DESC);

-- Index for action type filtering
CREATE INDEX IF NOT EXISTS idx_moderation_log_action 
  ON public.moderation_log(action);

-- ==========================================
-- SETLISTS TABLE INDEXES
-- ==========================================

-- Index for public setlists
CREATE INDEX IF NOT EXISTS idx_setlists_public 
  ON public.setlists(is_public) 
  WHERE is_public = true;

-- Index for user's setlists
CREATE INDEX IF NOT EXISTS idx_setlists_created_by 
  ON public.setlists(created_by) 
  WHERE created_by IS NOT NULL;

-- Index for share_id lookups
CREATE INDEX IF NOT EXISTS idx_setlists_share_id 
  ON public.setlists(share_id) 
  WHERE share_id IS NOT NULL;

-- ==========================================
-- SETLIST_ITEMS TABLE INDEXES
-- ==========================================

-- Composite index for setlist content queries
CREATE INDEX IF NOT EXISTS idx_setlist_items_setlist_position 
  ON public.setlist_items(setlist_id, position);

-- Index for arrangement lookups
CREATE INDEX IF NOT EXISTS idx_setlist_items_arrangement 
  ON public.setlist_items(arrangement_id) 
  WHERE arrangement_id IS NOT NULL;

-- ==========================================
-- USER_ROLES TABLE INDEXES
-- ==========================================

-- Index for active user roles
CREATE INDEX IF NOT EXISTS idx_user_roles_active 
  ON public.user_roles(user_id, role) 
  WHERE is_active = true;

-- Index for role queries
CREATE INDEX IF NOT EXISTS idx_user_roles_role 
  ON public.user_roles(role) 
  WHERE is_active = true;

-- Index for expiring roles
CREATE INDEX IF NOT EXISTS idx_user_roles_expires 
  ON public.user_roles(expires_at) 
  WHERE expires_at IS NOT NULL;

-- ==========================================
-- REVIEWS TABLE INDEXES
-- ==========================================

-- Index for song reviews
CREATE INDEX IF NOT EXISTS idx_reviews_song_id 
  ON public.reviews(song_id);

-- Index for user reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_id 
  ON public.reviews(user_id);

-- Composite index for uniqueness checks
CREATE INDEX IF NOT EXISTS idx_reviews_song_user 
  ON public.reviews(song_id, user_id);

-- Index for recent reviews
CREATE INDEX IF NOT EXISTS idx_reviews_created_at 
  ON public.reviews(created_at DESC);

-- ==========================================
-- ANALYZE TABLES FOR OPTIMIZER
-- ==========================================

-- Update table statistics for query optimizer
ANALYZE public.songs;
ANALYZE public.arrangements;
ANALYZE public.setlists;
ANALYZE public.setlist_items;
ANALYZE public.user_roles;
ANALYZE public.content_reports;
ANALYZE public.moderation_log;
ANALYZE public.reviews;
ANALYZE public.permissions;
ANALYZE public.custom_roles;
ANALYZE public.permission_groups;
ANALYZE public.user_permissions;

COMMIT;