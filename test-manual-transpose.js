// Test manual chord transposition
import pkg from 'chordsheetjs';
const { ChordProParser, ChordProFormatter, Chord } = pkg;

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

// Manual transpose by 2 semitones
const transposeAmount = 2;
console.log(`Manually transposing by ${transposeAmount} semitones...`);

song.lines.forEach((line) => {
  if (line.items) {
    line.items.forEach((item) => {
      if (item.chords && typeof item.chords === 'string') {
        console.log(`  Original chord: ${item.chords}`);
        try {
          const chord = Chord.parse(item.chords);
          if (chord) {
            const transposedChord = chord.transpose(transposeAmount);
            item.chords = transposedChord.toString();
            console.log(`  -> Transposed to: ${item.chords}`);
          }
        } catch (e) {
          console.error(`  Failed to transpose: ${e.message}`);
        }
      }
    });
  }
});

// Format and show result
const formatter = new ChordProFormatter();
const transposed = formatter.format(song);
console.log('\nFinal transposed output:');
console.log(transposed);