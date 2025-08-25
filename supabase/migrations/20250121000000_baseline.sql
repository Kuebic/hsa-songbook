-- Baseline schema migration for HSA Songbook
-- Generated from existing production database

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- Create custom enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'moderator', 'user');

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    provider TEXT,
    provider_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users are viewable by everyone" 
    ON public.users FOR SELECT 
    USING (true);

CREATE POLICY "Users can update own profile" 
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);

-- ==========================================
-- SONGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    artist TEXT,
    alternative_titles TEXT[],
    lyrics JSONB,
    themes TEXT[],
    ccli TEXT,
    ccli_verified BOOLEAN DEFAULT false,
    primary_ccli_id TEXT,
    composition_year INTEGER,
    original_language TEXT,
    lyrics_source TEXT,
    lyrics_verified BOOLEAN DEFAULT false,
    source TEXT,
    notes TEXT,
    auto_conversion_enabled BOOLEAN DEFAULT true,
    default_arrangement_id UUID,
    is_public BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    rating_average NUMERIC(3,2),
    rating_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    moderation_status TEXT DEFAULT 'pending',
    moderated_at TIMESTAMPTZ,
    moderated_by UUID REFERENCES public.users(id),
    moderation_note TEXT
);

-- Enable RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Songs policies
CREATE POLICY "Public songs are viewable by everyone" 
    ON public.songs FOR SELECT 
    USING (is_public = true);

CREATE POLICY "Authenticated users can insert songs" 
    ON public.songs FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own songs" 
    ON public.songs FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own songs" 
    ON public.songs FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Create indexes
CREATE INDEX idx_songs_slug ON public.songs(slug);
CREATE INDEX idx_songs_title ON public.songs(title);
CREATE INDEX idx_songs_artist ON public.songs(artist);
CREATE INDEX idx_songs_created_by ON public.songs(created_by);
CREATE INDEX idx_songs_ccli ON public.songs(ccli);
CREATE INDEX idx_songs_themes ON public.songs USING GIN(themes);
CREATE INDEX idx_songs_alternative_titles ON public.songs USING GIN(alternative_titles);

-- ==========================================
-- ARRANGEMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.arrangements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    chord_data TEXT NOT NULL,
    description TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    key TEXT,
    tempo INTEGER,
    time_signature TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    rating_average NUMERIC(3,2),
    rating_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    moderation_status TEXT DEFAULT 'pending',
    moderated_at TIMESTAMPTZ,
    moderated_by UUID REFERENCES public.users(id),
    moderation_note TEXT,
    UNIQUE(song_id, slug)
);

-- Enable RLS
ALTER TABLE public.arrangements ENABLE ROW LEVEL SECURITY;

-- Arrangements policies
CREATE POLICY "Public arrangements are viewable by everyone"
    ON public.arrangements FOR SELECT
    USING (is_public = true);

CREATE POLICY "Authenticated users can insert arrangements" 
    ON public.arrangements FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own arrangements" 
    ON public.arrangements FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own arrangements" 
    ON public.arrangements FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Create indexes
CREATE INDEX idx_arrangements_song_id ON public.arrangements(song_id);
CREATE INDEX idx_arrangements_slug ON public.arrangements(slug);
CREATE INDEX idx_arrangements_created_by ON public.arrangements(created_by);
CREATE INDEX idx_arrangements_key ON public.arrangements(key);
CREATE INDEX idx_arrangements_tags ON public.arrangements USING GIN(tags);

-- Add foreign key for default arrangement
ALTER TABLE public.songs 
    ADD CONSTRAINT songs_default_arrangement_id_fkey 
    FOREIGN KEY (default_arrangement_id) 
    REFERENCES public.arrangements(id) 
    ON DELETE SET NULL;

-- ==========================================
-- SETLISTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.setlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    share_id TEXT UNIQUE,
    metadata JSONB,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

-- Setlists policies
CREATE POLICY "Public setlists are viewable by everyone"
    ON public.setlists FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can view own setlists"
    ON public.setlists FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can insert setlists" 
    ON public.setlists FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own setlists" 
    ON public.setlists FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own setlists" 
    ON public.setlists FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Create indexes
