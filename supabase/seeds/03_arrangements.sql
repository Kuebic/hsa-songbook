-- HSA Songbook Seed Data: Arrangement Variations
-- Creates additional arrangement variations for comprehensive testing
-- Includes different keys, difficulties, and chord progressions

BEGIN;

-- ==========================================
-- ARRANGEMENT VARIATIONS
-- ==========================================
-- Create multiple arrangements for songs to test arrangement selection and comparison

INSERT INTO public.arrangements (
    id, song_id, name, slug, chord_data, 
    difficulty, key, tempo, time_signature, 
    is_public, created_by, created_at, moderation_status,
    description, tags
) VALUES
    -- Multiple arrangements for "Goodness of God"
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c31',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b33',
        'Original Key (C)',
        'original-c',
        '{title:Goodness of God}
{key:C}
{tempo:76}
{time:4/4}
{artist:Bethel Music, Jenn Johnson}

Verse 1:
[C]I love You Lord, oh Your [G]mercy never [Am]fails me
[F]All my days, I''ve been [C]held in Your [G]hands
From the [Am]moment that I [G]wake up
Until I [F]lay my head
[G]I will sing of the [C]goodness of God

Chorus:
All my [C]life You have been [G]faithful
All my [Am]life You have been [F]so, so good
With every [C]breath that I am [G]able
I will [Am]sing of the [F]goodness of [C]God [G]',
        'medium',
        'C',
        76,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
        NOW() - INTERVAL '3 months',
        'approved',
        'Standard arrangement in original key',
        ARRAY['contemporary', 'worship', 'medium']
    ),
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c32',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b33',
        'Guitar Friendly (G)',
        'guitar-g',
        '{title:Goodness of God}
{key:G}
{tempo:76}
{time:4/4}
{artist:Bethel Music, Jenn Johnson}
{comment:Capo 5 to match original recording}

Verse 1:
[G]I love You Lord, oh Your [D]mercy never [Em]fails me
[C]All my days, I''ve been [G]held in Your [D]hands
From the [Em]moment that I [D]wake up
Until I [C]lay my head
[D]I will sing of the [G]goodness of God',
        'easy',
        'G',
        76,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',
        NOW() - INTERVAL '2 months',
        'approved',
        'Guitar-friendly arrangement with open chords',
        ARRAY['contemporary', 'worship', 'easy', 'guitar']
    ),
    
    -- Way Maker arrangements
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b34',
        'Original Key (E)',
        'original-e',
        '{title:Way Maker}
{key:E}
{tempo:66}
{time:4/4}
{artist:Sinach}

