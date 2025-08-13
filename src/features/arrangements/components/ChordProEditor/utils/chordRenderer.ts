export interface ChordPosition {
  chord: string;
  charIndex: number;
  lyricLine: string;
}

export class CharacterChordRenderer {
  /**
   * Parse ChordPro notation and extract chord positions
   */
  parseChordPositions(line: string): ChordPosition[] {
    const positions: ChordPosition[] = [];
    let cleanLine = '';
    
    // Parse line character by character
    let i = 0;
    while (i < line.length) {
      if (line[i] === '[') {
        // Found chord marker
        const closeIndex = line.indexOf(']', i);
        if (closeIndex !== -1) {
          const chord = line.substring(i + 1, closeIndex);
          positions.push({
            chord,
            charIndex: cleanLine.length,
            lyricLine: ''
          });
          i = closeIndex + 1;
        } else {
          cleanLine += line[i];
          i++;
        }
      } else {
        cleanLine += line[i];
        i++;
      }
    }
    
    // Update positions with clean line
    positions.forEach(pos => {
      pos.lyricLine = cleanLine;
    });
    
    return positions;
  }
  
  /**
   * Render line with chords positioned above characters
   */
  renderLine(line: string): HTMLElement {
    const positions = this.parseChordPositions(line);
    const container = document.createElement('div');
    container.className = 'chord-line-container';
    
    if (positions.length === 0) {
      // No chords, just lyrics
      container.textContent = line;
      return container;
    }
    
    const cleanLine = positions[0].lyricLine;
    
    // Check if this is a chord-only line (no lyrics, just chords)
    if (cleanLine.trim() === '') {
      // Render chords inline with spacing
      const chordOnlySpan = document.createElement('span');
      chordOnlySpan.className = 'chord-only-line';
      
      positions.forEach((pos, idx) => {
        const chordSpan = document.createElement('span');
        chordSpan.className = 'inline-chord';
        chordSpan.textContent = pos.chord;
        chordOnlySpan.appendChild(chordSpan);
        
        // Add spacing between chords (except after the last one)
        if (idx < positions.length - 1) {
          const spacer = document.createTextNode('  ');
          chordOnlySpan.appendChild(spacer);
        }
      });
      
      container.appendChild(chordOnlySpan);
      return container;
    }
    
    // Regular rendering with chords above lyrics
    const lyricSpan = document.createElement('span');
    lyricSpan.className = 'lyric-with-chords';
    
    let lastIndex = 0;
    
    positions.forEach((pos, _idx) => {
      // Add text before chord
      if (pos.charIndex > lastIndex) {
        const textNode = document.createTextNode(
          cleanLine.substring(lastIndex, pos.charIndex)
        );
        lyricSpan.appendChild(textNode);
      }
      
      // Add character with chord
      const charSpan = document.createElement('span');
      charSpan.className = 'chord-anchor';
      charSpan.setAttribute('data-chord', pos.chord);
      charSpan.textContent = cleanLine[pos.charIndex] || '';
      lyricSpan.appendChild(charSpan);
      
      lastIndex = pos.charIndex + 1;
    });
    
    // Add remaining text
    if (lastIndex < cleanLine.length) {
      const textNode = document.createTextNode(
        cleanLine.substring(lastIndex)
      );
      lyricSpan.appendChild(textNode);
    }
    
    container.appendChild(lyricSpan);
    return container;
  }

  /**
   * Render line as HTML string with chords positioned above characters
   */
  renderLineAsHTML(line: string): string {
    const positions = this.parseChordPositions(line);
    
    if (positions.length === 0) {
      // No chords, just lyrics
      return `<div class="chord-line-container">${line}</div>`;
    }
    
    const cleanLine = positions[0].lyricLine;
    
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
}