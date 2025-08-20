# Product Requirements Document (PRD)

## HSA-Songbook Web Application

---

## 1. Product Overview

### 1.1 Product Name
**HSA-Songbook** - A responsive web application for searching, viewing, and managing chord charts and setlists.

### 1.2 Problem Statement
Unification musicians and worship leaders need a streamlined way to search, view, and organize chord charts for songs, with the ability to create setlists for performances while maintaining a clean, responsive interface across all devices.

### 1.3 Solution Overview
A React + Vite web application that leverages ChordSheetJS libraries to parse and display chordpro-formatted songs, with search/filter capabilities, setlist creation functionality, and user contribution features. The app is built with Supabase (PostgreSQL) for backend services, providing real-time capabilities, authentication, and efficient data management within the free tier limits.

---

## 2. Target Users

| User Type | Description | Key Permissions |
|-----------|-------------|-----------------|
| **Public Users** | Anyone accessing the site | View songs, create/share setlists |
| **Contributing Users** | Registered community members | Add/edit own songs, manage personal setlists |
| **Administrators** | Content moderators | Approve submissions, manage all content |

---

## 3. Core Features

### 3.1 🎵 Song Management

#### Song Repository
- Pre-populated library of chordpro-formatted songs
- Community-contributed content with moderation

#### Song Display
- **Parsing**: ChordSheetJS libraries for chordpro format
- **Viewing**: Clean, responsive chord chart display
- **Formatting**: Proper chord positioning above lyrics

#### Song Metadata Structure

Songs are stored in two separate collections for optimal performance:

##### Songs Collection (Metadata Only)
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **title** | string | Song name | "Amazing Grace" |
| **artist** | string | Original artist/writer | "John Newton" |
| **slug** | string | URL-friendly identifier | "amazing-grace" |
| **compositionYear** | number | Year written/composed | 1772 |
| **ccli** | string | CCLI licensing number | "22025" |
| **themes** | string[] | Worship themes/categories | ["grace", "salvation", "traditional"] |
| **source** | string | Original source/hymnal | "Holy Songbook Vol. 1" |
| **notes** | string | General notes | "Traditional hymn, widely known" |
| **defaultArrangement** | ObjectId | Primary arrangement reference | Link to arrangement |
| **metadata** | object | System metadata | See below |

##### Metadata Object
- **createdBy**: User who added the song
- **lastModifiedBy**: Last editor
- **isPublic**: Public visibility flag
- **ratings**: Average rating and count
- **views**: View count for popularity

##### Arrangements Collection (Chord Data)
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **name** | string | Arrangement name | "Key of G", "Acoustic Version" |
| **songIds** | ObjectId[] | Linked songs (enables mashups) | References to songs |
| **key** | string | Musical key | "G", "C", "D" |
| **tempo** | number | Beats per minute | 120 |
| **timeSignature** | string | Time signature | "4/4", "3/4" |
| **difficulty** | enum | Skill level | "beginner", "intermediate", "advanced" |
| **tags** | string[] | Style tags | ["acoustic", "simple", "youth"] |
| **chordData** | Buffer | Compressed ChordPro content | ZSTD compressed |

### 3.2 🔍 Search and Filter

#### Search Capabilities
- **Full-text search**: Title, artist, lyrics
- **Keyword matching**: Tags and metadata
- **Smart suggestions**: Auto-complete functionality

#### Filter Options
- **Musical**: Key, tempo, difficulty
- **Category**: Genre, tags, arrangement
- **Meta**: Date added, popularity, user ratings

#### Results Display
- **Responsive grid**: Cards for mobile, table for desktop
- **Quick preview**: Hover/tap for song snippet
- **Sort options**: Relevance, alphabetical, date

### 3.3 📋 Setlist Creation

#### Core Functionality
| Feature | Description |
|---------|-------------|
| **Builder Interface** | Drag-and-drop song ordering |
| **Playback Mode** | Full-screen navigation through songs |
| **Management** | Save, edit, duplicate, delete setlists |
| **Sharing** | Public URLs for setlist access |
| **Persistence** | Cloud storage for registered users |

#### Setlist Features
- Custom setlist names and descriptions
- Notes per song (key changes, instructions)
- Estimated duration calculation
- Print-friendly format option
- Export to PDF/ChordPro

### 3.4 👤 User Authentication

#### Access Levels

```
Public (No Login Required)
├── View all songs
├── Search and filter
├── Create temporary setlists
└── Share setlist URLs

Registered Users
├── All public features
├── Save permanent setlists
├── Contribute new songs
├── Edit own contributions
└── Personal library management

Administrators
├── All user features
├── Content moderation queue
├── Edit any song/arrangement
├── User management
└── Analytics dashboard
```

### 3.5 🛡️ Admin Interface

#### Moderation Tools
- **Review Queue**: New submissions awaiting approval
- **Batch Actions**: Approve/reject multiple items
- **Edit Interface**: Direct editing of any content
- **Version History**: Track all content changes

#### Reporting System
- User-submitted reports for issues
- Dispute resolution workflow
- Content flagging categories
- Moderation log and audit trail

