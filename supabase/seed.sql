-- HSA Songbook Seed Data
-- Main seed file that orchestrates loading all seed data
-- This file is automatically executed during `supabase db reset`

BEGIN;

-- ==========================================
-- CLEAR EXISTING DATA (for reset scenarios)
-- ==========================================
TRUNCATE TABLE 
    public.setlist_items,
    public.setlists,
    public.arrangements,
    public.songs,
    public.user_roles,
    public.users
RESTART IDENTITY CASCADE;

-- ==========================================
-- TEST USERS
-- ==========================================
-- Note: For local development, we insert directly into public.users
-- In production, users would come from Supabase Auth

INSERT INTO public.users (id, email, username, full_name, created_at) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@hsa-songbook.test', 'admin', 'Admin User', NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'moderator@hsa-songbook.test', 'moderator', 'Moderator User', NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'user1@hsa-songbook.test', 'user1', 'Regular User 1', NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'user2@hsa-songbook.test', 'user2', 'Regular User 2', NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'korean@hsa-songbook.test', 'korean_user', '한국 사용자', NOW());

-- Assign roles
INSERT INTO public.user_roles (user_id, role, granted_by, granted_at) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'moderator', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW());

-- ==========================================
-- SONGS DATA
-- ==========================================
INSERT INTO public.songs (
    id, title, slug, artist, alternative_titles, 
    themes, ccli, original_language, is_public, 
    created_by, created_at, moderation_status
) VALUES
    -- Hymns
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
        'Amazing Grace',
        'amazing-grace',
        'John Newton',
        ARRAY['Amazing Grace (My Chains Are Gone)'],
        ARRAY['grace', 'salvation', 'redemption'],
        '22025',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        NOW(),
        'approved'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
        'How Great Thou Art',
        'how-great-thou-art',
        'Carl Boberg',
        ARRAY['O Lord My God'],
        ARRAY['worship', 'majesty', 'creation'],
        '14181',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        NOW(),
        'approved'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13',
        'Holy, Holy, Holy',
        'holy-holy-holy',
        'Reginald Heber',
        ARRAY['Holy Holy Holy Lord God Almighty'],
        ARRAY['trinity', 'worship', 'holiness'],
        '1156',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        NOW(),
        'approved'
    ),

    -- Contemporary Worship
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14',
        'In Christ Alone',
        'in-christ-alone',
        'Keith Getty, Stuart Townend',
        NULL,
        ARRAY['salvation', 'christ', 'hope'],
        '3350824',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        NOW(),
        'approved'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
        '10,000 Reasons (Bless the Lord)',
        '10000-reasons',
        'Matt Redman, Jonas Myrin',
        ARRAY['Ten Thousand Reasons', 'Bless the Lord O My Soul'],
        ARRAY['worship', 'praise', 'blessing'],
        '6016351',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        NOW(),
        'approved'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16',
        'What A Beautiful Name',
        'what-a-beautiful-name',
        'Ben Fielding, Brooke Ligertwood',
        NULL,
        ARRAY['jesus', 'name', 'worship'],
        '7068424',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        NOW(),
        'approved'
    ),

    -- Christmas Songs
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
        'Silent Night',
        'silent-night',
        'Franz Gruber, Joseph Mohr',
        ARRAY['Silent Night Holy Night'],
        ARRAY['christmas', 'advent', 'peace'],
        '27862',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        NOW(),
        'approved'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b18',
        'O Come All Ye Faithful',
        'o-come-all-ye-faithful',
        'John Francis Wade',
        ARRAY['Adeste Fideles'],
        ARRAY['christmas', 'advent', 'worship'],
        '31054',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        NOW(),
        'approved'
    ),

    -- Korean Songs
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b19',
        '주 하나님 지으신 모든 세계',
        'ju-hananim-jieusin',
        'Traditional Korean Hymn',
        ARRAY['How Great Thou Art (Korean)'],
        ARRAY['worship', 'majesty', 'creation'],
        NULL,
        'ko',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        NOW(),
        'approved'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b20',
        '나 같은 죄인 살리신',
        'na-gateun-joein',
        'Traditional Korean Hymn',
        ARRAY['Amazing Grace (Korean)'],
        ARRAY['grace', 'salvation', 'redemption'],
        NULL,
        'ko',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        NOW(),
        'approved'
    ),

    -- Easter Songs
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b21',
        'Christ the Lord Is Risen Today',
        'christ-lord-risen-today',
        'Charles Wesley',
        NULL,
        ARRAY['easter', 'resurrection', 'victory'],
        '27965',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        NOW(),
        'approved'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
        'Man of Sorrows',
        'man-of-sorrows',
        'Hillsong',
        NULL,
        ARRAY['easter', 'sacrifice', 'cross'],
        '6476063',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        NOW(),
        'approved'
    ),

    -- Communion Songs
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b23',
        'Behold the Lamb',
        'behold-the-lamb',
        'Keith Getty, Kristyn Getty, Stuart Townend',
        NULL,
        ARRAY['communion', 'sacrifice', 'lamb'],
        '5003372',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        NOW(),
        'approved'
    ),
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b24',
        'Remember',
        'remember',
        'Matt Redman, Matt Maher',
        NULL,
        ARRAY['communion', 'remembrance', 'sacrifice'],
        '7111934',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        NOW(),
        'approved'
    ),

    -- Prayer Songs
    (
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b25',
        'Lord I Need You',
        'lord-i-need-you',
        'Matt Maher, Jesse Reeves, Kristian Stanfill',
        NULL,
        ARRAY['prayer', 'dependence', 'need'],
        '5925687',
        'en',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        NOW(),
        'approved'
    );

