// Direct test of ChordSheetJS transpose
import pkg from 'chordsheetjs';
const { ChordProParser, ChordProFormatter } = pkg;

const chordPro = `{title: Test Song}
{key: C}

[Verse]
[G]This is a [D/G]test [G]song in [D/G]C major`;

console.log('Original ChordPro:');
console.log(chordPro);
console.log('\n---\n');

// Parse
const parser = new ChordProParser();
const song = parser.parse(chordPro);

// Get chords before
console.log('Before transpose:');
const linesBefore = song.lines.filter(line => line.items?.length > 0);
linesBefore.forEach(line => {
  const chords = line.items.filter(item => item.chords).map(item => item.chords);
  if (chords.length > 0) {
    console.log('Chords:', chords);
  }
});

// Transpose
console.log('\nCalling song.transpose(2)...');
song.transpose(2);

// Get chords after
console.log('\nAfter transpose:');
const linesAfter = song.lines.filter(line => line.items?.length > 0);
linesAfter.forEach(line => {
  const chords = line.items.filter(item => item.chords).map(item => item.chords);
  if (chords.length > 0) {
    console.log('Chords:', chords);
  }
});

// Try formatting back to see if it worked
const formatter = new ChordProFormatter();
const transposed = formatter.format(song);
console.log('\nFormatted output:');
console.log(transposed);