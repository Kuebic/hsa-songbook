-- HSA Songbook Performance Testing Fixtures
-- This file generates large datasets for performance testing including:
-- - 1000+ songs with arrangements
-- - Large setlists with many items
-- - Songs with many arrangements (10+ per song)
-- - Users with extensive activity history
-- - Stress test pagination and search features

BEGIN;

-- ==========================================
-- CLEAR EXISTING DATA (for test isolation)
-- ==========================================
TRUNCATE TABLE 
    public.setlist_items,
    public.setlists,
    public.arrangements,
    public.songs,
    public.user_roles,
    public.users,
    public.reviews,
    public.content_reports,
    public.moderation_log,
    public.role_audit_log
RESTART IDENTITY CASCADE;

-- ==========================================
-- HELPER FUNCTION TO GENERATE RANDOM STRINGS
-- ==========================================
CREATE OR REPLACE FUNCTION generate_random_string(length INTEGER)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- HELPER FUNCTION TO GENERATE SLUGS
-- ==========================================
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(trim(title), '[^a-zA-Z0-9\s]', '', 'g')) || '-' || generate_random_string(8);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PERFORMANCE TEST USERS (500 users)
-- ==========================================
-- Insert admin user first
INSERT INTO public.users (id, email, username, full_name, avatar_url, provider, provider_id, metadata, created_at) 
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@performance.test', 'perf_admin', 'Performance Test Admin', NULL, 'email', 'admin_001', '{"role": "admin", "test": true}', NOW());

INSERT INTO public.user_roles (user_id, role, granted_by, granted_at, is_active) 
VALUES ('00000000-0000-0000-0000-000000000000', 'admin', '00000000-0000-0000-0000-000000000000', NOW(), true);

-- Generate 500 regular users with realistic data distribution
INSERT INTO public.users (id, email, username, full_name, avatar_url, provider, provider_id, metadata, created_at)
SELECT 
    gen_random_uuid(),
    'user' || i || '@performance.test',
    'perf_user_' || i,
    CASE 
        WHEN i % 10 = 0 THEN 'User ' || i || ' with Long Name Including Multiple Words'
        WHEN i % 7 = 0 THEN '사용자 ' || i || ' (Korean User)'
        WHEN i % 5 = 0 THEN 'Usuario ' || i || ' (Spanish User)'
        ELSE 'Performance User ' || i
    END,
    CASE 
        WHEN i % 3 = 0 THEN 'https://example.com/avatar' || i || '.jpg'
        ELSE NULL
    END,
    CASE 
        WHEN i % 4 = 0 THEN 'google'
        WHEN i % 4 = 1 THEN 'facebook'
        WHEN i % 4 = 2 THEN 'github'
        ELSE 'email'
    END,
    'provider_id_' || i,
    CASE 
        WHEN i % 20 = 0 THEN '{"preferences": {"theme": "dark", "language": "ko"}, "activity_level": "high", "instruments": ["piano", "guitar", "violin"]}'::jsonb
        WHEN i % 15 = 0 THEN '{"preferences": {"theme": "light", "language": "es"}, "activity_level": "medium", "instruments": ["guitar", "drums"]}'::jsonb
        WHEN i % 10 = 0 THEN '{"preferences": {"theme": "auto", "language": "en"}, "activity_level": "low", "instruments": ["piano"]}'::jsonb
        ELSE '{"test_user": true, "activity_level": "normal"}'::jsonb
    END,
    NOW() - (random() * INTERVAL '2 years') -- Spread creation dates over 2 years
FROM generate_series(1, 500) AS i;

-- Assign roles to some users for realistic distribution
WITH random_users AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY random()) as rn
    FROM public.users 
    WHERE email != 'admin@performance.test'
)
INSERT INTO public.user_roles (user_id, role, granted_by, granted_at, is_active)
SELECT 
    id,
    CASE 
        WHEN rn <= 5 THEN 'moderator'::user_role
        ELSE 'user'::user_role
    END,
    '00000000-0000-0000-0000-000000000000',
    NOW() - (random() * INTERVAL '1 year'),
    CASE WHEN rn <= 495 THEN true ELSE false END -- 5 inactive users
FROM random_users
WHERE rn <= 50; -- Only assign explicit roles to 50 users

-- ==========================================
-- PERFORMANCE TEST SONGS (1200 songs)
-- ==========================================