-- ==========================================
-- ARRANGEMENTS DATA
-- ==========================================
INSERT INTO public.arrangements (
    id, song_id, name, slug, chord_data, 
    difficulty, key, tempo, time_signature, 
    is_public, created_by, created_at, moderation_status
) VALUES
    -- Amazing Grace Arrangements
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
        'Original Key',
        'original',
        '{title:Amazing Grace}
{key:G}
{tempo:72}
{time:3/4}
{artist:John Newton}

Verse 1:
A[G]mazing [G/B]grace how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
I [G]once was [G/B]lost but [C]now am [G]found
Was [Em]blind but [D]now I [G]see

Verse 2:
''Twas [G]grace that [G/B]taught my [C]heart to [G]fear
And [G]grace my [Em]fears re[D]lieved
How [G]precious [G/B]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved

Verse 3:
Through [G]many [G/B]dangers, [C]toils and [G]snares
I [G]have al[Em]ready [D]come
''Tis [G]grace hath [G/B]brought me [C]safe thus [G]far
And [Em]grace will [D]lead me [G]home

Verse 4:
When [G]we''ve been [G/B]there ten [C]thousand [G]years
Bright [G]shining [Em]as the [D]sun
We''ve [G]no less [G/B]days to [C]sing God''s [G]praise
Than [Em]when we [D]first be[G]gun',
        'easy',
        'G',
        72,
        '3/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        NOW(),
        'approved'
    ),
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
        'Capo 5 (Key of C)',
        'capo-5',
        '{title:Amazing Grace}
{key:C}
{capo:5}
{tempo:72}
{time:3/4}
{artist:John Newton}
{comment:Play G shapes with capo on 5th fret}

Verse 1:
A[G]mazing [G/B]grace how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
I [G]once was [G/B]lost but [C]now am [G]found
Was [Em]blind but [D]now I [G]see',
        'easy',
        'C',
        72,
        '3/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        NOW(),
        'approved'
    ),

    -- How Great Thou Art Arrangements
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12',
        'Original Key',
        'original',
        '{title:How Great Thou Art}
{key:A}
{tempo:68}
{time:4/4}
{artist:Carl Boberg}

Verse 1:
O Lord my [A]God, when I in [D]awesome wonder
Consider [A]all the [E]worlds Thy hands have [A]made
I see the [A]stars, I hear the [D]rolling thunder
Thy power through[A]out the [E]universe dis[A]played

Chorus:
Then sings my [A]soul, my [D]Saviour God, to [A]Thee
How great Thou [E]art, how great Thou [A]art
Then sings my [A]soul, my [D]Saviour God, to [A]Thee
How great Thou [E]art, how great Thou [A]art

Verse 2:
When through the [A]woods and forest [D]glades I wander
And hear the [A]birds sing [E]sweetly in the [A]trees
When I look [A]down from lofty [D]mountain grandeur
And hear the [A]brook and [E]feel the gentle [A]breeze

{comment:Repeat Chorus}

Verse 3:
And when I [A]think that God, His [D]Son not sparing
Sent Him to [A]die, I [E]scarce can take it [A]in
That on the [A]cross, my burden [D]gladly bearing
He bled and [A]died to [E]take away my [A]sin

{comment:Repeat Chorus}',
        'medium',
        'A',
        68,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        NOW(),
        'approved'
    ),

    -- In Christ Alone Arrangements
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14',
        'Original Key',
        'original',
        '{title:In Christ Alone}
{key:D}
{tempo:76}
{time:3/4}
{artist:Keith Getty, Stuart Townend}

