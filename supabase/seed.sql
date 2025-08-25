-- Seed data for HSA Songbook development
-- This file is run after migrations during `supabase db reset`

BEGIN;

-- Create test users (only in local development)
-- Note: These users won't have auth records, they're just for foreign key references
INSERT INTO public.users (id, email, username, full_name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@example.com', 'admin', 'Admin User'),
    ('22222222-2222-2222-2222-222222222222', 'moderator@example.com', 'moderator', 'Moderator User'),
    ('33333333-3333-3333-3333-333333333333', 'user1@example.com', 'user1', 'Test User 1'),
    ('44444444-4444-4444-4444-444444444444', 'user2@example.com', 'user2', 'Test User 2')
ON CONFLICT (id) DO NOTHING;

-- Assign roles
INSERT INTO public.user_roles (user_id, role, granted_by) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin', '11111111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222', 'moderator', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- Create sample songs
INSERT INTO public.songs (id, title, slug, artist, themes, ccli, created_by, is_public, lyrics) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
     'Amazing Grace', 
     'amazing-grace', 
     'John Newton',
     ARRAY['grace', 'salvation', 'redemption'],
     '1037882',
     '11111111-1111-1111-1111-111111111111',
     true,
     '{"verses": [{"type": "verse", "number": 1, "text": "Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind but now I see"}]}'::jsonb),
    
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'How Great Thou Art',
     'how-great-thou-art',
     'Stuart K. Hine',
     ARRAY['worship', 'creation', 'majesty'],
     '14181',
     '11111111-1111-1111-1111-111111111111',
     true,
     '{"verses": [{"type": "verse", "number": 1, "text": "O Lord my God, when I in awesome wonder\nConsider all the worlds Thy hands have made"}]}'::jsonb),
    
    ('cccccccc-cccc-cccc-cccc-cccccccccccc',
     'Great Is Thy Faithfulness',
     'great-is-thy-faithfulness',
     'Thomas O. Chisholm',
     ARRAY['faithfulness', 'providence', 'mercy'],
     '18723',
     '22222222-2222-2222-2222-222222222222',
     true,
     '{"verses": [{"type": "verse", "number": 1, "text": "Great is Thy faithfulness, O God my Father\nThere is no shadow of turning with Thee"}]}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create sample arrangements
INSERT INTO public.arrangements (id, song_id, name, slug, chord_data, key, tempo, difficulty, created_by) VALUES
    ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Traditional',
     'traditional',
     '{title: Amazing Grace}
{artist: John Newton}
{key: G}

[G]Amazing [G7]grace, how [C]sweet the [G]sound
That [G]saved a [G/B]wretch like [D]me
I [G]once was [G7]lost, but [C]now am [G]found
Was [G/D]blind but [D]now I [G]see',
     'G',
     72,
     'easy',
     '11111111-1111-1111-1111-111111111111'),
    
    ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'Standard',
     'standard',
     '{title: How Great Thou Art}
{artist: Stuart K. Hine}
{key: A}

O Lord my [A]God, when I in [D]awesome wonder
Con[A]sider [E]all the [A]worlds Thy [E]hands have [A]made',
     'A',
     68,
     'medium',
     '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Update default arrangements
UPDATE public.songs 
SET default_arrangement_id = '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE public.songs 
SET default_arrangement_id = '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Create sample setlists
INSERT INTO public.setlists (id, name, description, is_public, created_by) VALUES
    ('11111111-1111-1111-aaaa-111111111111',
     'Sunday Morning Worship',
     'Regular Sunday morning service setlist',
     true,
     '11111111-1111-1111-1111-111111111111'),
    
    ('22222222-2222-2222-bbbb-222222222222',
     'Youth Service',
     'Contemporary songs for youth service',
     true,
     '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Add songs to setlists
INSERT INTO public.setlist_items (setlist_id, arrangement_id, position) VALUES
    ('11111111-1111-1111-aaaa-111111111111', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1),
    ('11111111-1111-1111-aaaa-111111111111', '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2)
ON CONFLICT DO NOTHING;

-- Add sample reviews
INSERT INTO public.reviews (song_id, user_id, rating, comment) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 5, 'Beautiful hymn, timeless message'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 5, 'Love this arrangement'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 4, 'Great worship song')
ON CONFLICT (song_id, user_id) DO NOTHING;

COMMIT;

-- Display seed data summary
SELECT 'Seed data loaded:' as status;
SELECT COUNT(*) as users_count FROM public.users;
SELECT COUNT(*) as songs_count FROM public.songs;
SELECT COUNT(*) as arrangements_count FROM public.arrangements;
SELECT COUNT(*) as setlists_count FROM public.setlists;
SELECT COUNT(*) as reviews_count FROM public.reviews;