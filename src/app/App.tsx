import { lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@shared/components/Layout'
import { UpdatePrompt, InstallPrompt, OfflineIndicator, LazyRouteWrapper } from '@features/pwa'
import { setupOfflineHandlers } from '@features/pwa/utils/offline'
import { ErrorBoundary, useWebVitals } from '@features/monitoring'
import { NotificationProvider } from '@shared/components/notifications'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import { SongModalProvider } from '@features/songs/contexts/SongModalContext.tsx'
import { GlobalSongModal } from '@features/songs/components/GlobalSongModal'
import { ProtectedRoute, AuthProvider } from '@features/auth'
import { initializePrefetching, prefetchCriticalRoutes } from './utils/routePrefetch'

// Import feature-specific error boundaries
import { ArrangementErrorBoundary } from '@features/arrangements/components/ArrangementErrorBoundary'
import { SongListErrorBoundary } from '@features/songs/components/SongListErrorBoundary'
import { SetlistErrorBoundary } from '@features/setlists/components/SetlistErrorBoundary'

// Eagerly load the home page
import { HomePage } from './pages/HomePage'

// Lazy load other pages for code splitting with chunk names
const SearchPage = lazy(() => import(/* webpackChunkName: "SearchPage" */ './pages/SearchPage').then(module => ({ default: module.SearchPage })))
const SongListPage = lazy(() => import(/* webpackChunkName: "SongListPage" */ '@features/songs').then(module => ({ default: module.SongListPage })))
const SongDetailPage = lazy(() => import(/* webpackChunkName: "SongDetailPage" */ '@features/songs').then(module => ({ default: module.SongDetailPage })))
const SetlistsPage = lazy(() => import(/* webpackChunkName: "SetlistsPage" */ '@features/setlists').then(module => ({ default: module.SetlistsPage })))
const ArrangementViewerPage = lazy(() => import(/* webpackChunkName: "ArrangementViewerPage" */ '@features/arrangements/pages/ArrangementViewerPage').then(module => ({ default: module.ArrangementViewerPage })))
const ChordEditingPage = lazy(() => import(/* webpackChunkName: "ChordEditingPage" */ '@features/arrangements/pages/ChordEditingPage').then(module => ({ default: module.ChordEditingPage })))
const AdminDashboard = lazy(() => import(/* webpackChunkName: "AdminDashboard" */ './pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })))
const ModerationDashboard = lazy(() => import(/* webpackChunkName: "ModerationDashboard" */ './pages/ModerationDashboard').then(module => ({ default: module.ModerationDashboard })))
const PermissionManagement = lazy(() => import(/* webpackChunkName: "PermissionManagement" */ './pages/PermissionManagement').then(module => ({ default: module.PermissionManagement })))

function App() {
  // Initialize web vitals monitoring
  useWebVitals()

  // Initialize PWA offline handlers and prefetching
  useEffect(() => {
    setupOfflineHandlers()
    
    // Initialize intelligent prefetching
    initializePrefetching()
    
    // Prefetch critical routes on idle
    prefetchCriticalRoutes()
  }, [])

  return (
    <ErrorBoundary level="app">
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <SongModalProvider>
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
                    <SongListErrorBoundary>
                      <SongListPage />
                    </SongListErrorBoundary>
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
              path="/arrangements/:slug" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Arrangement Viewer">
                    <ArrangementViewerPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/arrangements/:slug/edit" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Chord Editor">
                    <ProtectedRoute>
                      <ArrangementErrorBoundary>
                        <ChordEditingPage />
                      </ArrangementErrorBoundary>
                    </ProtectedRoute>
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/arrangements/new" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="New Arrangement">
                    <ProtectedRoute>
                      <ArrangementErrorBoundary>
                        <ChordEditingPage />
                      </ArrangementErrorBoundary>
                    </ProtectedRoute>
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
                    <SetlistErrorBoundary>
                      <SetlistsPage />
                    </SetlistErrorBoundary>
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/setlists/:id" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Setlist Details">
                    <SetlistErrorBoundary>
                      <SetlistsPage />
                    </SetlistErrorBoundary>
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/setlists/:id/play" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Setlist Playback">
                    <SetlistErrorBoundary>
                      <SetlistsPage />
                    </SetlistErrorBoundary>
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/setlists/:id/play/:index" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Setlist Playback">
                    <SetlistErrorBoundary>
                      <SetlistsPage />
                    </SetlistErrorBoundary>
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/moderation" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Moderation Dashboard">
                    <ProtectedRoute>
                      <ModerationDashboard />
                    </ProtectedRoute>
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Admin Dashboard">
                    <ProtectedRoute requireAdmin={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/admin/permissions" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Permission Management">
                    <ProtectedRoute requireAdmin={true}>
                      <PermissionManagement />
                    </ProtectedRoute>
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
          
          {/* Global Song Management Modal */}
          <GlobalSongModal />
            </BrowserRouter>
          </SongModalProvider>
        </NotificationProvider>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App