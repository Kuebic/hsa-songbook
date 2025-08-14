# PRP: Enhanced Transpose Feature with Enharmonic Support

## Executive Summary
Enhance the existing chord transposition feature to include enharmonic equivalent support (sharp/flat toggle), improved UI controls with capo selector and key dropdown, and context-aware music theory implementation using ChordSheetJS library's advanced capabilities.

## Context

### Current State Analysis
The HSA Songbook currently has a basic transposition implementation that:
- **Uses sharp-preference system**: Always converts flats to sharps (Bb → A#)
- **Has basic UI controls**: Simple +/- buttons with key display
- **Lacks enharmonic choice**: No user preference for sharp vs flat spelling
- **Missing key selector**: No dropdown for direct key selection
- **No capo support**: No capo position calculator or display

### Feature Requirements
Based on user requirements and research:
1. **Core Functionality**
   - Add transpose buttons with semitone shifting (+/-)
   - Display current transposition level (+2, -3, 0)
   - Include Reset button to return to original key
   - Show current key with automatic detection

2. **Enharmonic Support**
   - Add enharmonic toggle button for keys with accidentals
   - Maintain consistency when choosing sharps vs flats
   - Toggle all enharmonic equivalents simultaneously (Bb ↔ A#)

3. **Advanced UI Features**
   - Key selector dropdown for direct key changes
   - Common transposition intervals (capo positions)
   - Visual feedback for transposition state

### Technical Context
- **ChordSheetJS v12.3.1**: Already installed and integrated
- **React 19.1 + TypeScript 5.8**: Modern React patterns with hooks
- **Vertical Slice Architecture**: Arrangements feature slice
- **Existing Infrastructure**: TransposeControls, useTransposition hook

## Research & References

### Critical Documentation
- **ChordSheetJS Docs**: https://github.com/martijnversluis/ChordSheetJS
- **ChordSheetJS NPM**: https://www.npmjs.com/package/chordsheetjs
- **ChordFiddle Playground**: https://martijnversluis.github.io/ChordFiddle/
- **TonalJS (for advanced features)**: https://github.com/tonaljs/tonal
- **OnSong Manual (UI patterns)**: https://onsongapp.com/docs/features/capo/

### Local Research Files
- `PRPs/ai_docs/chord-transposition-enhancement-research.md` - Existing transposition research
- `claude_md_file/example/chord-pro-editor/utils/lineOfFifths.ts` - Advanced enharmonic algorithm
- `claude_md_file/example/chord-pro-editor/utils/musicBasedTransposition.ts` - Music theory implementation

### Key ChordSheetJS Methods for Enharmonics
```javascript
// Core enharmonic methods
chord.useModifier('#')     // Force sharp notation
chord.useModifier('b')     // Force flat notation  
chord.switchModifier()     // Toggle between # and b (deprecated)
chord.normalize()          // Simplify B#→C, E#→F, Cb→B, Fb→E

// Transposition methods
song.transpose(semitones)  // Transpose by semitones
song.transposeUp(steps)    // Transpose up
song.transposeDown(steps)  // Transpose down
```

### Music Theory Best Practices
- **Sharp keys**: G, D, A, E, B, F#, C# → Use sharps
- **Flat keys**: F, Bb, Eb, Ab, Db, Gb → Use flats
- **Enharmonic preferences**: Db > C#, Eb > D#, Ab > G#, Bb > A#
- **Context-aware spelling**: Consider key signature and harmonic function

## Implementation Blueprint

### Vertical Slice Architecture
All components remain within `/src/features/arrangements/` maintaining feature boundaries:

```
src/features/arrangements/
├── components/
│   ├── TransposeControls.tsx (enhance existing)
│   ├── EnharmonicToggle.tsx (new)
│   ├── KeySelector.tsx (existing, integrate)
│   └── CapoCalculator.tsx (new)
├── hooks/
│   ├── useTransposition.ts (enhance existing)
│   ├── useEnharmonic.ts (new)
│   └── useCapo.ts (new)
├── services/
│   ├── chordProService.ts (enhance existing)
│   └── enharmonicService.ts (new)
├── utils/
│   ├── enharmonicUtils.ts (new)
│   └── musicTheory.ts (new)
└── styles/
    └── transpose.css (enhance existing)
```

### Phase 1: Enhanced Enharmonic Support

#### 1.1 Create Enharmonic Service
```typescript
// src/features/arrangements/services/enharmonicService.ts
import { Chord } from 'chordsheetjs';

export interface EnharmonicPreference {
  preference: 'sharp' | 'flat' | 'auto';
  contextKey?: string;
}

export class EnharmonicService {
  private preference: EnharmonicPreference = { preference: 'auto' };
  
  // Enharmonic key pairs
  private readonly ENHARMONIC_PAIRS = [
    { sharp: 'C#', flat: 'Db' },
    { sharp: 'D#', flat: 'Eb' },
    { sharp: 'F#', flat: 'Gb' },
    { sharp: 'G#', flat: 'Ab' },
    { sharp: 'A#', flat: 'Bb' }
  ];
  
  // Key signature preferences (flats preferred)
  private readonly FLAT_KEY_SIGNATURES = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
  private readonly SHARP_KEY_SIGNATURES = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
  
  setPreference(pref: EnharmonicPreference): void {
    this.preference = pref;
    localStorage.setItem('enharmonic-preference', JSON.stringify(pref));
  }
  
  getPreference(): EnharmonicPreference {
    const stored = localStorage.getItem('enharmonic-preference');
    if (stored) {
      this.preference = JSON.parse(stored);
    }
    return this.preference;
  }
  
  convertChord(chordSymbol: string, targetModifier?: '#' | 'b'): string {
    const chord = Chord.parse(chordSymbol);
    if (!chord) return chordSymbol;
    
    // Determine modifier based on preference
    const modifier = targetModifier || this.determineModifier(chordSymbol);
    return chord.useModifier(modifier).toString();
  }
  
  private determineModifier(chordSymbol: string): '#' | 'b' {
    if (this.preference.preference === 'sharp') return '#';
    if (this.preference.preference === 'flat') return 'b';
    
    // Auto mode: use context
    if (this.preference.contextKey) {
      const baseKey = this.preference.contextKey.replace('m', '');
      if (this.FLAT_KEY_SIGNATURES.includes(baseKey)) return 'b';
      if (this.SHARP_KEY_SIGNATURES.includes(baseKey)) return '#';
    }
    
    // Default to current notation
    return chordSymbol.includes('b') ? 'b' : '#';
  }
  
  isEnharmonicKey(key: string): boolean {
    const baseKey = key.replace('m', '');
    return this.ENHARMONIC_PAIRS.some(
      pair => pair.sharp === baseKey || pair.flat === baseKey
    );
  }
  
  getEnharmonicEquivalent(key: string): string | null {
    const isMinor = key.endsWith('m');
    const baseKey = key.replace('m', '');
    
    const pair = this.ENHARMONIC_PAIRS.find(
      p => p.sharp === baseKey || p.flat === baseKey
    );
    
    if (!pair) return null;
    
    const equivalent = pair.sharp === baseKey ? pair.flat : pair.sharp;
    return isMinor ? `${equivalent}m` : equivalent;
  }
}

export const enharmonicService = new EnharmonicService();
```

#### 1.2 Create Enharmonic Toggle Component
```typescript
// src/features/arrangements/components/EnharmonicToggle.tsx
import { Music } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { enharmonicService } from '../services/enharmonicService';

interface EnharmonicToggleProps {
  currentKey?: string;
  onToggle: () => void;
  className?: string;
  variant?: 'button' | 'switch';
}

export function EnharmonicToggle({ 
  currentKey, 
  onToggle, 
  className,
  variant = 'button' 
}: EnharmonicToggleProps) {
  const isEnharmonic = currentKey && enharmonicService.isEnharmonicKey(currentKey);
  const preference = enharmonicService.getPreference();
  
  if (!isEnharmonic) return null;
  
  const handleToggle = () => {
    const newPref = preference.preference === 'sharp' ? 'flat' : 'sharp';
    enharmonicService.setPreference({ 
      preference: newPref,
      contextKey: currentKey 
    });
    onToggle();
  };
  
  if (variant === 'switch') {
    return (
      <div className={cn('enharmonic-switch', className)}>
        <button
          onClick={handleToggle}
          className={cn(
            'switch-button',
            preference.preference === 'sharp' && 'active-sharp',
            preference.preference === 'flat' && 'active-flat'
          )}
          aria-label="Toggle between sharp and flat notation"
          title={`Currently showing ${preference.preference}s`}
        >
          <span className="sharp-symbol">♯</span>
          <span className="switch-slider" />
          <span className="flat-symbol">♭</span>
        </button>
      </div>
    );
  }
  
  return (
    <button
      onClick={handleToggle}
      className={cn(
        'enharmonic-toggle-button',
        className
      )}
      aria-label="Toggle enharmonic equivalent"
      title={`Switch to ${preference.preference === 'sharp' ? 'flat' : 'sharp'} notation`}
    >
      <Music className="w-4 h-4" />
      <span>{preference.preference === 'sharp' ? '♯' : '♭'}</span>
    </button>
  );
}
```

#### 1.3 Enhance useTransposition Hook
```typescript
// src/features/arrangements/hooks/useTransposition.ts (enhanced)
import { useState, useCallback, useEffect, useMemo } from 'react';
import { enharmonicService } from '../services/enharmonicService';
import { chordProService } from '../services/chordProService';

export function useTransposition(
  originalKey?: string,
  options?: TranspositionOptions
) {
  // ... existing code ...
  
  const [enharmonicPreference, setEnharmonicPreference] = useState<'sharp' | 'flat' | 'auto'>('auto');
  
  // Apply enharmonic preference to transposed content
  const applyEnharmonicPreference = useCallback((content: string, preference: 'sharp' | 'flat' | 'auto') => {
    if (preference === 'auto') return content;
    
    const { song } = chordProService.parse(content);
    
    // Convert all chords to preferred notation
    song.lines.forEach(line => {
      line.items.forEach(item => {
        if (item.chords) {
          item.chords = enharmonicService.convertChord(item.chords, preference === 'sharp' ? '#' : 'b');
        }
      });
    });
    
    return chordProService.format(song);
  }, []);
  
  const toggleEnharmonic = useCallback(() => {
    const newPref = enharmonicPreference === 'sharp' ? 'flat' : 'sharp';
    setEnharmonicPreference(newPref);
    enharmonicService.setPreference({ 
      preference: newPref,
      contextKey: currentKey 
    });
  }, [enharmonicPreference, currentKey]);
  
  // ... rest of hook implementation ...
  
  return {
    // ... existing returns ...
    enharmonicPreference,
    toggleEnharmonic,
    isEnharmonicKey: currentKey ? enharmonicService.isEnharmonicKey(currentKey) : false
  };
}
```

### Phase 2: Enhanced UI Controls

#### 2.1 Update TransposeControls Component
```typescript
// src/features/arrangements/components/TransposeControls.tsx (enhanced)
import { EnharmonicToggle } from './EnharmonicToggle';
import { KeySelector } from './KeySelector';
import { CapoSelector } from './CapoSelector';

interface EnhancedTransposeControlsProps extends TransposeControlsProps {
  showEnharmonicToggle?: boolean;
  showKeySelector?: boolean;
  showCapoSelector?: boolean;
  onEnharmonicToggle?: () => void;
  onKeySelect?: (key: string) => void;
  onCapoChange?: (capo: number) => void;
}

export function TransposeControls({
  // ... existing props ...
  showEnharmonicToggle = true,
  showKeySelector = false,
  showCapoSelector = false,
  onEnharmonicToggle,
  onKeySelect,
  onCapoChange
}: EnhancedTransposeControlsProps) {
  // ... existing implementation ...
  
  return (
    <div className={cn(styles.container, 'transpose-controls-enhanced', className)}>
      {/* Existing transpose controls */}
      <div className="transpose-basic-controls">
        {/* ... existing buttons ... */}
      </div>
      
      {/* Enharmonic toggle */}
      {showEnharmonicToggle && currentKey && (
        <EnharmonicToggle
          currentKey={currentKey}
          onToggle={onEnharmonicToggle || (() => {})}
          variant="switch"
        />
      )}
      
      {/* Key selector dropdown */}
      {showKeySelector && (
        <KeySelector
          currentKey={currentKey}
          onKeySelect={onKeySelect || (() => {})}
          className="transpose-key-selector"
        />
      )}
      
      {/* Capo selector */}
      {showCapoSelector && (
        <CapoSelector
          currentCapo={0}
          onCapoChange={onCapoChange || (() => {})}
          showChordShapes={true}
        />
      )}
    </div>
  );
}
```

#### 2.2 Create Capo Calculator Component
```typescript
// src/features/arrangements/components/CapoCalculator.tsx
interface CapoOption {
  position: number;
  playKey: string;
  chordShape: string;
}

interface CapoCalculatorProps {
  originalKey: string;
  targetKey: string;
  onSelectCapo: (option: CapoOption) => void;
}

export function CapoCalculator({ 
  originalKey, 
  targetKey, 
  onSelectCapo 
}: CapoCalculatorProps) {
  const capoOptions = useMemo(() => {
    return calculateCapoOptions(originalKey, targetKey);
  }, [originalKey, targetKey]);
  
  return (
    <div className="capo-calculator">
      <h3>Capo Options for {targetKey}</h3>
      <div className="capo-options-grid">
        {capoOptions.map(option => (
          <button
            key={option.position}
            onClick={() => onSelectCapo(option)}
            className="capo-option"
          >
            <div className="capo-position">Capo {option.position}</div>
            <div className="play-key">Play {option.playKey}</div>
            <div className="chord-shape">{option.chordShape} shape</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function calculateCapoOptions(originalKey: string, targetKey: string): CapoOption[] {
  // Implementation based on music theory
  // Calculate all valid capo positions that achieve the target key
  const options: CapoOption[] = [];
  const commonShapes = ['G', 'C', 'D', 'A', 'E'];
  
  // ... calculation logic ...
  
  return options;
}
```

### Phase 3: ChordPro Service Enhancement

#### 3.1 Enhance ChordPro Service
```typescript
// src/features/arrangements/services/chordProService.ts (enhanced)
export class ChordProService {
  // ... existing methods ...
  
  transposeWithEnharmonic(
    content: string, 
    semitones: number, 
    enharmonicPreference?: 'sharp' | 'flat' | 'auto'
  ): string {
    const { song } = this.parse(content);
    
    // Apply transposition
    song.transpose(semitones);
    
    // Apply enharmonic preference if specified
    if (enharmonicPreference && enharmonicPreference !== 'auto') {
      const modifier = enharmonicPreference === 'sharp' ? '#' : 'b';
      
      song.lines.forEach(line => {
        line.items.forEach(item => {
          if (item.chords) {
            const chord = Chord.parse(item.chords);
            if (chord) {
              item.chords = chord.useModifier(modifier).toString();
            }
          }
        });
      });
    }
    
    const formatter = new ChordProFormatter();
    return formatter.format(song);
  }
  
  detectSongKey(content: string): { key: string; confidence: number } {
    const { song } = this.parse(content);
    
    // Check for explicit key directive
    if (song.key) {
      return { key: song.key, confidence: 1.0 };
    }
    
    // Analyze chord progression for key detection
    const chords: string[] = [];
    song.lines.forEach(line => {
      line.items.forEach(item => {
        if (item.chords) {
          chords.push(item.chords);
        }
      });
    });
    
    // Use advanced key detection algorithm
    return detectKeyFromChords(chords);
  }
}
```

### Phase 4: Testing Strategy

#### 4.1 Unit Tests
```typescript
// src/features/arrangements/services/__tests__/enharmonicService.test.ts
describe('EnharmonicService', () => {
  describe('convertChord', () => {
    it('should convert sharp to flat notation', () => {
      const result = enharmonicService.convertChord('C#', 'b');
      expect(result).toBe('Db');
    });
    
    it('should convert flat to sharp notation', () => {
      const result = enharmonicService.convertChord('Bb', '#');
      expect(result).toBe('A#');
    });
    
    it('should preserve chord quality', () => {
      const result = enharmonicService.convertChord('Ebm7', '#');
      expect(result).toBe('D#m7');
    });
  });
  
  describe('context-aware conversion', () => {
    it('should use flats in F major context', () => {
      enharmonicService.setPreference({ 
        preference: 'auto', 
        contextKey: 'F' 
      });
      const result = enharmonicService.convertChord('A#');
      expect(result).toBe('Bb');
    });
    
    it('should use sharps in G major context', () => {
      enharmonicService.setPreference({ 
        preference: 'auto', 
        contextKey: 'G' 
      });
      const result = enharmonicService.convertChord('Gb');
      expect(result).toBe('F#');
    });
  });
});
```

#### 4.2 Integration Tests
```typescript
// src/features/arrangements/components/__tests__/TransposeControls.test.tsx
describe('TransposeControls with Enharmonic Support', () => {
  it('should show enharmonic toggle for enharmonic keys', () => {
    render(
      <TransposeControls
        currentKey="F#"
        showEnharmonicToggle={true}
        {...defaultProps}
      />
    );
    
    expect(screen.getByLabelText('Toggle enharmonic equivalent')).toBeInTheDocument();
  });
  
  it('should not show enharmonic toggle for non-enharmonic keys', () => {
    render(
      <TransposeControls
        currentKey="C"
        showEnharmonicToggle={true}
        {...defaultProps}
      />
    );
    
    expect(screen.queryByLabelText('Toggle enharmonic equivalent')).not.toBeInTheDocument();
  });
  
  it('should toggle all chords when enharmonic button clicked', async () => {
    const onEnharmonicToggle = vi.fn();
    render(
      <TransposeControls
        currentKey="Bb"
        showEnharmonicToggle={true}
        onEnharmonicToggle={onEnharmonicToggle}
        {...defaultProps}
      />
    );
    
    await userEvent.click(screen.getByLabelText('Toggle enharmonic equivalent'));
    expect(onEnharmonicToggle).toHaveBeenCalled();
  });
});
```

### Phase 5: Styling

#### 5.1 Enhanced Transpose Styles
```css
/* src/features/arrangements/styles/transpose.css (enhanced) */

/* Enharmonic Toggle Switch */
.enharmonic-switch {
  display: inline-flex;
  align-items: center;
  margin-left: 1rem;
}

.switch-button {
  position: relative;
  width: 60px;
  height: 28px;
  background-color: var(--color-accent);
  border: 2px solid var(--color-border);
  border-radius: 14px;
  padding: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.switch-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.switch-button.active-sharp .switch-slider {
  transform: translateX(0);
}

.switch-button.active-flat .switch-slider {
  transform: translateX(32px);
}

.sharp-symbol, .flat-symbol {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  font-weight: bold;
  color: var(--text-secondary);
}

.sharp-symbol {
  left: 8px;
}

.flat-symbol {
  right: 8px;
}

/* Key Selector Dropdown */
.transpose-key-selector {
  margin-left: 1rem;
}

.key-selector select {
  padding: 0.375rem 0.75rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.key-selector optgroup {
  font-weight: bold;
  color: var(--text-secondary);
}

/* Capo Calculator */
.capo-calculator {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--color-background-secondary);
  border-radius: 0.5rem;
}

.capo-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.capo-option {
  padding: 0.5rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.capo-option:hover {
  background-color: var(--color-accent);
  transform: scale(1.05);
}

.capo-position {
  font-weight: bold;
  font-size: 0.875rem;
}

.play-key {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.chord-shape {
  font-size: 0.75rem;
  font-style: italic;
  color: var(--text-tertiary);
}

/* Enhanced Controls Container */
.transpose-controls-enhanced {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--color-background-secondary);
  border-radius: 0.5rem;
}

.transpose-basic-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .transpose-controls-enhanced {
    flex-direction: column;
    align-items: stretch;
  }
  
  .enharmonic-switch {
    margin-left: 0;
    margin-top: 0.5rem;
  }
  
  .transpose-key-selector {
    margin-left: 0;
    margin-top: 0.5rem;
  }
  
  .capo-options-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

## Validation Gates

```bash
# Level 1: Type checking and linting
npm run lint && npm run build

# Level 2: Unit tests for enharmonic service
npm run test -- src/features/arrangements/services/__tests__/enharmonicService.test.ts

# Level 3: Integration tests for UI components
npm run test -- src/features/arrangements/components/__tests__/TransposeControls.test.tsx
npm run test -- src/features/arrangements/components/__tests__/EnharmonicToggle.test.tsx

# Level 4: E2E transpose functionality
npm run test:e2e -- --grep "transpose"

# Level 5: Build validation
npm run build && npm run preview

# Level 6: Bundle size check
npm run analyze

# Level 7: Performance testing
# - Transpose large chord sheet (100+ chords)
# - Toggle enharmonics rapidly
# - Switch between multiple keys

# Level 8: Music theory validation
# - Test all enharmonic pairs (C#/Db, D#/Eb, etc.)
# - Verify key signature context
# - Test capo calculations

# Level 9: Accessibility testing
# - Keyboard navigation (Tab through controls)
# - Screen reader announcements
# - ARIA labels verification

# Level 10: Mobile responsiveness
# - Test on mobile viewport
# - Touch target sizes (min 44px)
# - Gesture support
```

## Success Metrics

### Functional Requirements
- [ ] Transpose buttons shift chords by semitones
- [ ] Current transposition level displayed
- [ ] Reset button returns to original key
- [ ] Enharmonic toggle switches between sharp/flat
- [ ] Consistency maintained across all chords
- [ ] Key selector allows direct key changes
- [ ] Capo positions calculated correctly
- [ ] Preferences persist in localStorage

### Non-Functional Requirements
- [ ] Transpose operation < 50ms for typical song
- [ ] Enharmonic toggle < 100ms response time
- [ ] Mobile touch targets ≥ 44px
- [ ] All controls keyboard accessible
- [ ] No layout shifts during transpose
- [ ] Works offline (no external dependencies)

### Code Quality
- [ ] 90% test coverage for new code
- [ ] TypeScript strict mode compliance
- [ ] No ESLint errors or warnings
- [ ] Follows vertical slice architecture
- [ ] ChordSheetJS methods used correctly
- [ ] Music theory rules properly implemented

## Implementation Order

### Sprint 1: Core Enharmonic Support (2-3 days)
1. Create EnharmonicService with conversion logic
2. Add useModifier() integration to ChordProService
3. Create EnharmonicToggle component
4. Update useTransposition hook
5. Write unit tests for service

### Sprint 2: Enhanced UI Controls (2-3 days)
1. Update TransposeControls with new props
2. Integrate EnharmonicToggle into UI
3. Add KeySelector integration
4. Style enharmonic switch
5. Write component tests

### Sprint 3: Advanced Features (2-3 days)
1. Implement capo calculator logic
2. Create CapoCalculator component
3. Add key detection to ChordProService
4. Implement context-aware enharmonics
5. Write integration tests

### Sprint 4: Polish & Optimization (1-2 days)
1. Performance optimization
2. Mobile responsiveness
3. Accessibility improvements
4. Documentation
5. E2E testing

## Risk Mitigation

### Technical Risks
- **ChordSheetJS limitations**: Have fallback manual conversion
- **Performance with large sheets**: Implement debouncing and memoization
- **Browser compatibility**: Test useModifier() across browsers

### UX Risks
- **Confusing enharmonic toggle**: Add tooltips and visual feedback
- **Key context errors**: Allow manual override
- **Mobile usability**: Ensure touch targets are large enough

## Rollback Plan

If critical issues arise:
1. Feature flag to disable enharmonic features
2. Revert to simple transpose without enharmonics
3. Keep existing TransposeControls as fallback
4. Document known issues for next iteration

## Post-Implementation

### Monitoring
- Track enharmonic toggle usage
- Monitor transpose performance metrics
- Collect user feedback on key preferences

### Future Enhancements
- Instrument-specific transposition (Bb trumpet, Eb sax)
- Chord progression analysis
- Smart key suggestions based on vocal range
- MIDI export with transposition

## External Dependencies
- ChordSheetJS v12.3.1 (already installed)
- No additional npm packages required
- All functionality uses existing ChordSheetJS methods

## Notes for Implementation

### ChordSheetJS API Usage
The implementation relies heavily on these ChordSheetJS methods:
- `Chord.parse()` - Parse chord symbols
- `chord.useModifier('#'|'b')` - Convert to sharp/flat
- `song.transpose(semitones)` - Transpose entire song
- `chord.normalize()` - Simplify enharmonics

### Music Theory Considerations
- Always respect key signature context
- Prefer simpler spellings (fewer accidentals)
- Maintain chord quality during conversion
- Consider harmonic function for edge cases

### Testing Checklist
- [ ] All 5 enharmonic pairs toggle correctly
- [ ] Complex chords preserve quality (m7, sus4, etc.)
- [ ] Slash chords convert properly (C/E → Db/F)
- [ ] Key detection works for common progressions
- [ ] Capo calculations are musically accurate
- [ ] Preferences persist across sessions
- [ ] Mobile gestures work smoothly

## Confidence Score: 9/10

### Strengths
- Comprehensive research on ChordSheetJS capabilities
- Existing codebase has solid foundation
- Clear vertical slice architecture
- Well-defined testing strategy
- Music theory properly considered

### Considerations
- Enharmonic logic complexity requires careful testing
- Performance optimization may be needed for large sheets
- UI complexity needs careful UX testing

This PRP provides complete context for implementing enhanced transpose with enharmonic support, leveraging ChordSheetJS's built-in methods while maintaining musical accuracy and user control.