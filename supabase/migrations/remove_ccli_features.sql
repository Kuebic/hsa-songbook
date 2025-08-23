-- ============================================================================
-- REMOVE ALL CCLI-RELATED DATABASE OBJECTS
-- Created: 2025-01-23
-- Purpose: Complete removal of CCLI functionality from the database
-- 
-- WARNING: This will permanently delete all CCLI data!
-- Make sure you have a backup before running this script.
-- ============================================================================

-- Start transaction for safety
BEGIN;

-- ============================================================================
-- STEP 1: Drop Views and Functions that depend on CCLI tables
-- ============================================================================

-- Drop views that reference CCLI tables
DROP VIEW IF EXISTS top_popular_songs CASCADE;
DROP MATERIALIZED VIEW IF EXISTS ccli_song_view CASCADE;

-- Drop CCLI-specific functions
DROP FUNCTION IF EXISTS get_popular_songs(INTEGER, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS search_ccli_mappings(TEXT) CASCADE;
DROP FUNCTION IF EXISTS find_ccli_by_title(TEXT) CASCADE;
DROP FUNCTION IF EXISTS find_ccli_by_ccli_number(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS find_best_ccli_match(TEXT, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS link_song_to_ccli(UUID, UUID, INTEGER, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS normalize_title(TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_title_fingerprint(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_title_normalized() CASCADE;
DROP FUNCTION IF EXISTS populate_normalized_titles() CASCADE;
DROP FUNCTION IF EXISTS auto_match_songs_to_ccli() CASCADE;
DROP FUNCTION IF EXISTS match_single_song_to_ccli(UUID) CASCADE;
DROP FUNCTION IF EXISTS find_song_by_ccli(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_ccli_stats() CASCADE;
DROP FUNCTION IF EXISTS ccli_fuzzy_search(TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS ccli_fuzzy_search_enhanced(TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS populate_normalized_fingerprints() CASCADE;

-- ============================================================================
-- STEP 2: Drop CCLI Tables
-- ============================================================================

-- Drop relationship table first (has foreign keys)
DROP TABLE IF EXISTS song_ccli_matches CASCADE;

-- Drop main CCLI tables
DROP TABLE IF EXISTS ccli_mappings CASCADE;
DROP TABLE IF EXISTS ccli_sources CASCADE;

-- ============================================================================
-- STEP 3: Remove CCLI and Popularity Columns from Songs Table
-- ============================================================================

-- Remove popularity tracking columns (added for CCLI popular songs)
ALTER TABLE songs 
  DROP COLUMN IF EXISTS popularity_rank,
  DROP COLUMN IF EXISTS popularity_source,
  DROP COLUMN IF EXISTS popularity_updated_at;

-- Note: The 'ccli' column might have existed before CCLI feature
-- Only uncomment if you want to remove it completely:
-- ALTER TABLE songs DROP COLUMN IF EXISTS ccli;

-- ============================================================================
-- STEP 4: Drop CCLI-related Indexes
-- ============================================================================

-- Drop indexes that were created for CCLI functionality
DROP INDEX IF EXISTS idx_songs_popularity;
DROP INDEX IF EXISTS idx_ccli_number;
DROP INDEX IF EXISTS idx_ccli_title_normalized;
DROP INDEX IF EXISTS idx_ccli_title_trgm;
DROP INDEX IF EXISTS idx_ccli_fingerprint;
DROP INDEX IF EXISTS idx_ccli_source;
DROP INDEX IF EXISTS idx_ccli_artists;
DROP INDEX IF EXISTS idx_song_ccli_matches_song;
DROP INDEX IF EXISTS idx_song_ccli_matches_mapping;
DROP INDEX IF EXISTS idx_song_ccli_primary;

-- ============================================================================
-- STEP 5: Drop Triggers
-- ============================================================================

-- Drop any triggers that were created for CCLI
DROP TRIGGER IF EXISTS update_title_normalized_trigger ON ccli_mappings;
DROP TRIGGER IF EXISTS update_ccli_mappings_updated_at ON ccli_mappings;
DROP TRIGGER IF EXISTS update_song_ccli_matches_updated_at ON song_ccli_matches;

-- ============================================================================
-- STEP 6: Optional - Keep or Remove Alternative Titles Feature
-- ============================================================================

-- The alternative titles feature was added alongside CCLI but is useful independently
-- UNCOMMENT these lines if you want to remove alternative titles too:

-- ALTER TABLE songs DROP COLUMN IF EXISTS alternative_titles;
-- DROP FUNCTION IF EXISTS song_has_alternative_title(TEXT[], TEXT);
-- DROP FUNCTION IF EXISTS get_all_song_titles(TEXT, TEXT[]);
-- DROP FUNCTION IF EXISTS get_alternative_titles_stats();
-- DROP INDEX IF EXISTS idx_songs_alternative_titles;
-- ALTER TABLE songs DROP CONSTRAINT IF EXISTS check_alternative_titles_max_length;

-- ============================================================================
-- STEP 7: Clean up any RLS policies related to CCLI
-- ============================================================================

-- Drop any RLS policies that were created for CCLI tables (they're dropped with tables)
-- This is just for documentation

-- ============================================================================
-- VERIFICATION: Check what CCLI objects remain
-- ============================================================================

-- After running this script, you can verify removal with:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE '%ccli%';

-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name LIKE '%ccli%';

-- Commit the transaction
COMMIT;

-- ============================================================================
-- SUMMARY OF REMOVED OBJECTS:
-- 
-- Tables:
--   - ccli_sources
--   - ccli_mappings
--   - song_ccli_matches
-- 
-- Views:
--   - top_popular_songs
--   - ccli_song_view (materialized)
-- 
-- Functions:
--   - All CCLI search and matching functions
--   - Popularity tracking functions
-- 
-- Columns from songs table:
--   - popularity_rank
--   - popularity_source
--   - popularity_updated_at
-- 
-- Indexes:
--   - All CCLI-related indexes
-- 
-- Note: Alternative titles feature is preserved by default
-- ============================================================================