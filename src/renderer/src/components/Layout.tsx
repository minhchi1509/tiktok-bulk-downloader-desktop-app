import { ReactNode } from 'react'
import Footer from './Footer'
import UpdaterHandler from './UpdaterHandler'
import { Button, Tooltip } from '@heroui/react'
import { Moon, Sun, RotateCw, CircleDollarSign } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useNavigate } from 'react-router-dom'
import { EAppRoutes } from '@renderer/constants/route.constant'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-divider backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="app-drag w-full h-full absolute top-0 left-0 z-0 pointer-events-none" />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-500 to-cyan-500 z-10">
            Tiktok Bulk Downloader
          </h1>
        </div>

        <div className="flex items-center gap-2 z-10 app-no-drag">
          <Tooltip delay={0}>
            <Tooltip.Trigger>
              <Button
                onClick={() => navigate(EAppRoutes.PRICING)}
                isIconOnly
                variant="tertiary"
                aria-label="Pricing"
              >
                <CircleDollarSign size={20} />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Pricing</Tooltip.Content>
          </Tooltip>
          <Tooltip delay={0}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                variant="tertiary"
                onPress={() => window.api.checkForUpdates()}
                aria-label="Check for Updates"
              >
                <RotateCw size={20} />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Check for Updates</Tooltip.Content>
          </Tooltip>
          <Button isIconOnly variant="tertiary" onPress={toggleTheme} aria-label="Toggle Dark Mode">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 overflow-auto flex flex-col bg-background">
        {children}
      </main>

      <Footer />
      <UpdaterHandler />
    </div>
  )
}

export default Layout
