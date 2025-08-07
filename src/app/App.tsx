import { lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@shared/components/Layout'
import { UpdatePrompt, InstallPrompt, OfflineIndicator, LazyRouteWrapper } from '@features/pwa'
import { setupOfflineHandlers } from '@features/pwa/utils/offline'

// Eagerly load the home page
import { HomePage } from './pages/HomePage'

// Lazy load other pages for code splitting
const SearchPage = lazy(() => import('./pages/SearchPage').then(module => ({ default: module.SearchPage })))
const SetlistDetailPage = lazy(() => import('./pages/SetlistDetailPage').then(module => ({ default: module.SetlistDetailPage })))
const SongListPage = lazy(() => import('@features/songs').then(module => ({ default: module.SongListPage })))
const SongDetailPage = lazy(() => import('@features/songs').then(module => ({ default: module.SongDetailPage })))
const SetlistPage = lazy(() => import('@features/setlists').then(module => ({ default: module.SetlistPage })))

function App() {
  // Setup offline handlers on mount
  useEffect(() => {
    setupOfflineHandlers()
  }, [])

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/songs" 
            element={
              <LazyRouteWrapper pageName="Songs">
                <SongListPage />
              </LazyRouteWrapper>
            } 
          />
          <Route 
            path="/songs/:slug" 
            element={
              <LazyRouteWrapper pageName="Song Details">
                <SongDetailPage />
              </LazyRouteWrapper>
            } 
          />
          <Route 
            path="/search" 
            element={
              <LazyRouteWrapper pageName="Search">
                <SearchPage />
              </LazyRouteWrapper>
            } 
          />
          <Route 
            path="/setlists" 
            element={
              <LazyRouteWrapper pageName="Setlists">
                <SetlistPage />
              </LazyRouteWrapper>
            } 
          />
          <Route 
            path="/setlists/:id" 
            element={
              <LazyRouteWrapper pageName="Setlist Details">
                <SetlistDetailPage />
              </LazyRouteWrapper>
            } 
          />
        </Routes>
        {/* PWA Components */}
        <OfflineIndicator />
        <UpdatePrompt />
        <InstallPrompt />
      </Layout>
    </BrowserRouter>
  )
}

export default App