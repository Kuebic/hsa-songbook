import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@shared/components/Layout'
// PWA features temporarily disabled
// import { UpdatePrompt, InstallPrompt, OfflineIndicator, LazyRouteWrapper } from '@features/pwa'
// import { setupOfflineHandlers } from '@features/pwa/utils/offline'
import { LazyRouteWrapper } from '@features/pwa'
import { ErrorBoundary, useWebVitals } from '@features/monitoring'
import { NotificationProvider } from '@shared/components/notifications'
import { ThemeProvider } from '@shared/contexts/ThemeContext'
import { SongModalProvider } from '@features/songs/contexts/SongModalContext'
import { GlobalSongModal } from '@features/songs/components/GlobalSongModal'

// Eagerly load the home page
import { HomePage } from './pages/HomePage'

// Lazy load other pages for code splitting
const SearchPage = lazy(() => import('./pages/SearchPage').then(module => ({ default: module.SearchPage })))
const SongListPage = lazy(() => import('@features/songs').then(module => ({ default: module.SongListPage })))
const SongDetailPage = lazy(() => import('@features/songs').then(module => ({ default: module.SongDetailPage })))
const SetlistsPage = lazy(() => import('@features/setlists').then(module => ({ default: module.SetlistsPage })))
const ArrangementViewerPage = lazy(() => import('@features/arrangements/pages/ArrangementViewerPage').then(module => ({ default: module.ArrangementViewerPage })))
const ChordEditingPage = lazy(() => import('@features/arrangements/pages/ChordEditingPage').then(module => ({ default: module.ChordEditingPage })))

function App() {
  // Initialize web vitals monitoring
  useWebVitals()

  // PWA offline handlers temporarily disabled
  // useEffect(() => {
  //   setupOfflineHandlers()
  // }, [])

  return (
    <ErrorBoundary level="app">
      <ThemeProvider>
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
                    <SetlistsPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/setlists/:id" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Setlist Details">
                    <SetlistsPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/setlists/:id/play" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Setlist Playback">
                    <SetlistsPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            <Route 
              path="/setlists/:id/play/:index" 
              element={
                <ErrorBoundary level="page">
                  <LazyRouteWrapper pageName="Setlist Playback">
                    <SetlistsPage />
                  </LazyRouteWrapper>
                </ErrorBoundary>
              } 
            />
            </Routes>
            {/* PWA Components - temporarily disabled */}
            {/* <OfflineIndicator /> */}
            {/* <UpdatePrompt /> */}
            {/* <InstallPrompt /> */}
          </Layout>
          
          {/* Global Song Management Modal */}
          <GlobalSongModal />
            </BrowserRouter>
          </SongModalProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App