-- First, create arrays of realistic song data for variety
DO $$
DECLARE
    song_titles TEXT[] := ARRAY[
        'Amazing Grace', 'How Great Thou Art', 'Holy Holy Holy', 'Be Thou My Vision', 'Great Is Thy Faithfulness',
        'In Christ Alone', '10000 Reasons', 'What A Beautiful Name', 'Good Good Father', 'Reckless Love',
        'Way Maker', 'Lion and the Lamb', 'Here I Am To Worship', 'How Deep The Father''s Love', 'Before The Throne Of God Above',
        'Christ The Lord Is Risen Today', 'Crown Him With Many Crowns', 'All Hail The Power', 'Blessed Assurance', 'It Is Well',
        'Silent Night', 'Joy To The World', 'O Come All Ye Faithful', 'Hark The Herald Angels Sing', 'O Holy Night',
        'Come Thou Fount', 'Rock of Ages', 'When I Survey', 'A Mighty Fortress', 'All Creatures Of Our God',
        'This Is Amazing Grace', 'Oceans', 'Build My Life', 'King of Kings', 'Goodness of God',
        'Living Hope', 'Yes I Will', 'Who You Say I Am', 'Graves Into Gardens', 'See A Victory',
        'Holy Spirit', 'Raise A Hallelujah', 'The Blessing', 'Surrounded', 'Waymaker'
    ];
    
    artists TEXT[] := ARRAY[
        'Chris Tomlin', 'Hillsong Worship', 'Bethel Music', 'Elevation Worship', 'Passion',
        'Jesus Culture', 'Matt Redman', 'David Crowder', 'Kari Jobe', 'Lauren Daigle',
        'Phil Wickham', 'Brandon Lake', 'Cody Carnes', 'Maverick City Music', 'UPPERROOM',
        'Traditional', 'Hymn', 'Keith & Kristyn Getty', 'Stuart Townend', 'Matt Maher',
        'Rend Collective', 'We The Kingdom', 'Shane & Shane', 'CityAlight', 'Sovereign Grace',
        'Tim Hughes', 'Martin Smith', 'Matt Papa', 'Keith Getty', 'Kristyn Getty'
    ];
    
    themes TEXT[] := ARRAY[
        'worship', 'praise', 'adoration', 'thanksgiving', 'glory', 'holiness', 'majesty', 'sovereignty',
        'grace', 'mercy', 'love', 'forgiveness', 'redemption', 'salvation', 'cross', 'resurrection',
        'jesus', 'christ', 'savior', 'lord', 'king', 'lamb', 'shepherd', 'rock', 'light',
        'faith', 'hope', 'trust', 'peace', 'joy', 'strength', 'comfort', 'healing', 'victory',
        'discipleship', 'mission', 'evangelism', 'service', 'unity', 'church', 'kingdom', 'heaven',
        'prayer', 'communion', 'baptism', 'scripture', 'truth', 'wisdom', 'guidance', 'provision',
        'christmas', 'easter', 'advent', 'lent', 'pentecost', 'thanksgiving', 'new-year', 'harvest'
    ];
    
    languages TEXT[] := ARRAY['en', 'es', 'ko', 'zh', 'fr', 'de', 'pt', 'ru', 'ja', 'hi'];
    
    i INTEGER;
    current_user_id UUID;
    user_ids UUID[];
    selected_themes TEXT[];
    theme_count INTEGER;
    j INTEGER;
