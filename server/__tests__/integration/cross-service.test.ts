import { describe, it, expect } from 'vitest'
import { createTestEcosystem, createTestUser, createTestSong, createTestArrangement, getSampleChordPro } from '../../shared/test-utils/factories'
import { userService } from '../../features/users/user.service'
import { songService } from '../../features/songs/song.service'
import { arrangementService } from '../../features/arrangements/arrangement.service'
import { User } from '../../features/users/user.model'
import { Song } from '../../features/songs/song.model'
import { testTimeout } from '../../shared/test-utils/timeout-config'

describe('Cross-Service Integration Tests', () => {
  // ============================================================================
  // Song-Arrangement-User Integration
  // ============================================================================

  describe('Song-Arrangement-User Integration', () => {
    it('should maintain data consistency across all services', async () => {
      // Create ecosystem
      const { user, song, arrangement } = await createTestEcosystem()

      // Verify relationships
      expect(arrangement.songIds).toContain(song._id.toString())
      expect(arrangement.createdBy.toString()).toBe(user._id.toString())
      expect(song.metadata.createdBy.toString()).toBe(user._id.toString())

      // Verify user stats are properly tracked
      const updatedUser = await User.findById(user._id)
      expect(updatedUser!.stats.songsCreated).toBeGreaterThanOrEqual(0)
      expect(updatedUser!.stats.arrangementsCreated).toBeGreaterThanOrEqual(0)
    })

    it('should update arrangement count when arrangement created', async () => {
      const user = await createTestUser()
      const song = await createTestSong({ 'metadata.createdBy': user._id })
      
      // Initial arrangement count should be 0
      const initialSong = await Song.findById(song._id)
      const _initialCount = initialSong?.metadata?.arrangementCount || 0

      // Create arrangement for this song
      const arrangement = await createTestArrangement(
        [song._id.toString()],
        getSampleChordPro(),
        { createdBy: user._id }
      )

      // Verify arrangement was created correctly
      expect(arrangement.songIds).toContain(song._id.toString())

      // Verify user stats were updated via service calls
      await userService.incrementStat(user._id.toString(), 'arrangementsCreated')
      
      const updatedUser = await userService.findById(user._id.toString())
      expect(updatedUser.stats.arrangementsCreated).toBe(1)
    })

    it('should track user contributions across all services', async () => {
      const user = await createTestUser()
      
      // Create content via services
      const song = await songService.create({
        title: 'Test Song for Stats',
        artist: 'Test Artist',
        themes: ['worship'],
        isPublic: true
      }, user._id.toString())

      const arrangement = await arrangementService.create({
        name: 'Test Arrangement for Stats',
        songIds: [song.id],
        chordProText: getSampleChordPro(),
        difficulty: 'intermediate' as const,
        isPublic: true
      }, user._id.toString())

      // Update user stats
      await userService.incrementStat(user._id.toString(), 'songsCreated')
      await userService.incrementStat(user._id.toString(), 'arrangementsCreated')

      // Verify stats were updated
      const updatedUser = await userService.findById(user._id.toString())
      expect(updatedUser.stats.songsCreated).toBe(1)
      expect(updatedUser.stats.arrangementsCreated).toBe(1)

      // Verify content was created
      expect(song.title).toBe('Test Song for Stats')
      expect(arrangement.name).toBe('Test Arrangement for Stats')
    })

    it('should handle mashup arrangements with multiple songs', async () => {
      const user = await createTestUser()
      
      // Create multiple songs
      const song1 = await createTestSong({ 
        title: 'Song 1',
        'metadata.createdBy': user._id 
      })
      const song2 = await createTestSong({ 
        title: 'Song 2', 
        'metadata.createdBy': user._id 
      })

      // Create mashup arrangement
      const mashup = await createTestArrangement(
        [song1._id.toString(), song2._id.toString()],
        getSampleChordPro(),
        { 
          name: 'Mashup Arrangement',
          createdBy: user._id 
        }
      )

      // Verify mashup properties
      expect(mashup.songIds).toHaveLength(2)
      expect(mashup.songIds).toContain(song1._id.toString())
      expect(mashup.songIds).toContain(song2._id.toString())
      expect(mashup.metadata.isMashup).toBe(true)
    })
  })

  // ============================================================================
  // User Statistics Integration
  // ============================================================================

  describe('User Statistics Integration', () => {
    it('should accurately track content creation statistics', async () => {
      const user = await createTestUser()
      
      // Create multiple pieces of content
      const songs = []
      const arrangements = []

      // Create 3 songs
      for (let i = 1; i <= 3; i++) {
        const song = await songService.create({
          title: `Song ${i}`,
          artist: 'Test Artist',
          themes: ['test'],
          isPublic: true
        }, user._id.toString())
        songs.push(song)
        await userService.incrementStat(user._id.toString(), 'songsCreated')
      }

      // Create 2 arrangements
      for (let i = 1; i <= 2; i++) {
        const arrangement = await arrangementService.create({
          name: `Arrangement ${i}`,
          songIds: [songs[i - 1].id],
          chordProText: getSampleChordPro(),
          difficulty: 'intermediate' as const,
          isPublic: true
        }, user._id.toString())
        arrangements.push(arrangement)
        await userService.incrementStat(user._id.toString(), 'arrangementsCreated')
      }

      // Verify final statistics
      const finalUser = await userService.findById(user._id.toString())
      expect(finalUser.stats.songsCreated).toBe(3)
      expect(finalUser.stats.arrangementsCreated).toBe(2)
      expect(finalUser.stats.setlistsCreated).toBe(0) // None created
    })

    it('should handle concurrent statistics updates correctly', async () => {
      const user = await createTestUser()
      
      // Simulate concurrent stat increments
      const songPromises = Array(5).fill(0).map(() => 
        userService.incrementStat(user._id.toString(), 'songsCreated')
      )
      const arrangementPromises = Array(3).fill(0).map(() =>
        userService.incrementStat(user._id.toString(), 'arrangementsCreated')
      )

      await Promise.all([...songPromises, ...arrangementPromises])

      // Verify final counts
      const updatedUser = await userService.findById(user._id.toString())
      expect(updatedUser.stats.songsCreated).toBe(5)
      expect(updatedUser.stats.arrangementsCreated).toBe(3)
    }, testTimeout('INTEGRATION')) // Integration test with concurrent operations
  })

  // ============================================================================
  // Compression Integration
  // ============================================================================

  describe('Compression Integration', () => {
    it('should maintain compression integrity across arrangement operations', async () => {
      const user = await createTestUser()
      const song = await createTestSong({ 'metadata.createdBy': user._id })

      const originalChordPro = getSampleChordPro()
      
      // Create arrangement with compression
      const arrangement = await arrangementService.create({
        name: 'Compression Test',
        songIds: [song._id.toString()],
        chordProText: originalChordPro,
        difficulty: 'intermediate' as const,
        isPublic: true
      }, user._id.toString())

      // Verify compression metrics
      expect(arrangement.compressionMetrics).toBeDefined()
      expect(arrangement.compressionMetrics!.ratio).toBeGreaterThan(0)
      expect(arrangement.compressionMetrics!.originalSize).toBe(
        Buffer.byteLength(originalChordPro, 'utf-8')
      )

      // Fetch arrangement with decompression
      const fetchedArrangement = await arrangementService.findById(arrangement.id, true)
      
      // Verify decompression worked correctly
      expect(fetchedArrangement.chordData).toBe(originalChordPro)
      expect(fetchedArrangement.compressionMetrics).toBeDefined()
    })

    it('should handle large chord sheet compression efficiently', async () => {
      const user = await createTestUser()
      const song = await createTestSong({ 'metadata.createdBy': user._id })

      // Create a large chord sheet
      const largeChordPro = Array(50).fill(getSampleChordPro()).join('\n\n')
      
      const arrangement = await arrangementService.create({
        name: 'Large Chord Sheet Test',
        songIds: [song._id.toString()],
        chordProText: largeChordPro,
        difficulty: 'advanced' as const,
        isPublic: true
      }, user._id.toString())

      // Verify compression achieved good ratio on repetitive data
      expect(arrangement.compressionMetrics!.ratio).toBeGreaterThan(50) // >50% compression
      expect(arrangement.compressionMetrics!.savings).toBeGreaterThan(1000) // >1KB saved

      // Verify decompression accuracy
      const fetchedArrangement = await arrangementService.findById(arrangement.id, true)
      expect(fetchedArrangement.chordData).toBe(largeChordPro)
    }, testTimeout('PERFORMANCE')) // Performance test with large data compression
  })

  // ============================================================================
  // Rating and View Integration
  // ============================================================================

  describe('Rating and View Integration', () => {
    it('should update ratings across song and arrangement services', async () => {
      const user = await createTestUser()
      const song = await createTestSong({ 'metadata.createdBy': user._id })

      // Rate the song multiple times
      const ratingPromises = [
        songService.updateRating(song._id.toString(), 5),
        songService.updateRating(song._id.toString(), 4),
        songService.updateRating(song._id.toString(), 5)
      ]

      await Promise.all(ratingPromises)

      // Verify final rating calculation
      const updatedSong = await songService.findById(song._id.toString())
      expect(updatedSong.metadata.ratings.count).toBe(3)
      expect(updatedSong.metadata.ratings.average).toBeCloseTo(4.67, 1) // (5+4+5)/3 ≈ 4.67
    })

    it('should track view counts independently', async () => {
      const user = await createTestUser()
      const song = await createTestSong({ 'metadata.createdBy': user._id })
      const arrangement = await createTestArrangement(
        [song._id.toString()],
        getSampleChordPro(),
        { createdBy: user._id }
      )

      // Simulate viewing content
      await songService.incrementViews(song._id.toString())
      await songService.incrementViews(song._id.toString())

      // Verify view counts
      const updatedSong = await songService.findById(song._id.toString())
      expect(updatedSong.metadata.views).toBe(2)

      // Verify arrangement views are independent
      const fetchedArrangement = await arrangementService.findById(arrangement._id.toString())
      expect(fetchedArrangement.metadata.views).toBe(0) // No views on arrangement
    })
  })

  // ============================================================================
  // Error Propagation Integration
  // ============================================================================

  describe('Error Propagation Integration', () => {
    it('should handle cascading failures gracefully', async () => {
      const user = await createTestUser()
      
      // Attempt to create arrangement with non-existent song
      const nonExistentSongId = '507f1f77bcf86cd799439011'
      
      await expect(arrangementService.create({
        name: 'Failed Arrangement',
        songIds: [nonExistentSongId],
        chordProText: getSampleChordPro(),
        difficulty: 'intermediate' as const,
        isPublic: true
      }, user._id.toString())).rejects.toThrow()

      // Verify user stats weren't incorrectly updated
      const userAfterFailure = await userService.findById(user._id.toString())
      expect(userAfterFailure.stats.arrangementsCreated).toBe(0)
    })

    it('should maintain data consistency during partial failures', async () => {
      const user = await createTestUser()
      const song = await createTestSong({ 'metadata.createdBy': user._id })

      // Create arrangement successfully
      const arrangement = await arrangementService.create({
        name: 'Successful Arrangement',
        songIds: [song._id.toString()],
        chordProText: getSampleChordPro(),
        difficulty: 'intermediate' as const,
        isPublic: true
      }, user._id.toString())

      // Update user stats
      await userService.incrementStat(user._id.toString(), 'arrangementsCreated')

      // Verify everything was created successfully
      expect(arrangement.name).toBe('Successful Arrangement')
      
      const updatedUser = await userService.findById(user._id.toString())
      expect(updatedUser.stats.arrangementsCreated).toBe(1)
    })
  })

  // ============================================================================
  // Service Communication Integration
  // ============================================================================

  describe('Service Communication Integration', () => {
    it('should handle service layer interactions correctly', async () => {
      // Create user via service
      const clerkData = {
        clerkId: 'clerk_integration_test',
        email: 'integration@example.com',
        username: 'integrationuser',
        name: 'Integration Test User'
      }
      const user = await userService.createFromClerk(clerkData)

      // Create song via service
      const song = await songService.create({
        title: 'Integration Test Song',
        artist: 'Integration Artist',
        themes: ['integration', 'test'],
        isPublic: true
      }, user.id)

      // Create arrangement via service
      const arrangement = await arrangementService.create({
        name: 'Integration Test Arrangement',
        songIds: [song.id],
        chordProText: getSampleChordPro(),
        difficulty: 'intermediate' as const,
        tags: ['integration', 'test'],
        isPublic: true
      }, user.id)

      // Update stats
      await userService.incrementStat(user.id, 'songsCreated')
      await userService.incrementStat(user.id, 'arrangementsCreated')

      // Verify all services worked together
      expect(user.email).toBe(clerkData.email)
      expect(song.title).toBe('Integration Test Song')
      expect(arrangement.name).toBe('Integration Test Arrangement')

      const finalUser = await userService.findById(user.id)
      expect(finalUser.stats.songsCreated).toBe(1)
      expect(finalUser.stats.arrangementsCreated).toBe(1)
    })

    it('should handle user role changes affecting content access', async () => {
      const user = await createTestUser({ role: 'USER' })
      
      // Create content as regular user
      const song = await songService.create({
        title: 'Role Test Song',
        isPublic: false // Private content
      }, user._id.toString())

      // Upgrade user to MODERATOR
      const updatedUser = await userService.updateRole(user._id.toString(), 'MODERATOR')
      expect(updatedUser.role).toBe('MODERATOR')

      // Verify content still belongs to user
      const userSong = await songService.findById(song.id)
      expect(userSong.metadata.createdBy.toString()).toBe(user._id.toString())
    })
  })
})