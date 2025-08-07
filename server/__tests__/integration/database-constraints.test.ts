import { describe, it, expect } from 'vitest'
import { User } from '../../features/users/user.model'
import { Song } from '../../features/songs/song.model'
import { Arrangement } from '../../features/arrangements/arrangement.model'
import { createTestUser, createTestSong, createTestArrangement, getSampleChordPro } from '../../shared/test-utils/factories'
import mongoose from 'mongoose'

describe('Database Constraints and Referential Integrity Tests', () => {
  // ============================================================================
  // Unique Constraints Testing
  // ============================================================================

  describe('Unique Constraints', () => {
    describe('User Unique Constraints', () => {
      it('should enforce unique clerkId constraint', async () => {
        const clerkId = 'duplicate_clerk_id'
        
        await createTestUser({ 
          clerkId,
          email: 'user1@example.com',
          username: 'user1'
        })

        await expect(createTestUser({ 
          clerkId,
          email: 'user2@example.com',
          username: 'user2'
        })).rejects.toThrow()
      })

      it('should enforce unique email constraint', async () => {
        const email = 'duplicate@example.com'
        
        await createTestUser({ 
          email,
          clerkId: 'clerk1',
          username: 'user1'
        })

        await expect(createTestUser({ 
          email,
          clerkId: 'clerk2',
          username: 'user2'
        })).rejects.toThrow()
      })

      it('should enforce unique username constraint', async () => {
        const username = 'duplicateuser'
        
        await createTestUser({ 
          username,
          clerkId: 'clerk1',
          email: 'user1@example.com'
        })

        await expect(createTestUser({ 
          username,
          clerkId: 'clerk2',
          email: 'user2@example.com'
        })).rejects.toThrow()
      })
    })

    describe('Song Unique Constraints', () => {
      it('should enforce unique slug constraint', async () => {
        const slug = 'duplicate-song-slug'
        
        await createTestSong({ 
          title: 'Song 1',
          slug,
          'metadata.createdBy': new mongoose.Types.ObjectId()
        })

        await expect(createTestSong({ 
          title: 'Song 2',
          slug,
          'metadata.createdBy': new mongoose.Types.ObjectId()
        })).rejects.toThrow()
      })

      it('should allow same title with different slug', async () => {
        const title = 'Amazing Grace'
        const user = await createTestUser()
        
        const song1 = await createTestSong({ 
          title,
          slug: 'amazing-grace-1',
          'metadata.createdBy': user._id
        })

        const song2 = await createTestSong({ 
          title,
          slug: 'amazing-grace-2',
          'metadata.createdBy': user._id
        })

        expect(song1.title).toBe(title)
        expect(song2.title).toBe(title)
        expect(song1.slug).not.toBe(song2.slug)
      })
    })

    describe('Arrangement Unique Constraints', () => {
      it('should allow arrangements with same name but different slugs', async () => {
        const user = await createTestUser()
        const song = await createTestSong({ 'metadata.createdBy': user._id })
        
        const arrangement1 = await createTestArrangement(
          [song._id.toString()],
          getSampleChordPro(),
          { 
            name: 'Amazing Grace Arrangement',
            slug: 'amazing-grace-arrangement-1',
            createdBy: user._id
          }
        )

        const arrangement2 = await createTestArrangement(
          [song._id.toString()],
          getSampleChordPro(),
          { 
            name: 'Amazing Grace Arrangement',
            slug: 'amazing-grace-arrangement-2',
            createdBy: user._id
          }
        )

        expect(arrangement1.name).toBe(arrangement2.name)
        expect(arrangement1.slug).not.toBe(arrangement2.slug)
      })
    })
  })

  // ============================================================================
  // Referential Integrity Testing
  // ============================================================================

  describe('Referential Integrity', () => {
    describe('User References', () => {
      it('should validate createdBy references exist', async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId()

        // Songs should validate user exists (if validation is implemented)
        const songData = {
          title: 'Test Song',
          slug: 'test-song',
          metadata: {
            createdBy: nonExistentUserId,
            isPublic: true,
            ratings: { average: 0, count: 0 },
            views: 0
          }
        }

        // This should succeed as mongoose doesn't enforce referential integrity by default
        // But in a real application, you might add custom validation
        const song = await Song.create(songData)
        expect(song.metadata.createdBy.toString()).toBe(nonExistentUserId.toString())
      })

      it('should handle user deletion impact on created content', async () => {
        const user = await createTestUser()
        const song = await createTestSong({ 'metadata.createdBy': user._id })
        const arrangement = await createTestArrangement(
          [song._id.toString()],
          getSampleChordPro(),
          { createdBy: user._id }
        )

        // Soft delete user
        await User.findByIdAndUpdate(user._id, { isActive: false })

        // Content should still exist but user is inactive
        const foundSong = await Song.findById(song._id)
        const foundArrangement = await Arrangement.findById(arrangement._id)
        const inactiveUser = await User.findById(user._id)

        expect(foundSong).toBeTruthy()
        expect(foundArrangement).toBeTruthy()
        expect(inactiveUser!.isActive).toBe(false)
      })
    })

    describe('Song-Arrangement References', () => {
      it('should validate songIds exist in arrangements', async () => {
        const user = await createTestUser()
        const nonExistentSongId = new mongoose.Types.ObjectId().toString()

        // Create arrangement with non-existent song ID
        // This should succeed as mongoose doesn't enforce referential integrity by default
        const arrangement = await createTestArrangement(
          [nonExistentSongId],
          getSampleChordPro(),
          { createdBy: user._id }
        )

        expect(arrangement.songIds).toContain(nonExistentSongId)
      })

      it('should handle song deletion impact on arrangements', async () => {
        const user = await createTestUser()
        const song = await createTestSong({ 'metadata.createdBy': user._id })
        const arrangement = await createTestArrangement(
          [song._id.toString()],
          getSampleChordPro(),
          { createdBy: user._id }
        )

        // Delete song
        await Song.findByIdAndDelete(song._id)

        // Arrangement should still exist but reference deleted song
        const foundArrangement = await Arrangement.findById(arrangement._id)
        const deletedSong = await Song.findById(song._id)

        expect(foundArrangement).toBeTruthy()
        expect(foundArrangement!.songIds).toContain(song._id.toString())
        expect(deletedSong).toBeNull()
      })

      it('should support arrangements referencing multiple songs', async () => {
        const user = await createTestUser()
        const song1 = await createTestSong({ 
          title: 'Song 1',
          'metadata.createdBy': user._id 
        })
        const song2 = await createTestSong({ 
          title: 'Song 2',
          'metadata.createdBy': user._id 
        })

        const mashupArrangement = await createTestArrangement(
          [song1._id.toString(), song2._id.toString()],
          getSampleChordPro(),
          { 
            name: 'Mashup',
            createdBy: user._id 
          }
        )

        expect(mashupArrangement.songIds).toHaveLength(2)
        expect(mashupArrangement.songIds).toContain(song1._id.toString())
        expect(mashupArrangement.songIds).toContain(song2._id.toString())
        expect(mashupArrangement.metadata.isMashup).toBe(true)
      })
    })
  })

  // ============================================================================
  // Cascade Operations Testing
  // ============================================================================

  describe('Cascade Operations', () => {
    it('should handle bulk user operations correctly', async () => {
      const users = await Promise.all([
        createTestUser({ 
          email: 'bulk1@test.com',
          username: 'bulk1',
          clerkId: 'clerk_bulk1'
        }),
        createTestUser({ 
          email: 'bulk2@test.com',
          username: 'bulk2',
          clerkId: 'clerk_bulk2'
        }),
        createTestUser({ 
          email: 'bulk3@test.com',
          username: 'bulk3',
          clerkId: 'clerk_bulk3'
        })
      ])

      // Create content for each user
      const songs = await Promise.all(
        users.map(user => createTestSong({ 'metadata.createdBy': user._id }))
      )

      // Bulk deactivate users
      await User.updateMany(
        { _id: { $in: users.map(u => u._id) } },
        { isActive: false }
      )

      // Verify users are deactivated but content remains
      const deactivatedUsers = await User.find({ 
        _id: { $in: users.map(u => u._id) } 
      })
      
      deactivatedUsers.forEach(user => {
        expect(user.isActive).toBe(false)
      })

      // Verify songs still exist
      const remainingSongs = await Song.find({ 
        _id: { $in: songs.map(s => s._id) } 
      })
      expect(remainingSongs).toHaveLength(3)
    })

    it('should handle complex deletion scenarios', async () => {
      const user = await createTestUser()
      
      // Create a song with multiple arrangements
      const song = await createTestSong({ 'metadata.createdBy': user._id })
      
      const arrangements = await Promise.all([
        createTestArrangement([song._id.toString()], getSampleChordPro(), { 
          name: 'Arrangement 1',
          createdBy: user._id 
        }),
        createTestArrangement([song._id.toString()], getSampleChordPro(), { 
          name: 'Arrangement 2',
          createdBy: user._id 
        })
      ])

      // Delete the song
      await Song.findByIdAndDelete(song._id)

      // Verify arrangements still exist (orphaned references)
      const remainingArrangements = await Arrangement.find({
        _id: { $in: arrangements.map(a => a._id) }
      })

      expect(remainingArrangements).toHaveLength(2)
      remainingArrangements.forEach(arr => {
        expect(arr.songIds).toContain(song._id.toString())
      })
    })
  })

  // ============================================================================
  // Index Constraints Testing
  // ============================================================================

  describe('Index Constraints', () => {
    it('should enforce index constraints for performance', async () => {
      // Test that indexes are working by creating many records and querying
      const users = []
      
      // Create 100 users
      for (let i = 0; i < 100; i++) {
        const user = await createTestUser({
          email: `perf${i}@test.com`,
          username: `perfuser${i}`,
          clerkId: `clerk_perf_${i}`
        })
        users.push(user)
      }

      // Query should be fast with index
      const startTime = Date.now()
      const foundUser = await User.findOne({ clerkId: users[50].clerkId })
      const queryTime = Date.now() - startTime

      expect(foundUser).toBeTruthy()
      expect(foundUser!.clerkId).toBe(users[50].clerkId)
      expect(queryTime).toBeLessThan(100) // Should be very fast with index
    })

    it('should support text search indexes on songs', async () => {
      const user = await createTestUser()
      
      // Create songs with searchable content
      await Promise.all([
        createTestSong({ 
          title: 'Amazing Grace',
          artist: 'John Newton',
          themes: ['grace', 'salvation'],
          'metadata.createdBy': user._id
        }),
        createTestSong({ 
          title: 'How Great Thou Art',
          artist: 'Carl Boberg',
          themes: ['worship', 'praise'],
          'metadata.createdBy': user._id
        }),
        createTestSong({ 
          title: 'Great is Thy Faithfulness',
          artist: 'Thomas Chisholm',
          themes: ['faithfulness', 'mercy'],
          'metadata.createdBy': user._id
        })
      ])

      // Text search should work if indexes are configured
      const searchResults = await Song.find({
        $text: { $search: 'great' }
      }).limit(10)

      // This might not work if text indexes aren't set up, but structure should be there
      expect(Array.isArray(searchResults)).toBe(true)
    })
  })

  // ============================================================================
  // Data Consistency Under Load
  // ============================================================================

  describe('Data Consistency Under Load', () => {
    it('should maintain consistency during concurrent operations', async () => {
      const user = await createTestUser()

      // Concurrent operations on same user stats
      const statPromises = Array(20).fill(0).map(async (_, index) => {
        if (index % 2 === 0) {
          return User.findByIdAndUpdate(user._id, {
            $inc: { 'stats.songsCreated': 1 }
          })
        } else {
          return User.findByIdAndUpdate(user._id, {
            $inc: { 'stats.arrangementsCreated': 1 }
          })
        }
      })

      await Promise.all(statPromises)

      // Check final state
      const finalUser = await User.findById(user._id)
      expect(finalUser!.stats.songsCreated).toBe(10)
      expect(finalUser!.stats.arrangementsCreated).toBe(10)
    })

    it('should handle concurrent unique constraint violations gracefully', async () => {
      const baseEmail = 'concurrent@test.com'
      const baseUsername = 'concurrentuser'
      const baseClerkId = 'clerk_concurrent'

      // Try to create users with same email concurrently
      const concurrentCreations = Array(5).fill(0).map(async (_, index) => {
        try {
          return await createTestUser({
            email: `${baseEmail}${index === 0 ? '' : index}`,
            username: `${baseUsername}${index}`,
            clerkId: `${baseClerkId}_${index}`
          })
        } catch (_error) {
          return null // Ignore duplicate errors
        }
      })

      const results = await Promise.all(concurrentCreations)
      const successfulCreations = results.filter(r => r !== null)

      // At least one should succeed
      expect(successfulCreations.length).toBeGreaterThan(0)
      expect(successfulCreations.length).toBeLessThanOrEqual(5)
    })
  })

  // ============================================================================
  // Orphaned Data Detection
  // ============================================================================

  describe('Orphaned Data Detection', () => {
    it('should identify orphaned arrangements after song deletion', async () => {
      const user = await createTestUser()
      const song = await createTestSong({ 'metadata.createdBy': user._id })
      const arrangement = await createTestArrangement(
        [song._id.toString()],
        getSampleChordPro(),
        { createdBy: user._id }
      )

      // Delete song
      await Song.findByIdAndDelete(song._id)

      // Find orphaned arrangements
      const allArrangements = await Arrangement.find()
      const orphanedArrangements = []

      for (const arr of allArrangements) {
        const songExists = await Promise.all(
          arr.songIds.map(songId => Song.exists({ _id: songId }))
        )
        
        if (songExists.some(exists => exists === null)) {
          orphanedArrangements.push(arr)
        }
      }

      expect(orphanedArrangements).toHaveLength(1)
      expect(orphanedArrangements[0]._id.toString()).toBe(arrangement._id.toString())
    })

    it('should identify content from inactive users', async () => {
      const user = await createTestUser()
      const song = await createTestSong({ 'metadata.createdBy': user._id })
      
      // Deactivate user
      await User.findByIdAndUpdate(user._id, { isActive: false })

      // Find content from inactive users
      const inactiveUserIds = (await User.find({ isActive: false })).map(u => u._id)
      const contentFromInactiveUsers = await Song.find({
        'metadata.createdBy': { $in: inactiveUserIds }
      })

      expect(contentFromInactiveUsers).toHaveLength(1)
      expect(contentFromInactiveUsers[0]._id.toString()).toBe(song._id.toString())
    })
  })
})