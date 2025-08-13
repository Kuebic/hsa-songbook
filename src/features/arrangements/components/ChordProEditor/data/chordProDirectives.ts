/**
 * ChordPro directive definitions for autocomplete
 */

import { fuzzyMatch, sortByFuzzyScore, normalizeForComparison } from '../utils/fuzzyMatch';

export interface AutocompleteItem {
  value: string;
  label: string;
  description?: string;
  category?: string;
  icon?: string;
  fuzzyScore?: number;
  fuzzyMatches?: number[];
}

/**
 * Comprehensive list of ChordPro directives organized by category
 */
export const CHORDPRO_DIRECTIVES: AutocompleteItem[] = [
  // Meta directives
  { value: 'title:', label: 'title', description: 'Song title', category: 'meta', icon: '📝' },
  { value: 'subtitle:', label: 'subtitle', description: 'Song subtitle', category: 'meta', icon: '📝' },
  { value: 't:', label: 't', description: 'Title (short)', category: 'meta', icon: '📝' },
  { value: 'artist:', label: 'artist', description: 'Artist name', category: 'meta', icon: '👤' },
  { value: 'composer:', label: 'composer', description: 'Composer name', category: 'meta', icon: '🎼' },
  { value: 'lyricist:', label: 'lyricist', description: 'Lyricist name', category: 'meta', icon: '✍️' },
  { value: 'copyright:', label: 'copyright', description: 'Copyright info', category: 'meta', icon: '©️' },
  { value: 'album:', label: 'album', description: 'Album name', category: 'meta', icon: '💿' },
  { value: 'year:', label: 'year', description: 'Release year', category: 'meta', icon: '📅' },
  { value: 'key:', label: 'key', description: 'Song key', category: 'meta', icon: '🎵' },
  { value: 'time:', label: 'time', description: 'Time signature', category: 'meta', icon: '⏱️' },
  { value: 'tempo:', label: 'tempo', description: 'Song tempo (BPM)', category: 'meta', icon: '🎚️' },
  { value: 'duration:', label: 'duration', description: 'Song duration', category: 'meta', icon: '⏳' },
  { value: 'capo:', label: 'capo', description: 'Capo position', category: 'meta', icon: '🎸' },
  
  // Structure directives - Long form
  { value: 'start_of_chorus', label: 'start_of_chorus', description: 'Begin chorus section', category: 'structure', icon: '🎤' },
  { value: 'end_of_chorus', label: 'end_of_chorus', description: 'End chorus section', category: 'structure', icon: '🎤' },
  { value: 'start_of_verse', label: 'start_of_verse', description: 'Begin verse section', category: 'structure', icon: '📄' },
  { value: 'end_of_verse', label: 'end_of_verse', description: 'End verse section', category: 'structure', icon: '📄' },
  { value: 'start_of_bridge', label: 'start_of_bridge', description: 'Begin bridge section', category: 'structure', icon: '🌉' },
  { value: 'end_of_bridge', label: 'end_of_bridge', description: 'End bridge section', category: 'structure', icon: '🌉' },
  { value: 'start_of_tab', label: 'start_of_tab', description: 'Begin tablature section', category: 'structure', icon: '🎸' },
  { value: 'end_of_tab', label: 'end_of_tab', description: 'End tablature section', category: 'structure', icon: '🎸' },
  { value: 'start_of_grid', label: 'start_of_grid', description: 'Begin chord grid', category: 'structure', icon: '⚏' },
  { value: 'end_of_grid', label: 'end_of_grid', description: 'End chord grid', category: 'structure', icon: '⚏' },
  
  // Structure directives - Short form
  { value: 'soc', label: 'soc', description: 'Start of chorus (short)', category: 'shortcut', icon: '🎤' },
  { value: 'eoc', label: 'eoc', description: 'End of chorus (short)', category: 'shortcut', icon: '🎤' },
  { value: 'sov', label: 'sov', description: 'Start of verse (short)', category: 'shortcut', icon: '📄' },
  { value: 'eov', label: 'eov', description: 'End of verse (short)', category: 'shortcut', icon: '📄' },
  { value: 'sob', label: 'sob', description: 'Start of bridge (short)', category: 'shortcut', icon: '🌉' },
  { value: 'eob', label: 'eob', description: 'End of bridge (short)', category: 'shortcut', icon: '🌉' },
  { value: 'sot', label: 'sot', description: 'Start of tab (short)', category: 'shortcut', icon: '🎸' },
  { value: 'eot', label: 'eot', description: 'End of tab (short)', category: 'shortcut', icon: '🎸' },
  
  // Formatting directives
  { value: 'comment:', label: 'comment', description: 'Add comment', category: 'format', icon: '💬' },
  { value: 'c:', label: 'c', description: 'Comment (short)', category: 'format', icon: '💬' },
  { value: 'comment_italic:', label: 'comment_italic', description: 'Italic comment', category: 'format', icon: '💭' },
  { value: 'ci:', label: 'ci', description: 'Italic comment (short)', category: 'format', icon: '💭' },
  { value: 'comment_box:', label: 'comment_box', description: 'Boxed comment', category: 'format', icon: '🔲' },
  { value: 'cb:', label: 'cb', description: 'Boxed comment (short)', category: 'format', icon: '🔲' },
  { value: 'chorus', label: 'chorus', description: 'Repeat chorus here', category: 'format', icon: '🔁' },
  { value: 'highlight:', label: 'highlight', description: 'Highlight text', category: 'format', icon: '🔆' },
  
  // Chord directives
  { value: 'define:', label: 'define', description: 'Define chord fingering', category: 'chord', icon: '🤘' },
  { value: 'chord:', label: 'chord', description: 'Show chord diagram', category: 'chord', icon: '🎵' },
  { value: 'transpose:', label: 'transpose', description: 'Transpose amount', category: 'chord', icon: '🔄' },
  
  // Display directives
  { value: 'new_song', label: 'new_song', description: 'Start new song', category: 'display', icon: '📃' },
  { value: 'ns', label: 'ns', description: 'New song (short)', category: 'display', icon: '📃' },
  { value: 'new_page', label: 'new_page', description: 'Start new page', category: 'display', icon: '📄' },
  { value: 'np', label: 'np', description: 'New page (short)', category: 'display', icon: '📄' },
  { value: 'new_physical_page', label: 'new_physical_page', description: 'Force page break', category: 'display', icon: '📋' },
  { value: 'npp', label: 'npp', description: 'New physical page (short)', category: 'display', icon: '📋' },
  { value: 'column_break', label: 'column_break', description: 'Break column', category: 'display', icon: '⚓' },
  { value: 'cb', label: 'cb', description: 'Column break (short)', category: 'display', icon: '⚓' },
  
  // Font directives
  { value: 'textfont:', label: 'textfont', description: 'Set text font', category: 'font', icon: '🔤' },
  { value: 'textsize:', label: 'textsize', description: 'Set text size', category: 'font', icon: '📏' },
  { value: 'textcolour:', label: 'textcolour', description: 'Set text color', category: 'font', icon: '🎨' },
  { value: 'chordfont:', label: 'chordfont', description: 'Set chord font', category: 'font', icon: '🔤' },
  { value: 'chordsize:', label: 'chordsize', description: 'Set chord size', category: 'font', icon: '📏' },
  { value: 'chordcolour:', label: 'chordcolour', description: 'Set chord color', category: 'font', icon: '🎨' },
  
  // Output directives
  { value: 'pagetype:', label: 'pagetype', description: 'Page size (a4, letter)', category: 'output', icon: '📄' },
  { value: 'titles:', label: 'titles', description: 'Title flush (left, center)', category: 'output', icon: '📝' },
  { value: 'columns:', label: 'columns', description: 'Number of columns', category: 'output', icon: '🔢' },
];

