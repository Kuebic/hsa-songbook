# Slug
- Enhanced for Uniqueness: `/songs/twinkle-twinkle-little-star-jc-4k7p2` (where "jc" are artist initials like Joshua Cotter, and "4k7p2" is a short random ID).
- Full Example: For "See Through Children's Eyes" by Joshua Cotter: `/songs/see-through-childrens-eyes-jc-9x3f1`.
- For "Generation of Righteousness" by Dan Fefferman: `/songs/generation-of-righteousness-df-2q8r6`.
- Arrangement also get slugs, although since Arrangment names can change, their slug is <referenced-song-name>-<short-random-id>, so for example: `/arrangements/amazing-grace-2snkd`.
## How to Generate:
1. **Slugify the Title:** Convert song title to lowercase, replace spaces with hyphens, remove special characters (e.g., using libraries like slugify in Next.js). This ensures readability and SEO-friendliness.
2. **Add Descriptive Element:** Append artist initials (e.g., first letters of name) or a short genre/tag (e.g., "holy" for Traditional Holy Songs) to hint at content without bloating the URL.
3. **Append Short Unique ID:** Generate a collision-resistant string (e.g., via nanoid: 7 characters have over 78 trillion possibilities, far exceeding free-tier MongoDB limits). Store this in the song's database document alongside metadata.
4. **Database Integration:** In MongoDB, index on a "slug" field for quick lookups. When adding a song, check for slug conflicts and auto-append/increment the ID if needed. This fits within 512MB storage by keeping fields lean.
5. **Redirects for Cleanliness:** Implement Next.js rewrites or server-side logic to handle vanity URLs (e.g., redirect /songs/twinkle-star to the full unique version if ambiguous).