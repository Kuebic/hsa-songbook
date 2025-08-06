# Song Categories & Tagging System

## Comprehensive Guide to Organizing and Tagging Songs for Unification Church Use

Based on the HSA-Songbook Product Requirements Document (PRD), this guide provides a structured approach to categorizing and tagging songs for efficient searchability, filtering, and setlist creation within MongoDB's free-tier limits.

## 📋 Core Categorization Framework

### Primary Categories by Origin

#### 1. **Traditional Holy Songs**
- **Description**: Core sacred repertoire, often ancient or foundational to Unification teachings
- **Primary Tag**: `Traditional-Holy`
- **Sub-tags**: 
  - `Psalm-Based`
  - `Revelation-Inspired`
  - Scripture references

#### 2. **New Holy Songs**
- **Description**: Modern additions to the holy canon
- **Primary Tag**: `New-Holy`
- **Sub-tags**:
  - Creation date (e.g., `Post-2000`)
  - Author attribution
  - Regional origin

#### 3. **American Pioneer Songs**
- **Description**: Songs from early American Unification movement
- **Primary Tag**: `American-Pioneer`
- **Examples**:
  - "See Through Children's Eyes" by Joshua Cotter
  - "Generation of Righteousness" by Dan Fefferman
- **Sub-tags**:
  - Artist-specific (e.g., `Joshua-Cotter`)
  - Era markers (e.g., `1970s-1980s`)

#### 4. **Adapted Secular Songs**
- **Description**: Secular originals modified with spiritual themes
- **Primary Tag**: `Adapted-Secular`
- **Sub-tags**:
  - Original source (e.g., `From-Pop`, `From-Folk`)
  - Adaptation type (e.g., `Church-Theme-Adaptation`)

#### 5. **General Secular Songs**
- **Description**: Unmodified secular pieces used in services
- **Primary Tag**: `Secular-General`
- **Sub-tags**:
  - Genre (`Pop`, `Rock`, `Folk`)
  - Usage context restrictions

#### 6. **Contemporary Christian**
- **Description**: Modern worship songs from broader Christian traditions
- **Primary Tag**: `Contemporary-Christian`
- **Sub-tags**:
  - `Praise-Worship`
  - `CCM` (Contemporary Christian Music)
  - Source church/movement (e.g., `Hillsong`)

#### 7. **Classic Hymns**
- **Description**: Traditional Christian hymns
- **Primary Tag**: `Classic-Hymn`
- **Sub-tags**:
  - Century of origin
  - Denominational source

#### 8. **Original Interchurch Songs**
- **Description**: User-contributed or inter-church originals
- **Primary Tag**: `Original-Interchurch`
- **Sub-tags**:
  - Source branch (e.g., `US-Unification`, `Korean-Branch`)
  - Creator attribution (e.g., `Community-Submitted`)

## 🏷️ Multi-Layered Tagging System

### Theme/Function Tags

| Tag | Description | Usage Context |
|-----|-------------|---------------|
| `Declarative` | Proclaims God's truth, sovereignty | Opening hymns, doctrinal songs |
| `Confessional` | Personal faith expression, repentance | Prayer songs, testimonies |
| `Prophetic` | Future hope, inspiration | Vision songs, prophecy |
| `Celebratory` | Joyful praise, thanksgiving | Festival songs, victories |
| `Freestyle` | Improvisational, modern expressive | Youth services, contemporary |
| `Eucharistic` | Communion-focused | Holy Wine ceremony |
| `Liturgical` | Formal worship structure | Sunday service |
| `Seasonal` | Holiday/season specific | `Advent`, `Easter`, `God's Day` |

### Genre/Style Tags

| Tag | Description | Typical Instrumentation |
|-----|-------------|------------------------|
| `Traditional` | Hymns, chants | Organ, piano |
| `Contemporary` | Modern worship style | Guitars, drums, keyboards |
| `Gospel` | Soulful, choir-based | Full choir, piano |
| `Praise-Worship` | Repetitive choruses | Band ensemble |
| `Folk` | Acoustic, storytelling | Acoustic guitar, simple |
| `Rock` | Electric, energetic | Electric guitars, drums |
| `Chant` | Meditative, repetitive | A cappella or minimal |

