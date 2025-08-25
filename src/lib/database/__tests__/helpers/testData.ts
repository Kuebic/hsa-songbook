import { faker } from '@faker-js/faker'
import type { Database } from '../../../database.types'
import { supabase } from '../../../supabase'

// Type aliases for better readability
type Song = Database['public']['Tables']['songs']['Insert']
type Arrangement = Database['public']['Tables']['arrangements']['Insert']
type User = Database['public']['Tables']['users']['Insert']
type Setlist = Database['public']['Tables']['setlists']['Insert']
type SetlistItem = Database['public']['Tables']['setlist_items']['Insert']
type Permission = Database['public']['Tables']['permissions']['Insert']
type CustomRole = Database['public']['Tables']['custom_roles']['Insert']
type UserRole = Database['public']['Tables']['user_roles']['Insert']
type UserPermission = Database['public']['Tables']['user_permissions']['Insert']
type Review = Database['public']['Tables']['reviews']['Insert']

// Test data configuration
interface TestDataConfig {
  songCount?: number
  arrangementCount?: number
  userCount?: number
  setlistCount?: number
  reviewCount?: number
  includeRoles?: boolean
  includePermissions?: boolean
  realistic?: boolean
}

// Seed control for reproducible tests
export function setSeed(seed: number) {
  faker.seed(seed)
}

// Generate realistic chord data
export function generateChordData(complexity: 'simple' | 'medium' | 'complex' = 'medium'): string {
  const chords = ['C', 'G', 'Am', 'F', 'D', 'Em', 'Bm', 'E', 'A']
  const sections = ['[Verse]', '[Chorus]', '[Bridge]', '[Outro]']
  
  let chordPro = '{title:' + faker.lorem.words(3) + '}\n'
  chordPro += '{artist:' + faker.person.fullName() + '}\n'
  chordPro += '{key:' + faker.helpers.arrayElement(chords) + '}\n\n'
  
  const sectionCount = complexity === 'simple' ? 2 : complexity === 'medium' ? 3 : 4
  for (let i = 0; i < sectionCount; i++) {
    chordPro += sections[i] + '\n'
    const lineCount = faker.number.int({ min: 2, max: 4 })
    for (let j = 0; j < lineCount; j++) {
      const chordsInLine = faker.helpers.arrayElements(chords, faker.number.int({ min: 2, max: 4 }))
      chordPro += chordsInLine.map(c => `[${c}]`).join(' ') + ' ' + faker.lorem.words(faker.number.int({ min: 3, max: 6 })) + '\n'
    }
    chordPro += '\n'
  }
  
  return chordPro
}

// Generate test users with different roles
export function generateUsers(count: number = 10): User[] {
  const users: User[] = []
  // const roles = ['user', 'moderator', 'admin'] // Unused for now
  
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const email = faker.internet.email({ firstName, lastName })
    
    users.push({
      id: faker.string.uuid(),
      email,
      name: `${firstName} ${lastName}`,
      created_at: faker.date.past({ years: 2 }).toISOString(),
      updated_at: faker.date.recent({ days: 30 }).toISOString(),
      last_login_at: faker.date.recent({ days: 7 }).toISOString(),
      avatar_url: faker.image.avatar(),
    })
  }
  
  return users
}

// Generate test songs
export function generateSongs(count: number = 50): Song[] {
  const songs: Song[] = []
  const themes = ['worship', 'praise', 'prayer', 'communion', 'thanksgiving', 'advent', 'easter', 'christmas']
  const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ko', 'zh']
  
  for (let i = 0; i < count; i++) {
    songs.push({
      id: faker.string.uuid(),
      title: faker.lorem.words({ min: 2, max: 5 }),
      artist: faker.person.fullName(),
      themes: faker.helpers.arrayElements(themes, faker.number.int({ min: 1, max: 3 })),
      copyright: faker.datatype.boolean(0.7) ? `© ${faker.date.past({ years: 5 }).getFullYear()} ${faker.company.name()}` : null,
      ccli_number: faker.datatype.boolean(0.5) ? faker.number.int({ min: 1000000, max: 9999999 }).toString() : null,
      language: faker.helpers.arrayElement(languages),
      created_at: faker.date.past({ years: 2 }).toISOString(),
      updated_at: faker.date.recent({ days: 30 }).toISOString(),
      created_by: faker.string.uuid(),
      is_public: faker.datatype.boolean(0.8),
      moderation_status: faker.helpers.arrayElement(['approved', 'pending', 'rejected', null]),
      slug: faker.helpers.slugify(faker.lorem.words({ min: 2, max: 4 })),
    })
  }
  
  return songs
}

