import { describe, it, expect } from 'vitest';
import { CharacterChordRenderer } from '../chordRenderer';

describe('CharacterChordRenderer - Consecutive Chords', () => {
  const renderer = new CharacterChordRenderer();

  describe('renderLineAsHTML - Chord-only lines', () => {
    it('should render consecutive chords inline on the same line', () => {
      const line = '[G][D/G][G][D/G]';
      const result = renderer.renderLineAsHTML(line);
      
      // Should contain chord-only-line class
      expect(result).toContain('chord-only-line');
      
      // Should contain inline-chord spans
      expect(result).toContain('<span class="inline-chord">G</span>');
      expect(result).toContain('<span class="inline-chord">D/G</span>');
      
      // Should have spacing between chords
      expect(result).toMatch(/G<\/span>\s+<span/);
      
      // Should all be in one container
      expect(result).toMatch(/<div class="chord-line-container">.*<\/div>/);
      // Should only have one chord-line-container div
      expect((result.match(/chord-line-container/g) || []).length).toBe(1);
    });

    it('should handle complex intro chords', () => {
      const line = '[G][C/G][G][D][Em][C][G][D/G]';
      const result = renderer.renderLineAsHTML(line);
      
      expect(result).toContain('chord-only-line');
      expect(result).toContain('<span class="inline-chord">G</span>');
      expect(result).toContain('<span class="inline-chord">C/G</span>');
      expect(result).toContain('<span class="inline-chord">D</span>');
      expect(result).toContain('<span class="inline-chord">Em</span>');
      expect(result).toContain('<span class="inline-chord">C</span>');
      expect(result).toContain('<span class="inline-chord">D/G</span>');
    });

    it('should not treat chords with lyrics as chord-only', () => {
      const line = '[G]Amazing [C]grace';
      const result = renderer.renderLineAsHTML(line);
      
      // Should NOT contain chord-only-line class
      expect(result).not.toContain('chord-only-line');
      
      // Should use chord-anchor for positioned chords
      expect(result).toContain('chord-anchor');
      expect(result).toContain('data-chord="G"');
      expect(result).toContain('data-chord="C"');
    });
  });

  describe('renderLine - DOM elements', () => {
    it('should create proper DOM structure for consecutive chords', () => {
      const line = '[G][D/G][G][D/G]';
      const element = renderer.renderLine(line);
      
      expect(element.className).toBe('chord-line-container');
      
      const chordOnlySpan = element.querySelector('.chord-only-line');
      expect(chordOnlySpan).toBeTruthy();
      
      const inlineChords = element.querySelectorAll('.inline-chord');
      expect(inlineChords.length).toBe(4);
      expect(inlineChords[0].textContent).toBe('G');
      expect(inlineChords[1].textContent).toBe('D/G');
      expect(inlineChords[2].textContent).toBe('G');
      expect(inlineChords[3].textContent).toBe('D/G');
    });

    it('should add spacing between chords', () => {
      const line = '[C][G][Am]';
      const element = renderer.renderLine(line);
      
      const chordOnlySpan = element.querySelector('.chord-only-line');
      expect(chordOnlySpan).toBeTruthy();
      
      // Check that text nodes with spaces exist between chord spans
      const childNodes = Array.from(chordOnlySpan!.childNodes);
      const textNodes = childNodes.filter(node => node.nodeType === Node.TEXT_NODE);
      
      // Should have 2 text nodes with spaces (between 3 chords)
      expect(textNodes.length).toBe(2);
      textNodes.forEach(node => {
        expect(node.textContent).toBe('  ');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle single chord without lyrics', () => {
      const line = '[G]';
      const result = renderer.renderLineAsHTML(line);
      
      expect(result).toContain('chord-only-line');
      expect(result).toContain('<span class="inline-chord">G</span>');
    });

    it('should handle chord at the beginning with lyrics', () => {
      const line = '[G]Hello world';
      const result = renderer.renderLineAsHTML(line);
      
      expect(result).not.toContain('chord-only-line');
      expect(result).toContain('chord-anchor');
      expect(result).toContain('data-chord="G"');
    });

    it('should handle mixed whitespace with chords only', () => {
      const line = '[G]  [C]  [D]';
      const positions = renderer.parseChordPositions(line);
      
      // The clean line should have the spaces
      expect(positions[0].lyricLine).toBe('    ');
      
      // But when rendered, it should be treated as chord-only since it's just whitespace
      const result = renderer.renderLineAsHTML(line);
      expect(result).toContain('chord-only-line');
    });
  });
});