-- Seed data for permission system testing
-- This file adds test data for the permission tables

-- ==========================================
-- TEST USERS (if not already present)
-- ==========================================

-- Note: These users should already exist from the main seed.sql
-- We're just ensuring they have proper roles

-- ==========================================
-- ASSIGN ROLES TO TEST USERS
-- ==========================================

-- Ensure we have an admin user
INSERT INTO public.user_roles (user_id, role, is_active, granted_at)
SELECT 
  id, 
  'admin'::public.user_role, 
  true, 
  NOW()
FROM public.users
WHERE email = 'admin@hsa-songbook.com'
ON CONFLICT DO NOTHING;

-- Ensure we have a moderator user  
INSERT INTO public.user_roles (user_id, role, is_active, granted_at)
SELECT 
  id, 
  'moderator'::public.user_role, 
  true, 
  NOW()
FROM public.users
WHERE email = 'moderator@hsa-songbook.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- CREATE CUSTOM ROLES
-- ==========================================

-- Content Creator role
INSERT INTO public.custom_roles (name, display_name, description, is_system, permissions)
VALUES (
  'content_creator',
  'Content Creator',
  'Can create and manage songs and arrangements',
  true,
  (
    SELECT jsonb_agg(id)
    FROM public.permissions
    WHERE (resource = 'songs' AND action IN ('create', 'read', 'update'))
    OR (resource = 'arrangements' AND action IN ('create', 'read', 'update'))
  )
)
ON CONFLICT (name) DO NOTHING;

-- Reviewer role
INSERT INTO public.custom_roles (name, display_name, description, is_system, permissions)
VALUES (
  'reviewer',
  'Content Reviewer',
  'Can review and rate content',
  true,
  (
    SELECT jsonb_agg(id)
    FROM public.permissions
    WHERE (resource IN ('songs', 'arrangements') AND action = 'read')
    OR (resource = 'reports' AND action = 'view')
  )
)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- ASSIGN PERMISSION GROUPS
-- ==========================================

-- Update permission groups with actual permission IDs
UPDATE public.permission_groups
SET permissions = (
  SELECT array_agg(id)
  FROM public.permissions
  WHERE resource = 'songs'
)
WHERE name = 'song_management';

UPDATE public.permission_groups
SET permissions = (
  SELECT array_agg(id)
  FROM public.permissions
  WHERE resource = 'arrangements'
)
WHERE name = 'arrangement_management';

UPDATE public.permission_groups
SET permissions = (
  SELECT array_agg(id)
  FROM public.permissions
  WHERE resource = 'setlists'
)
WHERE name = 'setlist_management';

UPDATE public.permission_groups
SET permissions = (
  SELECT array_agg(id)
  FROM public.permissions
  WHERE action IN ('moderate', 'view', 'resolve')
  AND resource IN ('songs', 'arrangements', 'users', 'reports')
)
WHERE name = 'moderation';

UPDATE public.permission_groups
SET permissions = (
  SELECT array_agg(id)
  FROM public.permissions
  WHERE resource = 'users'
)
WHERE name = 'user_management';

UPDATE public.permission_groups
SET permissions = (
  SELECT array_agg(id)
  FROM public.permissions
)
WHERE name = 'system_administration';

-- ==========================================
-- GRANT DIRECT PERMISSIONS (for testing)
-- ==========================================

-- Grant a specific user permission to create setlists (as an example)
INSERT INTO public.user_permissions (user_id, permission_id, granted_at)
SELECT 
  u.id,
  p.id,
  NOW()
FROM public.users u, public.permissions p
WHERE u.email = 'user@hsa-songbook.com'
AND p.resource = 'setlists' 
AND p.action = 'create'
ON CONFLICT DO NOTHING;

-- Grant temporary permission with expiration (for testing)
INSERT INTO public.user_permissions (user_id, permission_id, granted_at, expires_at)
SELECT 
  u.id,
  p.id,
  NOW(),
  NOW() + INTERVAL '30 days'
FROM public.users u, public.permissions p
WHERE u.email = 'user@hsa-songbook.com'
AND p.resource = 'songs' 
AND p.action = 'update'
ON CONFLICT DO NOTHING;

-- ==========================================
-- CREATE SAMPLE CONTENT REPORTS
-- ==========================================

-- Add some sample reports for testing moderation
INSERT INTO public.content_reports (
  content_id, 
  content_type, 
  reason, 
  description, 
  reported_by, 
  status,
  created_at
)
SELECT 
  s.id::text,
  'song',
  'incorrect',
  'The lyrics are incorrect in verse 2',
  u.id,
  'pending',
  NOW() - INTERVAL '2 days'
FROM public.songs s, public.users u
WHERE s.title LIKE '%Amazing%'
AND u.email = 'user@hsa-songbook.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.content_reports (
  content_id, 
  content_type, 
  reason, 
  description, 
  reported_by, 
  status,
  created_at
)
SELECT 
  a.id::text,
  'arrangement',
  'inappropriate',
  'Contains inappropriate chord progressions',
  u.id,
  'pending',
  NOW() - INTERVAL '1 day'
FROM public.arrangements a, public.users u
WHERE a.name LIKE '%Standard%'
AND u.email = 'user@hsa-songbook.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ==========================================
-- CREATE SAMPLE MODERATION LOG ENTRIES
-- ==========================================

-- Add some moderation history
INSERT INTO public.moderation_log (
  content_id,
  content_type,
  action,
  previous_status,
  new_status,
  note,
  performed_by,
  performed_at
)
SELECT 
  s.id::text,
  'song',
  'approve',
  'pending',
  'approved',
  'Verified lyrics are correct',
  u.id,
  NOW() - INTERVAL '5 days'
FROM public.songs s, public.users u
WHERE s.title LIKE '%Lord%'
AND u.email = 'moderator@hsa-songbook.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ==========================================
-- DISPLAY SUMMARY
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE 'Permission seed data loaded successfully';
  RAISE NOTICE 'Total permissions: %', (SELECT COUNT(*) FROM public.permissions);
  RAISE NOTICE 'Total custom roles: %', (SELECT COUNT(*) FROM public.custom_roles);
  RAISE NOTICE 'Total permission groups: %', (SELECT COUNT(*) FROM public.permission_groups);
  RAISE NOTICE 'Total user permissions: %', (SELECT COUNT(*) FROM public.user_permissions);
  RAISE NOTICE 'Total content reports: %', (SELECT COUNT(*) FROM public.content_reports);
  RAISE NOTICE 'Total moderation log entries: %', (SELECT COUNT(*) FROM public.moderation_log);
END $$;