### Metadata Attributes (Per PRD)

#### Musical Attributes
- **Key**: `C-Major`, `G-Major`, `D-Minor`, etc.
- **Tempo**: `60-BPM` (slow), `120-BPM` (moderate), `140-BPM` (fast)
- **Time Signature**: `4/4`, `3/4`, `6/8`
- **Difficulty**: `Beginner`, `Intermediate`, `Advanced`

#### Arrangement Types
- `Choir` - Full SATB arrangement
- `Guitar-Led` - Chord-based with guitar
- `Piano-Solo` - Piano accompaniment
- `A-Cappella` - Voices only
- `Orchestra` - Full orchestration
- `Band` - Contemporary band setup

### Usage/Context Tags

#### Service Components
- `Opening-Hymn`
- `Closing-Song`
- `Offering-Song`
- `Communion-Song`
- `Prayer-Song`
- `Meditation`

#### Event-Specific
- `Wedding`
- `Blessing-Ceremony`
- `Youth-Group`
- `Sunday-School`
- `Holy-Day`
- `Memorial`

#### Cultural/Regional
- `American-Unification`
- `Korean-Traditional`
- `Japanese-Style`
- `International`
- `Multicultural`

## 💾 Implementation in HSA-Songbook

### Database Structure

```javascript
{
  // Core Fields
  title: "Song Title",
  artist: "Original Artist/Composer",
  
  // Category (Single Primary)
  category: "Traditional-Holy",
  
  // Tags (Multiple, 5-10 recommended)
  tags: [
    "Declarative",
    "Traditional",
    "Choir",
    "Opening-Hymn",
    "Korean-Traditional"
  ],
  
  // Musical Metadata
  key: "G-Major",
  tempo: 100,
  timeSignature: "4/4",
  difficulty: "Intermediate",
  
  // Source Information
  source: "Holy-Songbook-Vol-1",
  yearComposed: 1975,
  
  // Additional Metadata
  themes: ["Family", "Unity", "Divine-Principle"]
}
```

### Search & Filter Examples

#### Common Filter Combinations
1. **Traditional Sunday Service**: `Traditional-Holy` + `Liturgical` + `Opening-Hymn`
2. **Youth Service**: `Contemporary-Christian` + `Celebratory` + `Youth-Group`
3. **Wedding Ceremony**: `Wedding` + `Celebratory` + `Choir`
4. **Meditation/Prayer**: `Confessional` + `Prayer-Song` + `Slow-Tempo`

### Setlist Organization Flow

```
Opening → Declaration → Confession → Teaching → Response → Celebration → Closing
```

Example progression:
1. Traditional-Holy + Opening-Hymn
2. Declarative + Choir
3. Confessional + Contemporary
4. Prophetic + Teaching-Song
5. Celebratory + Praise-Worship
6. Traditional-Holy + Closing-Song

## ✅ Best Practices

### 1. **Standardization**
- Maintain a tag glossary to prevent duplicates
- Use consistent naming conventions (e.g., `1st-Gen-American`)
- Regular tag audits and cleanup

### 2. **Efficiency**
- Limit tags to 5-10 per song for optimal performance
- Index frequently searched tags in MongoDB
- Compress metadata to stay within 512MB limit

### 3. **Extensibility**
- Allow user-submitted tags (with moderation)
- Regular review of emerging categories
- Version control for tag schema updates

### 4. **Accessibility**
- Ensure all tags are keyboard-searchable
- Provide tag autocomplete in UI
- Support WCAG AA standards

### 5. **Quality Control**
- Admin review for new tags
- Community voting on tag relevance
- Regular cleanup of unused tags

## 📊 Tag Usage Guidelines

### Minimum Required Tags (3)
1. Primary category (origin-based)
2. Theme/function tag
3. Genre/style tag

### Recommended Additional Tags (2-7)
- Musical attributes (key, tempo)
- Arrangement type
- Usage context
- Cultural/regional identifier
- Seasonal/event specific

### Maximum Tags
- Hard limit: 10 tags per song
- Recommended: 5-7 tags for optimal searchability

---

*Last Updated: January 2025*
*Based on HSA-Songbook PRD and established church music practices*