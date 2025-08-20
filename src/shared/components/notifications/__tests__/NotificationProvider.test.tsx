import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, cleanup } from '@testing-library/react'
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
  afterEach(() => {
    // Cleanup after each test to prevent test pollution
    cleanup()
    vi.restoreAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
    // Clear any remaining DOM elements
    document.body.innerHTML = ''
  })

  it('throws error when useNotification is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => render(<TestComponent />)).toThrow(
      'useNotification must be used within NotificationProvider'
    )
    
    consoleError.mockRestore()
  })

  it('adds and displays notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Initially no notifications
    expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
    
    // Add success notification
    const addButton = screen.getByText('Add Success')
    await act(async () => {
      await userEvent.click(addButton)
    })
    
    await waitFor(
      () => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
        expect(screen.getByText('Success!')).toBeInTheDocument()
        expect(screen.getByText('Operation completed')).toBeInTheDocument()
        expect(screen.getByText('✅')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('auto-dismisses notifications after duration', async () => {
    // Use real timers with a shorter duration for the test
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add notification
    const addButton = screen.getByText('Add Success')
    await act(async () => {
      await userEvent.click(addButton)
    })
    
    await waitFor(
      () => {
        expect(screen.getByText('Success!')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
    
    // Wait for auto-dismiss with real timer (5 seconds)
    await waitFor(
      () => {
        expect(screen.queryByText('Success!')).not.toBeInTheDocument()
        expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
      },
      { timeout: 6000 }
    )
  })

  it('does not auto-dismiss notifications with duration 0', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add persistent notification
    const addButton = screen.getByText('Add Error')
    await act(async () => {
      await userEvent.click(addButton)
    })
    
    await waitFor(
      () => {
        expect(screen.getByText('Error!')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
    
    // Wait a bit and ensure it's still there (no auto-dismiss)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    expect(screen.getByText('Error!')).toBeInTheDocument()
    expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
  })

  it('manually dismisses notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add notification
    const addButton = screen.getByText('Add Error')
    await act(async () => {
      await userEvent.click(addButton)
    })
    
    await waitFor(
      () => {
        expect(screen.getByText('Error!')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
    
    // Manually dismiss
    const dismissButton = screen.getByLabelText('Dismiss notification')
    await act(async () => {
      await userEvent.click(dismissButton)
    })
    
    await waitFor(
      () => {
        expect(screen.queryByText('Error!')).not.toBeInTheDocument()
        expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
      },
      { timeout: 3000 }
    )
  })

  it('clears all notifications', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add multiple notifications
    const successButton = screen.getByText('Add Success')
    const errorButton = screen.getByText('Add Error')
    await act(async () => {
      await userEvent.click(successButton)
      await userEvent.click(errorButton)
    })
    
    await waitFor(
      () => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('2')
      },
      { timeout: 3000 }
    )
    
    // Clear all
    const clearButton = screen.getByText('Clear All')
    await act(async () => {
      await userEvent.click(clearButton)
    })
    
    await waitFor(
      () => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
        expect(screen.queryByText('Success!')).not.toBeInTheDocument()
        expect(screen.queryByText('Error!')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('renders notifications with actions', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add notification with action
    const addButton = screen.getByText('Add Info with Action')
    await act(async () => {
      await userEvent.click(addButton)
    })
    
    await waitFor(
      () => {
        expect(screen.getByText('Info')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
        expect(screen.getByText('ℹ️')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('handles multiple notifications correctly', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )
    
    // Add multiple different notifications
    const successButton = screen.getByText('Add Success')
    const errorButton = screen.getByText('Add Error')
    const infoButton = screen.getByText('Add Info with Action')
    await act(async () => {
      await userEvent.click(successButton)
      await userEvent.click(errorButton)
      await userEvent.click(infoButton)
    })
    
    await waitFor(
      () => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('3')
        expect(screen.getByText('Success!')).toBeInTheDocument()
        expect(screen.getByText('Error!')).toBeInTheDocument()
        expect(screen.getByText('Info')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
    
    // Wait for success notification auto-dismiss (5 seconds)
    await waitFor(
      () => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('2')
        expect(screen.queryByText('Success!')).not.toBeInTheDocument()
        expect(screen.getByText('Error!')).toBeInTheDocument() // Persistent
        expect(screen.getByText('Info')).toBeInTheDocument() // Has action
      },
      { timeout: 6000 }
    )
  })
})