# Multilingual Lyrics Guide

## Overview

The HSA Songbook supports storing and managing song lyrics in multiple languages, enabling worship leaders to create arrangements for diverse, international congregations. This guide explains how the multilingual system works and how to use it effectively.

## Supported Languages

The system currently supports:
- **English** (`en`)
- **Japanese** (`ja`) - Native script (Hiragana/Katakana/Kanji)
- **Japanese Romaji** (`ja-romaji`) - Romanized for pronunciation
- **Korean** (`ko`) - Native script (Hangul)
- **Korean Romaji** (`ko-romaji`) - Romanized for pronunciation

## Database Structure

### Column Purposes

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `lyrics` | JSONB | Stores all language versions of a song | `{"en": "Amazing grace...", "ko": "놀라운 은혜...", "ko-romaji": "Nollaun eunhye..."}` |
| `original_language` | VARCHAR | The language the song was originally written in | `"ko"` for Korean hymn |
| `lyrics_verified` | BOOLEAN | Whether lyrics have been checked for accuracy | `true` after review |
| `lyrics_source` | VARCHAR | Where the lyrics came from | `"user"`, `"import"`, `"opensong"` |
| `auto_conversion_enabled` | BOOLEAN | Future feature flag for automatic Romaji conversion | Currently unused |

### Important Notes

- `original_language` only stores native scripts (`en`, `ja`, `ko`), never Romaji variants
- The `lyrics` JSONB can store any combination of languages - not all need to be present
- Each language version should contain the complete lyrics for that language

## Common Worship Scenarios

### Scenario 1: Translating Songs for Your Congregation

**Situation**: You have a Korean worship song that you want to use in an English service.

**Database Setup**:
```json
{
  "title": "I Am a Worshipper",
  "original_language": "ko",
  "lyrics": {
    "ko": "나는 예배자입니다\n주님을 사랑합니다...",
    "ko-romaji": "Naneun yebaeja imnida\nJunim-eul saranghamnida...",
    "en": "I am a worshipper\nI love the Lord..."
  }
}
```

**Workflow**:
1. Search for the song in the songbook
2. Click "Create Arrangement"
3. Select "English" when prompted for language
4. ChordPro editor opens with English lyrics pre-filled
5. Add chords: `I am a [G]worshipper`
6. Save and use in service

### Scenario 2: Bilingual Services

**Situation**: Your congregation sings verses in English but wants the chorus in Korean with Romaji for non-Korean speakers.

**Workflow**:
1. Create arrangement with English as base language
2. In ChordPro editor, manually replace chorus section:

```chordpro
[Verse 1]
I am a [G]worshipper, seeking Your [C]face
Living to [Am]honor You, in every [D]way

[Chorus - Korean]
Naneun [G]yebaeja imnida
Ju-reul [C]saranghamnida
```

3. Add a note for musicians: `{comment: Chorus in Korean - see Romaji for pronunciation}`

### Scenario 3: Teaching Songs in New Languages

**Situation**: Teaching "Amazing Grace" to a Korean congregation who wants to learn it in English.

**Database Setup**:
```json
{
  "title": "Amazing Grace",
  "original_language": "en",
  "lyrics": {
    "en": "Amazing grace, how sweet the sound\nThat saved a wretch like me",
    "ko": "놀라운 은혜 나 같은 죄인 살리신",
    "ko-romaji": "Nollaun eunhye na gateun joein sallisin"
  }
}
```

**Usage Options**:
- **For Korean speakers**: Display Korean lyrics with English underneath
- **For English speakers visiting**: Use Korean-Romaji to sing along
- **For learning**: Show all three versions side-by-side

### Scenario 4: International Gatherings

**Situation**: International conference where each verse is sung in a different language.

**Workflow**:
1. Store all language versions in the database
2. Create a special arrangement:

```chordpro
[Verse 1 - English]
Amazing [G]grace, how [C]sweet the [G]sound

[Verse 2 - Korean]
Nollaun [G]eunhye na [C]gateun joein [G]sallisin

[Verse 3 - Japanese]
Odoroku [G]bakari no [C]megumi [G]nari
```