Verse 1:
In [D]Christ a[G]lone my [D]hope is [A]found
[D/F#]He is my [G]light, my [A]strength, my [D]song
This [D]Corner[G]stone, this [D]solid [A]Ground
[D/F#]Firm through the [G]fiercest [A]drought and [D]storm
What heights of [D/F#]love, what [G]depths of [D]peace
When fears are [D/F#]stilled, when [G]strivings [A]cease
My [D]Comfort[G]er, my [D]All in [A]All
[D/F#]Here in the [G]love of [A]Christ I [D]stand

Verse 2:
In [D]Christ a[G]lone! Who [D]took on [A]flesh
[D/F#]Fullness of [G]God in [A]helpless [D]babe
This [D]gift of [G]love and [D]righteous[A]ness
[D/F#]Scorned by the [G]ones He [A]came to [D]save
Till on that [D/F#]cross as [G]Jesus [D]died
The wrath of [D/F#]God was [G]satis[A]fied
For [D]every [G]sin on [D]Him was [A]laid
[D/F#]Here in the [G]death of [A]Christ I [D]live',
        'medium',
        'D',
        76,
        '3/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        NOW(),
        'approved'
    ),

    -- 10,000 Reasons Arrangements
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c15',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15',
        'Original Key',
        'original',
        '{title:10,000 Reasons (Bless the Lord)}
{key:C}
{tempo:73}
{time:4/4}
{artist:Matt Redman, Jonas Myrin}

Chorus:
[C]Bless the [G]Lord, O my [D/F#]soul, [Em]O my soul
[C]Worship His [G]holy [Dsus4]name [D]
Sing like [C]never be[Em]fore, [C]O my [D]soul
I''ll [C]worship Your [D]holy [C/G]name [G] [C/G] [G]

Verse 1:
The [C]sun comes [G]up, it''s a [D]new day [Em]dawning
[C]It''s time to [G]sing Your [D]song a[Em]gain
What[C]ever may [G]pass and what[D]ever lies be[Em]fore me
[C]Let me be [G]singing when the [Dsus4]evening [D]comes [G]

{comment:Repeat Chorus}

Verse 2:
You''re [C]rich in [G]love and You''re [D]slow to [Em]anger
Your [C]name is [G]great and Your [D]heart is [Em]kind
For [C]all Your [G]goodness, I will [D]keep on [Em]singing
[C]Ten thousand [G]reasons for my [Dsus4]heart to [D]find [G]

{comment:Repeat Chorus}',
        'easy',
        'C',
        73,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        NOW(),
        'approved'
    ),

    -- Silent Night Arrangements
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c16',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b17',
        'Traditional',
        'traditional',
        '{title:Silent Night}
{key:C}
{tempo:60}
{time:3/4}
{artist:Franz Gruber, Joseph Mohr}

Verse 1:
[C]Silent night, holy night
[G]All is [C]calm, all is bright
[F]Round yon virgin [C]mother and child
[F]Holy infant so [C]tender and mild
[G]Sleep in heavenly [C]peace
Sleep in [G]heavenly [C]peace

Verse 2:
[C]Silent night, holy night
[G]Shepherds [C]quake at the sight
[F]Glories stream from [C]heaven afar
[F]Heavenly hosts sing [C]Alleluia
[G]Christ the Savior is [C]born
Christ the [G]Savior is [C]born

Verse 3:
[C]Silent night, holy night
[G]Son of [C]God, love''s pure light
[F]Radiant beams from [C]thy holy face
[F]With the dawn of re[C]deeming grace
[G]Jesus, Lord, at thy [C]birth
Jesus, [G]Lord, at thy [C]birth',
        'easy',
        'C',
        60,
        '3/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        NOW(),
        'approved'
    ),

    -- Korean Song Arrangements
    (
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c17',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b19',
        'Original Key',
        'original',
        '{title:주 하나님 지으신 모든 세계}
{key:G}
{tempo:72}
{time:4/4}
{artist:Traditional Korean Hymn}

Verse 1:
[G]주 하나님 [C]지으신 [G]모든 세계
[D]내 마음 속에 [G]그리어 볼 때
[G]하늘의 별 [C]울려 퍼지는 [G]뇌성
[D]주님의 권능 [G]우주에 찼네

Chorus:
[G]주님의 [C]높고 위대 하[G]심을
[Am]내 영혼[D]이 찬양[G]하네
[G]주님의 [C]높고 위대 하[G]심을
[Am]내 영혼[D]이 찬양[G]하네',
        'easy',
        'G',
        72,
        '4/4',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        NOW(),
        'approved'
    );

-- Update default arrangements for songs
UPDATE public.songs 
SET default_arrangement_id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11';

UPDATE public.songs 
SET default_arrangement_id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12';

UPDATE public.songs 
SET default_arrangement_id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14';

UPDATE public.songs 
SET default_arrangement_id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c15'
WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15';

-- ==========================================
-- SETLISTS DATA
-- ==========================================
INSERT INTO public.setlists (
    id, name, description, is_public, 
    created_by, created_at
) VALUES
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11',
        'Sunday Morning Worship',
        'Regular Sunday morning worship service setlist',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        NOW()
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12',
        'Christmas Eve Service',
        'Special Christmas Eve candlelight service',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        NOW()
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13',
        'Youth Group Worship',
        'Contemporary worship for youth service',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        NOW()
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14',
        'Easter Sunday Celebration',
        'Easter morning resurrection celebration',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        NOW()
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15',
        'Communion Service',
        'Monthly communion service setlist',
        false,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        NOW()
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d16',
        'Korean Service 주일예배',
        'Korean language worship service',
        true,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        NOW()
    ),
    (
        'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d17',
        'Prayer Meeting',
        'Wednesday evening prayer meeting songs',
        false,
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        NOW()
    );

-- ==========================================
-- SETLIST ITEMS DATA
-- ==========================================
INSERT INTO public.setlist_items (
    id, setlist_id, arrangement_id, position, 
    transpose_steps, notes, created_at
) VALUES
    -- Sunday Morning Worship
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c15', 1, 0, 'Opening song - upbeat', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e12', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 2, 0, 'Worship', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 3, 0, 'Response song', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e14', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d11', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 4, 0, 'Closing hymn', NOW()),

    -- Christmas Eve Service
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e21', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c16', 1, 0, 'Traditional opening', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', NULL, 2, 0, 'O Come All Ye Faithful - congregation', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c16', 3, 0, 'Candlelight - repeat', NOW()),

    -- Youth Group Worship
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e31', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c15', 1, 2, 'Key of D - energetic', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e32', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', NULL, 2, 0, 'What A Beautiful Name', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e33', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d13', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 3, -2, 'Key of C for vocalists', NOW()),

    -- Easter Sunday
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e41', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', NULL, 1, 0, 'Christ the Lord Is Risen Today', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e42', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 2, 0, 'In Christ Alone', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e43', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d14', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 3, 0, 'Closing - triumphant', NOW()),

    -- Communion Service
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e51', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', NULL, 1, 0, 'Behold the Lamb', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e52', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', NULL, 2, 0, 'Remember', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e53', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d15', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 3, 0, 'Reflection', NOW()),

    -- Korean Service
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e61', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d16', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c17', 1, 0, '찬양 시작', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e62', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d16', NULL, 2, 0, '나 같은 죄인 살리신', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e63', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d16', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 3, 0, 'English hymn for mixed congregation', NOW()),

    -- Prayer Meeting
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e71', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d17', NULL, 1, 0, 'Lord I Need You', NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e72', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d17', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 2, 0, 'Prayer response', NOW());

-- ==========================================
-- SAMPLE REVIEWS (Optional - for testing)
-- ==========================================
INSERT INTO public.reviews (
    id, song_id, user_id, rating, comment, created_at
) VALUES
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 5, 'Beautiful hymn, timeless message!', NOW()),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f12', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 5, 'Love this song for worship!', NOW()),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 4, 'Great contemporary worship song', NOW());

-- ==========================================
-- UPDATE STATISTICS
-- ==========================================
-- Update view counts and ratings for realism
UPDATE public.songs SET 
    views = floor(random() * 1000 + 1)::int,
    rating_average = round((random() * 2 + 3)::numeric, 1),
    rating_count = floor(random() * 50 + 1)::int
WHERE id IN (
    SELECT id FROM public.songs 
    ORDER BY random() 
    LIMIT 10
);

UPDATE public.arrangements SET 
    views = floor(random() * 500 + 1)::int,
    rating_average = round((random() * 2 + 3)::numeric, 1),
    rating_count = floor(random() * 30 + 1)::int
WHERE id IN (
    SELECT id FROM public.arrangements 
    ORDER BY random() 
    LIMIT 8
);

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these to verify seed data loaded correctly:
-- SELECT COUNT(*) as user_count FROM public.users;
-- SELECT COUNT(*) as song_count FROM public.songs;
-- SELECT COUNT(*) as arrangement_count FROM public.arrangements;
-- SELECT COUNT(*) as setlist_count FROM public.setlists;
-- SELECT COUNT(*) as setlist_item_count FROM public.setlist_items;