Verse 1:
[E]You are here, moving in our [B]midst
I worship [C#m]You, I worship [A]You
[E]You are here, working in this [B]place
I worship [C#m]You, I worship [A]You

Chorus:
[E]You are Way maker, miracle worker
[B]Promise keeper, light in the darkness
[C#m]My God, [A]that is who You are
[E]You are Way maker, miracle worker
[B]Promise keeper, light in the darkness
[C#m]My God, [A]that is who You [E]are',
        'medium',
        'E',
        66,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        NOW() - INTERVAL '4 months',
        'approved',
        'Original recording key with full arrangement',
        ARRAY['contemporary', 'african', 'worship']
    ),
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c34',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b34',
        'Beginner Friendly (D)',
        'beginner-d',
        '{title:Way Maker}
{key:D}
{tempo:66}
{time:4/4}
{artist:Sinach}
{comment:Simplified chord progression for beginners}

Verse 1:
[D]You are here, moving in our [A]midst
I worship [Bm]You, I worship [G]You
[D]You are here, working in this [A]place
I worship [Bm]You, I worship [G]You

Chorus:
[D]Way maker, miracle worker
[A]Promise keeper, light in the darkness
[Bm]My God, [G]that is who You are',
        'easy',
        'D',
        66,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',
        NOW() - INTERVAL '1 month',
        'approved',
        'Simplified arrangement for beginning guitarists',
        ARRAY['contemporary', 'worship', 'easy', 'beginner']
    ),

    -- Spanish song arrangements
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c35',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b32',
        'Original Key',
        'original',
        '{title:Renuévame}
{key:G}
{tempo:72}
{time:4/4}
{artist:Marcos Witt}

Verso 1:
[G]Renuévame Señor [C]Jesús
[G]Ya no quiero ser [D]igual
[Em]Renuévame Señor Je[C]sús
[G]Pon en mí tu co[D]razón

Coro:
[G]Porque todo lo que [C]hay
[G]Dentro de mi co[D]razón
[Em]Solo tú conoces [C]bien
[G]Cámbialo Se[D]ñor [G]',
        'medium',
        'G',
        72,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24',
        NOW() - INTERVAL '2 months',
        'approved',
        'Arreglo original en español por Marcos Witt',
        ARRAY['spanish', 'contemporary', 'renewal']
    ),

    -- Korean hymn arrangements
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c36',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b44',
        'Traditional Arrangement',
        'traditional',
        '{title:주의 사랑 비칠 때에}
{key:F}
{tempo:80}
{time:4/4}
{artist:Traditional Korean Hymn}

1절:
[F]주의 사랑 [Bb]비칠 때에 [F]내 맘 정결 [C]하리라
[F]주의 사랑 [Bb]비칠 때에 [F]내 맘 [C]정결 [F]하리라

후렴:
[F]주여 [Bb]나의 맘 [F]속에 [C]들어와 [F]계시사
[F]모든 [Bb]죄악 물[F]리치고 [C]정케 하옵[F]소서',
        'medium',
        'F',
        80,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28',
        NOW() - INTERVAL '3 months',
        'approved',
        'Traditional Korean hymn arrangement',
        ARRAY['korean', 'traditional', 'hymn']
    ),

    -- Advanced arrangements for experienced musicians
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c37',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b35',
        'Advanced Jazz Chords',
        'jazz-advanced',
        '{title:Oceans (Where Feet May Fail)}
{key:D}
{tempo:76}
{time:4/4}
{artist:Hillsong United}
{comment:Advanced jazz chord arrangement}

Verse 1:
[Dmaj7]You call me out upon the [Gmaj7]waters
The great un[Bm7]known where feet may [Asus4]fail [A]
[Dmaj7]And there I find You in the [Gmaj7]mystery
In oceans [Bm7]deep my faith will [Asus4]stand [A]

Chorus:
And I will [G]call upon Your [D/F#]name
And keep my [G]eyes above the [D/F#]waves
When oceans [G]rise, my soul will [D/F#]rest in Your em[Bm7]brace
For I am [Asus4]Yours [A] and You are [D]mine [Dmaj7]',
        'advanced',
        'D',
        76,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29',
        NOW() - INTERVAL '5 months',
        'approved',
        'Advanced arrangement with jazz chord extensions',
        ARRAY['contemporary', 'worship', 'advanced', 'jazz']
    ),

    -- Simple arrangements for beginners
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c38',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b37',
        'Three Chord Version',
        'three-chord',
        '{title:Great Is Thy Faithfulness}
{key:G}
{tempo:72}
{time:3/4}
{artist:Thomas Chisholm}
{comment:Simplified to just three chords for beginners}

Verse 1:
[G]Great is Thy faithfulness, [C]O God my [G]Father
[G]There is no shadow of [D]turning with [G]Thee
[G]Thou changest not, Thy com[C]passions, they [G]fail not
[G]As Thou hast [D]been Thou for[G]ever wilt be

Chorus:
[G]Great is Thy [C]faithful[G]ness
[G]Great is Thy [D]faithful[G]ness
[G]Morning by [C]morning new [G]mercies I see
[G]All I have [C]needed Thy [G]hand hath pro[D]vided
[G]Great is Thy [D]faithfulness, [G]Lord, unto me',
        'easy',
        'G',
        72,
        '3/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',
        NOW() - INTERVAL '1 month',
        'approved',
        'Ultra-simple version using only G, C, and D chords',
        ARRAY['traditional', 'hymn', 'easy', 'beginner']
    ),

    -- Alternative time signatures
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c39',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b45',
        'Acoustic Fingerpicking',
        'acoustic-fingerpicking',
        '{title:Build My Life}
{key:G}
{tempo:68}
{time:4/4}
{artist:Pat Barrett, Brett Younker}
{comment:Fingerpicking pattern for acoustic guitar}

Verse 1:
[G]Worthy of every song we could ever sing [Em7]
[C]Worthy of all the praise we could ever bring [G] [Em7]
[G]Worthy of every breath we could ever breathe [Em7]
We live for [C]You [G]

Chorus:
[G]Jesus the name above [Em7]every other name
[C]Jesus the only one [G]who could ever save
[G]Worthy of every breath we could [Em7]ever breathe
We live for [C]You
We live for [G]You',
        'medium',
        'G',
        68,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29',
        NOW() - INTERVAL '6 weeks',
        'approved',
        'Acoustic fingerpicking arrangement with detailed picking patterns',
        ARRAY['contemporary', 'worship', 'acoustic', 'fingerpicking']
    ),

    -- Worship team arrangement
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c40',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b43',
        'Full Band Arrangement',
        'full-band',
        '{title:Shout to the Lord}
{key:D}
{tempo:84}
{time:4/4}
{artist:Darlene Zschech}
{comment:Complete arrangement for worship band with chord charts}

