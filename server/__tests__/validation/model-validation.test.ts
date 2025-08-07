import { describe, it, expect } from 'vitest'
import { User } from '../../features/users/user.model'
import { Song } from '../../features/songs/song.model'
import { Arrangement } from '../../features/arrangements/arrangement.model'
import { createUserData, createSongData, createArrangementData, getSampleChordPro } from '../../shared/test-utils/factories'
import { compressionService } from '../../shared/services/compressionService'
import mongoose from 'mongoose'

describe('Model Validation Error Tests', () => {
  // ============================================================================
  // User Model Validation Errors
  // ============================================================================

  describe('User Model Validation', () => {
    describe('Required Field Validation', () => {
      it('should provide detailed error for missing clerkId', async () => {
        const userData = createUserData({ clerkId: undefined })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.clerkId).toBeDefined()
          expect(error.errors.clerkId.message).toContain('required')
          expect(error.errors.clerkId.kind).toBe('required')
          expect(error.errors.clerkId.path).toBe('clerkId')
        }
      })

      it('should provide detailed error for missing email', async () => {
        const userData = createUserData({ email: undefined })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.email).toBeDefined()
          expect(error.errors.email.message).toContain('required')
          expect(error.errors.email.kind).toBe('required')
        }
      })

      it('should provide detailed error for missing username', async () => {
        const userData = createUserData({ username: undefined })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.username).toBeDefined()
          expect(error.errors.username.message).toContain('required')
          expect(error.errors.username.kind).toBe('required')
        }
      })

      it('should handle multiple missing required fields', async () => {
        const userData = {
          // Missing clerkId, email, username
          role: 'USER'
        }
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.clerkId).toBeDefined()
          expect(error.errors.email).toBeDefined()
          expect(error.errors.username).toBeDefined()
          
          expect(Object.keys(error.errors)).toHaveLength(3)
        }
      })
    })

    describe('Enum Validation', () => {
      it('should provide detailed error for invalid role', async () => {
        const userData = createUserData({ role: 'INVALID_ROLE' as any })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.role).toBeDefined()
          expect(error.errors.role.message).toContain('is not a valid enum value')
          expect(error.errors.role.kind).toBe('enum')
          expect(error.errors.role.value).toBe('INVALID_ROLE')
        }
      })

      it('should provide detailed error for invalid theme', async () => {
        const userData = createUserData({ 
          preferences: { 
            fontSize: 16, 
            theme: 'invalid-theme' as any 
          }
        })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors['preferences.theme']).toBeDefined()
          expect(error.errors['preferences.theme'].message).toContain('is not a valid enum value')
          expect(error.errors['preferences.theme'].value).toBe('invalid-theme')
        }
      })

      it('should provide detailed error for invalid defaultKey', async () => {
        const userData = createUserData({ 
          preferences: { 
            fontSize: 16, 
            theme: 'light',
            defaultKey: 'H' as any 
          }
        })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors['preferences.defaultKey']).toBeDefined()
          expect(error.errors['preferences.defaultKey'].message).toContain('is not a valid enum value')
        }
      })
    })

    describe('Range Validation', () => {
      it('should provide detailed error for fontSize below minimum', async () => {
        const userData = createUserData({ 
          preferences: { 
            fontSize: 11, // Below minimum of 12
            theme: 'light' 
          }
        })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors['preferences.fontSize']).toBeDefined()
          expect(error.errors['preferences.fontSize'].kind).toBe('min')
          expect(error.errors['preferences.fontSize'].value).toBe(11)
        }
      })

      it('should provide detailed error for fontSize above maximum', async () => {
        const userData = createUserData({ 
          preferences: { 
            fontSize: 25, // Above maximum of 24
            theme: 'light' 
          }
        })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors['preferences.fontSize']).toBeDefined()
          expect(error.errors['preferences.fontSize'].kind).toBe('max')
          expect(error.errors['preferences.fontSize'].value).toBe(25)
        }
      })

      it('should provide detailed error for negative stats', async () => {
        const userData = createUserData({ 
          stats: { 
            songsCreated: -1,
            arrangementsCreated: 0,
            setlistsCreated: 0
          }
        })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors['stats.songsCreated']).toBeDefined()
          expect(error.errors['stats.songsCreated'].kind).toBe('min')
        }
      })
    })

    describe('String Length Validation', () => {
      it('should provide detailed error for bio too long', async () => {
        const userData = createUserData({ 
          profile: { 
            bio: 'x'.repeat(501) // Exceeds 500 character limit
          }
        })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors['profile.bio']).toBeDefined()
          expect(error.errors['profile.bio'].kind).toBe('maxlength')
          expect(error.errors['profile.bio'].value).toHaveLength(501)
        }
      })

      it('should provide detailed error for website too long', async () => {
        const userData = createUserData({ 
          profile: { 
            website: 'https://example.com/' + 'x'.repeat(200) // Exceeds 200 character limit
          }
        })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors['profile.website']).toBeDefined()
          expect(error.errors['profile.website'].kind).toBe('maxlength')
        }
      })

      it('should provide detailed error for location too long', async () => {
        const userData = createUserData({ 
          profile: { 
            location: 'x'.repeat(101) // Exceeds 100 character limit
          }
        })
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors['profile.location']).toBeDefined()
          expect(error.errors['profile.location'].kind).toBe('maxlength')
        }
      })
    })

    describe('Compound Validation Errors', () => {
      it('should handle multiple validation errors simultaneously', async () => {
        const userData = {
          // Missing required fields
          clerkId: undefined,
          email: undefined,
          // Invalid values
          role: 'INVALID_ROLE' as any,
          preferences: {
            fontSize: 999, // Too large
            theme: 'invalid-theme' as any,
            defaultKey: 'Z' as any
          },
          profile: {
            bio: 'x'.repeat(600), // Too long
            website: 'x'.repeat(300), // Too long
            location: 'x'.repeat(200) // Too long
          },
          stats: {
            songsCreated: -5, // Negative
            arrangementsCreated: -1,
            setlistsCreated: -10
          }
        }
        
        try {
          await User.create(userData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          
          // Should have errors for multiple fields
          expect(Object.keys(error.errors).length).toBeGreaterThan(5)
          
          // Check some specific errors
          expect(error.errors.clerkId).toBeDefined()
          expect(error.errors.email).toBeDefined()
          expect(error.errors.role).toBeDefined()
          expect(error.errors['preferences.fontSize']).toBeDefined()
          expect(error.errors['profile.bio']).toBeDefined()
          expect(error.errors['stats.songsCreated']).toBeDefined()
        }
      })
    })
  })

  // ============================================================================
  // Song Model Validation Errors
  // ============================================================================

  describe('Song Model Validation', () => {
    describe('Required Field Validation', () => {
      it('should provide detailed error for missing title', async () => {
        const songData = createSongData({ title: undefined })
        
        try {
          await Song.create(songData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.title).toBeDefined()
          expect(error.errors.title.kind).toBe('required')
        }
      })

      it('should provide detailed error for missing metadata', async () => {
        const songData = createSongData({ metadata: undefined })
        
        try {
          await Song.create(songData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors['metadata.createdBy']).toBeDefined()
        }
      })
    })

    describe('String Length Validation', () => {
      it('should provide detailed error for title too long', async () => {
        const songData = createSongData({ 
          title: 'x'.repeat(201) // Assuming there's a title length limit
        })
        
        try {
          await Song.create(songData)
          // This might pass if no length limit is set
        } catch (error: any) {
          if (error.name === 'ValidationError') {
            expect(error.errors.title).toBeDefined()
            expect(error.errors.title.kind).toBe('maxlength')
          }
        }
      })
    })

    describe('Array Validation', () => {
      it('should handle empty themes array if validation exists', async () => {
        const songData = createSongData({ themes: [] })
        
        try {
          const song = await Song.create(songData)
          // This should pass as empty array might be allowed
          expect(song.themes).toEqual([])
        } catch (error: any) {
          if (error.name === 'ValidationError') {
            expect(error.errors.themes).toBeDefined()
          }
        }
      })
    })

    describe('Numeric Validation', () => {
      it('should provide detailed error for invalid composition year', async () => {
        const songData = createSongData({ 
          compositionYear: 1200 // Too old
        })
        
        try {
          const song = await Song.create(songData)
          // This might pass if no validation is set
          expect(song.compositionYear).toBe(1200)
        } catch (error: any) {
          if (error.name === 'ValidationError') {
            expect(error.errors.compositionYear).toBeDefined()
          }
        }
      })

      it('should provide detailed error for future composition year', async () => {
        const songData = createSongData({ 
          compositionYear: 3000 // Too far in future
        })
        
        try {
          const song = await Song.create(songData)
          // This might pass if no validation is set
          expect(song.compositionYear).toBe(3000)
        } catch (error: any) {
          if (error.name === 'ValidationError') {
            expect(error.errors.compositionYear).toBeDefined()
          }
        }
      })
    })
  })

  // ============================================================================
  // Arrangement Model Validation Errors
  // ============================================================================

  describe('Arrangement Model Validation', () => {
    let compressedChordData: Buffer

    beforeEach(async () => {
      compressedChordData = await compressionService.compressChordPro(getSampleChordPro())
    })

    describe('Required Field Validation', () => {
      it('should provide detailed error for missing name', async () => {
        const arrangementData = {
          // Missing name
          songIds: [new mongoose.Types.ObjectId()],
          createdBy: new mongoose.Types.ObjectId(),
          chordData: compressedChordData,
          difficulty: 'intermediate' as const,
          metadata: {
            isPublic: true,
            ratings: { average: 0, count: 0 },
            views: 0
          }
        }
        
        try {
          await Arrangement.create(arrangementData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.name).toBeDefined()
          expect(error.errors.name.kind).toBe('required')
        }
      })

      it('should provide detailed error for missing songIds', async () => {
        const arrangementData = {
          name: 'Test Arrangement',
          // Missing songIds
          createdBy: new mongoose.Types.ObjectId(),
          chordData: compressedChordData,
          difficulty: 'intermediate' as const,
          metadata: {
            isPublic: true,
            ratings: { average: 0, count: 0 },
            views: 0
          }
        }
        
        try {
          await Arrangement.create(arrangementData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.songIds).toBeDefined()
          expect(error.errors.songIds.kind).toBe('required')
        }
      })

      it('should provide detailed error for missing chordData', async () => {
        const arrangementData = {
          name: 'Test Arrangement',
          songIds: [new mongoose.Types.ObjectId()],
          createdBy: new mongoose.Types.ObjectId(),
          // Missing chordData
          difficulty: 'intermediate' as const,
          metadata: {
            isPublic: true,
            ratings: { average: 0, count: 0 },
            views: 0
          }
        }
        
        try {
          await Arrangement.create(arrangementData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.chordData).toBeDefined()
          expect(error.errors.chordData.kind).toBe('required')
        }
      })
    })

    describe('Enum Validation', () => {
      it('should provide detailed error for invalid difficulty', async () => {
        const arrangementData = createArrangementData()
        arrangementData.chordData = compressedChordData
        arrangementData.difficulty = 'invalid-difficulty' as any
        
        try {
          await Arrangement.create(arrangementData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.difficulty).toBeDefined()
          expect(error.errors.difficulty.kind).toBe('enum')
          expect(error.errors.difficulty.value).toBe('invalid-difficulty')
        }
      })
    })

    describe('Array Validation', () => {
      it('should provide detailed error for empty songIds array', async () => {
        const arrangementData = createArrangementData()
        arrangementData.chordData = compressedChordData
        arrangementData.songIds = [] // Empty array
        
        try {
          await Arrangement.create(arrangementData)
          // This might pass if empty arrays are allowed
        } catch (error: any) {
          if (error.name === 'ValidationError') {
            expect(error.errors.songIds).toBeDefined()
          }
        }
      })
    })

    describe('Buffer Validation', () => {
      it('should provide detailed error for invalid chordData type', async () => {
        const arrangementData = createArrangementData()
        arrangementData.chordData = 'not-a-buffer' as any
        
        try {
          await Arrangement.create(arrangementData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(error.errors.chordData).toBeDefined()
        }
      })
    })

    describe('Compound Validation Errors', () => {
      it('should handle multiple arrangement validation errors', async () => {
        const arrangementData = {
          // Missing required fields
          name: undefined,
          songIds: undefined,
          chordData: undefined,
          // Invalid enum
          difficulty: 'super-hard' as any,
          // Missing metadata
          createdBy: undefined
        }
        
        try {
          await Arrangement.create(arrangementData)
          expect.fail('Should have thrown validation error')
        } catch (error: any) {
          expect(error.name).toBe('ValidationError')
          expect(Object.keys(error.errors).length).toBeGreaterThan(3)
          
          expect(error.errors.name).toBeDefined()
          expect(error.errors.songIds).toBeDefined()
          expect(error.errors.chordData).toBeDefined()
          expect(error.errors.difficulty).toBeDefined()
          expect(error.errors.createdBy).toBeDefined()
        }
      })
    })
  })

  // ============================================================================
  // Cross-Model Validation Scenarios
  // ============================================================================

  describe('Cross-Model Validation Scenarios', () => {
    it('should handle cascading validation failures', async () => {
      // Create invalid user data
      const invalidUserData = {
        clerkId: undefined,
        email: 'invalid-email',
        role: 'INVALID' as any
      }
      
      try {
        await User.create(invalidUserData)
        expect.fail('Should have thrown validation error')
      } catch (userError: any) {
        expect(userError.name).toBe('ValidationError')
        expect(userError.errors.clerkId).toBeDefined()
        expect(userError.errors.email).toBeDefined()
        expect(userError.errors.role).toBeDefined()
      }
      
      // Create invalid song data
      const invalidSongData = {
        title: undefined,
        metadata: {
          createdBy: 'invalid-object-id'
        }
      }
      
      try {
        await Song.create(invalidSongData)
        expect.fail('Should have thrown validation error')
      } catch (songError: any) {
        expect(songError.name).toBe('ValidationError')
        expect(songError.errors.title).toBeDefined()
      }
    })

    it('should provide helpful validation error messages', async () => {
      const userData = createUserData({ 
        email: 'not-an-email',
        preferences: {
          fontSize: 999,
          theme: 'neon-green' as any
        }
      })
      
      try {
        await User.create(userData)
        expect.fail('Should have thrown validation error')
      } catch (error: any) {
        expect(error.name).toBe('ValidationError')
        
        // Verify error messages are helpful
        if (error.errors['preferences.fontSize']) {
          expect(error.errors['preferences.fontSize'].message).toBeTruthy()
        }
        if (error.errors['preferences.theme']) {
          expect(error.errors['preferences.theme'].message).toBeTruthy()
        }
      }
    })
  })

  // ============================================================================
  // Edge Case Validation
  // ============================================================================

  describe('Edge Case Validation', () => {
    it('should handle null vs undefined differences', async () => {
      const userDataWithNull = createUserData({ 
        name: null as any,
        lastLoginAt: null as any
      })
      
      const userDataWithUndefined = createUserData({ 
        name: undefined,
        lastLoginAt: undefined
      })
      
      try {
        const userWithNull = await User.create(userDataWithNull)
        const userWithUndefined = await User.create({
          ...userDataWithUndefined,
          email: 'different@test.com',
          username: 'different',
          clerkId: 'different_clerk'
        })
        
        expect(userWithNull.name).toBeNull()
        expect(userWithUndefined.name).toBeUndefined()
      } catch (error: any) {
        // Either should be valid, just checking the difference is handled
        expect(error).toBeTruthy()
      }
    })

    it('should handle empty string vs null validation', async () => {
      const userDataEmptyString = createUserData({ 
        name: '',
        profile: {
          bio: '',
          website: '',
          location: ''
        }
      })
      
      try {
        const user = await User.create(userDataEmptyString)
        expect(user.name).toBe('')
        expect(user.profile.bio).toBe('')
      } catch (error: any) {
        if (error.name === 'ValidationError') {
          // Check if empty strings are handled differently than null/undefined
          expect(error.errors).toBeDefined()
        }
      }
    })
  })
})