# ChordPro Preview Fix Verification

## Test Case 1: Consecutive Chords (Intro)
```
[G][D/G][G][D/G]
```
**Expected**: All chords should appear on the same line with spacing: `G  D/G  G  D/G`
**Previous Issue**: Each chord appeared on a separate line

## Test Case 2: Chord Highlighting
```
[C]Amazing [G]grace, how [D]sweet the [G]sound
That [Am]saved a [F]wretch like [C]me
```
**Expected**: Chords appear above their positions without background affecting lyrics
**Previous Issue**: Chord background overlapped with text below

## Test Case 3: Mixed Content
```
{title: Test Song}
{artist: Test Artist}

[G][D/G][G][D/G]  // Intro chords

[G]This is the [C]first verse
With encyclo[D]pedia example
[Am]Multiple [F]chords [G]here
```
**Expected**: 
- Intro chords on one line
- Regular chords positioned above lyrics
- No background overlap

## Test Case 4: Complex Intro
```
Intro: [G][C/G][G][D][Em][C][G][D/G]
```
**Expected**: All intro chords inline with spacing

## Manual Testing Steps:
1. Start dev server: `npm run dev`
2. Navigate to ChordPro editor
3. Paste each test case
4. Verify:
   - Consecutive chords render inline
   - No background overlap on lyrics
   - Chords properly positioned above text