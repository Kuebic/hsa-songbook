import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@shared/components/Layout'

// Eagerly load the home page
import { HomePage } from './pages/HomePage'

// Lazy load other pages for code splitting
const SearchPage = lazy(() => import('./pages/SearchPage').then(module => ({ default: module.SearchPage })))
const SetlistDetailPage = lazy(() => import('./pages/SetlistDetailPage').then(module => ({ default: module.SetlistDetailPage })))
const SongListPage = lazy(() => import('@features/songs').then(module => ({ default: module.SongListPage })))
const SongDetailPage = lazy(() => import('@features/songs').then(module => ({ default: module.SongDetailPage })))
const SetlistPage = lazy(() => import('@features/setlists').then(module => ({ default: module.SetlistPage })))

// Loading component for Suspense fallback
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '200px',
    fontSize: '1.2rem',
    color: '#64748b'
  }}>
    Loading...
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/songs" element={<SongListPage />} />
            <Route path="/songs/:slug" element={<SongDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/setlists" element={<SetlistPage />} />
            <Route path="/setlists/:id" element={<SetlistDetailPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}

export default App