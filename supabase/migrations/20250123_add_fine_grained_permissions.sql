-- Migration: Fine-Grained Permissions System
-- Date: 2025-01-23
-- Description: Adds advanced permission system with custom roles and resource-level controls

-- ========================================
-- PART 1: BASIC RBAC INFRASTRUCTURE (from Phase 1)
-- ========================================

-- User roles table (basic roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    UNIQUE(user_id, role)
);

-- Audit log for role changes
CREATE TABLE IF NOT EXISTS public.role_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('grant', 'revoke', 'expire', 'reactivate')),
    role TEXT NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    metadata JSONB
);

-- ========================================
-- PART 2: FINE-GRAINED PERMISSIONS
-- ========================================

-- Permission definitions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('global', 'type', 'resource', 'own')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resource, action, scope)
);

-- Custom roles (extends basic roles from Phase 1)
CREATE TABLE IF NOT EXISTS public.custom_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- Role inheritance
CREATE TABLE IF NOT EXISTS public.role_inheritance (
    child_role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    parent_role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (child_role_id, parent_role_id),
    CHECK (child_role_id != parent_role_id)
);

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    effect TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
    conditions JSONB,
    resource_id UUID,  -- For resource-specific permissions
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id, resource_id)
);

-- Direct user permissions (overrides roles)
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    effect TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
    conditions JSONB,
    resource_id UUID,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    reason TEXT,
    UNIQUE(user_id, permission_id, resource_id)
);

