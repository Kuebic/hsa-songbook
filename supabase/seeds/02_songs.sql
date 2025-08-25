-- HSA Songbook Seed Data: Additional Songs
-- Creates additional song samples beyond the base seed.sql
-- Includes diverse genres, languages, and themes for comprehensive testing

BEGIN;

-- ==========================================
-- ADDITIONAL SONGS DATA
-- ==========================================
-- These songs extend the base set in seed.sql with more variety

INSERT INTO public.songs (
    id, title, slug, artist, alternative_titles, 
    themes, ccli, original_language, is_public, 
    created_by, created_at, moderation_status,
    composition_year, source, notes
) VALUES
    -- Spanish Worship Songs
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b31',
        'Cuán Grande Es Él',
        'cuan-grande-es-el',
        'Traditional Spanish',
        ARRAY['How Great Thou Art (Spanish)'],
        ARRAY['worship', 'majesty', 'creation', 'spanish'],
        '14181',
        'es',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24',
        NOW() - INTERVAL '3 months',
        'approved',
        1885,
        'Traditional Hymn',
        'Spanish translation of How Great Thou Art'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b32',
        'Renuévame',
        'renuevame',
        'Marcos Witt',
        ARRAY['Renew Me', 'Renueva Mi Corazón'],
        ARRAY['renewal', 'transformation', 'spanish', 'contemporary'],
        '2689586',
        'es',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24',
        NOW() - INTERVAL '2 months',
        'approved',
        1995,
        'Contemporary Christian',
        'Popular Spanish worship song by Marcos Witt'
    ),

    -- Contemporary/Modern Worship
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b33',
        'Goodness of God',
        'goodness-of-god',
        'Bethel Music, Jenn Johnson',
        NULL,
        ARRAY['goodness', 'faithfulness', 'testimony', 'contemporary'],
        '7117726',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
        NOW() - INTERVAL '4 months',
        'approved',
        2018,
        'Bethel Music',
        'Popular contemporary worship anthem'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b34',
        'Way Maker',
        'way-maker',
        'Sinach',
        ARRAY['Waymaker'],
        ARRAY['miracles', 'promise_keeper', 'contemporary', 'african'],
        '7115744',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        NOW() - INTERVAL '5 months',
        'approved',
        2016,
        'Nigerian Gospel',
        'Global worship phenomenon by Sinach'
    ),

    -- Youth/Contemporary Rock
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b35',
        'Oceans (Where Feet May Fail)',
        'oceans-where-feet-may-fail',
        'Hillsong United',
        ARRAY['Oceans'],
        ARRAY['faith', 'trust', 'courage', 'contemporary'],
        '6428767',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23',
        NOW() - INTERVAL '6 months',
        'approved',
        2013,
        'Hillsong United',
        'Powerful contemporary worship song about stepping out in faith'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b36',
        'Reckless Love',
        'reckless-love',
        'Cory Asbury',
        NULL,
        ARRAY['love', 'grace', 'pursuit', 'contemporary'],
        '7089641',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23',
        NOW() - INTERVAL '1 year',
        'approved',
        2017,
        'Bethel Music',
        'Award-winning song about Gods relentless love'
    ),

    -- Traditional Hymns
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b37',
        'Great Is Thy Faithfulness',
        'great-is-thy-faithfulness',
        'Thomas Chisholm',
        NULL,
        ARRAY['faithfulness', 'morning', 'mercies', 'traditional'],
        '18723',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27',
        NOW() - INTERVAL '8 months',
        'approved',
        1923,
        'Traditional Hymn',
        'Classic hymn based on Lamentations 3:22-23'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b38',
        'It Is Well With My Soul',
        'it-is-well-with-my-soul',
        'Horatio Spafford, Philip Bliss',
        NULL,
        ARRAY['peace', 'suffering', 'faith', 'traditional'],
        '25376',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27',
        NOW() - INTERVAL '9 months',
        'approved',
        1873,
        'Traditional Hymn',
        'Hymn written after personal tragedy, expressing deep faith'
    ),

    -- Easter/Resurrection
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b39',
        'Because He Lives',
        'because-he-lives',
        'Bill Gaither, Gloria Gaither',
        NULL,
        ARRAY['easter', 'resurrection', 'hope', 'life'],
        '16880',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        NOW() - INTERVAL '7 months',
        'approved',
        1971,
        'Gaither Music',
        'Easter favorite about living hope through resurrection'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b40',
        'Living Hope',
        'living-hope',
        'Phil Wickham, Brian Johnson',
        NULL,
        ARRAY['easter', 'resurrection', 'hope', 'contemporary'],
        '7106807',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
        NOW() - INTERVAL '2 years',
        'approved',
        2018,
        'Phil Wickham',
        'Modern Easter anthem celebrating the resurrection'
    ),

    -- Prayer/Devotional
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b41',
        'Be Thou My Vision',
        'be-thou-my-vision',
        'Traditional Irish',
        NULL,
        ARRAY['prayer', 'vision', 'devotion', 'traditional', 'celtic'],
        '30639',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28',
        NOW() - INTERVAL '10 months',
        'approved',
        1912,
        'Ancient Irish Hymn',
        'Ancient Irish hymn adapted from 8th century poem'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b42',
        'Draw Me Close',
        'draw-me-close',
        'Kelly Carpenter',
        ARRAY['Draw Me Close to You'],
        ARRAY['intimacy', 'prayer', 'closeness', 'contemporary'],
        '1459484',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
        NOW() - INTERVAL '11 months',
        'approved',
        1994,
        'Vineyard Music',
        'Intimate worship song expressing desire for closeness with God'
    ),

    -- Multilingual/Cultural
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b43',
        'Shout to the Lord',
        'shout-to-the-lord',
        'Darlene Zschech',
        NULL,
        ARRAY['praise', 'declaration', 'worship', 'contemporary'],
        '1406918',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29',
        NOW() - INTERVAL '1.5 years',
        'approved',
        1993,
        'Hillsong Music',
        'Global worship classic from Hillsong'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b44',
        '주의 사랑 비칠 때에',
        'jui-sarang-bichil-ttaee',
        'Traditional Korean Hymn',
        ARRAY['When the Love of Christ Shines', 'Love Divine All Loves Excelling (Korean)'],
        ARRAY['love', 'divine', 'korean', 'traditional'],
        NULL,
        'ko',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28',
        NOW() - INTERVAL '4 months',
        'approved',
        1920,
        'Korean Hymnal',
        'Korean translation of Love Divine, All Loves Excelling'
    ),

    -- Modern Worship Ballads
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b45',
        'Build My Life',
        'build-my-life',
        'Pat Barrett, Brett Younker',
        NULL,
        ARRAY['surrender', 'foundation', 'jesus', 'contemporary'],
        '7070345',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',
        NOW() - INTERVAL '6 months',
        'approved',
        2017,
        'Passion Music',
        'Modern worship ballad about building life on Jesus'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b46',
        'King of My Heart',
        'king-of-my-heart',
        'John Mark McMillan, Sarah McMillan',
        NULL,
        ARRAY['kingship', 'heart', 'surrender', 'contemporary'],
        '7005631',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30',
        NOW() - INTERVAL '3 years',
        'approved',
        2015,
        'John Mark McMillan',
        'Intimate contemporary worship declaring Jesus as King'
    ),

    -- Seasonal/Special Occasions
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b47',
        'Mary Did You Know',
        'mary-did-you-know',
        'Mark Lowry, Buddy Greene',
        NULL,
        ARRAY['christmas', 'mary', 'prophecy', 'contemporary'],
        '839225',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        NOW() - INTERVAL '2 years',
        'approved',
        1991,
        'Christian Christmas Song',
        'Contemplative Christmas song about Mary and Jesus'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b48',
        'Come Thou Fount',
        'come-thou-fount',
        'Robert Robinson',
        ARRAY['Come Thou Fount of Every Blessing'],
        ARRAY['blessing', 'streams', 'mercy', 'traditional'],
        '108389',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27',
        NOW() - INTERVAL '13 months',
        'approved',
        1757,
        'Traditional Hymn',
        'Classic hymn about streams of mercy and blessing'
    )
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- UPDATE SONG METADATA
-- ==========================================
-- Add realistic view counts and ratings for the new songs

