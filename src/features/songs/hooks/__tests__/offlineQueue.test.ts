import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { OfflineQueue } from '../utils/offlineQueue'

// Mock dynamic import for songService
const mockSongService = {
  createSong: vi.fn(),
  updateSong: vi.fn(),
  deleteSong: vi.fn(),
  rateSong: vi.fn()
}

// Mock the songService module
vi.mock('@features/songs/services/songService', () => ({
  songService: mockSongService
}))

// Mock console.error and console.log - declare them but don't initialize yet
let mockConsoleError: ReturnType<typeof vi.spyOn>
let mockConsoleLog: ReturnType<typeof vi.spyOn>

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock event listeners
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener })
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener })
Object.defineProperty(document, 'addEventListener', { value: vi.fn() })
Object.defineProperty(document, 'removeEventListener', { value: vi.fn() })

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('OfflineQueue', () => {
  let queue: OfflineQueue
  const mockOnSync = vi.fn()
  const mockOnError = vi.fn()
  
  // Mock the dynamic import using vi.doMock
  beforeAll(async () => {
    vi.doMock('@features/songs/services/songService', () => ({
      songService: mockSongService
    }))
    
    // Reset modules to ensure our mock is picked up
    vi.resetModules()
  })
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up console spies
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    mockLocalStorage.getItem.mockReturnValue(null)
    Object.defineProperty(navigator, 'onLine', { value: true })
    
    queue = new OfflineQueue({
      onSync: mockOnSync,
      onError: mockOnError,
      storageKey: 'testQueue'
    })
  })
  
  afterEach(() => {
    queue.destroy()
    mockConsoleError?.mockRestore()
    mockConsoleLog?.mockRestore()
    vi.restoreAllMocks()
  })
  
  describe('initialization', () => {
    it('creates queue with default options', () => {
      const defaultQueue = new OfflineQueue()
      expect(defaultQueue).toBeDefined()
      expect(defaultQueue.getQueueSize()).toBe(0)
      defaultQueue.destroy()
    })
    
    it('loads existing queue from localStorage', () => {
      const existingActions = [
        {
          id: 'test-1',
          type: 'create',
          data: { title: 'Test' },
          timestamp: Date.now(),
          retries: 0,
          maxRetries: 3
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingActions))
      
      const queueWithData = new OfflineQueue({ storageKey: 'testWithData' })
      expect(queueWithData.getQueueSize()).toBe(1)
      queueWithData.destroy()
    })
    
    it('handles invalid localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')
      
      const queueWithBadData = new OfflineQueue({ storageKey: 'testBadData' })
      expect(queueWithBadData.getQueueSize()).toBe(0)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to load offline queue:',
        expect.any(SyntaxError)
      )
      queueWithBadData.destroy()
    })
  })
  
  describe('adding actions', () => {
    it('adds action to queue', () => {
      const actionId = queue.add({
        type: 'create',
        data: { formData: { title: 'Test Song' }, token: 'test-token' }
      })
      
      expect(actionId).toBeTruthy()
      expect(actionId).toMatch(/^create-\d+-[a-z0-9]+$/)
      expect(queue.getQueueSize()).toBe(1)
    })
    
    it('persists queue to localStorage when adding', () => {
      queue.add({
        type: 'create',
        data: { formData: { title: 'Test Song' }, token: 'test-token' }
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'testQueue',
        expect.stringContaining('"type":"create"')
      )
    })
    
    it('processes queue immediately if online', async () => {
      mockSongService.createSong.mockResolvedValue({ id: 'created' })
      
      queue.add({
        type: 'create',
        data: { formData: { title: 'Test' }, token: 'test-token' }
      })
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(mockSongService.createSong).toHaveBeenCalledWith({ title: 'Test' }, 'test-token')
      expect(queue.getQueueSize()).toBe(0)
      expect(mockOnSync).toHaveBeenCalled()
    })
  })
  
  describe('processing actions', () => {
    it('manages create actions in queue', async () => {
      // Test that actions are properly added and managed in queue
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      const actionId = queue.add({
        type: 'create',
        data: { formData: { title: 'Test' }, token: 'token' }
      })
      
      expect(actionId).toBeTruthy()
      expect(actionId).toMatch(/^create-\d+-[a-z0-9]+$/)
      expect(queue.getQueueSize()).toBe(1)
      
      const actions = queue.getQueuedActions()
      expect(actions).toHaveLength(1)
      expect(actions[0].type).toBe('create')
      expect(actions[0].data.formData.title).toBe('Test')
      
      queue.clearQueue()
    })
    
    it('manages update actions in queue', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      const actionId = queue.add({
        type: 'update',
        data: { id: 'song-1', formData: { title: 'Updated' }, token: 'token' }
      })
      
      expect(actionId).toMatch(/^update-\d+-[a-z0-9]+$/)
      expect(queue.getQueueSize()).toBe(1)
      
      const actions = queue.getQueuedActions()
      expect(actions[0].type).toBe('update')
      expect(actions[0].data.id).toBe('song-1')
      expect(actions[0].data.formData.title).toBe('Updated')
      
      queue.clearQueue()
    })
    
    it('manages delete actions in queue', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      const actionId = queue.add({
        type: 'delete',
        data: { id: 'song-1', token: 'token' }
      })
      
      expect(actionId).toMatch(/^delete-\d+-[a-z0-9]+$/)
      expect(queue.getQueueSize()).toBe(1)
      
      const actions = queue.getQueuedActions()
      expect(actions[0].type).toBe('delete')
      expect(actions[0].data.id).toBe('song-1')
      
      queue.clearQueue()
    })
    
    it('manages rate actions in queue', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      const actionId = queue.add({
        type: 'rate',
        data: { id: 'song-1', rating: 5, token: 'token' }
      })
      
      expect(actionId).toMatch(/^rate-\d+-[a-z0-9]+$/)
      expect(queue.getQueueSize()).toBe(1)
      
      const actions = queue.getQueuedActions()
      expect(actions[0].type).toBe('rate')
      expect(actions[0].data.id).toBe('song-1')
      expect(actions[0].data.rating).toBe(5)
      
      queue.clearQueue()
    })
    
    it('maintains actions in chronological order', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      // Create a new queue to isolate this test
      const testQueue = new OfflineQueue({
        onSync: mockOnSync,
        onError: mockOnError,
        storageKey: 'testChronologicalQueue'
      })
      
      // Add actions with artificial delays to ensure different timestamps
      const firstActionId = testQueue.add({
        type: 'create',
        data: { formData: { title: 'First' }, token: 'token' }
      })
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const secondActionId = testQueue.add({
        type: 'update',
        data: { id: 'song-1', formData: { title: 'Second' }, token: 'token' }
      })
      
      const actions = testQueue.getQueuedActions()
      expect(actions).toHaveLength(2)
      
      // Actions should be sorted by timestamp
      const firstAction = actions.find(a => a.id === firstActionId)
      const secondAction = actions.find(a => a.id === secondActionId)
      
      expect(firstAction).toBeDefined()
      expect(secondAction).toBeDefined()
      expect(firstAction!.timestamp).toBeLessThan(secondAction!.timestamp)
      
      testQueue.destroy()
    })
  })
  
  describe('error handling', () => {
    it('handles maxRetries configuration', async () => {
      // Create new queue with maxRetries: 2
      const testQueue = new OfflineQueue({
        onSync: mockOnSync,
        onError: mockOnError,
        storageKey: 'testRetryQueue',
        maxRetries: 2
      })
      
      const actionId = testQueue.add({
        type: 'create',
        data: { formData: { title: 'Test' }, token: 'token' }
      })
      
      expect(testQueue.getQueueSize()).toBe(1)
      
      const actions = testQueue.getQueuedActions()
      expect(actions[0].maxRetries).toBe(2)
      expect(actions[0].retries).toBe(0)
      
      testQueue.destroy()
    })
    
    it('accepts different action types', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      const testQueue = new OfflineQueue({
        onSync: mockOnSync,
        onError: mockOnError,
        storageKey: 'testTypesQueue'
      })
      
      // Test that all known action types are accepted
      const createId = testQueue.add({
        type: 'create',
        data: { formData: { title: 'test' }, token: 'token' }
      })
      
      const updateId = testQueue.add({
        type: 'update',
        data: { id: 'song-1', formData: { title: 'updated' }, token: 'token' }
      })
      
      const deleteId = testQueue.add({
        type: 'delete',
        data: { id: 'song-1', token: 'token' }
      })
      
      const rateId = testQueue.add({
        type: 'rate',
        data: { id: 'song-1', rating: 5, token: 'token' }
      })
      
      expect(testQueue.getQueueSize()).toBe(4)
      expect(createId).toMatch(/^create-/)
      expect(updateId).toMatch(/^update-/)
      expect(deleteId).toMatch(/^delete-/)
      expect(rateId).toMatch(/^rate-/)
      
      testQueue.destroy()
    })
    
    it('handles localStorage save errors gracefully', () => {
      const storageError = new Error('Storage full')
      mockLocalStorage.setItem.mockImplementation(() => {
        throw storageError
      })
      
      // Should not throw
      expect(() => {
        queue.add({
          type: 'create',
          data: { formData: { title: 'Test' }, token: 'test-token' }
        })
      }).not.toThrow()
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to save offline queue:',
        storageError
      )
    })
  })
  
  describe('network status handling', () => {
    it('does not process queue when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      queue.add({
        type: 'create',
        data: { formData: { title: 'Test' }, token: 'token' }
      })
      
      await queue.processQueue()
      
      expect(mockSongService.createSong).not.toHaveBeenCalled()
      expect(queue.getQueueSize()).toBe(1)
    })
    
    it('sets up event listeners for online/offline events', () => {
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })
    
    it('processes queue when coming online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      queue.add({
        type: 'create',
        data: { formData: { title: 'Test' }, token: 'token' }
      })
      
      // Simulate coming online
      Object.defineProperty(navigator, 'onLine', { value: true })
      mockSongService.createSong.mockResolvedValue({ id: 'created' })
      
      // Get the online event handler
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1]
      
      if (onlineHandler) {
        onlineHandler()
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      expect(mockSongService.createSong).toHaveBeenCalled()
    })
  })
  
  describe('utility methods', () => {
    it('provides queue size', () => {
      expect(queue.getQueueSize()).toBe(0)
      
      queue.add({ type: 'create', data: { formData: {}, token: 'token' } })
      expect(queue.getQueueSize()).toBe(1)
      
      queue.add({ type: 'update', data: { id: 'song-1', formData: {}, token: 'token' } })
      expect(queue.getQueueSize()).toBe(2)
    })
    
    it('provides queued actions', () => {
      queue.add({ type: 'create', data: { formData: { title: 'Test 1' }, token: 'token' } })
      queue.add({ type: 'update', data: { id: 'song-1', formData: { title: 'Test 2' }, token: 'token' } })
      
      const actions = queue.getQueuedActions()
      expect(actions).toHaveLength(2)
      expect(actions[0].type).toBe('create')
      expect(actions[1].type).toBe('update')
    })
    
    it('can clear queue', () => {
      queue.add({ type: 'create', data: { formData: {}, token: 'token' } })
      queue.add({ type: 'update', data: { id: 'song-1', formData: {}, token: 'token' } })
      
      expect(queue.getQueueSize()).toBe(2)
      
      queue.clearQueue()
      expect(queue.getQueueSize()).toBe(0)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testQueue', '[]')
    })
    
    it('removes event listeners on destroy', () => {
      queue.destroy()
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })
  })
})