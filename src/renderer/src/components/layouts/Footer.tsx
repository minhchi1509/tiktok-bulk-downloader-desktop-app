import { Link } from '@heroui/react'
import { FacebookLogoIcon, GithubLogoIcon } from '@renderer/assets/icons'

const Footer = () => {
  return (
    <footer className="w-full py-4 px-6 flex flex-col md:flex-row items-center justify-between border-t border-divider bg-background/60 backdrop-blur-md">
      <div>
        Created by <span className="font-semibold text-primary">@minhchi1509</span>
      </div>
      <div className="flex items-center gap-4 mt-2 md:mt-0">
        <Link target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/minhchi1509">
          <FacebookLogoIcon width={20} height={20} />
        </Link>
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/minhchi1509/tiktok-bulk-downloader-desktop-app"
          className="text-black dark:text-white hover:text-black/80 dark:hover:text-white/80"
        >
          <GithubLogoIcon width={20} height={20} />
        </Link>
      </div>
    </footer>
  )
}

export default Footer