BEGIN
    -- Get array of user IDs for random assignment
    SELECT ARRAY_AGG(id) INTO user_ids FROM public.users;
    
    -- Generate 1200 songs
    FOR i IN 1..1200 LOOP
        -- Randomly select user
        current_user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))];
        
        -- Randomly select 1-5 themes
        theme_count := 1 + floor(random() * 5);
        selected_themes := '{}';
        FOR j IN 1..theme_count LOOP
            selected_themes := array_append(selected_themes, themes[1 + floor(random() * array_length(themes, 1))]);
        END LOOP;
        selected_themes := array(SELECT DISTINCT unnest(selected_themes)); -- Remove duplicates
        
        INSERT INTO public.songs (
            id, title, slug, artist, alternative_titles, lyrics, themes, ccli, ccli_verified,
            primary_ccli_id, composition_year, original_language, lyrics_source, lyrics_verified,
            source, notes, auto_conversion_enabled, is_public, views, rating_average, rating_count,
            created_by, created_at, updated_at, moderation_status, moderated_at, moderated_by, moderation_note
        ) VALUES (
            gen_random_uuid(),
            -- Title with variation
            CASE 
                WHEN i % 20 = 0 THEN song_titles[1 + (i % array_length(song_titles, 1))] || ' (' || i || ')'
                ELSE song_titles[1 + (i % array_length(song_titles, 1))] || CASE WHEN i > array_length(song_titles, 1) THEN ' ' || (i / array_length(song_titles, 1))::text ELSE '' END
            END,
            -- Slug
            generate_slug(song_titles[1 + (i % array_length(song_titles, 1))]) || '-' || i::text,
            -- Artist
            CASE 
                WHEN i % 15 = 0 THEN artists[1 + (i % array_length(artists, 1))] || ', ' || artists[1 + ((i+1) % array_length(artists, 1))]
                ELSE artists[1 + (i % array_length(artists, 1))]
            END,
            -- Alternative titles (some songs have them)
            CASE 
                WHEN i % 7 = 0 THEN ARRAY['Alt Title ' || i, 'Another Title ' || i]
                WHEN i % 11 = 0 THEN ARRAY['Alternative ' || i]
                ELSE NULL
            END,
            -- Lyrics (realistic JSON structure)
            CASE 
                WHEN i % 10 = 0 THEN '{"en": {"verses": ["Verse 1 line 1 for song ' || i || '", "Verse 1 line 2"], "chorus": ["Chorus line 1", "Chorus line 2"]}, "ko": {"verses": ["한국어 가사 1", "한국어 가사 2"]}}'::jsonb
                WHEN i % 8 = 0 THEN '{"es": {"verses": ["Verso 1 línea 1 para canción ' || i || '", "Verso 1 línea 2"], "chorus": ["Coro línea 1", "Coro línea 2"]}}'::jsonb
                ELSE '{"en": {"verses": ["This is verse 1 for song number ' || i || '", "Line 2 of verse 1"], "chorus": ["Chorus for song ' || i || '", "Second chorus line"]}}'::jsonb
            END,
            -- Themes
            selected_themes,
            -- CCLI (some songs have them)
            CASE 
                WHEN i % 3 = 0 THEN (1000000 + i)::text
                ELSE NULL
            END,
            -- CCLI verified
            CASE WHEN i % 3 = 0 THEN (i % 2 = 0) ELSE NULL END,
            -- Primary CCLI ID
            CASE 
                WHEN i % 3 = 0 THEN 'CCLI-' || (1000000 + i)::text
                ELSE NULL
            END,
            -- Composition year (spread from 1800 to 2024)
            1800 + (i % 225) + CASE WHEN i % 10 = 0 THEN 224 ELSE 0 END, -- Bias towards recent years
            -- Original language
            languages[1 + (i % array_length(languages, 1))],
            -- Lyrics source
            CASE 
                WHEN i % 5 = 0 THEN 'https://www.ccli.com/songs/' || (1000000 + i)::text
                ELSE NULL
            END,
            -- Lyrics verified
            i % 4 = 0,
            -- Source
            CASE 
                WHEN i % 6 = 0 THEN 'CCLI Database'
                WHEN i % 6 = 1 THEN 'Hymnal: ' || (i % 100)::text
                WHEN i % 6 = 2 THEN 'Album: Performance Test Album ' || (i % 50)::text
                ELSE NULL
            END,
            -- Notes
            CASE 
                WHEN i % 25 = 0 THEN 'This is a performance test song with detailed notes about arrangement, performance instructions, and historical context. Song number ' || i || ' in the test dataset.'
                WHEN i % 13 = 0 THEN 'Short notes for song ' || i
                ELSE NULL
            END,
            -- Auto conversion enabled
            i % 5 != 0,
            -- Is public (90% public, 10% private)
            i % 10 != 0,
            -- Views (realistic distribution: most songs have low views, few have high views)
            CASE 
                WHEN i % 100 = 0 THEN floor(random() * 10000 + 5000)::integer -- Popular songs
                WHEN i % 50 = 0 THEN floor(random() * 2000 + 500)::integer  -- Moderately popular
                WHEN i % 10 = 0 THEN floor(random() * 500 + 100)::integer   -- Some views
                ELSE floor(random() * 100)::integer -- Low views
            END,
            -- Rating average (realistic distribution)
            CASE 
                WHEN i % 20 = 0 THEN NULL -- No ratings yet
                ELSE round((random() * 2 + 3)::numeric, 1) -- Between 3.0 and 5.0
            END,
            -- Rating count
            CASE 
                WHEN i % 20 = 0 THEN 0 -- No ratings yet
                WHEN i % 10 = 0 THEN floor(random() * 100 + 50)::integer -- Popular songs
                ELSE floor(random() * 25 + 1)::integer -- Regular songs
            END,
            -- Created by
            current_user_id,
            -- Created at (spread over last 2 years)
            NOW() - (random() * INTERVAL '2 years'),
            -- Updated at (recent updates)
            NOW() - (random() * INTERVAL '6 months'),
            -- Moderation status (realistic distribution)
            CASE 
                WHEN i % 100 = 0 THEN 'pending'
                WHEN i % 200 = 0 THEN 'flagged'
                WHEN i % 500 = 0 THEN 'rejected'
                ELSE 'approved'
            END,
            -- Moderated at
            CASE 
                WHEN i % 100 = 0 THEN NULL -- Pending items not moderated yet
                ELSE NOW() - (random() * INTERVAL '1 year')
            END,
            -- Moderated by
            CASE 
                WHEN i % 100 = 0 THEN NULL -- Pending items
                ELSE '00000000-0000-0000-0000-000000000000' -- Admin user
            END,
            -- Moderation note
            CASE 
                WHEN i % 100 = 0 THEN NULL -- Pending
                WHEN i % 200 = 0 THEN 'Flagged for review - song ' || i
                WHEN i % 500 = 0 THEN 'Rejected due to copyright issues - song ' || i
                WHEN i % 50 = 0 THEN 'Approved after review - song ' || i
                ELSE 'Auto-approved - song ' || i
            END
        );
    END LOOP;
END $$;

-- ==========================================
-- PERFORMANCE TEST ARRANGEMENTS (5000+ arrangements)
-- ==========================================
-- Create multiple arrangements per song (1-15 arrangements per song)

