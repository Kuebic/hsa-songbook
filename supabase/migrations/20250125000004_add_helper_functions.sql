-- Migration: Helper Functions and RPC Endpoints
-- Description: Creates helper functions for permissions, moderation, and common operations
-- Author: HSA Songbook Team
-- Date: 2025-01-25

BEGIN;

-- ==========================================
-- PERMISSION CHECK FUNCTIONS
-- ==========================================

-- Check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := false;
BEGIN
  -- Check for admin override (admins have all permissions)
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
    AND role = 'admin'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RETURN true;
  END IF;

  -- Check for direct user permission
  IF EXISTS (
    SELECT 1 FROM public.user_permissions up
    JOIN public.permissions p ON p.id = up.permission_id
    WHERE up.user_id = p_user_id
    AND p.resource = p_resource
    AND p.action = p_action
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
  ) THEN
    RETURN true;
  END IF;

  -- Check for permission through custom roles
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.custom_roles cr ON cr.name = ur.role::text
    JOIN public.permissions p ON p.id::text = ANY(
      SELECT jsonb_array_elements_text(cr.permissions)
    )
    WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND p.resource = p_resource
    AND p.action = p_action
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) THEN
    RETURN true;
  END IF;

  -- Check for moderator permissions
  IF p_resource IN ('songs', 'arrangements', 'users', 'reports') 
    AND p_action IN ('moderate', 'update', 'delete')
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = p_user_id
      AND role = 'moderator'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(
  p_user_id UUID
) RETURNS TABLE(
  resource TEXT,
  action TEXT,
  source TEXT  -- 'direct', 'role', 'custom_role', 'admin'
) AS $$
BEGIN
  -- Admin permissions (all)
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
    AND role = 'admin'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RETURN QUERY
    SELECT '*'::TEXT, '*'::TEXT, 'admin'::TEXT;
    RETURN;
  END IF;

  -- Direct permissions
  RETURN QUERY
  SELECT p.resource, p.action, 'direct'::TEXT
  FROM public.user_permissions up
  JOIN public.permissions p ON p.id = up.permission_id
  WHERE up.user_id = p_user_id
  AND (up.expires_at IS NULL OR up.expires_at > NOW());

  -- Role-based permissions (moderator)
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
    AND role = 'moderator'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RETURN QUERY
    SELECT 'songs'::TEXT, 'moderate'::TEXT, 'role'::TEXT
    UNION ALL
    SELECT 'arrangements'::TEXT, 'moderate'::TEXT, 'role'::TEXT
    UNION ALL
    SELECT 'users'::TEXT, 'moderate'::TEXT, 'role'::TEXT
    UNION ALL
    SELECT 'reports'::TEXT, 'view'::TEXT, 'role'::TEXT
    UNION ALL
    SELECT 'reports'::TEXT, 'resolve'::TEXT, 'role'::TEXT;
  END IF;

  -- Custom role permissions
  RETURN QUERY
  SELECT p.resource, p.action, 'custom_role'::TEXT
  FROM public.user_roles ur
  JOIN public.custom_roles cr ON cr.name = ur.role::text
  JOIN public.permissions p ON p.id::text = ANY(
    SELECT jsonb_array_elements_text(cr.permissions)
  )
  WHERE ur.user_id = p_user_id
  AND ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- MODERATION QUEUE FUNCTION
-- ==========================================

