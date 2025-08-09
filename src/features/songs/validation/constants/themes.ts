/**
 * Normalized themes in their canonical form
 */
export const NORMALIZED_THEMES = [
  'Adoration',
  'Baptism',
  'Children',
  'Christmas',
  'Comfort',
  'Communion',
  'Contemporary',
  'Easter',
  'Faith',
  'Grace',
  'Guidance',
  'Healing',
  'Holy Spirit',
  'Hope',
  'Joy',
  'Love',
  'Missions',
  'Patriotic',
  'Peace',
  'Praise',
  'Prayer',
  'Salvation',
  'Thanksgiving',
  'Traditional',
  'Trinity',
  'Worship'
] as const

/**
 * Theme mapping for normalization
 * Maps variations to their canonical form
 */
export const THEME_MAPPINGS: Record<string, string> = {
  // Christmas variations
  'christmas': 'Christmas',
  'xmas': 'Christmas',
  'x-mas': 'Christmas',
  'nativity': 'Christmas',
  'advent': 'Christmas',
  
  // Easter variations
  'easter': 'Easter',
  'resurrection': 'Easter',
  'passover': 'Easter',
  'holy week': 'Easter',
  
  // Worship variations
  'worship': 'Worship',
  'worshipping': 'Worship',
  'worshiping': 'Worship',
  'adoration': 'Adoration',
  'exaltation': 'Worship',
  
  // Praise variations
  'praise': 'Praise',
  'praising': 'Praise',
  'praised': 'Praise',
  'glorify': 'Praise',
  'glorification': 'Praise',
  
  // Prayer variations
  'prayer': 'Prayer',
  'supplication': 'Prayer',
  'intercession': 'Prayer',
  'petition': 'Prayer',
  'praying': 'Prayer',
  
  // Thanksgiving variations
  'thanksgiving': 'Thanksgiving',
  'gratitude': 'Thanksgiving',
  'thankfulness': 'Thanksgiving',
  'grateful': 'Thanksgiving',
  'thanks': 'Thanksgiving',
  
  // Salvation variations
  'salvation': 'Salvation',
  'redemption': 'Salvation',
  'saved': 'Salvation',
  'born again': 'Salvation',
  'conversion': 'Salvation',
  
  // Grace variations
  'grace': 'Grace',
  'mercy': 'Grace',
  'forgiveness': 'Grace',
  'pardon': 'Grace',
  
  // Faith variations
  'faith': 'Faith',
  'belief': 'Faith',
  'trust': 'Faith',
  'confidence': 'Faith',
  'believing': 'Faith',
  
  // Hope variations
  'hope': 'Hope',
  'expectation': 'Hope',
  'anticipation': 'Hope',
  'hopeful': 'Hope',
  
  // Love variations
  'love': 'Love',
  'charity': 'Love',
  'agape': 'Love',
  'compassion': 'Love',
  'loving': 'Love',
  
  // Peace variations
  'peace': 'Peace',
  'shalom': 'Peace',
  'tranquility': 'Peace',
  'calm': 'Peace',
  'peaceful': 'Peace',
  
  // Joy variations
  'joy': 'Joy',
  'happiness': 'Joy',
  'gladness': 'Joy',
  'rejoicing': 'Joy',
  'joyful': 'Joy',
  
  // Healing variations
  'healing': 'Healing',
  'restoration': 'Healing',
  'wholeness': 'Healing',
  'recovery': 'Healing',
  'healed': 'Healing',
  
  // Comfort variations
  'comfort': 'Comfort',
  'consolation': 'Comfort',
  'encouragement': 'Comfort',
  'comforting': 'Comfort',
  
  // Guidance variations
  'guidance': 'Guidance',
  'direction': 'Guidance',
  'leading': 'Guidance',
  'wisdom': 'Guidance',
  'guide': 'Guidance',
  
  // Holy Spirit variations
  'holy spirit': 'Holy Spirit',
  'holy-spirit': 'Holy Spirit',
  'spirit': 'Holy Spirit',
  'comforter': 'Holy Spirit',
  'advocate': 'Holy Spirit',
  'paraclete': 'Holy Spirit',
  
  // Trinity variations
  'trinity': 'Trinity',
  'triune': 'Trinity',
  'godhead': 'Trinity',
  'three in one': 'Trinity',
  
  // Baptism variations
  'baptism': 'Baptism',
  'immersion': 'Baptism',
  'christening': 'Baptism',
  'baptized': 'Baptism',
  
  // Communion variations
  'communion': 'Communion',
  'eucharist': 'Communion',
  'lord\'s supper': 'Communion',
  'lords supper': 'Communion',
  'breaking bread': 'Communion',
  
  // Missions variations
  'missions': 'Missions',
  'evangelism': 'Missions',
  'outreach': 'Missions',
  'witness': 'Missions',
  'missionary': 'Missions',
  
  // Children variations
  'children': 'Children',
  'kids': 'Children',
  'youth': 'Children',
  'young': 'Children',
  'child': 'Children',
  
  // Traditional variations
  'traditional': 'Traditional',
  'hymn': 'Traditional',
  'hymns': 'Traditional',
  'classic': 'Traditional',
  'heritage': 'Traditional',
  
  // Contemporary variations
  'contemporary': 'Contemporary',
  'modern': 'Contemporary',
  'current': 'Contemporary',
  'new': 'Contemporary',
  
  // Patriotic variations
  'patriotic': 'Patriotic',
  'national': 'Patriotic',
  'country': 'Patriotic',
  'america': 'Patriotic',
  'usa': 'Patriotic'
}

export type NormalizedTheme = typeof NORMALIZED_THEMES[number]

// Get all possible theme variations (for autocomplete)
export const ALL_THEME_VARIANTS: string[] = [
  ...NORMALIZED_THEMES,
  ...Object.keys(THEME_MAPPINGS)
]