Verse 1:
[D]My Jesus, [A]my Saviour, [Bm]Lord there is [F#m]none like [G]You
All of my [D]days, I want to [Em]praise the [A]wonders of Your [Bm]mighty love [A]
[D]My comfort, [A]my shelter, [Bm]tower of [F#m]refuge and [G]strength
Let every [D]breath, all that I [Em]am, [A]never cease to [D]worship You

Chorus:
[G]Shout to the [D]Lord all the [A]earth let us [Bm]sing
[G]Power and [D]majesty [Em]praise [A]to the [D]King
[G]Mountains bow [D]down and the [A]seas will [Bm]roar
At the [G]sound of Your [D]name
[G]I sing for [D]joy at the [A]work of Your [Bm]hands
For[G]ever I''ll [D]love You, for[Em]ever I''ll [A]stand
[G]Nothing com[D]pares to the [A]promise I [Bm]have in [A]You [D]',
        'medium',
        'D',
        84,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
        NOW() - INTERVAL '2 months',
        'approved',
        'Full worship band arrangement with detailed chord progressions',
        ARRAY['contemporary', 'worship', 'full-band', 'classic']
    )
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- UPDATE DEFAULT ARRANGEMENTS
-- ==========================================
-- Set default arrangements for the new songs

UPDATE public.songs 
SET default_arrangement_id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c31'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b33';

UPDATE public.songs 
SET default_arrangement_id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b34';

UPDATE public.songs 
SET default_arrangement_id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c35'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b32';

-- ==========================================
-- ARRANGEMENT METADATA
-- ==========================================
-- Add realistic view counts and ratings

UPDATE public.arrangements SET 
    views = floor(random() * 400 + 25)::int,
    rating_average = round((random() * 1.5 + 3.5)::numeric, 1),
    rating_count = floor(random() * 40 + 3)::int
WHERE id IN (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c31',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c32',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c34',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c35',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c36',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c37',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c38',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c39',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c40'
);

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Uncomment these to verify the data was loaded correctly:
-- 
-- -- Count arrangements by difficulty
-- SELECT 
--     difficulty,
--     COUNT(*) as arrangement_count
-- FROM public.arrangements 
-- WHERE id LIKE 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c%'
-- GROUP BY difficulty 
-- ORDER BY 
--     CASE difficulty 
--         WHEN 'easy' THEN 1 
--         WHEN 'medium' THEN 2 
--         WHEN 'advanced' THEN 3 
--     END;
-- 
-- -- Count arrangements by key
-- SELECT 
--     key,
--     COUNT(*) as arrangement_count
-- FROM public.arrangements 
-- WHERE id LIKE 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c%'
--   AND key IS NOT NULL
-- GROUP BY key 
-- ORDER BY arrangement_count DESC;
-- 
-- -- Songs with multiple arrangements
-- SELECT 
--     s.title,
--     COUNT(a.id) as arrangement_count,
--     array_agg(a.name || ' (' || a.key || ')') as arrangements
-- FROM public.songs s
-- JOIN public.arrangements a ON s.id = a.song_id
-- WHERE a.id LIKE 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c%'
-- GROUP BY s.id, s.title
-- HAVING COUNT(a.id) > 1
-- ORDER BY arrangement_count DESC;