-- Get moderation queue with filtering
CREATE OR REPLACE FUNCTION public.get_moderation_queue(
  filter_status TEXT DEFAULT NULL,
  filter_type TEXT DEFAULT NULL
) RETURNS TABLE(
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
  WITH combined_content AS (
    -- Songs
    SELECT 
      s.id,
      s.id as content_id,
      'song'::TEXT as content_type,
      s.title,
      s.created_by as creator_id,
      u.email as creator_email,
      COALESCE(s.moderation_status, 'pending') as status,
      s.created_at,
      GREATEST(s.created_at, s.updated_at) as last_modified
    FROM public.songs s
    LEFT JOIN public.users u ON u.id = s.created_by
    WHERE (filter_type IS NULL OR filter_type = 'song')
    AND (filter_status IS NULL OR s.moderation_status = filter_status)
    
    UNION ALL
    
    -- Arrangements
    SELECT 
      a.id,
      a.id as content_id,
      'arrangement'::TEXT as content_type,
      a.name as title,
      a.created_by as creator_id,
      u.email as creator_email,
      COALESCE(a.moderation_status, 'pending') as status,
      a.created_at,
      GREATEST(a.created_at, a.updated_at) as last_modified
    FROM public.arrangements a
    LEFT JOIN public.users u ON u.id = a.created_by
    WHERE (filter_type IS NULL OR filter_type = 'arrangement')
    AND (filter_status IS NULL OR a.moderation_status = filter_status)
  )
  SELECT 
    c.id,
    c.content_id,
    c.content_type,
    c.title,
    c.creator_id,
    c.creator_email,
    c.status,
    COUNT(r.id) as report_count,
    c.created_at,
    c.last_modified
  FROM combined_content c
  LEFT JOIN public.content_reports r ON 
    r.content_id::uuid = c.content_id
    AND r.content_type = c.content_type
    AND r.status = 'pending'
  GROUP BY 
    c.id, c.content_id, c.content_type, c.title, 
    c.creator_id, c.creator_email, c.status, 
    c.created_at, c.last_modified
  ORDER BY 
    report_count DESC,
    c.last_modified DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- MODERATION ACTION FUNCTION
-- ==========================================

-- Perform moderation action
CREATE OR REPLACE FUNCTION public.perform_moderation_action(
  p_content_id UUID,
  p_content_type TEXT,
  p_action TEXT,  -- 'approve', 'reject', 'flag'
  p_note TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_previous_status TEXT;
  v_new_status TEXT;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check permission
  IF NOT check_user_permission(v_user_id, p_content_type || 's', 'moderate') THEN
    RAISE EXCEPTION 'Insufficient permissions to moderate content';
  END IF;

  -- Map action to status
  v_new_status := CASE p_action
    WHEN 'approve' THEN 'approved'
    WHEN 'reject' THEN 'rejected'
    WHEN 'flag' THEN 'flagged'
    ELSE p_action
  END;

  -- Update content based on type
  IF p_content_type = 'song' THEN
    SELECT moderation_status INTO v_previous_status
    FROM public.songs WHERE id = p_content_id;
    
    UPDATE public.songs
    SET 
      moderation_status = v_new_status,
      moderated_by = v_user_id,
      moderated_at = NOW(),
      moderation_note = p_note
    WHERE id = p_content_id;
    
  ELSIF p_content_type = 'arrangement' THEN
    SELECT moderation_status INTO v_previous_status
    FROM public.arrangements WHERE id = p_content_id;
    
    UPDATE public.arrangements
    SET 
      moderation_status = v_new_status,
      moderated_by = v_user_id,
      moderated_at = NOW(),
      moderation_note = p_note
    WHERE id = p_content_id;
  ELSE
    RAISE EXCEPTION 'Invalid content type: %', p_content_type;
  END IF;

  -- Log the action
  INSERT INTO public.moderation_log (
    content_id,
    content_type,
    action,
    previous_status,
    new_status,
    note,
    performed_by,
    performed_at
  ) VALUES (
    p_content_id,
    p_content_type,
    p_action,
    v_previous_status,
    v_new_status,
    p_note,
    v_user_id,
    NOW()
  );

  -- If approved, mark related reports as resolved
  IF p_action = 'approve' THEN
    UPDATE public.content_reports
    SET 
      status = 'resolved',
      resolved_by = v_user_id,
      resolved_at = NOW(),
      resolution = 'Content approved'
    WHERE content_id::uuid = p_content_id
    AND content_type = p_content_type
    AND status = 'pending';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- STATISTICS FUNCTIONS
-- ==========================================

-- Get moderation statistics
CREATE OR REPLACE FUNCTION public.get_moderation_stats()
RETURNS TABLE(
  pending_songs BIGINT,
  pending_arrangements BIGINT,
  flagged_content BIGINT,
  pending_reports BIGINT,
  approved_today BIGINT,
  rejected_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.songs WHERE moderation_status = 'pending')::BIGINT as pending_songs,
    (SELECT COUNT(*) FROM public.arrangements WHERE moderation_status = 'pending')::BIGINT as pending_arrangements,
    (SELECT COUNT(*) FROM public.songs WHERE moderation_status = 'flagged')::BIGINT +
    (SELECT COUNT(*) FROM public.arrangements WHERE moderation_status = 'flagged')::BIGINT as flagged_content,
    (SELECT COUNT(*) FROM public.content_reports WHERE status = 'pending')::BIGINT as pending_reports,
    (SELECT COUNT(*) FROM public.moderation_log 
     WHERE action = 'approve' 
     AND performed_at >= CURRENT_DATE)::BIGINT as approved_today,
    (SELECT COUNT(*) FROM public.moderation_log 
     WHERE action = 'reject' 
     AND performed_at >= CURRENT_DATE)::BIGINT as rejected_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- SEARCH HELPER FUNCTIONS
-- ==========================================

-- Full text search for songs
CREATE OR REPLACE FUNCTION public.search_songs(
  search_query TEXT,
  limit_count INTEGER DEFAULT 50
) RETURNS TABLE(
  id UUID,
  title TEXT,
  artist TEXT,
  slug TEXT,
  themes TEXT[],
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.artist,
    s.slug,
    s.themes,
    GREATEST(
      similarity(s.title, search_query),
      COALESCE(similarity(s.artist, search_query), 0),
      COALESCE((
        SELECT MAX(similarity(alt_title, search_query))
        FROM unnest(s.alternative_titles) as alt_title
      ), 0)
    ) as rank
  FROM public.songs s
  WHERE s.is_public = true
  AND (s.moderation_status IS NULL OR s.moderation_status NOT IN ('rejected', 'flagged'))
  AND (
    s.title % search_query
    OR s.artist % search_query
    OR EXISTS (
      SELECT 1 FROM unnest(s.alternative_titles) as alt_title
      WHERE alt_title % search_query
    )
  )
  ORDER BY rank DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- CLEANUP FUNCTIONS
-- ==========================================

-- Clean up expired permissions and roles
CREATE OR REPLACE FUNCTION public.cleanup_expired_permissions()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_temp_count INTEGER := 0;
BEGIN
  -- Delete expired direct permissions
  DELETE FROM public.user_permissions
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Deactivate expired roles
  UPDATE public.user_roles
  SET is_active = false
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW()
  AND is_active = true;
  
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_temp_count;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.check_user_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_moderation_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_moderation_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_moderation_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_songs TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_permissions TO authenticated;

COMMIT;