import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'

export function useAuth() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser()
  const { userId, sessionId, getToken } = useClerkAuth()

  // Check if user has admin role (you can customize this based on your Clerk metadata)
  const isAdmin = user?.publicMetadata?.role === 'admin' || 
                  user?.emailAddresses?.some(email => 
                    email.emailAddress?.includes('@admin.hsa-songbook.com')
                  )

  return {
    user,
    userId,
    sessionId,
    isLoaded: userLoaded,
    isSignedIn,
    isAdmin,
    getToken,
    // Helper methods
    getUserEmail: () => user?.primaryEmailAddress?.emailAddress,
    getUserName: () => user?.fullName || user?.firstName || 'User',
    getUserAvatar: () => user?.imageUrl
  }
}