DO $$
DECLARE
    song_record RECORD;
    arrangement_count INTEGER;
    i INTEGER;
    current_user_id UUID;
    user_ids UUID[];
    keys TEXT[] := ARRAY['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
    difficulties TEXT[] := ARRAY['easy', 'medium', 'hard'];
    time_sigs TEXT[] := ARRAY['4/4', '3/4', '2/4', '6/8', '12/8', '2/2', '3/8', '6/4'];
    arrangement_names TEXT[] := ARRAY[
        'Original', 'Simplified', 'Advanced', 'Acoustic', 'Electric', 'Piano Solo', 'Guitar Solo',
        'Contemporary', 'Traditional', 'Jazz', 'Gospel', 'Country', 'Folk', 'Rock', 'Pop',
        'Capo 1', 'Capo 2', 'Capo 3', 'Capo 4', 'Capo 5', 'Lower Key', 'Higher Key',
        'Beginner', 'Intermediate', 'Expert', 'Worship Leader', 'Congregation', 'Choir',
        'Full Band', 'Minimal', 'Unplugged', 'Studio', 'Live', 'Alternative'
    ];
BEGIN
    -- Get array of user IDs for random assignment
    SELECT ARRAY_AGG(id) INTO user_ids FROM public.users;
    
    -- For each song, create 1-15 arrangements
    FOR song_record IN SELECT id, title FROM public.songs LOOP
        arrangement_count := 1 + floor(random() * 15); -- 1 to 15 arrangements per song
        
        FOR i IN 1..arrangement_count LOOP
            -- Randomly select user
            current_user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))];
            
            INSERT INTO public.arrangements (
                id, song_id, name, slug, chord_data, description, difficulty,
                key, tempo, time_signature, tags, is_public, views, rating_average, rating_count,
                created_by, created_at, updated_at, moderation_status, moderated_at, moderated_by, moderation_note
            ) VALUES (
                gen_random_uuid(),
                song_record.id,
                -- Arrangement name
                CASE 
                    WHEN i = 1 THEN 'Original'
                    WHEN i <= array_length(arrangement_names, 1) THEN arrangement_names[i]
                    ELSE arrangement_names[1 + ((i-1) % array_length(arrangement_names, 1))] || ' ' || ((i-1) / array_length(arrangement_names, 1) + 1)::text
                END,
                -- Slug
                CASE 
                    WHEN i = 1 THEN 'original'
                    ELSE lower(replace(arrangement_names[CASE WHEN i <= array_length(arrangement_names, 1) THEN i ELSE 1 + ((i-1) % array_length(arrangement_names, 1)) END], ' ', '-')) || '-' || i::text
                END,
                -- Chord data (realistic ChordPro content)
                '{title:' || song_record.title || '}' || E'\n' ||
                '{key:' || keys[1 + floor(random() * array_length(keys, 1))] || '}' || E'\n' ||
                '{tempo:' || (60 + floor(random() * 120))::text || '}' || E'\n' ||
                '{time:' || time_sigs[1 + floor(random() * array_length(time_sigs, 1))] || '}' || E'\n' ||
                CASE WHEN i % 5 = 0 THEN '{capo:' || (1 + floor(random() * 7))::text || '}' || E'\n' ELSE '' END ||
                E'\n' ||
                'Verse 1:' || E'\n' ||
                '[' || keys[1 + floor(random() * array_length(keys, 1))] || ']This is verse 1 of arrangement ' || i::text || E'\n' ||
                'For [' || keys[1 + floor(random() * array_length(keys, 1))] || ']performance testing [' || keys[1 + floor(random() * array_length(keys, 1))] || ']purposes' || E'\n' ||
                E'\n' ||
                'Chorus:' || E'\n' ||
                '[' || keys[1 + floor(random() * array_length(keys, 1))] || ']Chorus section with [' || keys[1 + floor(random() * array_length(keys, 1))] || ']chords' || E'\n' ||
                'Testing [' || keys[1 + floor(random() * array_length(keys, 1))] || ']performance [' || keys[1 + floor(random() * array_length(keys, 1))] || ']load' || E'\n' ||
                CASE 
                    WHEN i % 3 = 0 THEN E'\n' ||
                        'Verse 2:' || E'\n' ||
                        '[' || keys[1 + floor(random() * array_length(keys, 1))] || ']Second verse content [' || keys[1 + floor(random() * array_length(keys, 1))] || ']here' || E'\n' ||
                        'Additional [' || keys[1 + floor(random() * array_length(keys, 1))] || ']content for [' || keys[1 + floor(random() * array_length(keys, 1))] || ']testing' || E'\n'
                    ELSE ''
                END ||
                CASE 
                    WHEN i % 7 = 0 THEN E'\n' ||
                        'Bridge:' || E'\n' ||
                        '[' || keys[1 + floor(random() * array_length(keys, 1))] || ']Bridge section with [' || keys[1 + floor(random() * array_length(keys, 1))] || ']different chords' || E'\n' ||
                        'Testing [' || keys[1 + floor(random() * array_length(keys, 1))] || ']complex [' || keys[1 + floor(random() * array_length(keys, 1))] || ']arrangements' || E'\n'
                    ELSE ''
                END,
                -- Description
                CASE 
                    WHEN i % 10 = 0 THEN 'Detailed arrangement description for performance testing. This arrangement (#' || i::text || ') includes comprehensive performance notes and instructions.'
                    WHEN i % 5 = 0 THEN 'Arrangement #' || i::text || ' for ' || song_record.title
                    ELSE NULL
                END,
                -- Difficulty
                difficulties[1 + floor(random() * array_length(difficulties, 1))],
                -- Key
                keys[1 + floor(random() * array_length(keys, 1))],
                -- Tempo
                60 + floor(random() * 120)::integer,
                -- Time signature
                time_sigs[1 + floor(random() * array_length(time_sigs, 1))],
                -- Tags
                CASE 
                    WHEN i % 8 = 0 THEN ARRAY['performance-test', 'arrangement-' || i::text, 'load-test']
                    WHEN i % 5 = 0 THEN ARRAY['test-arrangement', 'version-' || i::text]
                    ELSE ARRAY['arrangement-' || i::text]
                END,
                -- Is public (85% public, 15% private)
                i % 7 != 0,
                -- Views (realistic distribution)
                CASE 
                    WHEN i = 1 THEN floor(random() * 1000 + 100)::integer -- Original arrangements get more views
                    WHEN i % 20 = 0 THEN floor(random() * 500 + 50)::integer -- Some popular arrangements
                    ELSE floor(random() * 100)::integer -- Regular views
                END,
                -- Rating average
                CASE 
                    WHEN i % 25 = 0 THEN NULL -- No ratings yet
                    ELSE round((random() * 2 + 3)::numeric, 1) -- Between 3.0 and 5.0
                END,
                -- Rating count
                CASE 
                    WHEN i % 25 = 0 THEN 0 -- No ratings yet
                    WHEN i = 1 THEN floor(random() * 50 + 10)::integer -- Original gets more ratings
                    ELSE floor(random() * 15 + 1)::integer -- Regular ratings
                END,
                -- Created by
                current_user_id,
                -- Created at (arrangements created after songs)
                NOW() - (random() * INTERVAL '1.5 years'),
                -- Updated at
                NOW() - (random() * INTERVAL '3 months'),
                -- Moderation status
                CASE 
                    WHEN i % 150 = 0 THEN 'pending'
                    WHEN i % 300 = 0 THEN 'flagged'
                    WHEN i % 1000 = 0 THEN 'rejected'
                    ELSE 'approved'
                END,
                -- Moderated at
                CASE 
                    WHEN i % 150 = 0 THEN NULL
                    ELSE NOW() - (random() * INTERVAL '6 months')
                END,
                -- Moderated by
                CASE 
                    WHEN i % 150 = 0 THEN NULL
                    ELSE '00000000-0000-0000-0000-000000000000'
                END,
                -- Moderation note
                CASE 
                    WHEN i % 150 = 0 THEN NULL
                    WHEN i % 300 = 0 THEN 'Flagged arrangement #' || i::text
                    WHEN i % 1000 = 0 THEN 'Rejected arrangement #' || i::text
                    WHEN i % 75 = 0 THEN 'Reviewed arrangement #' || i::text
                    ELSE 'Auto-approved arrangement #' || i::text
                END
            );
        END LOOP;
    END LOOP;
