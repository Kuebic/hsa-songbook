// Mock implementation of LazyClerkComponents for testing
// This provides synchronous components without lazy loading to avoid Suspense issues in tests

import React from 'react'

interface MockComponentProps {
  children?: React.ReactNode
  [key: string]: unknown
}

// Export synchronous versions of the lazy components
export const LazySignInButton = ({ children, ...props }: MockComponentProps) => {
  // Filter out Clerk-specific props that shouldn't be passed to DOM elements
  const { 
    mode: _mode, 
    redirectUrl: _redirectUrl, 
    signUpUrl: _signUpUrl, 
    forceRedirectUrl: _forceRedirectUrl,
    fallbackRedirectUrl: _fallbackRedirectUrl,
    ...domProps 
  } = props || {}
  
  if (children) {
    return <div {...domProps}>{children}</div>
  }
  return <button data-testid="sign-in-button" {...domProps}>Sign In</button>
}

export const LazySignUpButton = ({ children, ...props }: MockComponentProps) => {
  // Filter out Clerk-specific props that shouldn't be passed to DOM elements
  const { 
    mode: _mode, 
    redirectUrl: _redirectUrl, 
    signInUrl: _signInUrl, 
    forceRedirectUrl: _forceRedirectUrl,
    fallbackRedirectUrl: _fallbackRedirectUrl,
    ...domProps 
  } = props || {}
  
  if (children) {
    return <div {...domProps}>{children}</div>
  }
  return <button data-testid="sign-up-button" {...domProps}>Sign Up</button>
}

export const LazyUserButton = (props: MockComponentProps) => {
  // Filter out Clerk-specific props that shouldn't be passed to DOM elements
  const { 
    afterSignOutUrl: _afterSignOutUrl, 
    appearance: _appearance, 
    showName: _showName,
    signInUrl: _signInUrl,
    userProfileUrl: _userProfileUrl,
    userProfileMode: _userProfileMode,
    defaultOpen: _defaultOpen,
    ...domProps 
  } = props || {}
  
  return (
    <button 
      data-testid="user-button" 
      data-after-sign-out-url={_afterSignOutUrl as string}
      {...domProps}
    >
      User
    </button>
  )
}

export const LazySignedIn = ({ children }: MockComponentProps) => {
  // This would normally check auth state, but for testing we'll just render children
  // Individual tests can control this behavior by mocking useAuth
  return <>{children}</>
}

export const LazySignedOut = ({ children }: MockComponentProps) => {
  // This would normally check auth state, but for testing we'll just render children
  // Individual tests can control this behavior by mocking useAuth
  return <>{children}</>
}

// Loading component - not needed in tests but provided for completeness
export function ClerkComponentLoader() {
  return <div data-testid="clerk-loader">Loading...</div>
}