## Best Practices

### 1. Storing Lyrics

- **Complete Translations**: Store complete song lyrics for each language, not word-by-word translations
- **Preserve Structure**: Keep verse/chorus structure consistent across languages when possible
- **Original First**: Always identify and store the original language version

### 2. Romaji Guidelines

- **Consistency**: Use consistent romanization systems (Revised Romanization for Korean, Hepburn for Japanese)
- **Readability**: Space words naturally for singing, not strict grammatical spacing
- **Purpose**: Romaji is for pronunciation help, not linguistic accuracy

### 3. Creating Arrangements

- **Start Simple**: Begin with single-language arrangements before mixing
- **Document Changes**: Use ChordPro comments to note language switches
- **Consider Your Audience**: Choose languages based on who will be singing

### 4. Quality Control

- **Verify Translations**: Have native speakers check translations for theological accuracy
- **Test Singability**: Ensure translations match the melody's rhythm
- **Mark Verified**: Use the `lyrics_verified` flag after review

## Workflow Examples

### Adding a New Multilingual Song

1. **Add Song**: Enter basic song information (title, artist)
2. **Add Original Lyrics**: Input lyrics in the original language
3. **Add Translations**: Add other language versions as available
4. **Verify**: Have native speakers check each translation
5. **Mark Source**: Note where lyrics came from (`user`, `import`, etc.)

### Creating an Arrangement

1. **Select Song**: Choose from song library
2. **Choose Language**: System prompts which language to use
3. **Auto-Population**: Selected language lyrics fill the editor
4. **Customize**: Modify as needed (mix languages, add repeats, etc.)
5. **Add Chords**: Insert chord notations
6. **Save**: Arrangement is ready for use

### Finding Multilingual Songs

Future search features will allow:
- Filter by available languages
- Search across all language versions
- Find songs with verified translations
- Identify songs needing translation

## Technical Details

### JSONB Structure

```typescript
interface MultilingualLyrics {
  "en"?: string;        // English lyrics
  "ja"?: string;        // Japanese native script
  "ja-romaji"?: string; // Japanese romanized
  "ko"?: string;        // Korean native script  
  "ko-romaji"?: string; // Korean romanized
}
```

### Database Queries

```sql
-- Find songs with Korean lyrics
SELECT * FROM songs 
WHERE lyrics ? 'ko';

-- Get all available languages for a song
SELECT jsonb_object_keys(lyrics) as languages 
FROM songs 
WHERE id = 'song-id';

-- Find songs with both English and Korean
SELECT * FROM songs 
WHERE lyrics ? 'en' AND lyrics ? 'ko';
```

### Future Enhancements

- **Auto-Conversion**: Automatic native script to Romaji conversion
- **Translation API**: Integration with translation services for suggestions
- **Side-by-Side View**: Display multiple languages simultaneously
- **Pronunciation Guide**: Audio clips for proper pronunciation
- **Regional Variants**: Support for regional differences (UK/US English, etc.)

## FAQ

**Q: Can I mix languages within a single verse?**
A: Yes, once in the ChordPro editor, you can manually edit to mix languages as needed.

**Q: How do I handle songs with no direct translation?**
A: Store paraphrased versions that maintain the meaning and fit the melody.

**Q: What if I only have lyrics in one language?**
A: That's fine! Only populate the languages you have. The system doesn't require all languages.

**Q: Can I add languages beyond the supported ones?**
A: The JSONB structure is flexible. Additional languages can be added in future updates.

**Q: How do I indicate pronunciation for non-Romaji text?**
A: Use ChordPro comments or create a separate Romaji version for pronunciation guidance.

## Support and Contributions

For questions about multilingual features or to contribute translations:
- Check existing songs for translation examples
- Ask native speakers in the community for help
- Use the `lyrics_verified` flag to indicate quality-checked translations
- Report issues with translations through the feedback system

---

*This guide is part of the HSA Songbook documentation. For technical implementation details, see the [Multilingual Feature PRP](../PRPs/multilingual-lyrics-feature.md).*