-- HSA Songbook Seed Data: Additional Setlists
-- Creates additional setlist examples for comprehensive testing
-- Includes various worship contexts and international services

BEGIN;

-- ==========================================
-- ADDITIONAL SETLISTS
-- ==========================================
-- Create setlists for different worship contexts and scenarios

INSERT INTO public.setlists (
    id, name, description, is_public, 
    created_by, created_at, metadata
) VALUES
    -- Contemporary services
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21',
        'Modern Worship Experience',
        'High-energy contemporary worship with popular modern songs',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
        NOW() - INTERVAL '2 weeks',
        '{"service_type": "contemporary", "target_audience": "millennials", "energy_level": "high"}'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22',
        'Acoustic Coffee House',
        'Intimate acoustic worship for smaller gatherings',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29',
        NOW() - INTERVAL '3 weeks',
        '{"service_type": "acoustic", "venue": "coffee_house", "instruments": ["acoustic_guitar", "cajon", "vocals"]}'
    ),
    
    -- International/Multilingual services
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23',
        'Bilingual Worship Service',
        'English/Spanish bilingual service for diverse congregation',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24',
        NOW() - INTERVAL '1 month',
        '{"languages": ["en", "es"], "cultural_focus": "hispanic", "translation_needed": true}'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24',
        'International Night Service',
        'Multi-cultural worship celebrating global church',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25',
        NOW() - INTERVAL '5 weeks',
        '{"languages": ["en", "es", "ko", "zh"], "theme": "global_unity", "cultural_diversity": true}'
    ),
    
    -- Special occasions
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d25',
        'Mothers Day Celebration',
        'Special service honoring mothers and family',
        false,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23',
        NOW() - INTERVAL '8 months',
        '{"occasion": "mothers_day", "themes": ["family", "love", "nurturing"], "seasonal": true}'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d26',
        'Baptism Sunday',
        'Celebration service for water baptisms',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        NOW() - INTERVAL '2 months',
        '{"occasion": "baptism", "themes": ["new_life", "transformation", "commitment"], "ceremony": "baptism"}'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d27',
        'Memorial Service',
        'Gentle worship for funeral or memorial service',
        false,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27',
        NOW() - INTERVAL '6 months',
        '{"service_type": "memorial", "tone": "reflective", "themes": ["hope", "comfort", "eternal_life"]}'
    ),
    
    -- Age-specific services
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d28',
        'Kids Church Praise Party',
        'High-energy worship for children aged 4-12',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23',
        NOW() - INTERVAL '1 week',
        '{"target_age": "4-12", "energy_level": "very_high", "interactive": true, "simple_lyrics": true}'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d29',
        'Senior Saints Service',
        'Traditional hymns and familiar favorites for seniors',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27',
        NOW() - INTERVAL '3 months',
        '{"target_age": "65+", "style": "traditional", "tempo": "moderate", "familiar_songs": true}'
    ),
    
    -- Seasonal themes
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d30',
        'Back to School Blessing',
        'Service blessing students and teachers for new school year',
        false,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        NOW() - INTERVAL '4 months',
        '{"season": "back_to_school", "themes": ["wisdom", "learning", "growth"], "blessing_focus": ["students", "teachers"]}'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d31',
        'Harvest Thanksgiving',
        'Autumn thanksgiving service celebrating Gods provision',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30',
        NOW() - INTERVAL '7 months',
        '{"season": "autumn", "themes": ["thanksgiving", "harvest", "provision"], "occasion": "thanksgiving"}'
    ),
    
    -- Ministry-specific
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d32',
        'Mens Retreat Worship',
        'Worship songs for mens ministry retreat',
        false,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28',
        NOW() - INTERVAL '5 months',
        '{"ministry": "mens", "venue": "retreat", "themes": ["strength", "brotherhood", "leadership"]}'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d33',
        'Womens Conference Praise',
        'Empowering worship for womens conference',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
        NOW() - INTERVAL '9 months',
        '{"ministry": "womens", "venue": "conference", "themes": ["identity", "purpose", "strength"]}'
    ),
    
    -- Small group contexts
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34',
        'Home Group Worship',
        'Simple worship songs for small group gatherings',
        false,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',
        NOW() - INTERVAL '3 weeks',
        '{"setting": "home", "group_size": "small", "instruments": ["acoustic_guitar"], "informal": true}'
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35',
        'College Campus Ministry',
        'Contemporary worship for college students',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        NOW() - INTERVAL '6 weeks',
        '{"target_audience": "college", "venue": "campus", "style": "indie_worship", "relevant_themes": true}'
    )
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- SETLIST ITEMS FOR NEW SETLISTS
-- ==========================================
-- Populate the new setlists with appropriate songs

