#!/usr/bin/env tsx

/**
 * Import songs from existing files into database format
 * Usage: npm run seed:import [directory]
 * Example: npm run seed:import ./song-database
 */

import { readdir, readFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import type { Database } from '../src/lib/database.types';

// Type definitions
type Song = Database['public']['Tables']['songs']['Insert'];
type Arrangement = Database['public']['Tables']['arrangements']['Insert'];

// ChordPro directive patterns
const DIRECTIVE_PATTERNS = {
  title: /\{(?:title|t):([^}]+)\}/i,
  subtitle: /\{(?:subtitle|st):([^}]+)\}/i,
  artist: /\{(?:artist|a):([^}]+)\}/i,
  key: /\{key:([^}]+)\}/i,
  capo: /\{capo:([^}]+)\}/i,
  tempo: /\{tempo:([^}]+)\}/i,
  time: /\{time:([^}]+)\}/i,
  ccli: /\{ccli:([^}]+)\}/i,
  copyright: /\{copyright:([^}]+)\}/i,
  year: /\{year:([^}]+)\}/i,
};

// Language detection patterns
const LANGUAGE_PATTERNS = {
  ko: /[\u3131-\uD79D]/,  // Korean characters
  zh: /[\u4e00-\u9fa5]/,  // Chinese characters
  ja: /[\u3040-\u309f\u30a0-\u30ff]/,  // Japanese characters
  es: /[áéíóúñü]/i,  // Spanish characters
  de: /[äöüß]/i,  // German characters
  fr: /[àâæçéèêëïîôùûüÿœ]/i,  // French characters
};

/**
 * Parse ChordPro format file
 */
function parseChordPro(content: string): {
  title?: string;
  artist?: string;
  key?: string;
  capo?: string;
  tempo?: string;
  timeSignature?: string;
  ccli?: string;
  copyright?: string;
  year?: string;
  chordData: string;
  hasChords: boolean;
} {
  const result: any = {
    chordData: content,
    hasChords: false,
  };
  
  // Extract directives
  for (const [key, pattern] of Object.entries(DIRECTIVE_PATTERNS)) {
    const match = content.match(pattern);
    if (match) {
      result[key === 'time' ? 'timeSignature' : key] = match[1].trim();
    }
  }
  
  // Check if file has chord notations
  result.hasChords = /\[[A-G][^[\]]*\]/.test(content);
  
  return result;
}

/**
 * Detect language from text
 */
function detectLanguage(text: string): string {
  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(text)) {
      return lang;
    }
  }
  return 'en'; // Default to English
}

/**
 * Generate themes based on content analysis
 */
function extractThemes(content: string): string[] {
  const themes: string[] = [];
  const lowerContent = content.toLowerCase();
  
  const themeKeywords = {
    worship: ['worship', 'praise', 'adore', 'magnify', 'exalt'],
    prayer: ['pray', 'prayer', 'intercede', 'petition'],
    salvation: ['saved', 'salvation', 'redeemed', 'redemption', 'savior'],
    grace: ['grace', 'mercy', 'forgive', 'forgiveness'],
    faith: ['faith', 'believe', 'trust', 'hope'],
    love: ['love', 'heart', 'beloved', 'affection'],
    christmas: ['christmas', 'advent', 'nativity', 'bethlehem', 'manger'],
    easter: ['easter', 'resurrection', 'risen', 'calvary', 'cross'],
    communion: ['communion', 'bread', 'wine', 'remembrance', 'supper'],
    thanksgiving: ['thanks', 'grateful', 'gratitude', 'blessed'],
  };
  
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      themes.push(theme);
    }
  }
  
  return themes.length > 0 ? themes : ['general'];
}

/**
 * Generate difficulty based on chord complexity
 */
function assessDifficulty(chordData: string): string {
  const chords = chordData.match(/\[[^\]]+\]/g) || [];
  const uniqueChords = new Set(chords.map(c => c.replace(/[\[\]]/g, '')));
  
  // Count complex chord indicators
  let complexity = 0;
  uniqueChords.forEach(chord => {
    if (chord.includes('m7') || chord.includes('maj7')) complexity += 2;
    else if (chord.includes('7') || chord.includes('sus')) complexity += 1.5;
    else if (chord.includes('m') || chord.includes('#') || chord.includes('b')) complexity += 1;
    else if (chord.includes('/')) complexity += 0.5; // Slash chords
  });
  
  if (uniqueChords.size <= 3 && complexity <= 2) return 'easy';
  if (uniqueChords.size <= 6 && complexity <= 5) return 'medium';
  return 'hard';
}

/**
 * Sanitize string for SQL
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
 * Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
}

/**
 * Process a single song file
 */
