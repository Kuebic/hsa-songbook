-- HSA Songbook Seed Data: User Permissions and Role Configurations
-- Creates comprehensive permission scenarios for testing role-based access
-- Includes content moderation, user management, and access control scenarios

BEGIN;

-- ==========================================
-- CONTENT REPORTS
-- ==========================================
-- Create sample content reports to test moderation workflows

INSERT INTO public.content_reports (
    id, content_id, content_type, reason, description,
    reported_by, created_at, status
) VALUES
    -- Song content reports
    (
        'rep0eebc99-9c0b-4ef8-bb6d-6bb9bd380r01',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b33',
        'song',
        'incorrect_lyrics',
        'The lyrics shown dont match the official recording. Line 3 of verse 2 should be different.',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30',
        NOW() - INTERVAL '5 days',
        'pending'
    ),
    (
        'rep0eebc99-9c0b-4ef8-bb6d-6bb9bd380r02',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b34',
        'song',
        'copyright_concern',
        'This song may have copyright restrictions that need to be verified before public use.',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27',
        NOW() - INTERVAL '1 week',
        'under_review'
    ),
    (
        'rep0eebc99-9c0b-4ef8-bb6d-6bb9bd380r03',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b32',
        'song',
        'inappropriate_content',
        'Some of the theological content may not align with our church doctrine.',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',
        NOW() - INTERVAL '3 days',
        'pending'
    ),
    
    -- Arrangement content reports
    (
        'rep0eebc99-9c0b-4ef8-bb6d-6bb9bd380r04',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c31',
        'arrangement',
        'incorrect_chords',
        'The chord progression in the bridge section is incorrect. Should be Am-F-C-G instead of Am-C-F-G.',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29',
        NOW() - INTERVAL '2 days',
        'pending'
    ),
    (
        'rep0eebc99-9c0b-4ef8-bb6d-6bb9bd380r05',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c37',
        'arrangement',
        'too_difficult',
        'This arrangement is marked as "advanced" but the chord complexity suggests it should be "expert" level.',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',
        NOW() - INTERVAL '1 day',
        'pending'
    ),
    
    -- Resolved reports
    (
        'rep0eebc99-9c0b-4ef8-bb6d-6bb9bd380r06',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b37',
        'song',
        'duplicate_entry',
        'This appears to be a duplicate of an existing song already in the database.',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        NOW() - INTERVAL '2 weeks',
        'resolved'
    ),
    (
        'rep0eebc99-9c0b-4ef8-bb6d-6bb9bd380r07',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14',
        'arrangement',
        'formatting_issue',
        'ChordPro formatting is broken in several places making it hard to read.',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
        NOW() - INTERVAL '10 days',
        'resolved'
    )
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- CONTENT REPORT RESOLUTIONS
-- ==========================================
-- Update resolved reports with resolution details

UPDATE public.content_reports 
SET 
    resolved_by = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    resolved_at = NOW() - INTERVAL '1 week',
    resolution = 'Verified not a duplicate. Songs have similar titles but different lyrics and composition dates.'
WHERE id = 'rep0eebc99-9c0b-4ef8-bb6d-6bb9bd380r06';

UPDATE public.content_reports 
SET 
    resolved_by = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    resolved_at = NOW() - INTERVAL '8 days',
    resolution = 'Formatting corrected. ChordPro syntax validated and arrangement updated.'
WHERE id = 'rep0eebc99-9c0b-4ef8-bb6d-6bb9bd380r07';

-- ==========================================
-- MODERATION LOG ENTRIES
-- ==========================================
-- Track moderation actions for transparency and auditing

INSERT INTO public.moderation_log (
    id, content_id, content_type, action, previous_status, new_status,
    performed_by, performed_at, note, metadata
) VALUES
    -- Song moderation actions
    (
        'mod0eebc99-9c0b-4ef8-bb6d-6bb9bd380m01',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b33',
        'song',
        'approve',
        'pending',
        'approved',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
        NOW() - INTERVAL '3 months',
        'Excellent contemporary worship song. Theology is sound and arrangement quality is high.',
        '{"reviewer_confidence": "high", "theological_review": true, "musical_review": true}'
    ),
    (
        'mod0eebc99-9c0b-4ef8-bb6d-6bb9bd380m02',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b34',
        'song',
        'approve',
        'pending',
        'approved',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        NOW() - INTERVAL '4 months',
        'Global worship phenomenon. Appropriate for congregational use.',
        '{"reviewer_confidence": "high", "global_impact": true, "congregational_friendly": true}'
    ),
    (
        'mod0eebc99-9c0b-4ef8-bb6d-6bb9bd380m03',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b32',
        'song',
        'request_revision',
        'pending',
        'needs_revision',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28',
        NOW() - INTERVAL '1 month',
        'Spanish translation needs verification. Please provide source for translation accuracy.',
        '{"translation_verification_needed": true, "language": "es", "priority": "medium"}'
    ),
    
    -- Arrangement moderation actions
    (
        'mod0eebc99-9c0b-4ef8-bb6d-6bb9bd380m04',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c31',
        'arrangement',
        'approve',
        'pending',
        'approved',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
        NOW() - INTERVAL '2 months',
        'Well-structured arrangement. Chord progressions are accurate and difficulty level is appropriate.',
        '{"musical_accuracy": "verified", "difficulty_appropriate": true}'
    ),
    (
        'mod0eebc99-9c0b-4ef8-bb6d-6bb9bd380m05',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c37',
        'arrangement',
        'approve',
        'pending',
        'approved',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29',
        NOW() - INTERVAL '5 months',
        'Advanced jazz arrangement is excellent. Appropriate for experienced musicians.',
        '{"complexity_verified": true, "target_audience": "advanced_musicians"}'
    ),
    
    -- Rejection examples
    (
        'mod0eebc99-9c0b-4ef8-bb6d-6bb9bd380m06',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b47',
        'song',
        'reject',
        'pending',
        'rejected',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        NOW() - INTERVAL '6 months',
        'Copyright verification failed. Unable to confirm public domain status.',
        '{"copyright_issue": true, "legal_concern": true, "action_required": "copyright_clearance"}'
    )
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ADDITIONAL ROLE SCENARIOS
-- ==========================================
-- Create scenarios for testing different permission levels

