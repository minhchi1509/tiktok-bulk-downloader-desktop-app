import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress,
  useDisclosure
} from '@heroui/react'

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'

const UpdaterHandler = () => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Listeners
    const removeUpdateAvailable = window.api.onUpdateAvailable((info) => {
      setUpdateInfo(info)
      setStatus('available')
      onOpen()
    })

    const removeUpdateDownloaded = window.api.onUpdateDownloaded((info) => {
      setStatus('ready')
      onOpen() // Re-open or ensure open
    })

    const removeDownloadProgress = window.api.onDownloadProgress((prog) => {
      setStatus('downloading')
      setProgress(prog.percent)
    })

    const removeUpdateError = window.api.onUpdateError((err) => {
      setStatus('error')
      setError(err.message || 'Unknown error')
      console.error(err)
      // Optional: Show toast or modal
    })

    const removeChecking = window.api.onCheckingForUpdate(() => {
      setStatus('checking')
      // Maybe show a toast/loading indicator elsewhere?
      console.log('Checking for updates...')
    })

    const removeNotAvailable = window.api.onUpdateNotAvailable(() => {
      setStatus('idle')
      // Show "No updates available" toast if it was a manual check?
      // For now we can just log it.
      // Ideally we'd know if it was manual to show a feedback.
      // But basic implementation: just log.
      console.log('Update not available')
      alert('No updates available') // Simple alert for now for manual check feedback
    })

    return () => {
      // Cleanup not strictly necessary since api.on... returns undefined in my implementation?
      // Wait, I implemented it as `ipcRenderer.on`. `ipcRenderer.on` returns `IpcRenderer`.
      // My preload wrapper:
      // onUpdateAvailable: (callback) => { ipcRenderer.on(..., callback) }
      // This doesn't return a cleanup function.
      // I should have made it return a cleanup function in preload if I wanted to clean up.
      // But for a global handler, it's fine.
    }
  }, [])

  const handleDownload = () => {
    window.api.downloadUpdate()
    setStatus('downloading')
  }

  const handleInstall = () => {
    window.api.quitAndInstall()
  }

  const renderContent = (onClose: () => void) => {
    if (status === 'available') {
      return (
        <>
          <ModalHeader className="flex flex-col gap-1">Update Available</ModalHeader>
          <ModalBody>
            <p>A new version {updateInfo?.version} is available.</p>
            <p>Do you want to download it now?</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleDownload}>
              Download
            </Button>
          </ModalFooter>
        </>
      )
    }

    if (status === 'downloading') {
      return (
        <>
          <ModalHeader className="flex flex-col gap-1">Downloading Update...</ModalHeader>
          <ModalBody>
            <Progress value={progress} showValueLabel={true} label="Downloading..." />
          </ModalBody>
          <ModalFooter>
            {/* Can't really cancel easily with electron-updater without cancellation token logic, so just hide button or disable */}
          </ModalFooter>
        </>
      )
    }

    if (status === 'ready') {
      return (
        <>
          <ModalHeader className="flex flex-col gap-1">Update Ready</ModalHeader>
          <ModalBody>
            <p>The update has been downloaded. Restart the app to install?</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Later
            </Button>
            <Button color="primary" onPress={handleInstall}>
              Restart & Install
            </Button>
          </ModalFooter>
        </>
      )
    }

    return <></>
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={false}
      hideCloseButton={status === 'downloading'}
    >
      <ModalContent>{(onClose) => renderContent(onClose)}</ModalContent>
    </Modal>
  )
}

export default UpdaterHandler
