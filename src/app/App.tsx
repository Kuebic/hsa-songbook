import { lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@shared/components/Layout'
import { UpdatePrompt, InstallPrompt, OfflineIndicator, LazyRouteWrapper } from '@features/pwa'
import { setupOfflineHandlers } from '@features/pwa/utils/offline'
import { ErrorBoundary, useWebVitals } from '@features/monitoring'
import { NotificationProvider } from '@shared/components/notifications'
import { ThemeProvider } from '@shared/contexts/ThemeContext'

// Eagerly load the home page
import { HomePage } from './pages/HomePage'
import { TestEditorPage } from './pages/TestEditorPage'

// Lazy load other pages for code splitting
const SearchPage = lazy(() => import('./pages/SearchPage').then(module => ({ default: module.SearchPage })))
const SetlistDetailPage = lazy(() => import('./pages/SetlistDetailPage').then(module => ({ default: module.SetlistDetailPage })))
const SongListPage = lazy(() => import('@features/songs').then(module => ({ default: module.SongListPage })))
const SongDetailPage = lazy(() => import('@features/songs').then(module => ({ default: module.SongDetailPage })))
const SetlistPage = lazy(() => import('@features/setlists').then(module => ({ default: module.SetlistPage })))
const ArrangementViewerPage = lazy(() => import('@features/arrangements/pages/ArrangementViewerPage').then(module => ({ default: module.ArrangementViewerPage })))
const ChordEditingPage = lazy(() => import('@features/arrangements/pages/ChordEditingPage').then(module => ({ default: module.ChordEditingPage })))

function App() {
  // Initialize web vitals monitoring
  useWebVitals()

  // Setup offline handlers on mount
  useEffect(() => {
    setupOfflineHandlers()
  }, [])

  return (
    <ErrorBoundary level="app">
      <ThemeProvider>
        <NotificationProvider>
          <BrowserRouter>
          <Layout>
            <Routes>
            <Route path="/" element={
              <ErrorBoundary level="page">
                <HomePage />
              </ErrorBoundary>
            } />
            <Route path="/test-editor" element={
              <ErrorBoundary level="page">
                <TestEditorPage />
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
                    <ChordEditingPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/arrangements/new" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="New Arrangement">
                    <ChordEditingPage />
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
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App