UPDATE public.songs SET 
    views = floor(random() * 800 + 50)::int,
    rating_average = round((random() * 1.5 + 3.5)::numeric, 1),
    rating_count = floor(random() * 75 + 5)::int
WHERE id IN (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b31',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b32',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b33',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b34',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b35',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b36',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b37',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b38',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b39',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b40',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b41',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b42',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b43',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b44',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b45',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b46',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b47',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b48'
);

-- ==========================================
-- SAMPLE REVIEWS FOR NEW SONGS
-- ==========================================
-- Add reviews for some of the new songs to test review functionality

INSERT INTO public.reviews (
    id, song_id, user_id, rating, comment, created_at
) VALUES
    -- Reviews for popular contemporary songs
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f21', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 5, 'Incredible song that really speaks to Gods faithfulness in our lives. Perfect for corporate worship!', NOW() - INTERVAL '1 month'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f22', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b34', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 5, 'Way Maker has become such a powerful anthem in our youth services. Amazing testimony to Gods power!', NOW() - INTERVAL '3 weeks'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f23', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b35', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 4, 'Beautiful song about faith and trust. The arrangement is challenging but worth learning.', NOW() - INTERVAL '2 weeks'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f24', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b32', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 5, 'Marcos Witt es increíble! Esta canción toca mi corazón cada vez. Perfect for Spanish services.', NOW() - INTERVAL '5 days'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f25', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b37', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 5, 'One of the greatest hymns ever written. The theology is rich and the melody is timeless.', NOW() - INTERVAL '1 week'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f26', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b41', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 4, 'Beautiful Celtic melody with profound lyrics. Great for contemplative worship times.', NOW() - INTERVAL '4 days'),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f27', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b45', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 4, 'Great song for surrendering everything to Jesus. The bridge is particularly powerful.', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Uncomment these to verify the data was loaded correctly:
-- 
-- -- Count songs by language
-- SELECT 
--     original_language,
--     COUNT(*) as song_count
-- FROM public.songs 
-- WHERE id LIKE 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b%'
-- GROUP BY original_language 
-- ORDER BY song_count DESC;
-- 
-- -- Count songs by decade
-- SELECT 
--     FLOOR(composition_year/10)*10 as decade,
--     COUNT(*) as song_count
-- FROM public.songs 
-- WHERE composition_year IS NOT NULL 
--   AND id LIKE 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b%'
-- GROUP BY decade 
-- ORDER BY decade DESC;
-- 
-- -- Recent reviews
-- SELECT 
--     s.title,
--     u.username,
--     r.rating,
--     r.comment,
--     r.created_at
-- FROM public.reviews r
-- JOIN public.songs s ON r.song_id = s.id
-- JOIN public.users u ON r.user_id = u.id
-- WHERE r.id LIKE 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f2%'
-- ORDER BY r.created_at DESC;