// Generate test arrangements
export function generateArrangements(songs: Song[], count: number = 100): Arrangement[] {
  const arrangements: Arrangement[] = []
  const keys = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb', 'Ab']
  const difficulties = ['beginner', 'intermediate', 'advanced']
  const timeSignatures = ['4/4', '3/4', '6/8', '2/4']
  
  for (let i = 0; i < count; i++) {
    const song = faker.helpers.arrayElement(songs)
    const difficulty = faker.helpers.arrayElement(difficulties)
    
    arrangements.push({
      id: faker.string.uuid(),
      song_id: song.id!,
      name: faker.helpers.arrayElement([
        'Original Key',
        'Acoustic Version',
        'Simplified',
        'Full Band',
        'Piano Only',
        'Youth Version',
      ]),
      slug: faker.helpers.slugify(faker.lorem.words({ min: 2, max: 4 })),
      chord_data: generateChordData(difficulty === 'beginner' ? 'simple' : difficulty === 'advanced' ? 'complex' : 'medium'),
      key: faker.helpers.arrayElement(keys),
      tempo: faker.number.int({ min: 60, max: 180 }),
      time_signature: faker.helpers.arrayElement(timeSignatures),
      difficulty,
      description: faker.datatype.boolean(0.7) ? faker.lorem.paragraph() : null,
      tags: faker.helpers.arrayElements(['acoustic', 'electric', 'piano', 'full-band', 'simple', 'capo'], faker.number.int({ min: 0, max: 3 })),
      created_at: faker.date.past({ years: 2 }).toISOString(),
      updated_at: faker.date.recent({ days: 30 }).toISOString(),
      created_by: faker.string.uuid(),
      is_public: faker.datatype.boolean(0.8),
      moderation_status: faker.helpers.arrayElement(['approved', 'pending', 'rejected', null]),
      views: faker.number.int({ min: 0, max: 10000 }),
      rating_average: faker.datatype.boolean(0.6) ? faker.number.float({ min: 1, max: 5, fractionDigits: 1 }) : null,
      rating_count: faker.datatype.boolean(0.6) ? faker.number.int({ min: 0, max: 100 }) : null,
    })
  }
  
  return arrangements
}

// Generate test setlists
export function generateSetlists(users: User[], count: number = 20): Setlist[] {
  const setlists: Setlist[] = []
  const occasions = ['Sunday Service', 'Youth Night', 'Prayer Meeting', 'Christmas Service', 'Easter Service', 'Wedding', 'Funeral']
  
  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users)
    
    setlists.push({
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement(occasions) + ' - ' + faker.date.recent({ days: 60 }).toLocaleDateString(),
      description: faker.datatype.boolean(0.6) ? faker.lorem.paragraph() : null,
      date: faker.date.soon({ days: 30 }).toISOString().split('T')[0],
      created_at: faker.date.past({ years: 1 }).toISOString(),
      updated_at: faker.date.recent({ days: 7 }).toISOString(),
      created_by: user.id!,
      is_public: faker.datatype.boolean(0.5),
      tags: faker.helpers.arrayElements(['worship', 'contemporary', 'traditional', 'blended', 'special'], faker.number.int({ min: 1, max: 3 })),
    })
  }
  
  return setlists
}

