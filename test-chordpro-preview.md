# ChordPro Preview Test Cases

## Test Case 1: Encyclopedia Example
```
encyclo[D]pedia
```
Expected: D chord should appear exactly above the letter 'p'

## Test Case 2: Title Duplication
```
{title: Amazing Grace}
{artist: John Newton}
[G]Amazing [C]grace, how [D]sweet the [G]sound
```
Expected: Title "Amazing Grace" should appear only once

## Test Case 3: Word Spacing
```
[C]Hello [G]world [Am]test [F]spacing
```
Expected: No excessive spacing between words (should read "Hello world test spacing")

## Test Case 4: Complex Example
```
{title: Test Song}
{artist: Test Artist}
{key: G}
{tempo: 120}
{capo: 2}

{start_of_verse}
[G]This is the [C]first verse
With encyclo[D]pedia example
[Am]Multiple [F]chords [G]here
{end_of_verse}

{start_of_chorus}
[C]This is the [G]chorus section
With [Am]proper chord [F]alignment
{end_of_chorus}
```

## Manual Testing Steps:
1. Navigate to http://localhost:5175/
2. Go to the ChordPro editor
3. Copy and paste each test case
4. Verify:
   - D appears above 'p' in encyclopedia
   - Title appears only once
   - No excessive spacing between words
   - Responsive layout works on different screen sizes