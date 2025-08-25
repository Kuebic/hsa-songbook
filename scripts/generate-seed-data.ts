#!/usr/bin/env tsx

/**
 * Generate random seed data for HSA Songbook database
 * Usage: npm run seed:generate [count]
 * Example: npm run seed:generate 100
 */

import { faker } from '@faker-js/faker';
import type { Database } from '../src/lib/database.types';

// Type definitions based on database schema
type Song = Database['public']['Tables']['songs']['Insert'];
type Arrangement = Database['public']['Tables']['arrangements']['Insert'];
type Setlist = Database['public']['Tables']['setlists']['Insert'];
type SetlistItem = Database['public']['Tables']['setlist_items']['Insert'];
type User = Database['public']['Tables']['users']['Insert'];

// Configuration
const KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];
const THEMES = ['worship', 'praise', 'prayer', 'salvation', 'grace', 'faith', 'hope', 'love', 'thanksgiving', 'advent', 'christmas', 'easter', 'communion', 'baptism', 'dedication', 'missions'];
const LANGUAGES = ['en', 'ko', 'es', 'zh', 'fr', 'de', 'pt', 'ja'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4', '12/8'];
const MODERATION_STATUSES = ['pending', 'approved', 'rejected', 'flagged'];

// Chord progressions for different keys
const CHORD_PROGRESSIONS: Record<string, string[]> = {
  'C': ['C', 'F', 'G', 'Am', 'Dm', 'Em', 'G7', 'C/E'],
  'D': ['D', 'G', 'A', 'Bm', 'Em', 'F#m', 'A7', 'D/F#'],
  'E': ['E', 'A', 'B', 'C#m', 'F#m', 'G#m', 'B7', 'E/G#'],
  'F': ['F', 'Bb', 'C', 'Dm', 'Gm', 'Am', 'C7', 'F/A'],
  'G': ['G', 'C', 'D', 'Em', 'Am', 'Bm', 'D7', 'G/B'],
  'A': ['A', 'D', 'E', 'F#m', 'Bm', 'C#m', 'E7', 'A/C#'],
  'B': ['B', 'E', 'F#', 'G#m', 'C#m', 'D#m', 'F#7', 'B/D#'],
};

// Song title templates
const SONG_TITLES = [
  () => `${faker.word.adjective({ strategy: 'closest' })} ${faker.word.noun({ strategy: 'closest' })}`,
  () => `Lord of ${faker.word.noun({ strategy: 'closest' })}`,
  () => `${faker.word.verb({ strategy: 'closest' })} Your Name`,
  () => `Great is ${faker.word.adjective({ strategy: 'closest' })}`,
  () => `${faker.word.adjective({ strategy: 'closest' })} God`,
  () => `All ${faker.word.noun({ strategy: 'closest' })}s Praise`,
  () => `Holy ${faker.word.noun({ strategy: 'closest' })}`,
  () => `${faker.word.verb({ strategy: 'closest' })} to the Lord`,
];

/**
 * Generate valid ChordPro format content
 */
function generateChordPro(title: string, artist: string, key: string): string {
  const tempo = faker.number.int({ min: 60, max: 140 });
  const timeSignature = faker.helpers.arrayElement(TIME_SIGNATURES);
  const chords = CHORD_PROGRESSIONS[key] || CHORD_PROGRESSIONS['C'];
  
  const verses = [];
  const numVerses = faker.number.int({ min: 2, max: 4 });
  
  // Generate header
  let chordPro = `{title:${title}}\n`;
  chordPro += `{artist:${artist}}\n`;
  chordPro += `{key:${key}}\n`;
  chordPro += `{tempo:${tempo}}\n`;
  chordPro += `{time:${timeSignature}}\n\n`;
  
  // Generate verses
  for (let i = 1; i <= numVerses; i++) {
    chordPro += `Verse ${i}:\n`;
    const numLines = faker.number.int({ min: 2, max: 4 });
    
    for (let j = 0; j < numLines; j++) {
      const words = faker.lorem.words({ min: 4, max: 8 }).split(' ');
      let line = '';
      
      // Add chords at intervals
      words.forEach((word, index) => {
        if (index === 0 || (index % 2 === 0 && faker.datatype.boolean())) {
          const chord = faker.helpers.arrayElement(chords);
          line += `[${chord}]`;
        }
        line += word + ' ';
      });
      
      chordPro += line.trim() + '\n';
    }
    chordPro += '\n';
  }
  
  // Add chorus
  if (faker.datatype.boolean()) {
    chordPro += 'Chorus:\n';
    const numLines = faker.number.int({ min: 2, max: 4 });
    
    for (let j = 0; j < numLines; j++) {
      const words = faker.lorem.words({ min: 3, max: 6 }).split(' ');
      let line = '';
      
      words.forEach((word, index) => {
        if (index === 0 || faker.datatype.boolean(0.4)) {
          const chord = faker.helpers.arrayElement(chords);
          line += `[${chord}]`;
        }
        line += word + ' ';
      });
      
      chordPro += line.trim() + '\n';
    }
    chordPro += '\n';
  }
  
  // Add bridge occasionally
  if (faker.datatype.boolean(0.3)) {
    chordPro += 'Bridge:\n';
    const words = faker.lorem.words({ min: 4, max: 8 }).split(' ');
    let line = '';
    
    words.forEach((word, index) => {
      if (index === 0 || index === Math.floor(words.length / 2)) {
        const chord = faker.helpers.arrayElement(chords);
        line += `[${chord}]`;
      }
      line += word + ' ';
    });
    
    chordPro += line.trim() + '\n';
  }
  
  return chordPro;
}

/**
 * Generate a random song
 */
function generateSong(index: number): Song {
  const titleGenerator = faker.helpers.arrayElement(SONG_TITLES);
  const title = titleGenerator().replace(/^\w/, c => c.toUpperCase());
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  return {
    id: faker.string.uuid(),
    title,
    slug: `${slug}-${index}`,
    artist: faker.person.fullName(),
    alternative_titles: faker.helpers.maybe(() => 
      faker.helpers.arrayElements([
        title + ' (Alternate)',
        faker.music.songName(),
      ], { min: 1, max: 2 })
    ),
    themes: faker.helpers.arrayElements(THEMES, { min: 1, max: 4 }),
    ccli: faker.helpers.maybe(() => faker.string.numeric(7)),
    ccli_verified: faker.datatype.boolean(),
    composition_year: faker.helpers.maybe(() => 
      faker.number.int({ min: 1700, max: new Date().getFullYear() })
    ),
    original_language: faker.helpers.arrayElement(LANGUAGES),
    lyrics_source: faker.helpers.maybe(() => faker.company.name()),
    lyrics_verified: faker.datatype.boolean(),
    source: faker.helpers.maybe(() => faker.internet.url()),
    notes: faker.helpers.maybe(() => faker.lorem.sentence()),
    is_public: faker.datatype.boolean(0.9),
    views: faker.number.int({ min: 0, max: 10000 }),
    rating_average: faker.helpers.maybe(() => 
      Number(faker.number.float({ min: 3, max: 5, multipleOf: 0.1 }).toFixed(1))
    ),
    rating_count: faker.number.int({ min: 0, max: 100 }),
    created_by: faker.string.uuid(),
    created_at: faker.date.past().toISOString(),
    moderation_status: faker.helpers.arrayElement(MODERATION_STATUSES),
    moderated_at: faker.helpers.maybe(() => faker.date.recent().toISOString()),
    moderated_by: faker.helpers.maybe(() => faker.string.uuid()),
  };
}

/**
 * Generate an arrangement for a song
 */
function generateArrangement(songId: string, songTitle: string, index: number): Arrangement {
  const key = faker.helpers.arrayElement(KEYS);
  const names = ['Original', 'Acoustic', 'Contemporary', 'Traditional', 'Simplified', 'Capo 2', 'Capo 5', 'Guitar-friendly'];
  const name = faker.helpers.arrayElement(names);
  
  return {
    id: faker.string.uuid(),
    song_id: songId,
    name,
    slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    chord_data: generateChordPro(songTitle, faker.person.fullName(), key),
    description: faker.helpers.maybe(() => faker.lorem.sentence()),
    difficulty: faker.helpers.arrayElement(DIFFICULTIES),
    key,
    tempo: faker.number.int({ min: 60, max: 140 }),
    time_signature: faker.helpers.arrayElement(TIME_SIGNATURES),
    tags: faker.helpers.maybe(() => 
      faker.helpers.arrayElements(['acoustic', 'electric', 'piano', 'organ', 'strings', 'full-band'], { min: 1, max: 3 })
    ),
    is_public: faker.datatype.boolean(0.95),
    views: faker.number.int({ min: 0, max: 5000 }),
    rating_average: faker.helpers.maybe(() => 
      Number(faker.number.float({ min: 3, max: 5, multipleOf: 0.1 }).toFixed(1))
    ),
    rating_count: faker.number.int({ min: 0, max: 50 }),
    created_by: faker.string.uuid(),
    created_at: faker.date.past().toISOString(),
    moderation_status: faker.helpers.arrayElement(MODERATION_STATUSES),
  };
}

/**
 * Generate a setlist
 */
function generateSetlist(index: number): Setlist {
  const names = [
    'Sunday Morning Worship',
    'Evening Service',
    'Youth Group',
    'Prayer Meeting',
    'Christmas Service',
    'Easter Celebration',
    'Acoustic Session',
    'Contemporary Worship',
    'Traditional Service',
    'Bilingual Service',
  ];
  
  return {
    id: faker.string.uuid(),
    name: `${faker.helpers.arrayElement(names)} - ${faker.date.recent().toLocaleDateString()}`,
    description: faker.helpers.maybe(() => faker.lorem.sentence()),
    is_public: faker.datatype.boolean(0.7),
    share_id: faker.helpers.maybe(() => faker.string.alphanumeric(8)),
    metadata: faker.helpers.maybe(() => ({
      venue: faker.company.name(),
      date: faker.date.future().toISOString(),
      leader: faker.person.fullName(),
    })),
    created_by: faker.string.uuid(),
    created_at: faker.date.past().toISOString(),
  };
}

/**
 * Escape single quotes for SQL
 */
function escapeSql(str: string | null | undefined): string {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Format array for PostgreSQL
 */
function formatArray(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return 'NULL';
  return `ARRAY[${arr.map(item => escapeSql(item)).join(', ')}]`;
}

/**
 * Main generator function
 */
async function generateSeedData(count: number = 50) {
  console.log('-- ==========================================');
  console.log('-- Generated Seed Data');
  console.log(`-- Generated at: ${new Date().toISOString()}`);
  console.log(`-- Count: ${count} songs with arrangements`);
  console.log('-- ==========================================');
  console.log('');
  console.log('BEGIN;');
  console.log('');
  
  // Generate users
  console.log('-- Test Users');
  const userIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const userId = faker.string.uuid();
    userIds.push(userId);
    
    const email = faker.internet.email().toLowerCase();
    const username = faker.internet.username().toLowerCase();
    const fullName = faker.person.fullName();
    
    console.log(
      `INSERT INTO public.users (id, email, username, full_name, created_at) VALUES (` +
      `${escapeSql(userId)}, ${escapeSql(email)}, ${escapeSql(username)}, ${escapeSql(fullName)}, NOW())` +
      ` ON CONFLICT (id) DO NOTHING;`
    );
  }
  console.log('');
  
  // Generate songs and arrangements
  console.log('-- Songs');
  const songs: Array<{ id: string; title: string }> = [];
  const arrangements: Array<{ id: string; songId: string }> = [];
  
  for (let i = 0; i < count; i++) {
    const song = generateSong(i);
    song.created_by = faker.helpers.arrayElement(userIds);
    songs.push({ id: song.id!, title: song.title });
    
    const values = [
      escapeSql(song.id),
      escapeSql(song.title),
      escapeSql(song.slug),
      escapeSql(song.artist),
      formatArray(song.alternative_titles),
      formatArray(song.themes),
      escapeSql(song.ccli),
      song.ccli_verified ? 'true' : 'false',
      song.composition_year || 'NULL',
      escapeSql(song.original_language),
      escapeSql(song.lyrics_source),
      song.lyrics_verified ? 'true' : 'false',
      escapeSql(song.source),
      escapeSql(song.notes),
      song.is_public ? 'true' : 'false',
      song.views || 0,
      song.rating_average || 'NULL',
      song.rating_count || 0,
      escapeSql(song.created_by),
      'NOW()',
      escapeSql(song.moderation_status),
    ];
    
    console.log(
      `INSERT INTO public.songs (` +
      `id, title, slug, artist, alternative_titles, themes, ccli, ccli_verified, ` +
      `composition_year, original_language, lyrics_source, lyrics_verified, source, notes, ` +
      `is_public, views, rating_average, rating_count, created_by, created_at, moderation_status` +
      `) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;`
    );
  }
  console.log('');
  
  // Generate arrangements
  console.log('-- Arrangements');
  songs.forEach((song, songIndex) => {
    const numArrangements = faker.number.int({ min: 1, max: 3 });
    
    for (let i = 0; i < numArrangements; i++) {
      const arrangement = generateArrangement(song.id, song.title, songIndex * 10 + i);
      arrangement.created_by = faker.helpers.arrayElement(userIds);
      arrangements.push({ id: arrangement.id!, songId: song.id });
      
      const values = [
        escapeSql(arrangement.id),
        escapeSql(arrangement.song_id),
        escapeSql(arrangement.name),
        escapeSql(arrangement.slug),
        escapeSql(arrangement.chord_data),
        escapeSql(arrangement.description),
        escapeSql(arrangement.difficulty),
        escapeSql(arrangement.key),
        arrangement.tempo || 'NULL',
        escapeSql(arrangement.time_signature),
        formatArray(arrangement.tags),
        arrangement.is_public ? 'true' : 'false',
        arrangement.views || 0,
        arrangement.rating_average || 'NULL',
        arrangement.rating_count || 0,
        escapeSql(arrangement.created_by),
        'NOW()',
        escapeSql(arrangement.moderation_status),
      ];
      
      console.log(
        `INSERT INTO public.arrangements (` +
        `id, song_id, name, slug, chord_data, description, difficulty, key, tempo, ` +
        `time_signature, tags, is_public, views, rating_average, rating_count, ` +
        `created_by, created_at, moderation_status` +
        `) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;`
      );
    }
  });
  console.log('');
  
  // Generate setlists
  console.log('-- Setlists');
  const setlists: string[] = [];
  for (let i = 0; i < 20; i++) {
    const setlist = generateSetlist(i);
    setlist.created_by = faker.helpers.arrayElement(userIds);
    setlists.push(setlist.id!);
    
    const metadata = setlist.metadata ? 
      `'${JSON.stringify(setlist.metadata).replace(/'/g, "''")}'::jsonb` : 
      'NULL';
    
    const values = [
      escapeSql(setlist.id),
      escapeSql(setlist.name),
      escapeSql(setlist.description),
      setlist.is_public ? 'true' : 'false',
      escapeSql(setlist.share_id),
      metadata,
      escapeSql(setlist.created_by),
      'NOW()',
    ];
    
    console.log(
      `INSERT INTO public.setlists (` +
      `id, name, description, is_public, share_id, metadata, created_by, created_at` +
      `) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;`
    );
  }
  console.log('');
  
  // Generate setlist items
  console.log('-- Setlist Items');
  setlists.forEach((setlistId, index) => {
    const numItems = faker.number.int({ min: 3, max: 8 });
    const selectedArrangements = faker.helpers.arrayElements(arrangements, numItems);
    
    selectedArrangements.forEach((arrangement, position) => {
      const id = faker.string.uuid();
      const transposeSteps = faker.helpers.maybe(() => faker.number.int({ min: -6, max: 6 })) || 0;
      const notes = faker.helpers.maybe(() => faker.lorem.sentence());
      
      const values = [
        escapeSql(id),
        escapeSql(setlistId),
        escapeSql(arrangement.id),
        position + 1,
        transposeSteps,
        escapeSql(notes),
        'NOW()',
      ];
      
      console.log(
        `INSERT INTO public.setlist_items (` +
        `id, setlist_id, arrangement_id, position, transpose_steps, notes, created_at` +
        `) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;`
      );
    });
  });
  console.log('');
  
  console.log('COMMIT;');
  console.log('');
  console.log('-- ==========================================');
  console.log('-- Verification Queries');
  console.log('-- ==========================================');
  console.log('-- SELECT COUNT(*) as generated_users FROM public.users;');
  console.log('-- SELECT COUNT(*) as generated_songs FROM public.songs;');
  console.log('-- SELECT COUNT(*) as generated_arrangements FROM public.arrangements;');
  console.log('-- SELECT COUNT(*) as generated_setlists FROM public.setlists;');
  console.log('-- SELECT COUNT(*) as generated_items FROM public.setlist_items;');
}

// Run the generator
const count = process.argv[2] ? parseInt(process.argv[2], 10) : 50;
generateSeedData(count).catch(console.error);