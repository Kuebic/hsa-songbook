import { useEffect, useState, useCallback } from 'react'
import type { BeforeInstallPromptEvent, InstallPromptState } from '../types/pwa.types'

export function useInstallPrompt() {
  const [installPromptState, setInstallPromptState] = useState<InstallPromptState>({
    prompt: null,
    isInstallable: false,
    isInstalled: false,
    platform: null
  })

  // Detect platform
  const detectPlatform = useCallback((): 'ios' | 'android' | 'desktop' => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios'
    if (/android/.test(userAgent)) return 'android'
    return 'desktop'
  }, [])

  // Check if app is already installed
  const checkIfInstalled = useCallback(() => {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    // Check for iOS standalone
    const isIOSStandalone = ('standalone' in window.navigator) && 
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    // Check if installed as PWA
    const isInstalled = isStandalone || isIOSStandalone || document.referrer.includes('android-app://')
    
    return isInstalled
  }, [])

  useEffect(() => {
    const platform = detectPlatform()
    const isInstalled = checkIfInstalled()

    setInstallPromptState(prev => ({
      ...prev,
      platform,
      isInstalled
    }))

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      
      // Store the event so it can be triggered later
      setInstallPromptState(prev => ({
        ...prev,
        prompt: e,
        isInstallable: true,
        isInstalled: false
      }))

      // Store in window for debugging
      window.deferredPrompt = e
    }

    // Handle app installed event
    const handleAppInstalled = () => {
      setInstallPromptState(prev => ({
        ...prev,
        prompt: null,
        isInstallable: false,
        isInstalled: true
      }))
      
      // Clear the deferredPrompt
      window.deferredPrompt = undefined
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [detectPlatform, checkIfInstalled])

  const promptInstall = useCallback(async () => {
    const { prompt } = installPromptState
    
    if (!prompt) {
      console.log('No installation prompt available')
      return false
    }

    try {
      // Show the install prompt
      await prompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await prompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setInstallPromptState(prev => ({
          ...prev,
          prompt: null,
          isInstallable: false,
          isInstalled: true
        }))
        return true
      } else {
        console.log('User dismissed the install prompt')
        // Keep the prompt available for later
        return false
      }
    } catch (error) {
      console.error('Error showing install prompt:', error)
      return false
    }
  }, [installPromptState])

  const dismissPrompt = useCallback(() => {
    setInstallPromptState(prev => ({
      ...prev,
      isInstallable: false
    }))
  }, [])

  return {
    ...installPromptState,
    promptInstall,
    dismissPrompt
  }
}