### 3.6 ✏️ ChordPro Editor

#### Editor Interface
| Feature | Description |
|---------|-------------|
| **Syntax Highlighting** | Color-coded ChordPro syntax for easy editing |
| **Live Preview** | Split-screen with real-time rendering |
| **Auto-formatting** | Automatic chord alignment and spacing |
| **Validation** | Real-time syntax error detection |
| **Auto-save** | Draft saving every 30 seconds |

#### ChordPro Features
- **Directives Support**: Full ChordPro directive support ({title}, {artist}, {key}, {tempo}, etc.)
- **Chord Recognition**: Auto-detection and validation of chord symbols
- **Section Markers**: {verse}, {chorus}, {bridge}, {intro}, {outro} tags
- **Comments**: Support for ChordPro comments (lines starting with #)
- **Chord-only Lines**: Proper handling of instrumental sections
- **Repeat Notation**: {soc}, {eoc} for chorus repeats
- **Tab Support**: {sot}, {eot} for tablature sections

#### Music-Based Transpose (NOT Math-Based)
- **Circle of Fifths**: Transpose using musical relationships, not simple math
- **Key Signature Awareness**: Maintains proper sharp/flat notation per key
- **Chord Quality Preservation**: Major stays major, minor stays minor
- **Enharmonic Intelligence**: Chooses between C# and Db based on musical context
- **Capo Suggestions**: Recommends capo positions for easier playing
- **Nashville Number System**: Optional display/edit in number notation

##### Transpose Examples
```
Original Key: G
Chords: G - C - D - Em

Transpose UP 2 semitones (to A):
Result: A - D - E - F#m
(NOT: A - D - E - Gbm)

Transpose DOWN 3 semitones (to E):
Result: E - A - B - C#m
(Maintains sharp key signature)
```

#### Editing Tools
| Tool | Function |
|------|----------|
| **Chord Builder** | Visual chord selector with diagrams |
| **Find & Replace** | Search/replace with regex support |
| **Bulk Operations** | Change all chords of a type |
| **Version Control** | Track changes with diff view |
| **Import/Export** | Support for .cho, .crd, .pro formats |
| **Template Library** | Common song structures |

#### Smart Features
- **Chord Suggestions**: AI-powered next chord predictions
- **Rhythm Pattern Detection**: Identifies strumming patterns from notation
- **Key Detection**: Analyzes chords to suggest song key
- **Structure Recognition**: Auto-detects verse/chorus patterns
- **Lyric Alignment**: Automatic chord positioning above syllables
- **Mobile Optimization**: Touch-friendly chord insertion

#### Collaboration Features
- **Change Tracking**: See who edited what and when
- **Comments**: Inline commenting on specific lines
- **Suggestion Mode**: Propose changes without direct editing
- **Locking**: Prevent simultaneous edits to same section
- **Revision History**: Complete version history with rollback

#### Export Options
- **PDF Export**: Formatted sheet music with customizable layout
- **Plain Text**: Clean text without ChordPro markup
- **Word Document**: Formatted for printing/sharing
- **OnSong Format**: For mobile app compatibility
- **MIDI Export**: Basic chord progression as MIDI

### 3.7 📱 Offline Capability (Future Enhancement)

- **Smart Caching**: Frequently accessed songs stored locally
- **PWA Support**: Progressive Web App for offline functionality
- **Offline Setlists**: Download setlists for offline use
- **Sync Management**: Automatic sync when reconnected
- **Storage Limits**: User-configurable cache size
- **Offline Editor**: Edit songs without connection, sync when online

---

## 4. Technical Requirements

### 4.1 🏗️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + TypeScript | UI framework |
| **Build Tool** | Vite | Fast development and building |
| **UI Components** | ShadCN UI | Consistent design system |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Database** | Supabase (PostgreSQL) | Relational database with real-time |
| **Authentication** | Supabase Auth | User management with OAuth |
| **Testing** | Vitest + RTL | Unit and integration tests |
| **Chord Processing** | ChordSheetJS | ChordPro parsing |

### 4.2 💾 Database Design

#### Supabase Database Optimization (Free Tier)

```sql
Table Structure:
├── songs (metadata only)
│   └── Indexed: slug, title, artist, themes (GIN)
├── arrangements (chord data)
│   └── Indexed: song_id, slug, created_by
├── users (synced with auth.users)
│   └── Indexed: email, username
├── setlists
│   └── Indexed: created_by, is_public
├── setlist_items (junction table)
│   └── Indexed: setlist_id, position
└── reviews
    └── Indexed: arrangement_id, user_id
```

#### Storage Strategies
- Application-level compression for chord data if needed
- Separate metadata from content tables
- PostgreSQL GIN indexes for full-text search
- Row-level security (RLS) for data access control
- Real-time subscriptions via Supabase

### 4.3 ⚡ Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Initial Load** | < 3s | 3G connection |
| **Search Response** | < 500ms | Full-text search |
| **Route Changes** | < 100ms | Client-side navigation |
| **Time to Interactive** | < 2s | Mobile devices |
| **Bundle Size** | < 200KB | Initial JavaScript |

---

## 5. User Experience Requirements

### 5.1 📱 Responsive Design

#### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

#### Features by Device

| Device | Optimizations |
|--------|--------------|
| **Mobile** | Single column, touch gestures, simplified navigation |
| **Tablet** | Two-column layout, hover states, enhanced controls |
| **Desktop** | Multi-pane view, keyboard shortcuts, advanced filters |

### 5.2 ♿ Accessibility

#### WCAG 2.1 AA Compliance
- ✅ Semantic HTML structure
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast ratios
- ✅ Focus indicators
- ✅ Error messages

### 5.3 🔄 User Flows

#### Public User Journey
```
Landing → Browse Songs → Search/Filter → View Song → Create Setlist → Share
```

#### Registered User Journey
```
Login → Dashboard → Add Song → Edit Arrangements → Manage Setlists → Share
```

#### Admin Journey
```
Login → Moderation Queue → Review Content → Approve/Edit → Handle Reports
```

---

## 6. Security Requirements

### 6.1 🔐 Authentication & Authorization

- **OAuth 2.0**: Via Supabase Auth (Google, GitHub)
- **Role-Based Access**: Public, User, Admin levels via RLS
- **Session Management**: JWT tokens managed by Supabase
- **Password Policy**: Enforced by Supabase Auth
- **Anonymous Auth**: Guest access (future enhancement)

### 6.2 🛡️ Data Protection

- **Encryption**: HTTPS for all communications
- **Input Validation**: Zod schemas for all forms
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Token validation

### 6.3 📝 Content Governance

- **Attribution**: Clear ownership tracking
- **Versioning**: History of all edits
- **Reporting**: User flagging system
- **Moderation**: Admin review workflow

---

## 7. Future Extensibility

### 7.1 🔌 Architecture Principles

#### Modular Design
- Feature-based folder structure
- Reusable component library
- Service layer abstraction
- Plugin-ready architecture

#### API-First Approach
- RESTful endpoints
- GraphQL consideration
- WebSocket for real-time features
- Third-party integrations

### 7.2 🚀 Planned Enhancements

#### Phase 2 Features
- [ ] Audio recording attachments
- [ ] YouTube video embedding
- [ ] Real-time collaboration
- [ ] Advanced transpose tools
- [ ] Chord diagram generator

#### Phase 3 Features
- [ ] Mobile native apps
- [ ] MIDI integration
- [ ] AI-powered chord suggestions
- [ ] Social features (following, likes)
- [ ] Marketplace for arrangements

#### Export Options
- [ ] PDF generation with formatting
- [ ] ChordPro file export
- [ ] MIDI file creation
- [ ] PowerPoint/ProPresenter integration

---

## 8. Non-Functional Requirements

### 8.1 🔧 Operational Excellence

| Aspect | Requirement |
|--------|------------|
| **Availability** | 99.9% uptime target |
| **Backup** | Daily automated backups |
| **Monitoring** | Error tracking, performance metrics |
| **Documentation** | Comprehensive API and user docs |

### 8.2 📊 Compliance & Legal

- **Privacy**: GDPR/CCPA compliant
- **Copyright**: DMCA process for disputes
- **Terms of Service**: Clear usage guidelines
- **Content Policy**: Acceptable use policy

### 8.3 🎯 Quality Attributes

#### Maintainability
- Clean code principles
- Comprehensive testing (80% coverage)
- CI/CD pipeline
- Code review process

#### Scalability
- Horizontal scaling ready
- CDN for static assets
- Database sharding capability
- Microservices consideration

---

## 9. Success Metrics

### 9.1 📈 Key Performance Indicators

| Metric | Target | Measurement Period |
|--------|--------|-------------------|
| **User Adoption** | 1000 active users | 6 months |
| **Song Library** | 500+ songs | 3 months |
| **Setlists Created** | 100/month | Monthly |
| **User Retention** | 60% monthly active | Monthly |
| **Page Load Speed** | < 3 seconds | Continuous |

### 9.2 🎯 Quality Metrics

- **Bug Rate**: < 5 per release
- **Test Coverage**: > 80%
- **User Satisfaction**: > 4.0/5.0
- **Support Tickets**: < 10/week

---

## 10. Timeline & Milestones

### Phase 1: MVP (Months 1-3)
- ✅ Basic song display
- ✅ Search functionality
- ✅ Setlist creation
- ✅ Public sharing

### Phase 2: Enhanced Features (Months 4-6)
- [ ] User accounts
- [ ] Song contributions
- [ ] Admin interface
- [ ] Offline capability

### Phase 3: Advanced Features (Months 7-12)
- [ ] Mobile apps
- [ ] Real-time collaboration
- [ ] Advanced exports
- [ ] Social features

---

## Appendix

### A. Technical Specifications
- Detailed API documentation
- Database schema diagrams
- Component architecture

### B. Design Guidelines
- UI/UX mockups
- Brand guidelines
- Accessibility checklist

### C. Testing Strategy
- Test plan template
- QA procedures
- Performance benchmarks

---

*Last Updated: January 2025*  
*Version: 1.0*  
*Status: In Development*