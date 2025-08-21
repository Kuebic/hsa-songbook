-- Migration: Add multilingual lyrics support
-- Date: 2024-01-21
-- Description: Adds support for storing lyrics in multiple languages (English, Japanese, Korean) including Romaji versions

-- Add new columns to songs table for multilingual support
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS lyrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS original_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS lyrics_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lyrics_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS auto_conversion_enabled BOOLEAN DEFAULT false;

-- Migrate existing notes field to lyrics JSONB structure
-- Only migrate if notes exist and lyrics is empty
UPDATE songs 
SET lyrics = jsonb_build_object('en', notes) 
WHERE notes IS NOT NULL 
  AND notes != '' 
  AND lyrics = '{}';

-- Add comments to new columns for documentation
COMMENT ON COLUMN songs.lyrics IS 'JSONB object storing lyrics in multiple languages: {"en": "...", "ja": "...", "ja-romaji": "...", "ko": "...", "ko-romaji": "..."}';
COMMENT ON COLUMN songs.original_language IS 'Primary language of the song (native script only: en, ja, ko)';
COMMENT ON COLUMN songs.lyrics_verified IS 'Whether the lyrics have been verified for accuracy';
COMMENT ON COLUMN songs.lyrics_source IS 'Source of the lyrics (user, import, opensong)';
COMMENT ON COLUMN songs.auto_conversion_enabled IS 'Flag for future auto-conversion from native scripts to Romaji';

-- Create GIN indexes for JSONB query performance
CREATE INDEX IF NOT EXISTS idx_songs_lyrics ON songs USING GIN (lyrics);

-- Create specific indexes for common language queries (including Romaji variants)
CREATE INDEX IF NOT EXISTS idx_songs_lyrics_languages ON songs USING GIN (
  (lyrics -> 'en'), 
  (lyrics -> 'ja'), 
  (lyrics -> 'ja-romaji'), 
  (lyrics -> 'ko'), 
  (lyrics -> 'ko-romaji')
);

-- Create index for original language filtering
CREATE INDEX IF NOT EXISTS idx_songs_original_language ON songs (original_language);

-- Create index for lyrics verification status
CREATE INDEX IF NOT EXISTS idx_songs_lyrics_verified ON songs (lyrics_verified);

-- Add constraint to ensure original_language is always native script (not Romaji variants)
ALTER TABLE songs ADD CONSTRAINT check_original_language_native 
CHECK (original_language IN ('en', 'ja', 'ko') OR original_language IS NULL);

-- Add constraint to ensure lyrics_source is valid
ALTER TABLE songs ADD CONSTRAINT check_lyrics_source_valid 
CHECK (lyrics_source IN ('user', 'import', 'opensong') OR lyrics_source IS NULL);

-- Create function to extract available languages from lyrics JSONB
CREATE OR REPLACE FUNCTION get_song_languages(lyrics_data JSONB)
RETURNS TEXT[] AS $$
BEGIN
  IF lyrics_data IS NULL OR lyrics_data = '{}' THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  RETURN ARRAY(SELECT jsonb_object_keys(lyrics_data));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to check if song has lyrics in specific language
CREATE OR REPLACE FUNCTION song_has_language(lyrics_data JSONB, lang_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF lyrics_data IS NULL OR lyrics_data = '{}' THEN
    RETURN FALSE;
  END IF;
  
  RETURN lyrics_data ? lang_code AND 
         lyrics_data ->> lang_code IS NOT NULL AND 
         lyrics_data ->> lang_code != '';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get lyrics count by language for analytics
CREATE OR REPLACE FUNCTION get_lyrics_stats()
RETURNS TABLE(
  language_code TEXT,
  song_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lang.lang_code,
    COUNT(*)::BIGINT as song_count
  FROM songs s,
       LATERAL (SELECT jsonb_object_keys(s.lyrics) as lang_code) lang
  WHERE s.lyrics != '{}' 
    AND s.lyrics ->> lang.lang_code IS NOT NULL 
    AND s.lyrics ->> lang.lang_code != ''
  GROUP BY lang.lang_code
  ORDER BY song_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for songs with multilingual support information
CREATE OR REPLACE VIEW songs_multilingual AS
SELECT 
  s.*,
  get_song_languages(s.lyrics) as available_languages,
  CASE 
    WHEN array_length(get_song_languages(s.lyrics), 1) > 1 THEN true
    ELSE false
  END as is_multilingual,
  song_has_language(s.lyrics, 'en') as has_english,
  song_has_language(s.lyrics, 'ja') as has_japanese,
  song_has_language(s.lyrics, 'ja-romaji') as has_japanese_romaji,
  song_has_language(s.lyrics, 'ko') as has_korean,
  song_has_language(s.lyrics, 'ko-romaji') as has_korean_romaji
FROM songs s;

-- Add helpful comment explaining the JSONB structure
COMMENT ON INDEX idx_songs_lyrics IS 'GIN index for efficient JSONB queries on multilingual lyrics';
COMMENT ON FUNCTION get_song_languages(JSONB) IS 'Extract array of available language codes from lyrics JSONB';
COMMENT ON FUNCTION song_has_language(JSONB, TEXT) IS 'Check if song has non-empty lyrics in specified language';
COMMENT ON FUNCTION get_lyrics_stats() IS 'Get statistics on song count by language for analytics';
COMMENT ON VIEW songs_multilingual IS 'View with computed multilingual flags and language availability for each song';