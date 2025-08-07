import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@shared/components/Layout'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'
import { SetlistDetailPage } from './pages/SetlistDetailPage'
import { SongListPage, SongDetailPage } from '@features/songs'
import { SetlistPage } from '@features/setlists'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/songs" element={<SongListPage />} />
          <Route path="/songs/:slug" element={<SongDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/setlists" element={<SetlistPage />} />
          <Route path="/setlists/:id" element={<SetlistDetailPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App