/**
 * Get directives filtered by category
 */
export const getDirectivesByCategory = (category: string): AutocompleteItem[] => {
  return CHORDPRO_DIRECTIVES.filter(d => d.category === category);
};

/**
 * Normalize directive label for better matching
 * Handles ChordPro-specific patterns like underscores
 */
export const normalizeDirective = (directive: string): string => {
  return normalizeForComparison(directive);
};

/**
 * Get directives that match a search term using fuzzy matching
 */
export const searchDirectives = (searchTerm: string): AutocompleteItem[] => {
  if (!searchTerm) {
    return getCommonDirectives();
  }
  
  // Use fuzzy matching with ChordPro-optimized settings
  const results = sortByFuzzyScore(
    CHORDPRO_DIRECTIVES,
    searchTerm,
    item => item.label,
    {
      prioritizePrefix: true,
      prioritizeCamelCase: true,
      prioritizeTypoTolerance: true,
      caseSensitive: false,
      threshold: 0,
      maxLevenshteinDistance: 2  // Allow up to 2 character typos
    }
  );
  
  // Also try matching against normalized versions
  const normalizedSearchTerm = normalizeDirective(searchTerm);
  const normalizedMatches = CHORDPRO_DIRECTIVES
    .filter(directive => {
      // Don't include if already in results
      if (results.some(r => r.label === directive.label)) {
        return false;
      }
      
      // Try normalized matching
      const normalizedLabel = normalizeDirective(directive.label);
      const match = fuzzyMatch(normalizedSearchTerm, normalizedLabel, {
        prioritizePrefix: true,
        prioritizeCamelCase: false,
        prioritizeTypoTolerance: true,
        caseSensitive: false,
        maxLevenshteinDistance: 1
      });
      
      return match && match.score > 100;
    })
    .map(item => ({
      ...item,
      fuzzyScore: 600, // Medium score for normalized matches
      fuzzyMatches: []
    }));
  
  // Also try matching against descriptions
  const descriptionMatches = CHORDPRO_DIRECTIVES
    .filter(directive => {
      // Don't include if already in results or normalized matches
      if (results.some(r => r.label === directive.label) ||
          normalizedMatches.some(n => n.label === directive.label)) {
        return false;
      }
      
      // Try fuzzy match on description
      if (directive.description) {
        const match = fuzzyMatch(searchTerm, directive.description, {
          prioritizePrefix: false,
          prioritizeCamelCase: false,
          prioritizeTypoTolerance: true,
          caseSensitive: false,
          maxLevenshteinDistance: 2
        });
        return match && match.score > 50;
      }
      return false;
    })
    .map(item => ({
      ...item,
      fuzzyScore: 50, // Lower score for description matches
      fuzzyMatches: []
    }));
  
  // Combine and sort all results by score
  const allResults = [...results, ...normalizedMatches, ...descriptionMatches]
    .sort((a, b) => (b.fuzzyScore || 0) - (a.fuzzyScore || 0))
    .slice(0, 20);
  
  return allResults;
};

/**
 * Get the most commonly used directives
 */
export const getCommonDirectives = (): AutocompleteItem[] => {
  const commonLabels = [
    'title', 'artist', 'key', 'capo', 'tempo',
    'soc', 'eoc', 'sov', 'eov',
    'chorus', 'comment'
  ];
  
  return CHORDPRO_DIRECTIVES.filter(d => 
    commonLabels.includes(d.label)
  );
};