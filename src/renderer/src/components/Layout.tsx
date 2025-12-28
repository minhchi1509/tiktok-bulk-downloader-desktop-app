import { ReactNode } from 'react'
import Footer from './Footer'
import UpdaterHandler from './UpdaterHandler'
import { Button, Tooltip } from '@heroui/react'
import { Moon, Sun, RotateCw } from 'lucide-react'
import { useTheme } from 'next-themes'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-divider bg-background/60 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="app-drag w-full h-full absolute top-0 left-0 z-0 pointer-events-none" />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-500 to-cyan-500 z-10">
            Tiktok Bulk Downloader
          </h1>
        </div>

        <div className="flex items-center gap-2 z-10 app-no-drag">
          <Tooltip content="Check for Updates">
            <Button
              isIconOnly
              variant="light"
              onPress={() => window.api.checkForUpdates()}
              aria-label="Check for Updates"
              className="text-default-500"
            >
              <RotateCw size={20} />
            </Button>
          </Tooltip>
          <Button
            isIconOnly
            variant="light"
            onPress={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="text-default-500"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 overflow-auto flex flex-col">
        {children}
      </main>

      <Footer />
      <UpdaterHandler />
    </div>
  )
}

export default Layout