-- Permission groups for users
CREATE TABLE IF NOT EXISTS public.permission_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Group members
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.permission_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    added_by UUID REFERENCES auth.users(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- Group roles
CREATE TABLE IF NOT EXISTS public.group_roles (
    group_id UUID REFERENCES public.permission_groups(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, role_id)
);

-- User custom roles assignment
CREATE TABLE IF NOT EXISTS public.user_custom_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    PRIMARY KEY (user_id, role_id)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON public.user_roles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON public.role_permissions(role_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_lookup ON public.user_permissions(user_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_permission_resource ON public.permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_role_inheritance ON public.role_inheritance(child_role_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_roles ON public.user_custom_roles(user_id, is_active);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to check specific permission
CREATE OR REPLACE FUNCTION public.check_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT,
    p_resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := false;
    v_effect TEXT;
BEGIN
    -- Check direct user permissions first (highest priority)
    SELECT effect INTO v_effect
    FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND p.resource = p_resource
      AND p.action = p_action
      AND (up.resource_id IS NULL OR up.resource_id = p_resource_id)
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ORDER BY 
        CASE WHEN up.resource_id = p_resource_id THEN 1 ELSE 2 END,
        CASE up.effect WHEN 'deny' THEN 1 ELSE 2 END
    LIMIT 1;

    -- If explicit deny, return false
    IF v_effect = 'deny' THEN
        RETURN false;
    ELSIF v_effect = 'allow' THEN
        RETURN true;
    END IF;

    -- Check role-based permissions (including inherited)
    WITH RECURSIVE role_hierarchy AS (
        -- Direct basic roles from user_roles
        SELECT ur.role::text as role_name, NULL::uuid as role_id
        FROM public.user_roles ur
        WHERE ur.user_id = p_user_id
          AND ur.is_active = true
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        
        UNION
        
        -- Custom roles assigned to user
        SELECT cr.name as role_name, cr.id as role_id
        FROM public.user_custom_roles ucr
        JOIN public.custom_roles cr ON ucr.role_id = cr.id
        WHERE ucr.user_id = p_user_id
          AND ucr.is_active = true
          AND cr.is_active = true
          AND (ucr.expires_at IS NULL OR ucr.expires_at > NOW())
        
        UNION
        
        -- Roles from groups
        SELECT cr.name as role_name, gr.role_id
        FROM public.group_members gm
        JOIN public.group_roles gr ON gm.group_id = gr.group_id
        JOIN public.custom_roles cr ON gr.role_id = cr.id
        JOIN public.permission_groups pg ON gm.group_id = pg.id
        WHERE gm.user_id = p_user_id
          AND pg.is_active = true
          AND cr.is_active = true
        
        UNION
        
        -- Inherited roles
        SELECT pcr.name as role_name, ri.parent_role_id as role_id
        FROM role_hierarchy rh
        JOIN public.role_inheritance ri ON rh.role_id = ri.child_role_id
        JOIN public.custom_roles pcr ON ri.parent_role_id = pcr.id
        WHERE rh.role_id IS NOT NULL
          AND pcr.is_active = true
    )
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM role_hierarchy rh
                JOIN public.custom_roles cr ON (rh.role_name = cr.name OR rh.role_id = cr.id)
                JOIN public.role_permissions rp ON cr.id = rp.role_id
                JOIN public.permissions p ON rp.permission_id = p.id
                WHERE p.resource = p_resource
                  AND p.action = p_action
                  AND rp.effect = 'deny'
                  AND (rp.resource_id IS NULL OR rp.resource_id = p_resource_id)
                  AND (rp.expires_at IS NULL OR rp.expires_at > NOW())
            ) THEN false
            WHEN EXISTS (
                SELECT 1 
                FROM role_hierarchy rh
                JOIN public.custom_roles cr ON (rh.role_name = cr.name OR rh.role_id = cr.id)
                JOIN public.role_permissions rp ON cr.id = rp.role_id
                JOIN public.permissions p ON rp.permission_id = p.id
                WHERE p.resource = p_resource
                  AND p.action = p_action
                  AND rp.effect = 'allow'
                  AND (rp.resource_id IS NULL OR rp.resource_id = p_resource_id)
                  AND (rp.expires_at IS NULL OR rp.expires_at > NOW())
            ) THEN true
            -- Check if basic role has implicit permission
            WHEN EXISTS (
                SELECT 1 FROM role_hierarchy rh
                WHERE rh.role_name = 'admin'
            ) THEN true  -- Admins have all permissions by default
            WHEN p_resource = 'song' AND p_action = 'approve' AND EXISTS (
                SELECT 1 FROM role_hierarchy rh
                WHERE rh.role_name IN ('admin', 'moderator')
            ) THEN true  -- Moderators can approve songs
            ELSE false
        END INTO v_has_permission;

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get all effective permissions for a user
CREATE OR REPLACE FUNCTION public.get_effective_permissions(p_user_id UUID)
RETURNS TABLE (
    resource TEXT,
    action TEXT,
    effect TEXT,
    scope TEXT,
    resource_id UUID,
    source TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_perms AS (
        -- Direct user permissions
        SELECT 
            p.resource,
            p.action,
            up.effect,
            p.scope,
            up.resource_id,
            'direct'::TEXT as source
        FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = p_user_id
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
    ),
    role_perms AS (
        -- Role-based permissions (with inheritance)
        WITH RECURSIVE role_hierarchy AS (
            -- Basic roles
            SELECT ur.role::text as role_name, NULL::uuid as role_id
            FROM public.user_roles ur
            WHERE ur.user_id = p_user_id
              AND ur.is_active = true
              AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
            
            UNION
            
            -- Custom roles
            SELECT cr.name, ucr.role_id
            FROM public.user_custom_roles ucr
            JOIN public.custom_roles cr ON ucr.role_id = cr.id
            WHERE ucr.user_id = p_user_id
              AND ucr.is_active = true
              AND cr.is_active = true
            
            UNION
            
            -- Inherited roles
            SELECT pcr.name, ri.parent_role_id
            FROM role_hierarchy rh
            JOIN public.role_inheritance ri ON rh.role_id = ri.child_role_id
            JOIN public.custom_roles pcr ON ri.parent_role_id = pcr.id
            WHERE rh.role_id IS NOT NULL
        )
        SELECT 
            p.resource,
            p.action,
            rp.effect,
            p.scope,
            rp.resource_id,
            'role'::TEXT as source
        FROM role_hierarchy rh
        JOIN public.custom_roles cr ON (rh.role_name = cr.name OR rh.role_id = cr.id)
        JOIN public.role_permissions rp ON cr.id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE (rp.expires_at IS NULL OR rp.expires_at > NOW())
    )
    -- Combine with user permissions taking priority
    SELECT DISTINCT ON (resource, action, resource_id)
        resource,
        action,
        effect,
        scope,
        resource_id,
        source
    FROM (
        SELECT * FROM user_perms
        UNION ALL
        SELECT * FROM role_perms
    ) combined
    ORDER BY 
        resource, 
        action, 
        resource_id,
        CASE source WHEN 'direct' THEN 1 ELSE 2 END,
        CASE effect WHEN 'deny' THEN 1 ELSE 2 END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ========================================
-- AUTH HOOK FOR JWT CLAIMS
-- ========================================

-- Custom access token hook to add role and permission claims
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    claims jsonb;
    user_role TEXT;
    user_custom_roles TEXT[];
    user_groups TEXT[];
    can_moderate BOOLEAN := false;
    can_admin BOOLEAN := false;
BEGIN
    -- Extract existing claims
    claims := event->'claims';
    
    -- Get basic role
    SELECT role INTO user_role 
    FROM public.user_roles 
    WHERE user_id = (event->>'user_id')::uuid 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY 
        CASE role 
            WHEN 'admin' THEN 1 
            WHEN 'moderator' THEN 2 
            ELSE 3 
        END
    LIMIT 1;
    
    -- Get custom roles
    SELECT ARRAY_AGG(cr.name) INTO user_custom_roles
    FROM public.user_custom_roles ucr
    JOIN public.custom_roles cr ON ucr.role_id = cr.id
    WHERE ucr.user_id = (event->>'user_id')::uuid
      AND ucr.is_active = true
      AND cr.is_active = true
      AND (ucr.expires_at IS NULL OR ucr.expires_at > NOW());
    
    -- Get permission groups
    SELECT ARRAY_AGG(pg.name) INTO user_groups
    FROM public.group_members gm
    JOIN public.permission_groups pg ON gm.group_id = pg.id
    WHERE gm.user_id = (event->>'user_id')::uuid
      AND pg.is_active = true;
    
    -- Set permission flags
    IF user_role = 'admin' THEN
        can_admin := true;
        can_moderate := true;
    ELSIF user_role = 'moderator' THEN
        can_moderate := true;
    END IF;
    
    -- Add claims to JWT
    IF user_role IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    ELSE
        claims := jsonb_set(claims, '{user_role}', '"user"'::jsonb);
    END IF;
    
    claims := jsonb_set(claims, '{can_moderate}', to_jsonb(can_moderate));
    claims := jsonb_set(claims, '{can_admin}', to_jsonb(can_admin));
    
    -- Add custom roles array (keep it small for JWT size)
    IF user_custom_roles IS NOT NULL AND array_length(user_custom_roles, 1) > 0 THEN
        -- Limit to first 5 custom roles to keep JWT size manageable
        claims := jsonb_set(claims, '{custom_roles}', to_jsonb(user_custom_roles[1:5]));
    END IF;
    
    -- Add permission groups (limit to first 3)
    IF user_groups IS NOT NULL AND array_length(user_groups, 1) > 0 THEN
        claims := jsonb_set(claims, '{permission_groups}', to_jsonb(user_groups[1:3]));
    END IF;
    
    -- Update the event with modified claims
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
END;
$$;

-- ========================================
-- SEED DEFAULT PERMISSIONS
-- ========================================

INSERT INTO public.permissions (name, resource, action, scope, description) VALUES
    -- Songs
    ('songs.create', 'song', 'create', 'global', 'Create new songs'),
    ('songs.read', 'song', 'read', 'global', 'View songs'),
    ('songs.update.own', 'song', 'update', 'own', 'Edit own songs'),
    ('songs.update.all', 'song', 'update', 'global', 'Edit any song'),
    ('songs.delete.own', 'song', 'delete', 'own', 'Delete own songs'),
    ('songs.delete.all', 'song', 'delete', 'global', 'Delete any song'),
    ('songs.approve', 'song', 'approve', 'global', 'Approve songs'),
    ('songs.flag', 'song', 'flag', 'global', 'Flag songs for review'),
    
    -- Arrangements
    ('arrangements.create', 'arrangement', 'create', 'global', 'Create arrangements'),
    ('arrangements.read', 'arrangement', 'read', 'global', 'View arrangements'),
    ('arrangements.update.own', 'arrangement', 'update', 'own', 'Edit own arrangements'),
    ('arrangements.update.all', 'arrangement', 'update', 'global', 'Edit any arrangement'),
    ('arrangements.delete.own', 'arrangement', 'delete', 'own', 'Delete own arrangements'),
    ('arrangements.delete.all', 'arrangement', 'delete', 'global', 'Delete any arrangement'),
    ('arrangements.approve', 'arrangement', 'approve', 'global', 'Approve arrangements'),
    
    -- Setlists
    ('setlists.create', 'setlist', 'create', 'global', 'Create setlists'),
    ('setlists.read.own', 'setlist', 'read', 'own', 'View own setlists'),
    ('setlists.read.all', 'setlist', 'read', 'global', 'View any setlist'),
    ('setlists.update.own', 'setlist', 'update', 'own', 'Edit own setlists'),
    ('setlists.update.all', 'setlist', 'update', 'global', 'Edit any setlist'),
    ('setlists.delete.own', 'setlist', 'delete', 'own', 'Delete own setlists'),
    ('setlists.delete.all', 'setlist', 'delete', 'global', 'Delete any setlist'),
    
    -- Users
    ('users.read', 'user', 'read', 'global', 'View user list'),
    ('users.update', 'user', 'update', 'global', 'Update user details'),
    ('users.assign_role', 'user', 'assign_role', 'global', 'Assign roles to users'),
    ('users.revoke_role', 'user', 'revoke_role', 'global', 'Revoke user roles'),
    
    -- Roles
    ('roles.create', 'role', 'create', 'global', 'Create custom roles'),
    ('roles.read', 'role', 'read', 'global', 'View roles'),
    ('roles.update', 'role', 'update', 'global', 'Update roles'),
    ('roles.delete', 'role', 'delete', 'global', 'Delete custom roles'),
    
    -- System
    ('system.manage_roles', 'system', 'create', 'global', 'Create and manage custom roles'),
    ('system.view_audit', 'system', 'read', 'global', 'View audit logs'),
    ('system.export', 'system', 'export', 'global', 'Export data'),
    ('system.import', 'system', 'import', 'global', 'Import data'),
    ('system.bulk_edit', 'system', 'bulk_edit', 'global', 'Perform bulk operations')
ON CONFLICT (resource, action, scope) DO NOTHING;

-- Create default custom roles with permissions
DO $$
DECLARE
    admin_role_id UUID;
    moderator_role_id UUID;
    user_role_id UUID;
BEGIN
    -- Create admin role
    INSERT INTO public.custom_roles (name, description, is_system)
    VALUES ('admin', 'System Administrator', true)
    ON CONFLICT (name) DO UPDATE SET is_system = true
    RETURNING id INTO admin_role_id;
    
    -- Create moderator role
    INSERT INTO public.custom_roles (name, description, is_system)
    VALUES ('moderator', 'Content Moderator', true)
    ON CONFLICT (name) DO UPDATE SET is_system = true
    RETURNING id INTO moderator_role_id;
    
    -- Create user role
    INSERT INTO public.custom_roles (name, description, is_system)
    VALUES ('user', 'Regular User', true)
    ON CONFLICT (name) DO UPDATE SET is_system = true
    RETURNING id INTO user_role_id;
    
    -- Admin gets all permissions
    INSERT INTO public.role_permissions (role_id, permission_id, effect)
    SELECT admin_role_id, p.id, 'allow'
    FROM public.permissions p
    ON CONFLICT (role_id, permission_id, resource_id) DO NOTHING;
    
    -- Moderator gets specific permissions
    INSERT INTO public.role_permissions (role_id, permission_id, effect)
    SELECT moderator_role_id, p.id, 'allow'
    FROM public.permissions p
    WHERE p.name IN (
        'songs.read', 'songs.update.all', 'songs.approve', 'songs.flag',
        'arrangements.read', 'arrangements.update.all', 'arrangements.approve',
        'users.read', 'system.view_audit'
    )
    ON CONFLICT (role_id, permission_id, resource_id) DO NOTHING;
    
    -- Regular user gets basic permissions
    INSERT INTO public.role_permissions (role_id, permission_id, effect)
    SELECT user_role_id, p.id, 'allow'
    FROM public.permissions p
    WHERE p.name IN (
        'songs.read', 'songs.create', 'songs.update.own', 'songs.delete.own',
        'arrangements.read', 'arrangements.create', 'arrangements.update.own', 'arrangements.delete.own',
        'setlists.create', 'setlists.read.own', 'setlists.update.own', 'setlists.delete.own'
    )
    ON CONFLICT (role_id, permission_id, resource_id) DO NOTHING;
END $$;

-- ========================================
-- PERMISSIONS GRANTS
-- ========================================

-- Grant necessary permissions to auth admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT SELECT ON public.user_roles TO supabase_auth_admin;
GRANT SELECT ON public.user_custom_roles TO supabase_auth_admin;
GRANT SELECT ON public.custom_roles TO supabase_auth_admin;
GRANT SELECT ON public.group_members TO supabase_auth_admin;
GRANT SELECT ON public.permission_groups TO supabase_auth_admin;

-- Grant permissions to authenticated users
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.custom_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_effective_permissions TO authenticated;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read permissions
CREATE POLICY "Read permissions" ON public.permissions
    FOR SELECT USING (true);

-- Only admins can manage custom roles
CREATE POLICY "Admins manage roles" ON public.custom_roles
    FOR ALL USING (
        check_permission(auth.uid(), 'system', 'create')
    );

-- Users can read custom roles
CREATE POLICY "Read custom roles" ON public.custom_roles
    FOR SELECT USING (true);

-- Only admins can manage role permissions
CREATE POLICY "Admins manage role permissions" ON public.role_permissions
    FOR ALL USING (
        check_permission(auth.uid(), 'system', 'create')
    );

-- Only admins can manage user roles
CREATE POLICY "Admins manage user roles" ON public.user_roles
    FOR ALL USING (
        check_permission(auth.uid(), 'user', 'assign_role')
    );

-- Users can read their own roles
CREATE POLICY "Users read own roles" ON public.user_roles
    FOR SELECT USING (
        user_id = auth.uid() OR 
        check_permission(auth.uid(), 'user', 'read')
    );

-- Only admins can manage user permissions
CREATE POLICY "Admins manage user permissions" ON public.user_permissions
    FOR ALL USING (
        check_permission(auth.uid(), 'system', 'create')
    );

-- Users can read their own permissions
CREATE POLICY "Users read own permissions" ON public.user_permissions
    FOR SELECT USING (
        user_id = auth.uid() OR 
        check_permission(auth.uid(), 'user', 'read')
    );

-- Only admins can view audit log
CREATE POLICY "Admins view audit log" ON public.role_audit_log
    FOR SELECT USING (
        check_permission(auth.uid(), 'system', 'read')
    );

-- Only admins can manage permission groups
CREATE POLICY "Admins manage permission groups" ON public.permission_groups
    FOR ALL USING (
        check_permission(auth.uid(), 'system', 'create')
    );

-- Users can read permission groups
CREATE POLICY "Read permission groups" ON public.permission_groups
    FOR SELECT USING (true);

-- Only admins can manage group members
CREATE POLICY "Admins manage group members" ON public.group_members
    FOR ALL USING (
        check_permission(auth.uid(), 'system', 'create')
    );

-- Users can see groups they belong to
CREATE POLICY "Users see own groups" ON public.group_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        check_permission(auth.uid(), 'user', 'read')
    );

-- Only admins can manage group roles
CREATE POLICY "Admins manage group roles" ON public.group_roles
    FOR ALL USING (
        check_permission(auth.uid(), 'system', 'create')
    );

-- Only admins can manage user custom roles
CREATE POLICY "Admins manage user custom roles" ON public.user_custom_roles
    FOR ALL USING (
        check_permission(auth.uid(), 'user', 'assign_role')
    );

-- Users can see their own custom roles
CREATE POLICY "Users see own custom roles" ON public.user_custom_roles
    FOR SELECT USING (
        user_id = auth.uid() OR 
        check_permission(auth.uid(), 'user', 'read')
    );

-- ========================================
-- COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.permissions IS 'Defines all available permissions in the system';
COMMENT ON TABLE public.custom_roles IS 'Custom roles that can be created and assigned to users';
COMMENT ON TABLE public.role_permissions IS 'Maps permissions to roles with allow/deny effects';
COMMENT ON TABLE public.user_permissions IS 'Direct permission assignments to users, overrides role permissions';
COMMENT ON TABLE public.permission_groups IS 'Groups of users that share the same roles';
COMMENT ON FUNCTION public.check_permission IS 'Checks if a user has a specific permission on a resource';
COMMENT ON FUNCTION public.get_effective_permissions IS 'Returns all effective permissions for a user after resolving inheritance and overrides';
COMMENT ON FUNCTION public.custom_access_token_hook IS 'Auth hook that adds role and permission claims to JWT tokens';