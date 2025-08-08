import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationProvider } from '../NotificationProvider'
import { useNotification } from '../useNotification'

// Test component that uses the notification hook
function TestComponent() {
  const { addNotification, clearNotifications, notifications } = useNotification()
  
  return (
    <div>
      <button 
        onClick={() => addNotification({
          type: 'success',
          title: 'Success!',
          message: 'Operation completed'
        })}
      >
        Add Success
      </button>
      
      <button 
        onClick={() => addNotification({
          type: 'error',
          title: 'Error!',
          message: 'Something went wrong',
          duration: 0 // Persistent notification
        })}
      >
        Add Error
      </button>
      
      <button 
        onClick={() => addNotification({
          type: 'info',
          title: 'Info',
          action: {
            label: 'Action',
            onClick: () => console.log('Action clicked')
          }
        })}
      >
        Add Info with Action
      </button>
      
      <button onClick={clearNotifications}>
        Clear All
      </button>
      
      <div data-testid="notification-count">
        {notifications.length}
      </div>
    </div>
  )
}

describe('NotificationProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('throws error when useNotification is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => render(<TestComponent />)).toThrow(
      'useNotification must be used within NotificationProvider'
    )
    
    consoleError.mockRestore()
  })

  it('adds and displays notifications', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Initially no notifications
    expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    
    // Add success notification
    await user.click(screen.getByText('Add Success'))
    
    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
      expect(screen.getByText('Success!')).toBeInTheDocument()
      expect(screen.getByText('Operation completed')).toBeInTheDocument()
      expect(screen.getByText('✅')).toBeInTheDocument()
    })
  })

  it('auto-dismisses notifications after duration', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add notification
    await user.click(screen.getByText('Add Success'))
    
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
    })
    
    // Fast-forward time
    vi.advanceTimersByTime(5000)
    
    await waitFor(() => {
      expect(screen.queryByText('Success!')).not.toBeInTheDocument()
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    })
  })

  it('does not auto-dismiss notifications with duration 0', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add persistent notification
    await user.click(screen.getByText('Add Error'))
    
    await waitFor(() => {
      expect(screen.getByText('Error!')).toBeInTheDocument()
    })
    
    // Fast-forward time - should still be there
    vi.advanceTimersByTime(10000)
    
    await waitFor(() => {
      expect(screen.getByText('Error!')).toBeInTheDocument()
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
    })
  })

  it('manually dismisses notifications', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add notification
    await user.click(screen.getByText('Add Error'))
    
    await waitFor(() => {
      expect(screen.getByText('Error!')).toBeInTheDocument()
    })
    
    // Manually dismiss
    await user.click(screen.getByLabelText('Dismiss notification'))
    
    await waitFor(() => {
      expect(screen.queryByText('Error!')).not.toBeInTheDocument()
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    })
  })

  it('clears all notifications', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add multiple notifications
    await user.click(screen.getByText('Add Success'))
    await user.click(screen.getByText('Add Error'))
    
    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('2')
    })
    
    // Clear all
    await user.click(screen.getByText('Clear All'))
    
    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
      expect(screen.queryByText('Success!')).not.toBeInTheDocument()
      expect(screen.queryByText('Error!')).not.toBeInTheDocument()
    })
  })

  it('renders notifications with actions', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add notification with action
    await user.click(screen.getByText('Add Info with Action'))
    
    await waitFor(() => {
      expect(screen.getByText('Info')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
      expect(screen.getByText('ℹ️')).toBeInTheDocument()
    })
  })

  it('handles multiple notifications correctly', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add multiple different notifications
    await user.click(screen.getByText('Add Success'))
    await user.click(screen.getByText('Add Error'))
    await user.click(screen.getByText('Add Info with Action'))
    
    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('3')
      expect(screen.getByText('Success!')).toBeInTheDocument()
      expect(screen.getByText('Error!')).toBeInTheDocument()
      expect(screen.getByText('Info')).toBeInTheDocument()
    })
    
    // Auto-dismiss should work for success notification
    vi.advanceTimersByTime(5000)
    
    await waitFor(() => {
      expect(screen.getByTestId('notification-count')).toHaveTextContent('2')
      expect(screen.queryByText('Success!')).not.toBeInTheDocument()
      expect(screen.getByText('Error!')).toBeInTheDocument() // Persistent
      expect(screen.getByText('Info')).toBeInTheDocument() // Has action
    })
  })
})