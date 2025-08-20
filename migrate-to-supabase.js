#!/usr/bin/env node

/**
 * MongoDB to Supabase Migration Script
 * 
 * This script migrates data from MongoDB/Express backend to Supabase PostgreSQL.
 * Run this after setting up your Supabase database schema.
 * 
 * Usage:
 *   1. Set environment variables (see below)
 *   2. Run: node migrate-to-supabase.js
 * 
 * Environment Variables Required:
 *   - MONGODB_URI: MongoDB connection string
 *   - SUPABASE_URL: Your Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (bypasses RLS)
 *   - CLERK_SECRET_KEY: Clerk secret key for user data migration
 */

import { MongoClient } from 'mongodb'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

// Validation
if (!MONGODB_URI || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('Required: MONGODB_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const mongoClient = new MongoClient(MONGODB_URI)

// Migration statistics
const stats = {
  users: { processed: 0, migrated: 0, errors: 0 },
  songs: { processed: 0, migrated: 0, errors: 0 },
  arrangements: { processed: 0, migrated: 0, errors: 0 },
  setlists: { processed: 0, migrated: 0, errors: 0 },
  reviews: { processed: 0, migrated: 0, errors: 0 }
}

/**
 * Generate a deterministic UUID from a string (for consistent migration)
 */
function generateUUID(input) {
  const hash = createHash('sha256').update(input).digest('hex')
  // Format as UUID v4
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // Version 4
    ((parseInt(hash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.substring(17, 20), // Variant 10
    hash.substring(20, 32)
  ].join('-')
}

/**
 * Generate slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Migrate users from Clerk/MongoDB to Supabase Auth
 */
async function migrateUsers(db) {
  console.log('🔄 Migrating users...')
  
  try {
    // For this migration, we'll create placeholder users for any user IDs referenced in the data
    // In a real migration, you'd typically export users from Clerk or have a users collection
    
    // Get all unique user IDs from songs, arrangements, setlists
    const userIds = new Set()
    
    const songs = await db.collection('songs').find({}).toArray()
    const arrangements = await db.collection('arrangements').find({}).toArray()
    const setlists = await db.collection('setlists').find({}).toArray()
    
    songs.forEach(song => {
      if (song.createdBy) userIds.add(song.createdBy)
      if (song.metadata?.createdBy) userIds.add(song.metadata.createdBy)
    })
    
    arrangements.forEach(arr => {
      if (arr.createdBy) userIds.add(arr.createdBy)
    })
    
    setlists.forEach(setlist => {
      if (setlist.createdBy) userIds.add(setlist.createdBy)
    })
    
    for (const userId of userIds) {
      stats.users.processed++
      
      try {
        // Convert MongoDB ObjectId to UUID
        const uuid = generateUUID(userId.toString())
        
        // Create placeholder user (in real migration, get from Clerk API)
        const { error } = await supabase
          .from('users')
          .upsert({
            id: uuid,
            email: `user-${userId}@migrated.local`,
            username: `user-${userId}`,
            full_name: `Migrated User ${userId}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (error) {
          console.error(`❌ Error migrating user ${userId}:`, error.message)
          stats.users.errors++
        } else {
          stats.users.migrated++
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error.message)
        stats.users.errors++
      }
    }
    
    console.log(`✅ Users migration complete: ${stats.users.migrated}/${stats.users.processed} migrated`)
  } catch (error) {
    console.error('❌ Fatal error in user migration:', error)
  }
}

/**
 * Migrate songs from MongoDB to Supabase
 */
async function migrateSongs(db) {
  console.log('🔄 Migrating songs...')
  
  try {
    const songs = await db.collection('songs').find({}).toArray()
    
    for (const song of songs) {
      stats.songs.processed++
      
      try {
        const uuid = generateUUID(song._id.toString())
        const createdByUUID = song.createdBy ? generateUUID(song.createdBy.toString()) : null
        
        const supabaseSong = {
          id: uuid,
          title: song.title || 'Untitled',
          artist: song.artist || null,
          slug: song.slug || generateSlug(song.title || 'untitled'),
          composition_year: song.compositionYear || null,
          ccli: song.ccli || null,
          themes: song.themes || [],
          source: song.source || null,
          notes: song.notes || null,
          created_by: createdByUUID,
          is_public: song.metadata?.isPublic || false,
          rating_average: song.metadata?.ratings?.average || 0,
          rating_count: song.metadata?.ratings?.count || 0,
          views: song.metadata?.views || 0,
          created_at: song.createdAt || new Date().toISOString(),
          updated_at: song.updatedAt || new Date().toISOString()
        }
        
        const { error } = await supabase
          .from('songs')
          .upsert(supabaseSong)
        
        if (error) {
          console.error(`❌ Error migrating song ${song.title}:`, error.message)
          stats.songs.errors++
        } else {
          stats.songs.migrated++
        }
      } catch (error) {
        console.error(`❌ Error processing song ${song.title}:`, error.message)
        stats.songs.errors++
      }
    }
    
    console.log(`✅ Songs migration complete: ${stats.songs.migrated}/${stats.songs.processed} migrated`)
  } catch (error) {
    console.error('❌ Fatal error in songs migration:', error)
  }
}

/**
 * Migrate arrangements from MongoDB to Supabase
 */
async function migrateArrangements(db) {
  console.log('🔄 Migrating arrangements...')
  
  try {
    const arrangements = await db.collection('arrangements').find({}).toArray()
    
    for (const arrangement of arrangements) {
      stats.arrangements.processed++
      
      try {
        const uuid = generateUUID(arrangement._id.toString())
        const songUUID = arrangement.songIds?.[0] ? generateUUID(arrangement.songIds[0].toString()) : generateUUID('default-song')
        const createdByUUID = arrangement.createdBy ? generateUUID(arrangement.createdBy.toString()) : null
        
        const supabaseArrangement = {
          id: uuid,
          name: arrangement.name || 'Untitled Arrangement',
          song_id: songUUID,
          slug: arrangement.slug || generateSlug(arrangement.name || 'untitled-arrangement'),
          chord_data: arrangement.chordData || arrangement.chordProText || '',
          key: arrangement.key || null,
          tempo: arrangement.tempo || null,
          time_signature: arrangement.timeSignature || '4/4',
          difficulty: arrangement.difficulty || null,
          description: arrangement.description || null,
          tags: arrangement.tags || [],
          created_by: createdByUUID,
          created_at: arrangement.createdAt || new Date().toISOString(),
          updated_at: arrangement.updatedAt || new Date().toISOString()
        }
        
        const { error } = await supabase
          .from('arrangements')
          .upsert(supabaseArrangement)
        
        if (error) {
          console.error(`❌ Error migrating arrangement ${arrangement.name}:`, error.message)
          stats.arrangements.errors++
        } else {
          stats.arrangements.migrated++
        }
      } catch (error) {
        console.error(`❌ Error processing arrangement ${arrangement.name}:`, error.message)
        stats.arrangements.errors++
      }
    }
    
    console.log(`✅ Arrangements migration complete: ${stats.arrangements.migrated}/${stats.arrangements.processed} migrated`)
  } catch (error) {
    console.error('❌ Fatal error in arrangements migration:', error)
  }
}

/**
 * Migrate setlists from MongoDB to Supabase
 */
async function migrateSetlists(db) {
  console.log('🔄 Migrating setlists...')
  
  try {
    const setlists = await db.collection('setlists').find({}).toArray()
    
    for (const setlist of setlists) {
      stats.setlists.processed++
      
      try {
        const uuid = generateUUID(setlist._id.toString())
        const createdByUUID = setlist.createdBy ? generateUUID(setlist.createdBy.toString()) : null
        
        // Create setlist
        const supabaseSetlist = {
          id: uuid,
          name: setlist.name || 'Untitled Setlist',
          description: setlist.description || null,
          created_by: createdByUUID,
          is_public: setlist.isPublic || false,
          share_id: setlist.shareId || null,
          created_at: setlist.createdAt || new Date().toISOString(),
          updated_at: setlist.updatedAt || new Date().toISOString()
        }
        
        const { error: setlistError } = await supabase
          .from('setlists')
          .upsert(supabaseSetlist)
        
        if (setlistError) {
          console.error(`❌ Error migrating setlist ${setlist.name}:`, setlistError.message)
          stats.setlists.errors++
          continue
        }
        
        // Create setlist items
        if (setlist.arrangements && setlist.arrangements.length > 0) {
          const setlistItems = setlist.arrangements.map((arr, index) => ({
            id: generateUUID(`${setlist._id}-${arr.arrangementId || arr.id}-${index}`),
            setlist_id: uuid,
            arrangement_id: generateUUID((arr.arrangementId || arr.id).toString()),
            position: arr.position !== undefined ? arr.position : index,
            notes: arr.notes || null,
            transpose_steps: arr.transposeSteps || 0
          }))
          
          const { error: itemsError } = await supabase
            .from('setlist_items')
            .upsert(setlistItems)
          
          if (itemsError) {
            console.error(`❌ Error migrating setlist items for ${setlist.name}:`, itemsError.message)
          }
        }
        
        stats.setlists.migrated++
      } catch (error) {
        console.error(`❌ Error processing setlist ${setlist.name}:`, error.message)
        stats.setlists.errors++
      }
    }
    
    console.log(`✅ Setlists migration complete: ${stats.setlists.migrated}/${stats.setlists.processed} migrated`)
  } catch (error) {
    console.error('❌ Fatal error in setlists migration:', error)
  }
}

/**
 * Migrate reviews from MongoDB to Supabase
 */
async function migrateReviews(db) {
  console.log('🔄 Migrating reviews...')
  
  try {
    const reviews = await db.collection('reviews').find({}).toArray()
    
    for (const review of reviews) {
      stats.reviews.processed++
      
      try {
        const uuid = generateUUID(review._id.toString())
        const songUUID = generateUUID(review.songId.toString())
        const userUUID = generateUUID(review.userId.toString())
        
        const supabaseReview = {
          id: uuid,
          song_id: songUUID,
          user_id: userUUID,
          rating: review.rating || 5,
          comment: review.comment || null,
          created_at: review.createdAt || new Date().toISOString(),
          updated_at: review.updatedAt || new Date().toISOString()
        }
        
        const { error } = await supabase
          .from('reviews')
          .upsert(supabaseReview)
        
        if (error) {
          console.error(`❌ Error migrating review:`, error.message)
          stats.reviews.errors++
        } else {
          stats.reviews.migrated++
        }
      } catch (error) {
        console.error(`❌ Error processing review:`, error.message)
        stats.reviews.errors++
      }
    }
    
    console.log(`✅ Reviews migration complete: ${stats.reviews.migrated}/${stats.reviews.processed} migrated`)
  } catch (error) {
    console.error('❌ Fatal error in reviews migration:', error)
  }
}

/**
 * Validate migration integrity
 */
async function validateMigration(db) {
  console.log('🔍 Validating migration...')
  
  try {
    // Count documents in MongoDB
    const mongoStats = {
      songs: await db.collection('songs').countDocuments(),
      arrangements: await db.collection('arrangements').countDocuments(),
      setlists: await db.collection('setlists').countDocuments(),
      reviews: await db.collection('reviews').countDocuments()
    }
    
    // Count records in Supabase
    const { data: songCount } = await supabase.from('songs').select('*', { count: 'exact', head: true })
    const { data: arrangementCount } = await supabase.from('arrangements').select('*', { count: 'exact', head: true })
    const { data: setlistCount } = await supabase.from('setlists').select('*', { count: 'exact', head: true })
    const { data: reviewCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true })
    
    const supabaseStats = {
      songs: songCount?.length || 0,
      arrangements: arrangementCount?.length || 0,
      setlists: setlistCount?.length || 0,
      reviews: reviewCount?.length || 0
    }
    
    console.log('\n📊 Migration Validation:')
    console.log('MongoDB → Supabase')
    console.log(`Songs: ${mongoStats.songs} → ${supabaseStats.songs}`)
    console.log(`Arrangements: ${mongoStats.arrangements} → ${supabaseStats.arrangements}`)
    console.log(`Setlists: ${mongoStats.setlists} → ${supabaseStats.setlists}`)
    console.log(`Reviews: ${mongoStats.reviews} → ${supabaseStats.reviews}`)
    
    const isValid = Object.keys(mongoStats).every(key => 
      supabaseStats[key] >= stats[key].migrated
    )
    
    if (isValid) {
      console.log('✅ Migration validation passed!')
    } else {
      console.log('⚠️  Migration validation found discrepancies')
    }
  } catch (error) {
    console.error('❌ Error validating migration:', error)
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting MongoDB to Supabase migration...')
  console.log(`📡 MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`)
  console.log(`🌐 Supabase: ${SUPABASE_URL}`)
  console.log('')
  
  try {
    // Connect to MongoDB
    await mongoClient.connect()
    const db = mongoClient.db()
    console.log('✅ Connected to MongoDB')
    
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count', { head: true })
    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`)
    }
    console.log('✅ Connected to Supabase')
    console.log('')
    
    // Run migrations in order (users first for foreign key relationships)
    await migrateUsers(db)
    await migrateSongs(db)
    await migrateArrangements(db)
    await migrateSetlists(db)
    await migrateReviews(db)
    
    // Validate migration
    await validateMigration(db)
    
    // Print summary
    console.log('\n🎉 Migration Summary:')
    Object.entries(stats).forEach(([table, stat]) => {
      const successRate = stat.processed > 0 ? ((stat.migrated / stat.processed) * 100).toFixed(1) : '0'
      console.log(`${table}: ${stat.migrated}/${stat.processed} migrated (${successRate}%)${stat.errors > 0 ? ` - ${stat.errors} errors` : ''}`)
    })
    
    const totalMigrated = Object.values(stats).reduce((sum, stat) => sum + stat.migrated, 0)
    const totalProcessed = Object.values(stats).reduce((sum, stat) => sum + stat.processed, 0)
    const totalErrors = Object.values(stats).reduce((sum, stat) => sum + stat.errors, 0)
    
    console.log(`\n📈 Total: ${totalMigrated}/${totalProcessed} records migrated`)
    if (totalErrors > 0) {
      console.log(`⚠️  ${totalErrors} errors occurred during migration`)
    }
    
    console.log('\n✅ Migration completed!')
    console.log('\n📝 Next steps:')
    console.log('1. Update your environment variables to use Supabase')
    console.log('2. Test the application with migrated data')
    console.log('3. Set up Supabase Auth providers (Google, GitHub)')
    console.log('4. Update DNS and deploy the new version')
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  } finally {
    await mongoClient.close()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run migration
runMigration().catch(console.error)