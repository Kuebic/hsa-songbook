-- HSA Songbook Seed Data: Users and Authentication
-- Creates additional test user accounts with different roles and scenarios
-- This file complements the main seed.sql with more user testing scenarios

BEGIN;

-- ==========================================
-- ADDITIONAL TEST USERS
-- ==========================================
-- These users extend the base set in seed.sql for comprehensive role testing

INSERT INTO public.users (id, email, username, full_name, created_at, metadata) VALUES
    -- Content creators with different backgrounds
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'musician@hsa-songbook.test', 'musician_mary', 'Mary Thompson', NOW() - INTERVAL '6 months', '{"bio": "Professional worship leader", "instruments": ["piano", "guitar"], "years_experience": 15}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'songwriter@hsa-songbook.test', 'songwriter_steve', 'Steve Johnson', NOW() - INTERVAL '3 months', '{"bio": "Contemporary Christian songwriter", "published_works": 25, "years_active": 8}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'youth_leader@hsa-songbook.test', 'youth_pastor_jen', 'Jennifer Martinez', NOW() - INTERVAL '8 months', '{"ministry_focus": "youth", "preferred_genres": ["contemporary", "rock"], "church_size": "medium"}'),
    
    -- International users
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'spanish@hsa-songbook.test', 'carlos_adoracion', 'Carlos Rodriguez', NOW() - INTERVAL '4 months', '{"languages": ["es", "en"], "region": "Latin America", "ministry_type": "bilingual"}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'mandarin@hsa-songbook.test', 'chinese_worship', '李明华 (Li Minghua)', NOW() - INTERVAL '2 months', '{"languages": ["zh", "en"], "region": "Asia Pacific", "church_type": "international"}'),
    
    -- Different experience levels
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'newbie@hsa-songbook.test', 'beginner_bob', 'Bob Wilson', NOW() - INTERVAL '2 weeks', '{"experience_level": "beginner", "learning_goals": ["basic chords", "song leading"], "instrument": "acoustic_guitar"}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'veteran@hsa-songbook.test', 'veteran_grace', 'Grace Anderson', NOW() - INTERVAL '5 years', '{"experience_level": "expert", "specialties": ["arrangement", "harmonization"], "leadership_roles": ["choir director", "worship pastor"]}'),
    
    -- Specialized roles
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'translator@hsa-songbook.test', 'translator_tom', 'Thomas Kim', NOW() - INTERVAL '1 year', '{"languages": ["en", "ko", "ja"], "specialization": "hymn_translation", "cultural_focus": "Korean-American"}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'arranger@hsa-songbook.test', 'arranger_anna', 'Anna Chen', NOW() - INTERVAL '7 months', '{"specialization": "chord_arrangements", "instruments": ["piano", "organ", "guitar"], "difficulty_focus": ["beginner", "intermediate"]}'),
    
    -- Community contributors
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'reviewer@hsa-songbook.test', 'reviewer_rachel', 'Rachel Davis', NOW() - INTERVAL '10 months', '{"contribution_type": "reviews", "expertise": ["lyrical_analysis", "theological_accuracy"], "reviews_written": 127}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'editor@hsa-songbook.test', 'editor_eric', 'Eric Thompson', NOW() - INTERVAL '1.5 years', '{"role": "content_editor", "focus": ["accuracy", "formatting"], "edits_made": 450}')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ROLE ASSIGNMENTS
-- ==========================================
-- Assign roles to demonstrate different permission scenarios

INSERT INTO public.user_roles (user_id, role, granted_by, granted_at, is_active) VALUES
    -- Additional moderators with different specializations
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'moderator', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '5 months', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'moderator', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '8 months', true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'moderator', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '1 year', true),
    
    -- Temporary role assignments (expired)
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'moderator', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '6 months', false),
    
    -- Recent role grants
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'moderator', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '1 week', true)
ON CONFLICT (user_id, role) DO NOTHING;

-- ==========================================
-- ROLE AUDIT LOG
-- ==========================================
-- Track role changes for testing audit functionality

INSERT INTO public.role_audit_log (user_id, role, action, performed_by, performed_at, reason, metadata) VALUES
    -- Role grants
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'moderator', 'grant', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '5 months', 'Experienced worship leader with strong community engagement', '{"previous_contributions": 45, "community_votes": 23}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'moderator', 'grant', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '8 months', 'Multilingual expertise needed for international content', '{"languages": ["en", "ko", "ja"], "translation_quality": "excellent"}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'moderator', 'grant', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '1 year', 'Editorial expertise and attention to detail', '{"edits_accuracy": 0.98, "community_feedback": "positive"}'),
    
    -- Role revocations
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'moderator', 'revoke', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '3 months', 'Temporary sabbatical from moderation duties', '{"status": "voluntary", "return_expected": true}'),
    
    -- Recent grants
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'moderator', 'grant', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '1 week', 'Veteran user with exceptional content quality', '{"years_active": 5, "content_rating": 4.9, "reports_handled": 0}')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Uncomment these to verify the data was loaded correctly:
-- 
-- -- Total user count
-- SELECT COUNT(*) as total_users FROM public.users;
-- 
-- -- Users by role
-- SELECT 
--     COALESCE(ur.role, 'user') as role,
--     COUNT(*) as user_count
-- FROM public.users u
-- LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.is_active = true
-- GROUP BY ur.role
-- ORDER BY user_count DESC;
-- 
-- -- Recent role changes
-- SELECT 
--     u.username,
--     ral.role,
--     ral.action,
--     ral.performed_at,
--     ral.reason
-- FROM public.role_audit_log ral
-- JOIN public.users u ON ral.user_id = u.id
-- ORDER BY ral.performed_at DESC
-- LIMIT 10;