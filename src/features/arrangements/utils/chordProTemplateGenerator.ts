/**
 * @file chordProTemplateGenerator.ts
 * @description Utility for generating ChordPro templates from arrangement and song metadata
 */

import type { Song, Arrangement } from '../../songs/types/song.types';
import type { ChordProMetadata } from '../types/editor.types';

/**
 * Interface for template generation options
 */
export interface TemplateGenerationOptions {
  includeMetadata?: boolean;
  includeBasicStructure?: boolean;
  includeComments?: boolean;
  includePlaceholders?: boolean;
}

/**
 * Interface for the generated template result
 */
export interface ChordProTemplate {
  content: string;
  metadata: ChordProMetadata;
  hasArrangementData: boolean;
}

/**
 * Default template generation options
 */
const DEFAULT_TEMPLATE_OPTIONS: Required<TemplateGenerationOptions> = {
  includeMetadata: true,
  includeBasicStructure: true,
  includeComments: true,
  includePlaceholders: true,
};

/**
 * Generate a ChordPro template from arrangement and song data
 */
export function generateChordProTemplate(
  song: Song,
  arrangement?: Arrangement,
  options: TemplateGenerationOptions = {}
): ChordProTemplate {
  const opts = { ...DEFAULT_TEMPLATE_OPTIONS, ...options };
  const lines: string[] = [];
  
  // Extract metadata for return value
  const metadata = mapArrangementToChordProMetadata(song, arrangement);
  
  // Add comments if requested
  if (opts.includeComments) {
    lines.push('# ChordPro template generated for HSA Songbook');
    lines.push(`# Song: ${song.title}`);
    if (arrangement) {
      lines.push(`# Arrangement: ${arrangement.name}`);
    }
    lines.push('# Edit this template to create your chord sheet');
    lines.push('');
  }
  
  // Add metadata directives if requested
  if (opts.includeMetadata) {
    // Required metadata
    lines.push(`{title: ${song.title}${arrangement ? ` - ${arrangement.name}` : ''}}`);
    lines.push(`{artist: ${song.artist}}`);
    
    // Arrangement-specific metadata
    if (arrangement) {
      lines.push(`{key: ${arrangement.key}}`);
      
      if (arrangement.tempo) {
        lines.push(`{tempo: ${arrangement.tempo}}`);
      }
      
      if (arrangement.timeSignature) {
        lines.push(`{time: ${arrangement.timeSignature}}`);
      }
      
      lines.push(`{difficulty: ${arrangement.difficulty}}`);
      
      if (arrangement.capo) {
        lines.push(`{capo: ${arrangement.capo}}`);
      }
      
      if (arrangement.duration) {
        lines.push(`{duration: ${arrangement.duration}}`);
      }
    } else {
      // Placeholder metadata when no arrangement
      if (opts.includePlaceholders) {
        lines.push('{key: C}');
        lines.push('{tempo: 120}');
        lines.push('{time: 4/4}');
        lines.push('{difficulty: intermediate}');
      }
    }
    
    // Additional song metadata
    if (song.compositionYear) {
      lines.push(`{year: ${song.compositionYear}}`);
    }
    
    if (song.ccli) {
      lines.push(`{ccli: ${song.ccli}}`);
    }
    
    // Custom metadata
    if (arrangement?.tags?.length) {
      lines.push(`{tags: ${arrangement.tags.join(', ')}}`);
    }
    
    if (song.themes?.length) {
      lines.push(`{themes: ${song.themes.join(', ')}}`);
    }
    
    lines.push('');
  }
  
  // Add basic structure if requested
  if (opts.includeBasicStructure) {
    if (opts.includePlaceholders) {
      lines.push('# Add your chord progressions and lyrics below');
      lines.push('# Use [Chord] notation for chords above lyrics');
      lines.push('# Use {start_of_verse} and {end_of_verse} for sections');
      lines.push('');
      
      // Basic verse structure
      lines.push('{start_of_verse}');
      lines.push('[C]Add your [F]lyrics [G]here');
      lines.push('With [Am]chords [F]above the [C]words [G]');
      lines.push('{end_of_verse}');
      lines.push('');
      
      lines.push('{start_of_chorus}');
      lines.push('[F]This is the [C]chorus section');
      lines.push('[G]Where the main [Am]message [F]goes [C]');
      lines.push('{end_of_chorus}');
      lines.push('');
      
      // Add comments for common sections
      lines.push('# Uncomment and use these sections as needed:');
      lines.push('# {start_of_bridge}');
      lines.push('# [Bridge lyrics and chords]');
      lines.push('# {end_of_bridge}');
      lines.push('');
      lines.push('# {start_of_tag}');
      lines.push('# [Ending/tag lyrics and chords]');
      lines.push('# {end_of_tag}');
    }
  }
  
  return {
    content: lines.join('\n'),
    metadata,
    hasArrangementData: Boolean(arrangement),
  };
}

