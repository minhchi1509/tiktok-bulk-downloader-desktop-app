import { ThemeProvider as NextThemesProvider } from 'next-themes'
import Layout from './components/Layout'
import { Toaster } from 'sonner'
import { HashRouter, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import { EAppRoutes } from '@renderer/constants/route.constant'
import PricingPage from './pages/PricingPage'

export default function App() {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark">
      <HashRouter>
        <Layout>
          <Routes>
            <Route path={EAppRoutes.HOME} element={<HomePage />} />
            <Route path={EAppRoutes.PRICING} element={<PricingPage />} />
          </Routes>
        </Layout>
        <Toaster />
      </HashRouter>
    </NextThemesProvider>
  )
}
