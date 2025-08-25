import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ResolvedPermission } from '../types/permission.types'

interface PermissionCacheEntry {
  userId: string
  permissions: ResolvedPermission[]
  timestamp: number
  expiresAt: number
  version: number
}

interface PermissionCacheDB extends DBSchema {
  permissions: {
    key: string
    value: PermissionCacheEntry
    indexes: {
      'by-user': string
      'by-expiry': number
    }
  }
  metadata: {
    key: string
    value: {
      version: number
      lastCleanup: number
    }
  }
}

/**
 * PermissionCache provides client-side caching for user permissions using IndexedDB.
 * This reduces the need for frequent permission resolution and improves performance.
 */
export class PermissionCache {
  private static readonly DB_NAME = 'hsa-permissions-cache'
  private static readonly DB_VERSION = 1
  private static readonly DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes
  private static readonly CLEANUP_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes
  private static readonly CACHE_VERSION = 1

  private static dbInstance: IDBPDatabase<PermissionCacheDB> | null = null
  private static lastCleanup = 0

  /**
   * Initialize the IndexedDB database
   */
  private static async getDB(): Promise<IDBPDatabase<PermissionCacheDB>> {
    if (this.dbInstance) {
      return this.dbInstance
    }

    try {
      this.dbInstance = await openDB<PermissionCacheDB>(
        this.DB_NAME,
        this.DB_VERSION,
        {
          upgrade(db) {
            // Create permissions store
            const permissionsStore = db.createObjectStore('permissions', {
              keyPath: 'userId'
            })
            
            // Create indexes
            permissionsStore.createIndex('by-user', 'userId', { unique: true })
            permissionsStore.createIndex('by-expiry', 'expiresAt', { unique: false })

            // Create metadata store
            db.createObjectStore('metadata', {
              keyPath: 'version'
            })
          }
        }
      )

      // Schedule periodic cleanup
      this.scheduleCleanup()

      return this.dbInstance
    } catch (error) {
      console.error('Failed to initialize permission cache database:', error)
      throw new Error('Permission cache initialization failed')
    }
  }

  /**
   * Get cached permissions for a user
   */
  public static async get(
    userId: string
  ): Promise<ResolvedPermission[] | null> {
    try {
      const db = await this.getDB()
      const entry = await db.get('permissions', userId)

      if (!entry) {
        return null
      }

      // Check if entry has expired
      const now = Date.now()
      if (now > entry.expiresAt) {
        // Remove expired entry
        await this.clear(userId)
        return null
      }

      // Check version compatibility
      if (entry.version !== this.CACHE_VERSION) {
        await this.clear(userId)
        return null
      }

      return entry.permissions
    } catch (error) {
      console.error('Failed to get cached permissions:', error)
      return null
    }
  }

  /**
   * Store permissions in cache with TTL
   */
  public static async set(
    userId: string,
    permissions: ResolvedPermission[],
    ttlMs: number = this.DEFAULT_TTL_MS
  ): Promise<boolean> {
    try {
      const db = await this.getDB()
      const now = Date.now()
      
      const entry: PermissionCacheEntry = {
        userId,
        permissions: [...permissions], // Create a copy to avoid mutations
        timestamp: now,
        expiresAt: now + ttlMs,
        version: this.CACHE_VERSION
      }

      await db.put('permissions', entry)
      return true
    } catch (error) {
      console.error('Failed to cache permissions:', error)
      return false
    }
  }

  /**
   * Clear cached permissions for a specific user
   */
  public static async clear(userId: string): Promise<boolean> {
    try {
      const db = await this.getDB()
      await db.delete('permissions', userId)
      return true
    } catch (error) {
      console.error('Failed to clear cached permissions:', error)
      return false
    }
  }

  /**
   * Clear all cached permissions
   */
  public static async clearAll(): Promise<boolean> {
    try {
      const db = await this.getDB()
      await db.clear('permissions')
      await db.clear('metadata')
      return true
    } catch (error) {
      console.error('Failed to clear all cached permissions:', error)
      return false
    }
  }