// Generate setlist items
export function generateSetlistItems(setlists: Setlist[], arrangements: Arrangement[]): SetlistItem[] {
  const items: SetlistItem[] = []
  
  setlists.forEach(setlist => {
    const itemCount = faker.number.int({ min: 3, max: 12 })
    const setlistArrangements = faker.helpers.arrayElements(arrangements, itemCount)
    
    setlistArrangements.forEach((arrangement, index) => {
      items.push({
        id: faker.string.uuid(),
        setlist_id: setlist.id!,
        arrangement_id: arrangement.id!,
        position: index + 1,
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
        key_override: faker.datatype.boolean(0.2) ? faker.helpers.arrayElement(['C', 'G', 'D', 'A', 'E']) : null,
      })
    })
  })
  
  return items
}

// Generate reviews
export function generateReviews(users: User[], arrangements: Arrangement[], count: number = 100): Review[] {
  const reviews: Review[] = []
  
  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users)
    const arrangement = faker.helpers.arrayElement(arrangements)
    
    reviews.push({
      id: faker.string.uuid(),
      arrangement_id: arrangement.id!,
      user_id: user.id!,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.datatype.boolean(0.7) ? faker.lorem.paragraph() : null,
      created_at: faker.date.past({ years: 1 }).toISOString(),
      updated_at: faker.date.recent({ days: 30 }).toISOString(),
    })
  }
  
  return reviews
}

// Generate permissions
export function generatePermissions(): Permission[] {
  return [
    { id: faker.string.uuid(), name: 'songs.create', description: 'Create new songs' },
    { id: faker.string.uuid(), name: 'songs.edit', description: 'Edit existing songs' },
    { id: faker.string.uuid(), name: 'songs.delete', description: 'Delete songs' },
    { id: faker.string.uuid(), name: 'songs.moderate', description: 'Moderate song submissions' },
    { id: faker.string.uuid(), name: 'arrangements.create', description: 'Create new arrangements' },
    { id: faker.string.uuid(), name: 'arrangements.edit', description: 'Edit existing arrangements' },
    { id: faker.string.uuid(), name: 'arrangements.delete', description: 'Delete arrangements' },
    { id: faker.string.uuid(), name: 'arrangements.moderate', description: 'Moderate arrangement submissions' },
    { id: faker.string.uuid(), name: 'setlists.create', description: 'Create new setlists' },
    { id: faker.string.uuid(), name: 'setlists.edit', description: 'Edit existing setlists' },
    { id: faker.string.uuid(), name: 'setlists.delete', description: 'Delete setlists' },
    { id: faker.string.uuid(), name: 'users.manage', description: 'Manage user accounts' },
    { id: faker.string.uuid(), name: 'roles.manage', description: 'Manage user roles' },
  ]
}

// Generate custom roles
export function generateCustomRoles(permissions: Permission[]): CustomRole[] {
  const adminPerms = permissions.map(p => p.id!)
  const moderatorPerms = permissions.filter(p => p.name?.includes('moderate') || p.name?.includes('edit')).map(p => p.id!)
  const userPerms = permissions.filter(p => p.name?.includes('create')).map(p => p.id!)
  
  return [
    {
      id: faker.string.uuid(),
      name: 'admin',
      description: 'Full system administrator',
      permissions: adminPerms,
      is_active: true,
      created_at: faker.date.past({ years: 2 }).toISOString(),
    },
    {
      id: faker.string.uuid(),
      name: 'moderator',
      description: 'Content moderator',
      permissions: moderatorPerms,
      is_active: true,
      created_at: faker.date.past({ years: 2 }).toISOString(),
    },
    {
      id: faker.string.uuid(),
      name: 'user',
      description: 'Standard user',
      permissions: userPerms,
      is_active: true,
      created_at: faker.date.past({ years: 2 }).toISOString(),
    },
  ]
}