END $$;

-- Set default arrangements for songs (pick first arrangement for each song)
UPDATE public.songs 
SET default_arrangement_id = arrangements.id
FROM (
    SELECT DISTINCT ON (song_id) id, song_id
    FROM public.arrangements
    ORDER BY song_id, created_at ASC
) AS arrangements
WHERE public.songs.id = arrangements.song_id;

-- ==========================================
-- PERFORMANCE TEST SETLISTS (200 setlists)
-- ==========================================
DO $$
DECLARE
    i INTEGER;
    current_user_id UUID;
    user_ids UUID[];
    setlist_names TEXT[] := ARRAY[
        'Sunday Morning Worship', 'Evening Service', 'Youth Group', 'Christmas Eve', 'Easter Sunday',
        'Thanksgiving Service', 'Good Friday', 'New Year Service', 'Mother''s Day', 'Father''s Day',
        'Baptism Service', 'Communion Service', 'Wedding Ceremony', 'Funeral Service', 'Revival Meeting',
        'Prayer Meeting', 'Bible Study', 'Small Group', 'Choir Practice', 'Worship Night',
        'Concert Preparation', 'Outreach Event', 'Community Service', 'Retreat Worship', 'Camp Meeting',
        'Children''s Service', 'Teen Service', 'Adult Service', 'Senior Service', 'Family Service',
        'Contemporary Worship', 'Traditional Worship', 'Blended Worship', 'Acoustic Worship', 'Full Band',
        'Spanish Service', 'Korean Service', 'Multilingual Service', 'International Night', 'Cultural Celebration'
    ];
BEGIN
    -- Get array of user IDs for random assignment
    SELECT ARRAY_AGG(id) INTO user_ids FROM public.users;
    
    -- Generate 200 setlists
    FOR i IN 1..200 LOOP
        -- Randomly select user
        current_user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))];
        
        INSERT INTO public.setlists (
            id, name, description, is_public, share_id, metadata, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            -- Name
            setlist_names[1 + (i % array_length(setlist_names, 1))] || 
            CASE WHEN i > array_length(setlist_names, 1) THEN ' ' || ((i / array_length(setlist_names, 1)) + 1)::text ELSE '' END ||
            ' - Performance Test',
            -- Description
            CASE 
                WHEN i % 15 = 0 THEN 'Comprehensive performance test setlist #' || i::text || ' with detailed service order, timing information, special instructions for musicians, technical requirements, and notes for worship leaders and congregation participation guidelines.'
                WHEN i % 8 = 0 THEN 'Performance test setlist #' || i::text || ' for load testing pagination and search functionality.'
                WHEN i % 5 = 0 THEN 'Test setlist #' || i::text || ' - ' || setlist_names[1 + (i % array_length(setlist_names, 1))]
                ELSE NULL
            END,
            -- Is public (70% public, 30% private)
            i % 10 < 7,
            -- Share ID (some setlists have share IDs)
            CASE 
                WHEN i % 5 = 0 THEN 'PERF' || i::text || generate_random_string(4)
                ELSE NULL
            END,
            -- Metadata
            CASE 
                WHEN i % 20 = 0 THEN '{"duration_minutes": ' || (30 + floor(random() * 60))::text || ', "theme": "performance-test", "difficulty": "mixed", "instruments": ["piano", "guitar", "drums"], "special_notes": "Performance test setlist with comprehensive metadata for testing JSON field handling and search functionality"}'::jsonb
                WHEN i % 10 = 0 THEN '{"duration_minutes": ' || (20 + floor(random() * 40))::text || ', "theme": "load-test", "service_type": "' || setlist_names[1 + (i % array_length(setlist_names, 1))] || '"}'::jsonb
                WHEN i % 7 = 0 THEN '{"test_setlist": true, "performance_test": true, "item_count_target": ' || (5 + floor(random() * 15))::text || '}'::jsonb
                ELSE '{"performance_test": true}'::jsonb
            END,
            -- Created by
            current_user_id,
            -- Created at
            NOW() - (random() * INTERVAL '1 year'),
            -- Updated at
            NOW() - (random() * INTERVAL '2 months')
        );
    END LOOP;
