# OpenSong XML Parsing Guide for TypeScript

## Installation
```bash
npm install fast-xml-parser
# Alternative: npm install xml2js @types/xml2js
```

## OpenSong XML Format Specification

### Basic Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<song>
  <title>Amazing Grace</title>
  <author>John Newton</author>
  <copyright>Public Domain</copyright>
  <presentation>V1 C V2 C V3 C</presentation>
  <ccli>22025</ccli>
  <capo>0</capo>
  <key>G</key>
  <aka>Amazing Grace (My Chains Are Gone)</aka>
  <key_line></key_line>
  <user1></user1>
  <user2></user2>
  <user3></user3>
  <theme>Grace; Salvation; Redemption</theme>
  <tempo>72</tempo>
  <time_sig>3/4</time_sig>
  <lyrics>[V1]
.G          G7        C         G
 Amazing grace how sweet the sound
.    G                D   D7
 That saved a wretch like me
.G        G7       C      G
 I once was lost but now am found
.    Em       D    G
 Was blind but now I see

[C]
.G         G7       C        G
 My chains are gone, I've been set free
.G          G7        C      G
 My God, my Savior has ransomed me
</lyrics>
</song>
```

### OpenSong Chord Format Rules
- Lines starting with `.` contain chords
- Lines starting with ` ` (space) contain lyrics
- Lines starting with `[` are section markers
- Chords are positioned above lyrics using spaces
- Comments start with `;`

## TypeScript Implementation

### 1. Type Definitions

```typescript
// OpenSong data structure
export interface OpenSongData {
  song: {
    title: string;
    author?: string;
    copyright?: string;
    presentation?: string;
    ccli?: string;
    capo?: string;
    key?: string;
    aka?: string;
    theme?: string;
    tempo?: string;
    time_sig?: string;
    lyrics: string;
    // Additional optional fields
    key_line?: string;
    user1?: string;
    user2?: string;
    user3?: string;
    hymn_number?: string;
  };
}

// Parsed song structure for internal use
export interface ParsedSong {
  metadata: {
    title: string;
    artist?: string;
    ccli?: string;
    key?: string;
    tempo?: number;
    timeSignature?: string;
    themes: string[];
    copyright?: string;
    capo?: number;
  };
  sections: SongSection[];
  presentation?: string[];
}

export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'prechorus' | 'ending' | 'tag';
  number?: number;
  lines: SongLine[];
}

export interface SongLine {
  chords?: string;
  lyrics?: string;
}
```

### 2. Parser Implementation

```typescript
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

export class OpenSongParser {
  private parser: XMLParser;
  private builder: XMLBuilder;

  constructor() {
    const parserOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
      parseTrueNumberOnly: true,
      arrayMode: false
    };