INSERT INTO public.setlist_items (
    id, setlist_id, arrangement_id, position, 
    transpose_steps, notes, created_at
) VALUES
    -- Modern Worship Experience
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e81', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 1, 0, 'High energy opener - Way Maker', NOW() - INTERVAL '2 weeks'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e82', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 2, 0, 'Goodness of God - congregational favorite', NOW() - INTERVAL '2 weeks'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e83', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c40', 3, 0, 'Classic Shout to the Lord', NOW() - INTERVAL '2 weeks'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e84', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d21', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 4, 0, 'Response - In Christ Alone', NOW() - INTERVAL '2 weeks'),

    -- Acoustic Coffee House
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e91', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c39', 1, 0, 'Intimate acoustic opening', NOW() - INTERVAL '3 weeks'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e92', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 2, -2, 'Goodness of God in F (capo 3)', NOW() - INTERVAL '3 weeks'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e93', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 3, 0, 'Amazing Grace - acoustic closer', NOW() - INTERVAL '3 weeks'),

    -- Bilingual Worship Service  
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ea1', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c35', 1, 0, 'Renuévame - Spanish opener', NOW() - INTERVAL '1 month'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ea2', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c34', 2, 0, 'Way Maker - bilingual chorus', NOW() - INTERVAL '1 month'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ea3', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d23', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 3, 0, 'Amazing Grace - English', NOW() - INTERVAL '1 month'),

    -- International Night Service
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380eb1', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c40', 1, 0, 'Shout to the Lord - English', NOW() - INTERVAL '5 weeks'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380eb2', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c36', 2, 0, 'Korean hymn', NOW() - INTERVAL '5 weeks'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380eb3', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d24', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 3, 0, 'Way Maker - global anthem', NOW() - INTERVAL '5 weeks'),

    -- Baptism Sunday
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ec1', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d26', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 1, 0, 'In Christ Alone - new life theme', NOW() - INTERVAL '2 months'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ec2', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d26', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 2, 0, 'Amazing Grace - transformation', NOW() - INTERVAL '2 months'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ec3', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d26', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c39', 3, 0, 'Build My Life - commitment', NOW() - INTERVAL '2 months'),

    -- Kids Church Praise Party
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ed1', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d28', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c34', 1, 2, 'Way Maker in E - kid-friendly tempo', NOW() - INTERVAL '1 week'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ed2', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d28', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c32', 2, 0, 'Goodness of God - easy to sing along', NOW() - INTERVAL '1 week'),

    -- Senior Saints Service
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ee1', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d29', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c38', 1, 0, 'Great Is Thy Faithfulness - beloved hymn', NOW() - INTERVAL '3 months'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ee2', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d29', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 2, 0, 'Amazing Grace - classic', NOW() - INTERVAL '3 months'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ee3', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d29', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 3, 0, 'How Great Thou Art - congregational favorite', NOW() - INTERVAL '3 months'),

    -- Home Group Worship
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ef1', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c38', 1, 0, 'Simple 3-chord version', NOW() - INTERVAL '3 weeks'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380ef2', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d34', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c34', 2, 0, 'Way Maker - easy chords', NOW() - INTERVAL '3 weeks'),

    -- College Campus Ministry
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c37', 1, 0, 'Oceans - faith journey theme', NOW() - INTERVAL '6 weeks'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c39', 2, 0, 'Build My Life - commitment to Jesus', NOW() - INTERVAL '6 weeks'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d35', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c31', 3, 0, 'Goodness of God - testimony theme', NOW() - INTERVAL '6 weeks')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Uncomment these to verify the data was loaded correctly:
-- 
-- -- Count setlists by publicity status
-- SELECT 
--     is_public,
--     COUNT(*) as setlist_count
-- FROM public.setlists 
-- WHERE id LIKE 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d%'
-- GROUP BY is_public;
-- 
-- -- Setlists by creator
-- SELECT 
--     u.username,
--     COUNT(s.id) as setlists_created,
--     array_agg(s.name) as setlist_names
-- FROM public.setlists s
-- JOIN public.users u ON s.created_by = u.id
-- WHERE s.id LIKE 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d%'
-- GROUP BY u.id, u.username
-- ORDER BY setlists_created DESC;
-- 
-- -- Setlist details with song counts
-- SELECT 
--     s.name as setlist_name,
--     s.description,
--     COUNT(si.id) as song_count,
--     u.username as creator
-- FROM public.setlists s
-- LEFT JOIN public.setlist_items si ON s.id = si.setlist_id
-- JOIN public.users u ON s.created_by = u.id
-- WHERE s.id LIKE 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d%'
-- GROUP BY s.id, s.name, s.description, u.username
-- ORDER BY song_count DESC;
--
-- -- Most used arrangements in new setlists
-- SELECT 
--     a.name as arrangement_name,
--     song.title as song_title,
--     COUNT(si.id) as usage_count
-- FROM public.setlist_items si
-- JOIN public.arrangements a ON si.arrangement_id = a.id
-- JOIN public.songs song ON a.song_id = song.id
-- WHERE si.setlist_id LIKE 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d%'
-- GROUP BY a.id, a.name, song.title
-- ORDER BY usage_count DESC;