/**
 * Map arrangement and song data to ChordPro metadata format
 */
export function mapArrangementToChordProMetadata(
  song: Song,
  arrangement?: Arrangement
): ChordProMetadata {
  const metadata: ChordProMetadata = {
    title: arrangement ? `${song.title} - ${arrangement.name}` : song.title,
    artist: song.artist,
  };
  
  // Add arrangement-specific metadata
  if (arrangement) {
    metadata.key = arrangement.key;
    metadata.tempo = arrangement.tempo;
    metadata.time = arrangement.timeSignature;
    metadata.capo = arrangement.capo;
    metadata.duration = arrangement.duration?.toString();
    
    // Custom metadata
    metadata.difficulty = arrangement.difficulty;
    metadata.arrangementName = arrangement.name;
    metadata.arrangementId = arrangement.id;
  }
  
  // Add song metadata
  if (song.compositionYear) {
    metadata.year = song.compositionYear.toString();
  }
  
  if (song.ccli) {
    metadata.ccli = song.ccli;
  }
  
  if (song.source) {
    metadata.source = song.source;
  }
  
  if (arrangement?.tags?.length) {
    metadata.tags = arrangement.tags.join(', ');
  }
  
  if (song.themes?.length) {
    metadata.themes = song.themes.join(', ');
  }
  
  return metadata;
}

/**
 * Generate a minimal ChordPro template with just basic metadata
 */
export function generateMinimalChordProTemplate(
  song: Song,
  arrangement?: Arrangement
): ChordProTemplate {
  return generateChordProTemplate(song, arrangement, {
    includeMetadata: true,
    includeBasicStructure: false,
    includeComments: false,
    includePlaceholders: false,
  });
}

/**
 * Generate a full ChordPro template with examples and structure
 */
export function generateFullChordProTemplate(
  song: Song,
  arrangement?: Arrangement
): ChordProTemplate {
  return generateChordProTemplate(song, arrangement, {
    includeMetadata: true,
    includeBasicStructure: true,
    includeComments: true,
    includePlaceholders: true,
  });
}

/**
 * Update existing ChordPro content with new metadata from arrangement
 */
