import { Tabs, Tab } from '@heroui/react'
import BulkDownloader from '../features/BulkDownloader'
import SingleDownloader from '../features/SingleDownloader'

export default function HomePage() {
  return (
    <div className="flex w-full flex-col h-[calc(100vh-140px)]">
      <Tabs
        aria-label="Features"
        destroyInactiveTabPanel={false}
        color="primary"
        variant="underlined"
        classNames={{
          tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-divider',
          cursor: 'w-full bg-primary',
          tab: 'max-w-fit px-0 h-12',
          tabContent: 'group-data-[selected=true]:text-primary'
        }}
      >
        <Tab key="bulk" title="Bulk Download">
          <div className="pt-4 h-full">
            <BulkDownloader />
          </div>
        </Tab>
        <Tab key="single" title="Multi-URLs Download">
          <div className="pt-4 h-full">
            <SingleDownloader />
          </div>
        </Tab>
      </Tabs>
    </div>
  )
}