END $$;

-- ==========================================
-- PERFORMANCE TEST SETLIST ITEMS (3000+ items)
-- ==========================================
-- Create 5-25 items per setlist

DO $$
DECLARE
    setlist_record RECORD;
    item_count INTEGER;
    i INTEGER;
    arrangement_ids UUID[];
    selected_arrangement_id UUID;
    position_counter INTEGER;
BEGIN
    -- Get array of arrangement IDs for random selection
    SELECT ARRAY_AGG(id) INTO arrangement_ids FROM public.arrangements WHERE is_public = true;
    
    -- For each setlist, create 5-25 items
    FOR setlist_record IN SELECT id FROM public.setlists LOOP
        item_count := 5 + floor(random() * 21); -- 5 to 25 items per setlist
        position_counter := 1;
        
        FOR i IN 1..item_count LOOP
            -- Randomly select arrangement (90% of time) or NULL (10% of time for songs without specific arrangements)
            IF random() < 0.9 THEN
                selected_arrangement_id := arrangement_ids[1 + floor(random() * array_length(arrangement_ids, 1))];
            ELSE
                selected_arrangement_id := NULL;
            END IF;
            
            INSERT INTO public.setlist_items (
                id, setlist_id, arrangement_id, position, transpose_steps, notes, created_at
            ) VALUES (
                gen_random_uuid(),
                setlist_record.id,
                selected_arrangement_id,
                position_counter,
                -- Transpose steps (-12 to +12, most commonly -5 to +5)
                CASE 
                    WHEN random() < 0.1 THEN floor(random() * 25 - 12)::integer -- Extreme transpose (10%)
                    WHEN random() < 0.3 THEN floor(random() * 11 - 5)::integer  -- Common transpose (20%)
                    ELSE 0 -- No transpose (70%)
                END,
                -- Notes
                CASE 
                    WHEN i % 25 = 0 THEN 'Comprehensive performance notes for item #' || i::text || ' including detailed instructions for musicians, tempo changes, key modulations, dynamic markings, special performance techniques, congregation participation guidelines, technical setup requirements, and troubleshooting information for potential issues during live performance.'
                    WHEN i % 10 = 0 THEN 'Performance test notes for setlist item #' || i::text || ' - includes timing and arrangement details'
                    WHEN i % 5 = 0 THEN 'Test item #' || i::text || ' notes'
                    WHEN i % 3 = 0 THEN 'Key change, tempo adjustment needed'
                    WHEN i % 7 = 0 THEN 'Special instructions for worship leader'
                    ELSE NULL
                END,
                -- Created at
                NOW() - (random() * INTERVAL '6 months')
            );
            
            position_counter := position_counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- ==========================================
-- PERFORMANCE TEST REVIEWS (8000+ reviews)
-- ==========================================
-- Create multiple reviews per song (0-15 reviews per song)

DO $$
DECLARE
    song_record RECORD;
    review_count INTEGER;
    i INTEGER;
    user_ids UUID[];
    selected_user_ids UUID[];
    current_user_id UUID;
    review_comments TEXT[] := ARRAY[
        'Great song!', 'Love this arrangement', 'Perfect for worship', 'Easy to sing along',
        'Beautiful lyrics', 'Powerful message', 'Well arranged', 'Good for beginners',
        'Complex but rewarding', 'Congregation favorite', 'Excellent for small groups',
        'Works well with full band', 'Acoustic version is better', 'Key is too high',
        'Could use simpler chords', 'Love the bridge section', 'Chorus is catchy',
        'Verses are meaningful', 'Great for Easter service', 'Perfect Christmas song',
        'Good for youth group', 'Senior adults love this', 'Multilingual friendly',
        'Easy chord progression', 'Challenging for beginners', 'Professional arrangement',
        'Home-grown feel', 'Contemporary style', 'Traditional approach',
        'Jazz influences', 'Country flavor', 'Rock arrangement', 'Pop style'
    ];