export function updateChordProWithArrangementMetadata(
  existingContent: string,
  song: Song,
  arrangement: Arrangement
): string {
  const lines = existingContent.split('\n');
  const updatedLines: string[] = [];
  const metadata = mapArrangementToChordProMetadata(song, arrangement);
  
  // Track which metadata we've updated
  const updatedDirectives = new Set<string>();
  
  // Process existing lines and update metadata
  for (const line of lines) {
    const directiveMatch = line.match(/^\{([^:]+):\s*([^}]+)\}$/);
    
    if (directiveMatch) {
      const directive = directiveMatch[1].toLowerCase();
      
      // Update specific directives with new metadata
      switch (directive) {
        case 'title': {
          updatedLines.push(`{title: ${metadata.title}}`);
          updatedDirectives.add('title');
          break;
        }
        case 'key': {
          updatedLines.push(`{key: ${metadata.key}}`);
          updatedDirectives.add('key');
          break;
        }
        case 'tempo': {
          if (metadata.tempo) {
            updatedLines.push(`{tempo: ${metadata.tempo}}`);
            updatedDirectives.add('tempo');
          } else {
            updatedLines.push(line); // Keep existing if no new tempo
          }
          break;
        }
        case 'time': {
          if (metadata.time) {
            updatedLines.push(`{time: ${metadata.time}}`);
            updatedDirectives.add('time');
          } else {
            updatedLines.push(line); // Keep existing if no new time signature
          }
          break;
        }
        case 'difficulty': {
          updatedLines.push(`{difficulty: ${metadata.difficulty}}`);
          updatedDirectives.add('difficulty');
          break;
        }
        case 'capo': {
          if (metadata.capo) {
            updatedLines.push(`{capo: ${metadata.capo}}`);
            updatedDirectives.add('capo');
          } else {
            // Remove capo directive if not set in arrangement
            // Skip this line
          }
          break;
        }
        default: {
          // Keep other directives as-is
          updatedLines.push(line);
          break;
        }
      }
    } else {
      updatedLines.push(line);
    }
  }
  
  // Add missing essential metadata at the beginning (after any existing comments)
  const insertIndex = updatedLines.findIndex(line => 
    !line.startsWith('#') && line.trim() !== ''
  );
  const insertPoint = insertIndex === -1 ? 0 : insertIndex;
  
  const missingDirectives: string[] = [];
  
  if (!updatedDirectives.has('key') && metadata.key) {
    missingDirectives.push(`{key: ${metadata.key}}`);
  }
  
  if (!updatedDirectives.has('difficulty') && metadata.difficulty) {
    missingDirectives.push(`{difficulty: ${metadata.difficulty}}`);
  }
  
  if (!updatedDirectives.has('tempo') && metadata.tempo) {
    missingDirectives.push(`{tempo: ${metadata.tempo}}`);
  }
  
  if (!updatedDirectives.has('time') && metadata.time) {
    missingDirectives.push(`{time: ${metadata.time}}`);
  }
  
  // Insert missing directives
  if (missingDirectives.length > 0) {
    updatedLines.splice(insertPoint, 0, ...missingDirectives, '');
  }
  
  return updatedLines.join('\n');
}

/**
 * Extract song and arrangement information from ChordPro content
 */
export function extractMetadataFromChordPro(content: string): {
  songInfo: Partial<Song>;
  arrangementInfo: Partial<Arrangement>;
} {
  const songInfo: Partial<Song> = {};
  const arrangementInfo: Partial<Arrangement> = {};
  
  const directiveRegex = /\{([^:]+):\s*([^}]+)\}/g;
  let match;
  
  while ((match = directiveRegex.exec(content)) !== null) {
    const directive = match[1].toLowerCase().trim();
    const value = match[2].trim();
    
    switch (directive) {
      case 'title': {
        // Try to extract song title and arrangement name
        const titleParts = value.split(' - ');
        if (titleParts.length > 1) {
          songInfo.title = titleParts[0];
          arrangementInfo.name = titleParts.slice(1).join(' - ');
        } else {
          songInfo.title = value;
        }
        break;
      }
      case 'artist': {
        songInfo.artist = value;
        break;
      }
      case 'key': {
        arrangementInfo.key = value;
        break;
      }
      case 'tempo': {
        const tempo = parseInt(value, 10);
        if (!isNaN(tempo)) {
          arrangementInfo.tempo = tempo;
        }
        break;
      }
      case 'time': {
        arrangementInfo.timeSignature = value;
        break;
      }
      case 'difficulty': {
        if (['beginner', 'intermediate', 'advanced'].includes(value)) {
          arrangementInfo.difficulty = value as 'beginner' | 'intermediate' | 'advanced';
        }
        break;
      }
      case 'capo': {
        const capo = parseInt(value, 10);
        if (!isNaN(capo)) {
          arrangementInfo.capo = capo;
        }
        break;
      }
      case 'year': {
        const year = parseInt(value, 10);
        if (!isNaN(year)) {
          songInfo.compositionYear = year;
        }
        break;
      }
      case 'ccli': {
        songInfo.ccli = value;
        break;
      }
      case 'themes': {
        songInfo.themes = value.split(',').map(theme => theme.trim());
        break;
      }
      case 'tags': {
        arrangementInfo.tags = value.split(',').map(tag => tag.trim());
        break;
      }
    }
  }
  
  return { songInfo, arrangementInfo };
}