// Test the correct way to transpose in ChordSheetJS
import pkg from 'chordsheetjs';
const { ChordProParser, ChordProFormatter } = pkg;

const chordPro = `{title: Test Song}
{key: C}

[Verse]
[G]This is a [D/G]test [Am]song in [C]C major`;

console.log('Original ChordPro:');
console.log(chordPro);
console.log('\n---\n');

// Parse
const parser = new ChordProParser();
const song = parser.parse(chordPro);

// Method 1: Try song.transpose() if it exists
console.log('Testing song.transpose() method:');
if (typeof song.transpose === 'function') {
  console.log('song.transpose exists, calling with 2...');
  song.transpose(2);
} else {
  console.log('song.transpose does NOT exist');
}

// Method 2: Use mapItems to transpose
console.log('\nTesting mapItems method:');
song.mapItems((item) => {
  if (item && typeof item.transpose === 'function') {
    console.log('Found item with transpose method:', item.constructor.name);
    return item.transpose(2);
  }
  return item;
});

// Format and show result
const formatter = new ChordProFormatter();
const transposed = formatter.format(song);
console.log('\nTransposed output:');
console.log(transposed);