CREATE INDEX idx_setlists_created_by ON public.setlists(created_by);
CREATE INDEX idx_setlists_share_id ON public.setlists(share_id);
CREATE INDEX idx_setlists_is_public ON public.setlists(is_public);

-- ==========================================
-- SETLIST_ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.setlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
    arrangement_id UUID REFERENCES public.arrangements(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    transpose_steps INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(setlist_id, position)
);

-- Enable RLS
ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;

-- Setlist items policies
CREATE POLICY "Setlist items viewable by setlist viewers"
    ON public.setlist_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.setlists 
            WHERE id = setlist_items.setlist_id 
            AND (is_public = true OR created_by = auth.uid())
        )
    );

CREATE POLICY "Setlist owners can manage items"
    ON public.setlist_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.setlists 
            WHERE id = setlist_items.setlist_id 
            AND created_by = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX idx_setlist_items_setlist_id ON public.setlist_items(setlist_id);
CREATE INDEX idx_setlist_items_arrangement_id ON public.setlist_items(arrangement_id);
CREATE INDEX idx_setlist_items_position ON public.setlist_items(setlist_id, position);

-- ==========================================
-- REVIEWS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(song_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert reviews" 
    ON public.reviews FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" 
    ON public.reviews FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" 
    ON public.reviews FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_reviews_song_id ON public.reviews(song_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- ==========================================
-- USER_ROLES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES public.users(id),
    expires_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "User roles viewable by admins"
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

CREATE POLICY "User can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_is_active ON public.user_roles(is_active);

-- ==========================================
-- CONTENT_REPORTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('song', 'arrangement', 'review')),
    reason TEXT NOT NULL,
    description TEXT,
    reported_by UUID REFERENCES public.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Content reports policies
CREATE POLICY "Users can report content"
    ON public.content_reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Moderators can view all reports"
    ON public.content_reports FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
            AND is_active = true
        )
    );

CREATE POLICY "Moderators can update reports"
    ON public.content_reports FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
            AND is_active = true
        )
    );

-- Create indexes
CREATE INDEX idx_content_reports_content_id ON public.content_reports(content_id);
CREATE INDEX idx_content_reports_content_type ON public.content_reports(content_type);
CREATE INDEX idx_content_reports_status ON public.content_reports(status);
CREATE INDEX idx_content_reports_reported_by ON public.content_reports(reported_by);

-- ==========================================
-- MODERATION_LOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.moderation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    note TEXT,
    metadata JSONB,
    performed_by UUID REFERENCES public.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- Moderation log policies
CREATE POLICY "Moderators can view moderation log"
    ON public.moderation_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
            AND is_active = true
        )
    );

CREATE POLICY "System can insert moderation log"
    ON public.moderation_log FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
            AND is_active = true
        )
    );

-- Create indexes
CREATE INDEX idx_moderation_log_content_id ON public.moderation_log(content_id);
CREATE INDEX idx_moderation_log_content_type ON public.moderation_log(content_type);
CREATE INDEX idx_moderation_log_performed_by ON public.moderation_log(performed_by);
CREATE INDEX idx_moderation_log_performed_at ON public.moderation_log(performed_at);

-- ==========================================
-- ROLE_AUDIT_LOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.role_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    role public.user_role NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'expired')),
    reason TEXT,
    metadata JSONB,
    performed_by UUID REFERENCES public.users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Role audit log policies
CREATE POLICY "Admins can view role audit log"
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

CREATE POLICY "System can insert role audit log"
    ON public.role_audit_log FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Create indexes
CREATE INDEX idx_role_audit_log_user_id ON public.role_audit_log(user_id);
CREATE INDEX idx_role_audit_log_role ON public.role_audit_log(role);
CREATE INDEX idx_role_audit_log_action ON public.role_audit_log(action);
CREATE INDEX idx_role_audit_log_performed_by ON public.role_audit_log(performed_by);

-- ==========================================
-- VIEWS
-- ==========================================

-- Song statistics view
CREATE OR REPLACE VIEW public.song_stats AS
SELECT 
    s.id,
    s.title,
    s.artist,
    s.themes,
    s.views,
    s.rating_average,
    s.rating_count,
    COUNT(DISTINCT a.id) as arrangement_count,
    COUNT(DISTINCT si.setlist_id) as setlist_count