// Main seed function
export async function seedTestData(config: TestDataConfig = {}): Promise<{
  users: User[]
  songs: Song[]
  arrangements: Arrangement[]
  setlists: Setlist[]
  setlistItems: SetlistItem[]
  reviews: Review[]
  permissions?: Permission[]
  roles?: CustomRole[]
}> {
  const {
    songCount = 50,
    arrangementCount = 100,
    userCount = 10,
    setlistCount = 20,
    reviewCount = 100,
    includeRoles = false,
    includePermissions = false,
    realistic = true,
  } = config
  
  // Generate base data
  const users = generateUsers(userCount)
  const songs = generateSongs(songCount)
  const arrangements = generateArrangements(songs, arrangementCount)
  const setlists = generateSetlists(users, setlistCount)
  const setlistItems = generateSetlistItems(setlists, arrangements)
  const reviews = generateReviews(users, arrangements, reviewCount)
  
  // Generate permission data if needed
  let permissions: Permission[] | undefined
  let roles: CustomRole[] | undefined
  
  if (includePermissions) {
    permissions = generatePermissions()
  }
  
  if (includeRoles && permissions) {
    roles = generateCustomRoles(permissions)
  }
  
  // Insert into database if supabase client is available
  if (supabase && realistic) {
    try {
      // Insert users
      const { error: userError } = await supabase.from('users').insert(users)
      if (userError) console.error('Error inserting users:', userError)
      
      // Insert songs
      const { error: songError } = await supabase.from('songs').insert(songs)
      if (songError) console.error('Error inserting songs:', songError)
      
      // Insert arrangements
      const { error: arrangementError } = await supabase.from('arrangements').insert(arrangements)
      if (arrangementError) console.error('Error inserting arrangements:', arrangementError)
      
      // Insert setlists
      const { error: setlistError } = await supabase.from('setlists').insert(setlists)
      if (setlistError) console.error('Error inserting setlists:', setlistError)
      
      // Insert setlist items
      const { error: setlistItemError } = await supabase.from('setlist_items').insert(setlistItems)
      if (setlistItemError) console.error('Error inserting setlist items:', setlistItemError)
      
      // Insert reviews
      const { error: reviewError } = await supabase.from('reviews').insert(reviews)
      if (reviewError) console.error('Error inserting reviews:', reviewError)
      
      // Insert permissions if included
      if (permissions) {
        const { error: permError } = await supabase.from('permissions').insert(permissions)
        if (permError) console.error('Error inserting permissions:', permError)
      }
      
      // Insert roles if included
      if (roles) {
        const { error: roleError } = await supabase.from('custom_roles').insert(roles)
        if (roleError) console.error('Error inserting roles:', roleError)
      }
    } catch (err) {
      console.error('Error seeding test data:', err)
    }
  }
  
  return {
    users,
    songs,
    arrangements,
    setlists,
    setlistItems,
    reviews,
    permissions,
    roles,
  }
}

// Cleanup function
export async function cleanupTestData(tableNames?: string[]): Promise<void> {
  const tables = tableNames || [
    'reviews',
    'setlist_items',
    'setlists',
    'arrangements',
    'songs',
    'user_permissions',
    'user_roles',
    'custom_roles',
    'permissions',
    'users',
  ]
  
  if (supabase) {
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).delete().neq('id', '')
        if (error) {
          console.error(`Error cleaning ${table}:`, error)
        }
      } catch (err) {
        console.error(`Error cleaning ${table}:`, err)
      }
    }
  }
}

// Helper to create a test client with specific user context
export async function createTestClient(userId?: string, roles?: string[]) {
  // This would typically create a client with specific auth context
  // For testing, we can mock this or use a test instance
  return supabase
}

// Benchmark data generator for performance testing
export async function setupBenchmarkData(size: 'small' | 'medium' | 'large' = 'medium') {
  const configs = {
    small: { songCount: 100, arrangementCount: 200, userCount: 20 },
    medium: { songCount: 1000, arrangementCount: 2000, userCount: 100 },
    large: { songCount: 10000, arrangementCount: 20000, userCount: 1000 },
  }
  
  const config = configs[size]
  const data = await seedTestData(config)
  
  return {
    client: supabase,
    largeDataset: data,
    config,
  }
}