BEGIN
    -- Get array of user IDs for random assignment
    SELECT ARRAY_AGG(id) INTO user_ids FROM public.users;
    
    -- For each song, create 0-15 reviews
    FOR song_record IN SELECT id FROM public.songs WHERE is_public = true ORDER BY RANDOM() LIMIT 800 LOOP -- Review 800 songs
        review_count := floor(random() * 16)::integer; -- 0 to 15 reviews per song
        
        IF review_count > 0 THEN
            -- Select random users for this song's reviews (no duplicates per song)
            selected_user_ids := (
                SELECT ARRAY_AGG(id ORDER BY random()) 
                FROM (
                    SELECT id FROM unnest(user_ids) AS id 
                    ORDER BY random() 
                    LIMIT review_count
                ) AS random_users
            );
            
            FOR i IN 1..review_count LOOP
                current_user_id := selected_user_ids[i];
                
                INSERT INTO public.reviews (
                    id, song_id, user_id, rating, comment, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(),
                    song_record.id,
                    current_user_id,
                    -- Rating (realistic distribution: mostly 4-5, some 3, few 1-2)
                    CASE 
                        WHEN random() < 0.4 THEN 5 -- 40% give 5 stars
                        WHEN random() < 0.7 THEN 4 -- 30% give 4 stars
                        WHEN random() < 0.9 THEN 3 -- 20% give 3 stars
                        WHEN random() < 0.97 THEN 2 -- 7% give 2 stars
                        ELSE 1 -- 3% give 1 star
                    END,
                    -- Comment (60% have comments)
                    CASE 
                        WHEN random() < 0.6 THEN 
                            review_comments[1 + floor(random() * array_length(review_comments, 1))] ||
                            CASE 
                                WHEN random() < 0.3 THEN ' - Performance test review #' || i::text
                                WHEN random() < 0.2 THEN '. Really helps with worship planning and song selection.'
                                WHEN random() < 0.15 THEN '. Great addition to our songbook database.'
                                ELSE ''
                            END
                        ELSE NULL
                    END,
                    -- Created at (spread over last year)
                    NOW() - (random() * INTERVAL '1 year'),
                    -- Updated at (some reviews updated)
                    CASE 
                        WHEN random() < 0.2 THEN NOW() - (random() * INTERVAL '3 months')
                        ELSE NOW() - (random() * INTERVAL '1 year')
                    END
                );
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- ==========================================
-- PERFORMANCE TEST CONTENT REPORTS (150 reports)
-- ==========================================
DO $$
DECLARE
    i INTEGER;
    content_ids UUID[];
    user_ids UUID[];
    report_reasons TEXT[] := ARRAY[
        'inappropriate_content', 'copyright_violation', 'spam', 'offensive_language',
        'malicious_content', 'outdated_content', 'duplicate_content', 'quality_issues'
    ];
    content_types TEXT[] := ARRAY['song', 'arrangement', 'review'];
BEGIN
    -- Get arrays of IDs for random assignment
    SELECT ARRAY_AGG(id) INTO content_ids FROM public.songs WHERE is_public = true;
    SELECT ARRAY_AGG(id) INTO user_ids FROM public.users;
    
    -- Generate 150 content reports
    FOR i IN 1..150 LOOP
        INSERT INTO public.content_reports (
            id, content_id, content_type, reason, description, reported_by, status, 
            resolution, resolved_at, resolved_by, created_at
        ) VALUES (
            gen_random_uuid(),
            content_ids[1 + floor(random() * array_length(content_ids, 1))],
            content_types[1 + floor(random() * array_length(content_types, 1))],
            report_reasons[1 + floor(random() * array_length(report_reasons, 1))],
            CASE 
                WHEN i % 15 = 0 THEN 'Detailed performance test report #' || i::text || ' with comprehensive description of the issue including specific examples, context information, policy violations, and recommended actions for moderation team review and resolution.'
                WHEN i % 8 = 0 THEN 'Performance test report #' || i::text || ' for content moderation testing'
                WHEN i % 5 = 0 THEN 'Test report #' || i::text || ' - automated test data'
                ELSE NULL
            END,
            user_ids[1 + floor(random() * array_length(user_ids, 1))],
            CASE 
                WHEN i % 10 = 0 THEN 'pending'
                WHEN i % 8 = 0 THEN 'reviewed'
                WHEN i % 6 = 0 THEN 'resolved'
                ELSE 'dismissed'
            END,
            CASE 
                WHEN i % 10 = 0 THEN NULL -- Pending
                WHEN i % 6 = 0 THEN 'Issue resolved - content updated'
                ELSE 'No action needed - report dismissed'
            END,
            CASE 
                WHEN i % 10 = 0 THEN NULL -- Pending
                ELSE NOW() - (random() * INTERVAL '6 months')
            END,
            CASE 
                WHEN i % 10 = 0 THEN NULL -- Pending
                ELSE '00000000-0000-0000-0000-000000000000'
            END,
            NOW() - (random() * INTERVAL '1 year')
        );
    END LOOP;
END $$;

-- ==========================================
-- UPDATE SONG STATISTICS (Realistic distribution)
-- ==========================================
-- Update view counts and ratings based on actual reviews
UPDATE public.songs SET 
    rating_average = subq.avg_rating,
    rating_count = subq.review_count,
    views = GREATEST(subq.review_count * (2 + floor(random() * 10)), views) -- Views should be higher than reviews
FROM (
    SELECT 
        song_id,
        ROUND(AVG(rating)::numeric, 1) as avg_rating,
        COUNT(*) as review_count
    FROM public.reviews
    GROUP BY song_id
) subq
WHERE public.songs.id = subq.song_id;

-- Update arrangement statistics based on arrangements per song
UPDATE public.arrangements SET 
    views = CASE 
        WHEN name = 'Original' THEN GREATEST(floor(random() * 500 + 100), views)
        ELSE GREATEST(floor(random() * 200 + 10), views)
    END,
    rating_average = CASE 
        WHEN random() < 0.8 THEN round((random() * 1.5 + 3.5)::numeric, 1)
        ELSE NULL
    END,
    rating_count = CASE 
        WHEN random() < 0.8 THEN floor(random() * 20 + 1)::integer
        ELSE 0
    END;

