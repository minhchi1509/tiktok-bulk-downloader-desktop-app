import { useState, useEffect } from 'react'
import { Modal, Button, useOverlayState } from '@heroui/react'
import { UpdateAvailableInfo } from '@shared/types/ipc/ipc-event.type'
import ProgressBar from '@renderer/components/ProgressBar'

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'not-available'

const UpdaterHandler = () => {
  const modalState = useOverlayState()
  const { open: openModal, close: closeModal } = modalState
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [updateInfo, setUpdateInfo] = useState<UpdateAvailableInfo | null>(null)

  useEffect(() => {
    // Listeners
    const removeUpdateAvailable = window.api.onUpdateAvailable((info) => {
      setUpdateInfo(info)
      setStatus('available')
      openModal()
    })

    const removeUpdateDownloaded = window.api.onUpdateDownloaded(() => {
      setStatus('ready')
      openModal() // Re-open or ensure open
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
      openModal()
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

  const renderModalByStatus = {
    available: {
      title: () => 'Update Available',
      body: () => (
        <>
          <p>A new version {updateInfo?.version} is available.</p>
          <p>Do you want to download it now?</p>
        </>
      ),
      footer: () => (
        <>
          <Button variant="danger" onPress={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleDownload}>
            Download
          </Button>
        </>
      )
    },
    downloading: {
      title: () => 'Downloading Update',
      body: () => <ProgressBar label="Downloading..." value={progress} />,
      footer: () => null // No buttons during download
    },
    ready: {
      title: () => 'Update Ready',
      body: () => <p>The update has been downloaded. Restart the app to install?</p>,
      footer: () => (
        <>
          <Button variant="danger" onPress={closeModal}>
            Later
          </Button>
          <Button variant="primary" onPress={handleInstall}>
            Restart & Install
          </Button>
        </>
      )
    },
    'not-available': {
      title: () => 'No Updates Available',
      body: () => <p>You are using the latest version.</p>,
      footer: () => (
        <Button variant="primary" onPress={closeModal}>
          OK
        </Button>
      )
    }
  }

  return (
    <Modal state={modalState}>
      <Modal.Backdrop isDismissable={status !== 'downloading'} variant="blur">
        <Modal.Container>
          <Modal.Dialog>
            {status !== 'downloading' && <Modal.CloseTrigger />}
            <Modal.Header>
              <Modal.Heading>{renderModalByStatus[status]?.title()}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>{renderModalByStatus[status]?.body()}</Modal.Body>
            <Modal.Footer>{renderModalByStatus[status]?.footer()}</Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export default UpdaterHandler