  /**
   * Get cache statistics
   */
  public static async getStats(): Promise<{
    totalEntries: number
    expiredEntries: number
    validEntries: number
    cacheSize: number
  }> {
    try {
      const db = await this.getDB()
      const allEntries = await db.getAll('permissions')
      const now = Date.now()
      
      let expiredEntries = 0
      let validEntries = 0
      let totalSize = 0

      for (const entry of allEntries) {
        if (now > entry.expiresAt) {
          expiredEntries++
        } else {
          validEntries++
        }
        
        // Rough size calculation (JSON string length)
        totalSize += JSON.stringify(entry).length
      }

      return {
        totalEntries: allEntries.length,
        expiredEntries,
        validEntries,
        cacheSize: totalSize
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return {
        totalEntries: 0,
        expiredEntries: 0,
        validEntries: 0,
        cacheSize: 0
      }
    }
  }

  /**
   * Remove expired entries from cache
   */
  public static async cleanup(): Promise<number> {
    try {
      const db = await this.getDB()
      const now = Date.now()
      
      // Get all entries that have expired
      const tx = db.transaction('permissions', 'readwrite')
      const index = tx.store.index('by-expiry')
      
      let deletedCount = 0
      let cursor = await index.openCursor(IDBKeyRange.upperBound(now))
      
      while (cursor) {
        await cursor.delete()
        deletedCount++
        cursor = await cursor.continue()
      }
      
      await tx.done

      // Update last cleanup timestamp
      await db.put('metadata', {
        version: this.CACHE_VERSION,
        lastCleanup: now
      })

      this.lastCleanup = now
      
      return deletedCount
    } catch (error) {
      console.error('Failed to cleanup expired cache entries:', error)
      return 0
    }
  }

  /**
   * Check if a user's permissions are cached and valid
   */
  public static async isCached(userId: string): Promise<boolean> {
    try {
      const db = await this.getDB()
      const entry = await db.get('permissions', userId)
      
      if (!entry) {
        return false
      }

      const now = Date.now()
      return now <= entry.expiresAt && entry.version === this.CACHE_VERSION
    } catch (error) {
      console.error('Failed to check cache status:', error)
      return false
    }
  }

  /**
   * Get the remaining TTL for cached permissions
   */
  public static async getRemainingTTL(userId: string): Promise<number> {
    try {
      const db = await this.getDB()
      const entry = await db.get('permissions', userId)
      
      if (!entry) {
        return 0
      }

      const now = Date.now()
      const remaining = entry.expiresAt - now
      
      return Math.max(0, remaining)
    } catch (error) {
      console.error('Failed to get remaining TTL:', error)
      return 0
    }
  }

  /**
   * Extend the TTL of cached permissions
   */
  public static async extendTTL(
    userId: string,
    additionalTtlMs: number
  ): Promise<boolean> {
    try {
      const db = await this.getDB()
      const entry = await db.get('permissions', userId)
      
      if (!entry) {
        return false
      }

      // Only extend if not expired
      const now = Date.now()
      if (now > entry.expiresAt) {
        return false
      }

      entry.expiresAt += additionalTtlMs
      await db.put('permissions', entry)
      
      return true
    } catch (error) {
      console.error('Failed to extend cache TTL:', error)
      return false
    }
  }

  /**
   * Refresh cached permissions with new data
   */
  public static async refresh(
    userId: string,
    permissions: ResolvedPermission[],
    ttlMs: number = this.DEFAULT_TTL_MS
  ): Promise<boolean> {
    // This is essentially the same as set() but explicitly for refresh scenarios
    return await this.set(userId, permissions, ttlMs)
  }

  /**
   * Schedule periodic cleanup of expired entries
   */
  private static scheduleCleanup(): void {
    // Only schedule if we haven't cleaned up recently
    const now = Date.now()
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL_MS) {
      return
    }

    // Use setTimeout instead of setInterval to avoid overlapping cleanups
    setTimeout(async () => {
      try {
        const deletedCount = await this.cleanup()
        if (deletedCount > 0) {
          console.debug(`Cleaned up ${deletedCount} expired permission cache entries`)
        }
        
        // Schedule next cleanup
        this.scheduleCleanup()
      } catch (error) {
        console.error('Permission cache cleanup failed:', error)
        // Still schedule next cleanup attempt
        this.scheduleCleanup()
      }
    }, this.CLEANUP_INTERVAL_MS)
  }

  /**
   * Invalidate cache for multiple users
   */
  public static async invalidateUsers(userIds: string[]): Promise<number> {
    try {
      const db = await this.getDB()
      const tx = db.transaction('permissions', 'readwrite')
      
      let deletedCount = 0
      for (const userId of userIds) {
        try {
          await tx.store.delete(userId)
          deletedCount++
        } catch (error) {
          // Continue with other users even if one fails
          console.warn(`Failed to invalidate cache for user ${userId}:`, error)
        }
      }
      
      await tx.done
      return deletedCount
    } catch (error) {
      console.error('Failed to invalidate user caches:', error)
      return 0
    }
  }

  /**
   * Preload permissions for multiple users
   */
  public static async preload(
    userPermissions: Array<{
      userId: string
      permissions: ResolvedPermission[]
      ttlMs?: number
    }>
  ): Promise<number> {
    try {
      const db = await this.getDB()
      const tx = db.transaction('permissions', 'readwrite')
      const now = Date.now()
      
      let successCount = 0
      for (const { userId, permissions, ttlMs = this.DEFAULT_TTL_MS } of userPermissions) {
        try {
          const entry: PermissionCacheEntry = {
            userId,
            permissions: [...permissions],
            timestamp: now,
            expiresAt: now + ttlMs,
            version: this.CACHE_VERSION
          }
          
          await tx.store.put(entry)
          successCount++
        } catch (error) {
          console.warn(`Failed to preload permissions for user ${userId}:`, error)
        }
      }
      
      await tx.done
      return successCount
    } catch (error) {
      console.error('Failed to preload permissions:', error)
      return 0
    }
  }

  /**
   * Close the database connection
   */
  public static async close(): Promise<void> {
    if (this.dbInstance) {
      this.dbInstance.close()
      this.dbInstance = null
    }
  }
}