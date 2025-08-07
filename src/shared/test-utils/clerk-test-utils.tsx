/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { 
  setUserState, 
  setAuthState, 
  type RenderOptions 
} from './clerk-test-helpers'

// Mock ClerkProvider for testing - Component only
export const MockClerkProvider = ({ children }: { 
  children: ReactNode,
}) => {
  return <>{children}</>
}

// Custom render function with providers
export function renderWithClerk(
  ui: React.ReactElement,
  {
    user = null,
    isSignedIn = false,
    isLoaded = true,
    initialEntries = ['/'],
    ...renderOptions
  }: RenderOptions = {}
) {
  // Set the mock state for this render
  if (user && isSignedIn) {
    setUserState(user, true)
  } else {
    setAuthState({ isSignedIn, isLoaded })
  }
  
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <MockClerkProvider>
          {children}
        </MockClerkProvider>
      </MemoryRouter>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}