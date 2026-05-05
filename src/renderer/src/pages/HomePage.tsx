import { Tabs } from '@heroui/react'
import BulkDownloader from '@renderer/features/BulkDownloader'
import MultiUrlDownloader from '@renderer/features/MultiUrlDownloader'

export default function HomePage() {
  return (
    <div className="flex w-full flex-col">
      <Tabs variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Options" className="gap-6 *:data-[selected=true]:text-accent">
            <Tabs.Tab id="bulk" className="max-w-fit">
              Bulk Download
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="multi-urls" className="max-w-fit">
              Multi-URLs Download
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4 h-full" id="bulk">
          <BulkDownloader />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4 h-full" id="multi-urls">
          <MultiUrlDownloader />
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}