-- ==========================================
-- CREATE PERFORMANCE INDEXES FOR TESTING
-- ==========================================
-- These indexes help test query performance under load

-- Text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_title_gin ON public.songs USING GIN(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_artist_gin ON public.songs USING GIN(to_tsvector('english', artist));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrangements_chord_data_gin ON public.arrangements USING GIN(to_tsvector('english', chord_data));

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_public_created ON public.songs(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrangements_song_public ON public.arrangements(song_id, is_public) WHERE is_public = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_song_rating ON public.reviews(song_id, rating, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_setlist_items_setlist_pos ON public.setlist_items(setlist_id, position);

-- Statistics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_stats ON public.songs(views DESC, rating_average DESC, rating_count DESC) WHERE is_public = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrangements_stats ON public.arrangements(views DESC, rating_average DESC) WHERE is_public = true;

-- Drop helper functions
DROP FUNCTION IF EXISTS generate_random_string(INTEGER);
DROP FUNCTION IF EXISTS generate_slug(TEXT);

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES FOR PERFORMANCE TESTING
-- ==========================================
-- Run these to verify performance test data loaded correctly and test query performance:

-- Basic counts
-- SELECT 
--     'Performance Test Data Summary' as summary,
--     (SELECT COUNT(*) FROM public.users) as total_users,
--     (SELECT COUNT(*) FROM public.songs) as total_songs,
--     (SELECT COUNT(*) FROM public.arrangements) as total_arrangements,
--     (SELECT COUNT(*) FROM public.setlists) as total_setlists,
--     (SELECT COUNT(*) FROM public.setlist_items) as total_setlist_items,
--     (SELECT COUNT(*) FROM public.reviews) as total_reviews,
--     (SELECT COUNT(*) FROM public.content_reports) as total_reports;

-- Song statistics
-- SELECT 
--     'Song Statistics' as category,
--     COUNT(*) as total_songs,
--     COUNT(*) FILTER (WHERE is_public = true) as public_songs,
--     COUNT(*) FILTER (WHERE default_arrangement_id IS NOT NULL) as songs_with_default,
--     AVG(views) as avg_views,
--     MAX(views) as max_views,
--     COUNT(*) FILTER (WHERE rating_count > 0) as songs_with_ratings,
--     AVG(rating_average) FILTER (WHERE rating_count > 0) as avg_rating
-- FROM public.songs;

-- Arrangement statistics  
-- SELECT 
--     'Arrangement Statistics' as category,
--     COUNT(*) as total_arrangements,
--     COUNT(*) FILTER (WHERE is_public = true) as public_arrangements,
--     AVG(arrangements_per_song.count) as avg_arrangements_per_song,
--     MAX(arrangements_per_song.count) as max_arrangements_per_song,
--     COUNT(DISTINCT song_id) as songs_with_arrangements
-- FROM public.arrangements,
-- LATERAL (
--     SELECT COUNT(*) as count 
--     FROM public.arrangements a2 
--     WHERE a2.song_id = arrangements.song_id
-- ) arrangements_per_song;

-- Setlist statistics
-- SELECT 
--     'Setlist Statistics' as category,
--     COUNT(*) as total_setlists,
--     COUNT(*) FILTER (WHERE is_public = true) as public_setlists,
--     AVG(items_per_setlist.count) as avg_items_per_setlist,
--     MAX(items_per_setlist.count) as max_items_per_setlist
-- FROM public.setlists,
-- LATERAL (
--     SELECT COUNT(*) as count 
--     FROM public.setlist_items si 
--     WHERE si.setlist_id = setlists.id
-- ) items_per_setlist;

-- Performance test queries (measure execution time)
-- EXPLAIN ANALYZE SELECT * FROM public.songs WHERE is_public = true ORDER BY views DESC LIMIT 100;
-- EXPLAIN ANALYZE SELECT * FROM public.songs WHERE title ILIKE '%amazing%' AND is_public = true;
-- EXPLAIN ANALYZE SELECT s.*, COUNT(a.id) as arrangement_count FROM public.songs s LEFT JOIN public.arrangements a ON s.id = a.song_id WHERE s.is_public = true GROUP BY s.id ORDER BY s.rating_average DESC NULLS LAST LIMIT 50;
-- EXPLAIN ANALYZE SELECT * FROM public.arrangements WHERE chord_data ILIKE '%[C]%' AND is_public = true LIMIT 100;
-- EXPLAIN ANALYZE SELECT sl.*, COUNT(si.id) as item_count FROM public.setlists sl LEFT JOIN public.setlist_items si ON sl.id = si.setlist_id WHERE sl.is_public = true GROUP BY sl.id ORDER BY sl.created_at DESC LIMIT 25;

-- Test pagination performance
-- EXPLAIN ANALYZE SELECT * FROM public.songs WHERE is_public = true ORDER BY created_at DESC OFFSET 500 LIMIT 50;
-- EXPLAIN ANALYZE SELECT * FROM public.arrangements WHERE is_public = true ORDER BY created_at DESC OFFSET 1000 LIMIT 50;

-- Test complex search queries
-- EXPLAIN ANALYZE SELECT DISTINCT s.* FROM public.songs s JOIN public.arrangements a ON s.id = a.song_id WHERE s.is_public = true AND a.is_public = true AND (s.title ILIKE '%grace%' OR s.artist ILIKE '%chris%' OR a.chord_data ILIKE '%[G]%') ORDER BY s.views DESC LIMIT 20;