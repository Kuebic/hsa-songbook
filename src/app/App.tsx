import { lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@shared/components/Layout'
import { UpdatePrompt, InstallPrompt, OfflineIndicator, LazyRouteWrapper } from '@features/pwa'
import { setupOfflineHandlers } from '@features/pwa/utils/offline'
import { ErrorBoundary, useWebVitals } from '@features/monitoring'
import { NotificationProvider } from '@shared/components/notifications'

// Eagerly load the home page
import { HomePage } from './pages/HomePage'

// Lazy load other pages for code splitting
const SearchPage = lazy(() => import('./pages/SearchPage').then(module => ({ default: module.SearchPage })))
const SetlistDetailPage = lazy(() => import('./pages/SetlistDetailPage').then(module => ({ default: module.SetlistDetailPage })))
const SongListPage = lazy(() => import('@features/songs').then(module => ({ default: module.SongListPage })))
const SongDetailPage = lazy(() => import('@features/songs').then(module => ({ default: module.SongDetailPage })))
const SetlistPage = lazy(() => import('@features/setlists').then(module => ({ default: module.SetlistPage })))

function App() {
  // Initialize web vitals monitoring
  useWebVitals()

  // Setup offline handlers on mount
  useEffect(() => {
    setupOfflineHandlers()
  }, [])

  return (
    <ErrorBoundary level="app">
      <NotificationProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
            <Route path="/" element={
              <ErrorBoundary level="page">
                <HomePage />
              </ErrorBoundary>
            } />
            <Route 
              path="/songs" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Songs">
                    <SongListPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/songs/:slug" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Song Details">
                    <SongDetailPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/search" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Search">
                    <SearchPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/setlists" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Setlists">
                    <SetlistPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/setlists/:id" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Setlist Details">
                    <SetlistDetailPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            </Routes>
            {/* PWA Components */}
            <OfflineIndicator />
            <UpdatePrompt />
            <InstallPrompt />
          </Layout>
        </BrowserRouter>
      </NotificationProvider>
    </ErrorBoundary>
  )
}

export default App