FROM public.songs s
LEFT JOIN public.arrangements a ON s.id = a.song_id
LEFT JOIN public.setlist_items si ON a.id = si.arrangement_id
GROUP BY s.id;

-- Songs with alternative titles view
CREATE OR REPLACE VIEW public.songs_with_alt_titles AS
SELECT 
    s.*,
    ARRAY_APPEND(COALESCE(s.alternative_titles, ARRAY[]::TEXT[]), s.title) as all_titles,
    COALESCE(array_length(s.alternative_titles, 1), 0) as alt_title_count,
    s.alternative_titles IS NOT NULL AND array_length(s.alternative_titles, 1) > 0 as has_alternative_titles
FROM public.songs s;

-- User statistics view
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    COUNT(DISTINCT s.id) as songs_created,
    COUNT(DISTINCT a.id) as arrangements_created,
    COUNT(DISTINCT sl.id) as setlists_created,
    COUNT(DISTINCT r.id) as reviews_written
FROM public.users u
LEFT JOIN public.songs s ON u.id = s.created_by
LEFT JOIN public.arrangements a ON u.id = a.created_by
LEFT JOIN public.setlists sl ON u.id = sl.created_by
LEFT JOIN public.reviews r ON u.id = r.user_id
GROUP BY u.id;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION public.check_admin_role(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = user_id_param 
        AND role = 'admin' 
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate share ID
CREATE OR REPLACE FUNCTION public.generate_share_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to find CCLI matches
CREATE OR REPLACE FUNCTION public.find_ccli_matches(
    search_title TEXT,
    similarity_threshold FLOAT DEFAULT 0.3,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    ccli TEXT,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.ccli,
        similarity(s.title, search_title) as similarity_score
    FROM public.songs s
    WHERE s.ccli IS NOT NULL
    AND similarity(s.title, search_title) > similarity_threshold
    ORDER BY similarity_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to grant user role
CREATE OR REPLACE FUNCTION public.grant_user_role(
    target_user_id UUID,
    new_role public.user_role,
    grant_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    grantor_id UUID;
BEGIN
    grantor_id := auth.uid();
    
    -- Check if grantor has admin role
    IF NOT check_admin_role(grantor_id) THEN
        RAISE EXCEPTION 'Only admins can grant roles';
    END IF;
    
    -- Deactivate any existing roles for this user
    UPDATE public.user_roles 
    SET is_active = false 
    WHERE user_id = target_user_id AND is_active = true;
    
    -- Insert new role
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (target_user_id, new_role, grantor_id);
    
    -- Log the action
    INSERT INTO public.role_audit_log (user_id, role, action, reason, performed_by)
    VALUES (target_user_id, new_role, 'granted', grant_reason, grantor_id);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke user role
CREATE OR REPLACE FUNCTION public.revoke_user_role(
    target_user_id UUID,
    revoke_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    grantor_id UUID;
    current_role public.user_role;
BEGIN
    grantor_id := auth.uid();
    
    -- Check if grantor has admin role
    IF NOT check_admin_role(grantor_id) THEN
        RAISE EXCEPTION 'Only admins can revoke roles';
    END IF;
    
    -- Get current role
    SELECT role INTO current_role
    FROM public.user_roles 
    WHERE user_id = target_user_id AND is_active = true
    LIMIT 1;
    
    -- Deactivate role
    UPDATE public.user_roles 
    SET is_active = false 
    WHERE user_id = target_user_id AND is_active = true;
    
    -- Log the action
    IF current_role IS NOT NULL THEN
        INSERT INTO public.role_audit_log (user_id, role, action, reason, performed_by)
        VALUES (target_user_id, current_role, 'revoked', revoke_reason, grantor_id);
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON public.songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arrangements_updated_at BEFORE UPDATE ON public.arrangements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_setlists_updated_at BEFORE UPDATE ON public.setlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update song ratings
CREATE OR REPLACE FUNCTION public.update_song_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.songs
    SET 
        rating_average = (SELECT AVG(rating) FROM public.reviews WHERE song_id = NEW.song_id),
        rating_count = (SELECT COUNT(*) FROM public.reviews WHERE song_id = NEW.song_id)
    WHERE id = NEW.song_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for song ratings
CREATE TRIGGER update_song_ratings_on_review
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_song_ratings();

COMMIT;