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
import { UpdateAvailableInfo } from '@shared/types/ipc/ipc-event.type'

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'not-available'

const UpdaterHandler = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [updateInfo, setUpdateInfo] = useState<UpdateAvailableInfo | null>(null)

  useEffect(() => {
    // Listeners
    const removeUpdateAvailable = window.api.onUpdateAvailable((info) => {
      setUpdateInfo(info)
      setStatus('available')
      onOpen()
    })

    const removeUpdateDownloaded = window.api.onUpdateDownloaded(() => {
      setStatus('ready')
      onOpen() // Re-open or ensure open
    })

    const removeDownloadProgress = window.api.onDownloadProgress((prog) => {
      setStatus('downloading')
      setProgress(prog.percent)
    })

    const removeUpdateError = window.api.onUpdateError((err) => {
      setStatus('error')
      console.error(err)
      // Optional: Show toast or modal
    })

    const removeChecking = window.api.onCheckingForUpdate(() => {
      setStatus('checking')
      // Maybe show a toast/loading indicator elsewhere?
    })

    const removeNotAvailable = window.api.onUpdateNotAvailable(() => {
      setStatus('not-available')
      onOpen()
    })

    return () => {
      removeUpdateAvailable()
      removeUpdateDownloaded()
      removeDownloadProgress()
      removeUpdateError()
      removeChecking()
      removeNotAvailable()
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
            <Progress
              value={progress}
              showValueLabel={true}
              label="Downloading..."
              aria-label="Update download progress"
            />
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

    if (status === 'not-available') {
      return (
        <>
          <ModalHeader className="flex flex-col gap-1">No Updates Available</ModalHeader>
          <ModalBody>
            <p>You are using the latest version.</p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onClose}>
              OK
            </Button>
          </ModalFooter>
        </>
      )
    }

    return <></>
  }

  return (
    <Modal
      aria-label="Application update dialog"
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
