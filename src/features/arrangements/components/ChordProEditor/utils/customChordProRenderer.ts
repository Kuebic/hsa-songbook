import type { ChordPosition } from './chordRenderer';

export interface Section {
  type: string;
  lines: string[];
  label?: string;
}

export interface ParsedSong {
  title?: string;
  artist?: string;
  key?: string;
  tempo?: string;
  capo?: string;
  sections: Section[];
}

export class CustomChordProRenderer {
  private directives: Map<string, string> = new Map();
  
  parse(content: string): ParsedSong {
    const lines = content.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    
    lines.forEach(line => {
      // Handle directives
      if (line.startsWith('{') && line.endsWith('}')) {
        const directive = line.slice(1, -1);
        const [key, ...valueParts] = directive.split(':');
        const value = valueParts.join(':').trim();
        this.directives.set(key.toLowerCase(), value);
        
        // Handle section directives
        if (key.startsWith('start_of_')) {
          const sectionType = key.replace('start_of_', '');
          currentSection = { 
            type: sectionType, 
            lines: [],
            label: value || sectionType.charAt(0).toUpperCase() + sectionType.slice(1)
          };
        } else if (key.startsWith('end_of_')) {
          if (currentSection) {
            sections.push(currentSection);
            currentSection = null;
          }
        }
      } else if (line.trim()) {
        // Handle chord/lyric lines
        const rendered = this.renderChordLine(line);
        if (currentSection) {
          currentSection.lines.push(rendered);
        } else {
          // Create implicit verse section
          if (sections.length === 0 || sections[sections.length - 1].type !== 'verse') {
            sections.push({ type: 'verse', lines: [] });
          }
          sections[sections.length - 1].lines.push(rendered);
        }
      } else if (line.trim() === '' && currentSection) {
        // Add empty line to current section
        currentSection.lines.push('<div class="chord-line-container"></div>');
      }
    });
    
    // Close any open section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return {
      title: this.directives.get('title'),
      artist: this.directives.get('artist'),
      key: this.directives.get('key'),
      tempo: this.directives.get('tempo'),
      capo: this.directives.get('capo'),
      sections
    };
  }
  
  private renderChordLine(line: string): string {
    // Use character-level positioning algorithm
    const positions: ChordPosition[] = [];
    let cleanLine = '';
    let i = 0;
    
    while (i < line.length) {
      if (line[i] === '[') {
        const closeIndex = line.indexOf(']', i);
        if (closeIndex !== -1) {
          const chord = line.substring(i + 1, closeIndex);
          positions.push({
            chord,
            charIndex: cleanLine.length,
            lyricLine: ''
          });
          i = closeIndex + 1;
          continue;
        }
      }
      cleanLine += line[i];
      i++;
    }
    
    // Build HTML with positioned chords
    if (positions.length === 0) {
      return `<div class="chord-line-container">${cleanLine}</div>`;
    }
    
    // Check if this is a chord-only line (no lyrics, just chords)
    if (cleanLine.trim() === '') {
      let html = '<div class="chord-line-container"><span class="chord-only-line">';
      
      positions.forEach((pos, idx) => {
        html += `<span class="inline-chord">${pos.chord}</span>`;
        
        // Add spacing between chords (except after the last one)
        if (idx < positions.length - 1) {
          html += '  ';
        }
      });
      
      html += '</span></div>';
      return html;
    }
    
    // Regular rendering with chords above lyrics
    let html = '<div class="chord-line-container"><span class="lyric-with-chords">';
    let lastIndex = 0;
    
    positions.forEach(pos => {
      // Add text before chord
      if (pos.charIndex > lastIndex) {
        html += cleanLine.substring(lastIndex, pos.charIndex);
      }
      
      // Add character with chord
      html += `<span class="chord-anchor" data-chord="${pos.chord}">`;
      html += cleanLine[pos.charIndex] || '';
      html += '</span>';
      
      lastIndex = pos.charIndex + 1;
    });
    
    // Add remaining text
    if (lastIndex < cleanLine.length) {
      html += cleanLine.substring(lastIndex);
    }
    
    html += '</span></div>';
    return html;
  }
  
  render(parsedSong: ParsedSong): string {
    let html = '';
    
    // Render header if metadata exists
    if (parsedSong.title || parsedSong.artist) {
      html += '<div class="chord-sheet-header">';
      
      if (parsedSong.title) {
        html += `<h1 class="song-title">${parsedSong.title}</h1>`;
      }
      
      if (parsedSong.artist) {
        html += `<p class="song-artist">${parsedSong.artist}</p>`;
      }
      
      if (parsedSong.key || parsedSong.tempo || parsedSong.capo) {
        html += '<div class="song-metadata">';
        
        if (parsedSong.key) {
          html += `<span class="metadata-item"><span class="metadata-label">Key:</span> ${parsedSong.key}</span>`;
        }
        
        if (parsedSong.tempo) {
          html += `<span class="metadata-item"><span class="metadata-label">Tempo:</span> ${parsedSong.tempo}</span>`;
        }
        
        if (parsedSong.capo) {
          html += `<span class="metadata-item"><span class="metadata-label">Capo:</span> ${parsedSong.capo}</span>`;
        }
        
        html += '</div>';
      }
      
      html += '</div>';
    }
    
    // Render sections
    html += '<div class="chord-sheet-content">';
    
    parsedSong.sections.forEach(section => {
      html += `<div class="paragraph ${section.type}">`;
      
      if (section.label && section.type !== 'verse') {
        html += `<div class="paragraph-label section-label">${section.label}</div>`;
      }
      
      section.lines.forEach(line => {
        html += line;
      });
      
      html += '</div>';
    });
    
    html += '</div>';
    
    return html;
  }
  
  /**
   * Parse and render ChordPro content in one step
   */
  parseAndRender(content: string): string {
    const parsedSong = this.parse(content);
    return this.render(parsedSong);
  }
}