-- Temporary role assignments for testing
INSERT INTO public.user_roles (user_id, role, granted_by, granted_at, is_active, expires_at) VALUES
    -- Temporary moderator role (expires in future)
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'moderator', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '1 month', true, NOW() + INTERVAL '2 months'),
    
    -- Expired moderator role (for testing expired permissions)
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'moderator', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '6 months', false, NOW() - INTERVAL '1 month')
ON CONFLICT (user_id, role) DO NOTHING;

-- ==========================================
-- ADDITIONAL AUDIT LOG ENTRIES
-- ==========================================
-- More comprehensive audit trail for role changes

INSERT INTO public.role_audit_log (user_id, role, action, performed_by, performed_at, reason, metadata) VALUES
    -- Temporary role grant
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'moderator', 'grant', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '1 month', 'Temporary moderator role for summer outreach event coordination', '{"temporary": true, "event": "summer_outreach", "duration_months": 3}'),
    
    -- Role expiration
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'moderator', 'expire', 'system', NOW() - INTERVAL '1 month', 'Role expired as scheduled', '{"automatic_expiration": true, "original_duration_months": 6}'),
    
    -- Role revocation for policy violation
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'moderator', 'revoke', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '3 weeks', 'Violation of moderation guidelines - inappropriate content approval', '{"violation_type": "policy", "severity": "medium", "review_required": true}'),
    
    -- Role restoration after review
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'user', 'restore', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW() - INTERVAL '2 weeks', 'Completed remedial training. Role restrictions lifted.', '{"training_completed": true, "probation_period_months": 3, "mentor_assigned": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21"}')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- PERMISSION-BASED TEST SCENARIOS
-- ==========================================
-- Update some content to test different permission scenarios

-- Songs with different moderation statuses for testing
UPDATE public.songs 
SET 
    moderation_status = 'needs_revision',
    moderated_by = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    moderated_at = NOW() - INTERVAL '1 week',
    moderation_note = 'Please verify CCLI number and add source attribution'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b32';

UPDATE public.songs 
SET 
    moderation_status = 'under_review',
    moderated_by = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    moderated_at = NOW() - INTERVAL '3 days',
    moderation_note = 'Checking copyright status for this newer composition'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b45';

-- Arrangements with different privacy settings
UPDATE public.arrangements 
SET 
    is_public = false,
    moderation_status = 'private_review'
WHERE id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c37';

-- Private setlists for testing access control
UPDATE public.setlists 
SET 
    is_public = false,
    metadata = jsonb_set(
        COALESCE(metadata, '{}'),
        '{access_level}',
        '"restricted"'
    )
WHERE id IN ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d25', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d27', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d32', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34');

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Uncomment these to verify the permission data was loaded correctly:
-- 
-- -- Content reports by status
-- SELECT 
--     status,
--     COUNT(*) as report_count,
--     array_agg(reason) as reasons
-- FROM public.content_reports 
-- WHERE id LIKE 'rep0eebc99-9c0b-4ef8-bb6d-6bb9bd380r%'
-- GROUP BY status
-- ORDER BY report_count DESC;
-- 
-- -- Moderation actions summary
-- SELECT 
--     action,
--     content_type,
--     COUNT(*) as action_count
-- FROM public.moderation_log 
-- WHERE id LIKE 'mod0eebc99-9c0b-4ef8-bb6d-6bb9bd380m%'
-- GROUP BY action, content_type
-- ORDER BY action_count DESC;
-- 
-- -- Active vs inactive roles
-- SELECT 
--     role,
--     is_active,
--     COUNT(*) as user_count,
--     COUNT(*) FILTER (WHERE expires_at > NOW()) as unexpired_count
-- FROM public.user_roles 
-- GROUP BY role, is_active
-- ORDER BY role, is_active DESC;
-- 
-- -- Users with moderation activity
-- SELECT 
--     u.username,
--     u.full_name,
--     COUNT(ml.id) as moderation_actions,
--     array_agg(DISTINCT ml.action) as actions_performed
-- FROM public.users u
-- JOIN public.moderation_log ml ON u.id = ml.performed_by
-- WHERE ml.id LIKE 'mod0eebc99-9c0b-4ef8-bb6d-6bb9bd380m%'
-- GROUP BY u.id, u.username, u.full_name
-- ORDER BY moderation_actions DESC;
-- 
-- -- Content by moderation status
-- SELECT 
--     'songs' as content_type,
--     moderation_status,
--     COUNT(*) as count
-- FROM public.songs 
-- WHERE moderation_status IS NOT NULL
-- GROUP BY moderation_status
-- UNION ALL
-- SELECT 
--     'arrangements' as content_type,
--     moderation_status,
--     COUNT(*) as count
-- FROM public.arrangements 
-- WHERE moderation_status IS NOT NULL
-- GROUP BY moderation_status
-- ORDER BY content_type, count DESC;