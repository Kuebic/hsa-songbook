/**
 * @file VirtualChordScroller.utils.ts
 * @description Utility functions for VirtualChordScroller component
 */

import * as ChordSheetJS from 'chordsheetjs';
import type { ChordSection } from './VirtualChordScroller';

/**
 * Helper function to parse ChordPro content into sections
 */
export function parseChordProIntoSections(content: string): ChordSection[] {
  try {
    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(content);
    const sections: ChordSection[] = [];
    
    let currentSection: ChordSection | null = null;
    let sectionContent: string[] = [];
    let sectionIndex = 0;
    
    song.lines.forEach((line: ChordSheetJS.Line) => {
      // Check for section markers
      const lineText = line.items?.map(item => {
        if ('lyrics' in item) return item.lyrics;
        return '';
      }).join('').trim();
      
      // Simple section detection based on directives
      if (lineText.includes('{start_of_verse}') || lineText.includes('{sov}')) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = sectionContent.join('\n');
          sections.push(currentSection);
        }
        
        currentSection = {
          id: `verse-${sectionIndex++}`,
          type: 'verse',
          label: `Verse ${sectionIndex}`,
          content: ''
        };
        sectionContent = [];
      } else if (lineText.includes('{start_of_chorus}') || lineText.includes('{soc}')) {
        if (currentSection) {
          currentSection.content = sectionContent.join('\n');
          sections.push(currentSection);
        }
        
        currentSection = {
          id: `chorus-${sectionIndex++}`,
          type: 'chorus',
          label: 'Chorus',
          content: ''
        };
        sectionContent = [];
      } else if (lineText.includes('{start_of_bridge}') || lineText.includes('{sob}')) {
        if (currentSection) {
          currentSection.content = sectionContent.join('\n');
          sections.push(currentSection);
        }
        
        currentSection = {
          id: `bridge-${sectionIndex++}`,
          type: 'bridge',
          label: 'Bridge',
          content: ''
        };
        sectionContent = [];
      } else {
        // Add content to current section
        const originalLine = line.items?.map(item => {
          if ('chords' in item && item.chords) {
            return `[${item.chords}]${item.lyrics || ''}`;
          }
          if ('lyrics' in item) return item.lyrics;
          return '';
        }).join('');
        
        if (originalLine && originalLine.trim()) {
          sectionContent.push(originalLine);
        }
      }
    });
    
    // Save last section
    if (currentSection) {
      (currentSection as ChordSection).content = sectionContent.join('\n');
      sections.push(currentSection);
    }
    
    // If no sections detected, treat entire content as one section
    if (sections.length === 0) {
      sections.push({
        id: 'main',
        type: 'verse',
        label: 'Chords',
        content
      });
    }
    
    return sections;
  } catch (error) {
    console.error('Error parsing ChordPro:', error);
    // Fallback: return entire content as single section
    return [{
      id: 'main',
      type: 'verse',
      label: 'Chords',
      content
    }];
  }
}

/**
 * Convert sections back to ChordPro format
 */
export function sectionsToChordPro(sections: ChordSection[]): string {
  return sections.map(section => {
    let sectionContent = '';
    
    // Add section markers
    switch (section.type) {
      case 'verse':
        sectionContent = `{start_of_verse}\n${section.content}\n{end_of_verse}`;
        break;
      case 'chorus':
        sectionContent = `{start_of_chorus}\n${section.content}\n{end_of_chorus}`;
        break;
      case 'bridge':
        sectionContent = `{start_of_bridge}\n${section.content}\n{end_of_bridge}`;
        break;
      default:
        sectionContent = section.content;
    }
    
    return sectionContent;
  }).join('\n\n');
}