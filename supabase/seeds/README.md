# HSA Songbook Seed Files

This directory contains modular seed files that complement the main `seed.sql` file with additional test data for comprehensive testing scenarios.

## Files Overview

### `01_users.sql`
**Test user accounts with different roles and scenarios**
- 11 additional users with diverse backgrounds (musicians, songwriters, translators, etc.)
- International users (Spanish, Korean, Chinese speakers)
- Different experience levels (beginners to experts)
- Role assignments and audit trail
- Metadata for user testing scenarios

### `02_songs.sql` 
**Additional song samples beyond the base seed.sql**
- 18 additional songs across multiple genres and languages
- Spanish worship songs (Marcos Witt, traditional)
- Contemporary worship hits (Bethel, Hillsong, etc.)
- Traditional hymns and seasonal songs
- Korean translations and multilingual content
- Realistic ratings and review data

### `03_arrangements.sql`
**Arrangement variations for comprehensive testing**
- 10 new arrangements with different difficulties and keys
- Multiple arrangements per song (original key, guitar-friendly, beginner versions)
- Advanced jazz chord arrangements for experienced musicians
- Simplified 3-chord versions for beginners
- Acoustic fingerpicking and full-band arrangements
- International language arrangements

### `04_setlists.sql`
**Additional setlist examples for various contexts**
- 15 new setlists covering diverse worship scenarios
- Contemporary services, acoustic gatherings, multilingual services
- Age-specific services (kids, seniors, college)
- Special occasions (baptism, memorial, seasonal)
- Ministry-specific contexts (men's retreat, women's conference)
- Small group and campus ministry setlists

### `05_permissions.sql`
**User permission and role configurations**
- Content moderation scenarios (reports, resolutions)
- Moderation log entries and audit trails
- Temporary and expired role assignments
- Permission-based testing scenarios
- Various content approval states
- Role violation and restoration examples

## Usage

These files are designed to be:

1. **Self-contained**: Each file can run independently
2. **Transaction-safe**: Uses BEGIN/COMMIT blocks
3. **Conflict-safe**: Uses `ON CONFLICT DO NOTHING` to prevent duplicates
4. **Realistic**: Contains diverse, realistic test data

## Running the Seeds

To run all seed files:

```bash
# Run main seed first (if not already done)
supabase db reset

# Or run individual seed files
psql -h localhost -p 54322 -d postgres -U postgres -f 01_users.sql
psql -h localhost -p 54322 -d postgres -U postgres -f 02_songs.sql
psql -h localhost -p 54322 -d postgres -U postgres -f 03_arrangements.sql
psql -h localhost -p 54322 -d postgres -U postgres -f 04_setlists.sql
psql -h localhost -p 54322 -d postgres -U postgres -f 05_permissions.sql
```

## Verification

Each file includes verification queries (commented out) that can be uncommented to verify the data was loaded correctly. These queries help ensure:

- Proper data relationships
- Realistic distributions
- Functional test scenarios
- Permission boundaries

## Test Scenarios Covered

- **Multi-language support**: English, Spanish, Korean content
- **Various difficulty levels**: Beginner to advanced arrangements  
- **Different user roles**: Admin, moderator, regular users
- **Content moderation**: Reports, approvals, rejections
- **Worship contexts**: Traditional, contemporary, international
- **Age demographics**: Children, youth, adults, seniors
- **Permission scenarios**: Public/private content, role expiration
- **Seasonal content**: Christmas, Easter, special occasions

## Data Relationships

The seed files maintain referential integrity with the base `seed.sql`:

- New users create content and participate in moderation
- New songs have multiple arrangement variations
- New arrangements are used in diverse setlists
- Permission scenarios test role-based access control
- All foreign key relationships are properly maintained

This comprehensive seed data enables thorough testing of the HSA Songbook application across all major features and user scenarios.