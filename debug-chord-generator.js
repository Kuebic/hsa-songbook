// Test the actual generateInitialChordPro function with the same logic

function splitArrangementName(name, songTitle) {
  if (!songTitle) return { songTitle: '', arrangementSuffix: name || '' }
  
  const separator = ' - '
  if (name && name.includes(separator)) {
    const parts = name.split(separator)
    const potentialSuffix = parts.slice(1).join(separator)
    return {
      songTitle: parts[0],
      arrangementSuffix: potentialSuffix
    }
  }
  
  return {
    songTitle: songTitle || '',
    arrangementSuffix: name || 'Standard'
  }
}

function getNashvilleChords(key) {
  const isMinor = key.endsWith('m')
  const baseKey = key.replace('m', '')
  
  const chromaticKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  const keyMap = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
  }
  
  const normalizedKey = keyMap[baseKey] || baseKey
  const keyIndex = chromaticKeys.indexOf(normalizedKey)
  
  if (keyIndex === -1) {
    return { I: key, IV: 'IV', V: 'V', vi: 'vi' }
  }
  
  const getChordAtInterval = (interval) => {
    const chordIndex = (keyIndex + interval) % 12
    return chromaticKeys[chordIndex]
  }
  
  if (isMinor) {
    return {
      I: key,
      IV: getChordAtInterval(5),
      V: getChordAtInterval(7), 
      vi: getChordAtInterval(9)
    }
  } else {
    return {
      I: baseKey,
      IV: getChordAtInterval(5),
      V: getChordAtInterval(7),
      vi: getChordAtInterval(9) + 'm'
    }
  }
}

function generateInitialChordPro(formData, songTitle) {
  console.log('🎵 generateInitialChordPro called with:', {
    formData,
    songTitle,
    key: formData.key
  })
  
  const { arrangementSuffix } = splitArrangementName(formData.name || '', songTitle)

  const lines = []

  // Title directive
  if (songTitle) {
    lines.push(`{title: ${songTitle}}`)
  }

  // Subtitle directive (arrangement name)
  if (arrangementSuffix) {
    lines.push(`{subtitle: ${arrangementSuffix}}`)
  }

  // Key directive
  if (formData.key) {
    lines.push(`{key: ${formData.key}}`)
  }

  // Tempo directive
  if (formData.tempo) {
    lines.push(`{tempo: ${formData.tempo}}`)
  }

  // Time signature directive
  if (formData.timeSignature) {
    lines.push(`{time: ${formData.timeSignature}}`)
  }

  // Add empty line after directives
  if (lines.length > 0) {
    lines.push('')
  }

  // Add basic template structure using Nashville numbers
  lines.push(
    '[Intro]',
    '| [I] | [I] |',
    '',
    '[Verse 1]',
    '[I]Add your lyrics here with [V]chords above each syllable',
    '[vi]Each line shows the chord [IV]changes throughout',
    '',
    '[Chorus]',
    '[I]This is where the [V]chorus lyrics go',
    '[vi]With the main [IV]melody and [I]hook',
    '',
    '[Verse 2]',
    '[I]Second verse continues the [V]story here',
    '[vi]Building on the first [IV]verse theme',
    '',
    '[Bridge]',
    '[vi]This section provides [IV]contrast',
    '[I]Leading back to the [V]final chorus',
    '',
    '[Outro]',
    '| [vi] | [IV] | [I] |'
  )

  // Convert Nashville numbers to actual chords based on key
  let content = lines.join('\n')
  console.log('🎵 Before conversion:', { key: formData.key, hasKey: !!formData.key })
  console.log('🎵 Template content:', content.substring(0, 200) + '...')
  
  if (formData.key) {
    const chords = getNashvilleChords(formData.key)
    console.log('🎵 Generated chords:', chords)
    
    content = content
      .replace(/\[I\]/g, `[${chords.I}]`)
      .replace(/\[IV\]/g, `[${chords.IV}]`)
      .replace(/\[V\]/g, `[${chords.V}]`)
      .replace(/\[vi\]/g, `[${chords.vi}]`)
      
    console.log('🎵 After conversion:', content.substring(0, 200) + '...')
  } else {
    console.log('🎵 No key provided - Nashville numbers will not be converted')
  }

  return content
}

// Test scenarios
console.log('=== Test 1: With key ===')
const result1 = generateInitialChordPro({
  name: 'Amazing Grace - Standard',
  key: 'G',
  tempo: 120,
  timeSignature: '4/4'
}, 'Amazing Grace')

console.log('\nGenerated ChordPro:')
console.log(result1)

console.log('\n=== Test 2: Without key ===')
const result2 = generateInitialChordPro({
  name: 'Amazing Grace - Standard',
  // key: missing
  tempo: 120,
  timeSignature: '4/4'
}, 'Amazing Grace')

console.log('\nGenerated ChordPro:')
console.log(result2)

console.log('\n=== Test 3: With different key ===')
const result3 = generateInitialChordPro({
  name: 'Amazing Grace - Standard',
  key: 'D',
  tempo: 120,
  timeSignature: '4/4'
}, 'Amazing Grace')

console.log('\nGenerated ChordPro:')
console.log(result3)