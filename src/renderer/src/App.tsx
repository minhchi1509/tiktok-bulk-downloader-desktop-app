import { ThemeProvider as NextThemesProvider } from 'next-themes'
import Layout from './components/Layout'
import { Toaster } from 'sonner'
import { HashRouter, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DonatePage from './pages/DonatePage'

export default function App() {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark">
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/donate" element={<DonatePage />} />
          </Routes>
        </Layout>
        <Toaster />
      </HashRouter>
    </NextThemesProvider>
  )
}