    this.parser = new XMLParser(parserOptions);
    this.builder = new XMLBuilder(parserOptions);
  }

  /**
   * Parse OpenSong XML string to structured data
   */
  parseXML(xmlString: string): OpenSongData {
    // Validate XML first
    const validation = XMLValidator.validate(xmlString);
    if (validation !== true) {
      throw new Error(`Invalid XML: ${validation.err.msg} at line ${validation.err.line}`);
    }

    try {
      const parsed = this.parser.parse(xmlString);
      return this.normalizeOpenSongData(parsed);
    } catch (error) {
      throw new Error(`Failed to parse OpenSong XML: ${error.message}`);
    }
  }

  /**
   * Normalize parsed data to consistent structure
   */
  private normalizeOpenSongData(parsed: any): OpenSongData {
    const song = parsed.song || {};
    
    return {
      song: {
        title: song.title || 'Untitled',
        author: song.author || song.author1 || undefined,
        copyright: song.copyright || undefined,
        presentation: song.presentation || undefined,
        ccli: song.ccli?.toString() || undefined,
        capo: song.capo?.toString() || '0',
        key: song.key || undefined,
        aka: song.aka || undefined,
        theme: song.theme || song.themes || undefined,
        tempo: song.tempo?.toString() || undefined,
        time_sig: song.time_sig || song.timesig || undefined,
        lyrics: song.lyrics || ''
      }
    };
  }

  /**
   * Parse OpenSong lyrics format to structured sections
   */
  parseOpenSongLyrics(lyrics: string): ParsedSong['sections'] {
    const sections: ParsedSong['sections'] = [];
    const lines = lyrics.split('\n');
    
    let currentSection: SongSection | null = null;
    
    for (const line of lines) {
      // Section marker [V1], [C], [B], etc.
      if (line.startsWith('[') && line.includes(']')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        const sectionTag = line.substring(1, line.indexOf(']'));
        currentSection = this.parseSectionTag(sectionTag);
        continue;
      }
      
      if (!currentSection) {
        currentSection = { type: 'verse', lines: [] };
      }
      
      // Chord line (starts with .)
      if (line.startsWith('.')) {
        const chords = line.substring(1);
        currentSection.lines.push({ chords, lyrics: undefined });
      }
      // Lyrics line (starts with space)
      else if (line.startsWith(' ') || line.trim()) {
        const lyrics = line.startsWith(' ') ? line.substring(1) : line;
        
        // Check if previous line was chords
        const lastLine = currentSection.lines[currentSection.lines.length - 1];
        if (lastLine && !lastLine.lyrics) {
          lastLine.lyrics = lyrics;
        } else {
          currentSection.lines.push({ lyrics, chords: undefined });
        }
      }
      // Comment line (starts with ;)
      else if (line.startsWith(';')) {
        continue; // Skip comments
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * Parse section tag to type and number
   */
  private parseSectionTag(tag: string): SongSection {
    const typeMap: Record<string, SongSection['type']> = {
      'V': 'verse',
      'C': 'chorus',
      'B': 'bridge',
      'P': 'prechorus',
      'E': 'ending',
      'T': 'tag'
    };
    
    const match = tag.match(/^([A-Z])(\d*)$/);
    if (match) {
      const [, letter, number] = match;
      return {
        type: typeMap[letter] || 'verse',
        number: number ? parseInt(number, 10) : undefined,
        lines: []
      };
    }
    
    return { type: 'verse', lines: [] };
  }

  /**
   * Convert to ChordPro format
   */
  convertToChordPro(openSongData: OpenSongData): string {
    const { song } = openSongData;
    const sections = this.parseOpenSongLyrics(song.lyrics);
    
    let chordPro = '';
    
    // Add metadata directives
    if (song.title) chordPro += `{title: ${song.title}}\n`;
    if (song.author) chordPro += `{artist: ${song.author}}\n`;
    if (song.key) chordPro += `{key: ${song.key}}\n`;
    if (song.tempo) chordPro += `{tempo: ${song.tempo}}\n`;
    if (song.time_sig) chordPro += `{time: ${song.time_sig}}\n`;
    if (song.ccli) chordPro += `{ccli: ${song.ccli}}\n`;
    if (song.capo && song.capo !== '0') chordPro += `{capo: ${song.capo}}\n`;
    
    chordPro += '\n';
    
    // Convert sections
    for (const section of sections) {
      // Add section directive
      const sectionName = section.type + (section.number || '');
      chordPro += `{start_of_${section.type}}\n`;
      
      // Convert lines
      for (const line of section.lines) {
        if (line.chords && line.lyrics) {
          // Merge chords and lyrics ChordPro style
          chordPro += this.mergeChordAndLyrics(line.chords, line.lyrics) + '\n';
        } else if (line.lyrics) {
          chordPro += line.lyrics + '\n';
        } else if (line.chords) {
          // Instrumental line
          chordPro += `[${line.chords.trim()}]\n`;
        }
      }
      
      chordPro += `{end_of_${section.type}}\n\n`;
    }
    
    return chordPro.trim();
  }

  /**
   * Merge chord line and lyrics line into ChordPro format
   */
  private mergeChordAndLyrics(chordLine: string, lyricsLine: string): string {
    const chords = this.extractChordsWithPositions(chordLine);
    
    if (chords.length === 0) {
      return lyricsLine;
    }
    
    let result = '';
    let lastPos = 0;
    
    for (const { chord, position } of chords) {
      // Add lyrics before chord
      if (position > lastPos) {
        result += lyricsLine.substring(lastPos, Math.min(position, lyricsLine.length));
      }
      
      // Add chord in brackets
      result += `[${chord}]`;
      lastPos = position;
    }
    
    // Add remaining lyrics
    if (lastPos < lyricsLine.length) {
      result += lyricsLine.substring(lastPos);
    }
    
    return result;
  }

  /**
   * Extract chords and their positions from a chord line
   */
  private extractChordsWithPositions(chordLine: string): Array<{ chord: string; position: number }> {
    const chords: Array<{ chord: string; position: number }> = [];
    const regex = /\S+/g;
    let match;
    
    while ((match = regex.exec(chordLine)) !== null) {
      chords.push({
        chord: match[0],
        position: match.index
      });
    }
    
    return chords;
  }

  /**
   * Parse theme string to array
   */
  parseThemes(themeString?: string): string[] {
    if (!themeString) return [];
    
    // Themes can be separated by ; or ,
    return themeString
      .split(/[;,]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  /**
   * Build OpenSong XML from structured data
   */
  buildXML(data: OpenSongData): string {
    return this.builder.build(data);
  }
}
```

### 3. File Processing Service

```typescript
export class OpenSongImportService {
  private parser = new OpenSongParser();

  /**
   * Import single OpenSong file
   */
  async importFile(file: File): Promise<ParsedSong> {
    const content = await this.readFileAsText(file);
    const openSongData = this.parser.parseXML(content);
    
    return {
      metadata: {
        title: openSongData.song.title,
        artist: openSongData.song.author,
        ccli: openSongData.song.ccli,
        key: openSongData.song.key,
        tempo: openSongData.song.tempo ? parseInt(openSongData.song.tempo, 10) : undefined,
        timeSignature: openSongData.song.time_sig,
        themes: this.parser.parseThemes(openSongData.song.theme),
        copyright: openSongData.song.copyright,
        capo: openSongData.song.capo ? parseInt(openSongData.song.capo, 10) : undefined
      },
      sections: this.parser.parseOpenSongLyrics(openSongData.song.lyrics),
      presentation: openSongData.song.presentation?.split(' ')
    };
  }

  /**
   * Batch import multiple files
   */
  async importBatch(
    files: FileList,
    onProgress?: (current: number, total: number) => void
  ): Promise<Array<{ file: string; result: ParsedSong | Error }>> {
    const results: Array<{ file: string; result: ParsedSong | Error }> = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.(i + 1, files.length);
      
      try {
        const parsed = await this.importFile(file);
        results.push({ file: file.name, result: parsed });
      } catch (error) {
        results.push({ file: file.name, result: error as Error });
      }
    }
    
    return results;
  }

  /**
   * Read file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsText(file);
    });
  }

  /**
   * Validate OpenSong file
   */
  validateOpenSongFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      if (!file.name.endsWith('.xml')) {
        resolve(false);
        return;
      }
      
      this.readFileAsText(file)
        .then(content => {
          const isValid = XMLValidator.validate(content);
          resolve(isValid === true);
        })
        .catch(() => resolve(false));
    });
  }
}
```

### 4. Error Handling

```typescript
export class OpenSongParseError extends Error {
  constructor(
    message: string,
    public readonly fileName?: string,
    public readonly lineNumber?: number
  ) {
    super(message);
    this.name = 'OpenSongParseError';
  }
}

export function handleParseError(error: unknown, fileName?: string): OpenSongParseError {
  if (error instanceof Error) {
    const lineMatch = error.message.match(/line (\d+)/);
    const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
    
    return new OpenSongParseError(
      `Failed to parse OpenSong file: ${error.message}`,
      fileName,
      lineNumber
    );
  }
  
  return new OpenSongParseError(
    'Unknown error parsing OpenSong file',
    fileName
  );
}
```

## Common OpenSong Fields Reference

| Field | Description | Example |
|-------|-------------|---------|
| title | Song title | "Amazing Grace" |
| author | Composer/writer | "John Newton" |
| copyright | Copyright info | "Public Domain" |
| ccli | CCLI number | "22025" |
| key | Musical key | "G" |
| capo | Capo position | "0" |
| tempo | BPM | "72" |
| time_sig | Time signature | "3/4" |
| theme | Categories (;-separated) | "Grace; Salvation" |
| presentation | Section order | "V1 C V2 C" |
| hymn_number | Hymnal reference | "330" |

## References
- OpenSong Format: http://www.opensong.org/home/file-formats
- fast-xml-parser: https://github.com/NaturalIntelligence/fast-xml-parser
- XML Validation: https://www.npmjs.com/package/fast-xml-parser#xml-validator