async function processSongFile(filePath: string, index: number): Promise<{
  song: Partial<Song>;
  arrangement: Partial<Arrangement>;
} | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const fileName = basename(filePath, extname(filePath));
    const parsed = parseChordPro(content);
    
    // Skip files without meaningful content
    if (!parsed.title && !fileName) {
      return null;
    }
    
    const title = parsed.title || fileName.replace(/[-_]/g, ' ');
    const language = detectLanguage(title + ' ' + content);
    const themes = extractThemes(content);
    const slug = generateSlug(title);
    
    const songId = `song-${index}-${Date.now()}`;
    const arrangementId = `arr-${index}-${Date.now()}`;
    
    const song: Partial<Song> = {
      id: songId,
      title,
      slug: `${slug}-${index}`,
      artist: parsed.artist || null,
      themes,
      ccli: parsed.ccli || null,
      composition_year: parsed.year ? parseInt(parsed.year, 10) : null,
      original_language: language,
      lyrics_source: parsed.copyright || null,
      is_public: true,
      created_at: new Date().toISOString(),
      moderation_status: 'approved',
    };
    
    const arrangement: Partial<Arrangement> = {
      id: arrangementId,
      song_id: songId,
      name: parsed.hasChords ? 'Original' : 'Lyrics Only',
      slug: parsed.hasChords ? 'original' : 'lyrics-only',
      chord_data: content,
      difficulty: parsed.hasChords ? assessDifficulty(content) : null,
      key: parsed.key || null,
      tempo: parsed.tempo ? parseInt(parsed.tempo, 10) : null,
      time_signature: parsed.timeSignature || null,
      is_public: true,
      created_at: new Date().toISOString(),
      moderation_status: 'approved',
    };
    
    // If capo is specified, mark it in the arrangement name
    if (parsed.capo) {
      arrangement.name = `Original (Capo ${parsed.capo})`;
      arrangement.slug = `original-capo-${parsed.capo}`;
    }
    
    return { song, arrangement };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return null;
  }
}

/**
 * Main import function
 */
async function importSongs(directory: string = './song-database') {
  console.log('-- ==========================================');
  console.log('-- Imported Song Data');
  console.log(`-- Source: ${directory}`);
  console.log(`-- Generated at: ${new Date().toISOString()}`);
  console.log('-- ==========================================');
  console.log('');
  console.log('BEGIN;');
  console.log('');
  
  try {
    // Read all files in the directory
    const files = await readdir(directory);
    const songFiles = files.filter(file => {
      const ext = extname(file).toLowerCase();
      return ['.txt', '.cho', '.crd', '.chopro', '.pro'].includes(ext);
    });
    
    console.log(`-- Found ${songFiles.length} song files to import`);
    console.log('');
    
    // Process each file
    const songs: Array<Partial<Song>> = [];
    const arrangements: Array<Partial<Arrangement>> = [];
    
    for (let i = 0; i < songFiles.length; i++) {
      const filePath = join(directory, songFiles[i]);
      const result = await processSongFile(filePath, i);
      
      if (result) {
        songs.push(result.song);
        arrangements.push(result.arrangement);
      }
    }
    
    // Generate SQL for songs
    console.log('-- Songs');
    songs.forEach(song => {
      const values = [
        escapeSql(song.id),
        escapeSql(song.title),
        escapeSql(song.slug),
        escapeSql(song.artist),
        formatArray(song.themes),
        escapeSql(song.ccli),
        song.composition_year || 'NULL',
        escapeSql(song.original_language),
        escapeSql(song.lyrics_source),
        song.is_public ? 'true' : 'false',
        'NOW()',
        escapeSql(song.moderation_status),
      ];
      
      console.log(
        `INSERT INTO public.songs (` +
        `id, title, slug, artist, themes, ccli, composition_year, ` +
        `original_language, lyrics_source, is_public, created_at, moderation_status` +
        `) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;`
      );
    });
    console.log('');
    
    // Generate SQL for arrangements
    console.log('-- Arrangements');
    arrangements.forEach((arrangement, index) => {
      const values = [
        escapeSql(arrangement.id),
        escapeSql(arrangement.song_id),
        escapeSql(arrangement.name),
        escapeSql(arrangement.slug),
        escapeSql(arrangement.chord_data),
        escapeSql(arrangement.difficulty),
        escapeSql(arrangement.key),
        arrangement.tempo || 'NULL',
        escapeSql(arrangement.time_signature),
        arrangement.is_public ? 'true' : 'false',
        'NOW()',
        escapeSql(arrangement.moderation_status),
      ];
      
      console.log(
        `INSERT INTO public.arrangements (` +
        `id, song_id, name, slug, chord_data, difficulty, key, tempo, ` +
        `time_signature, is_public, created_at, moderation_status` +
        `) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;`
      );
      
      // Set as default arrangement for the song
      if (index < songs.length) {
        console.log(
          `UPDATE public.songs SET default_arrangement_id = ${escapeSql(arrangement.id)} ` +
          `WHERE id = ${escapeSql(arrangement.song_id)};`
        );
      }
    });
    console.log('');
    
    console.log('COMMIT;');
    console.log('');
    console.log('-- ==========================================');
    console.log('-- Import Summary');
    console.log('-- ==========================================');
    console.log(`-- Total files processed: ${songFiles.length}`);
    console.log(`-- Songs imported: ${songs.length}`);
    console.log(`-- Arrangements created: ${arrangements.length}`);
    console.log('--');
    console.log('-- Verification queries:');
    console.log('-- SELECT COUNT(*) FROM public.songs WHERE id LIKE \'song-%\';');
    console.log('-- SELECT COUNT(*) FROM public.arrangements WHERE id LIKE \'arr-%\';');
    
  } catch (error) {
    console.error('Error importing songs:', error);
    process.exit(1);
  }
}

// Run the importer
const directory = process.argv[2] || './song-database';
importSongs(directory).catch(console.error);