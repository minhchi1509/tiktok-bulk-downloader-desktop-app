import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Modal, Button, useOverlayState } from '@heroui/react'
import type { UpdateAvailableInfo } from '@shared/types/ipc/ipc-event.type'
import ProgressBar from '@renderer/components/ui/ProgressBar'

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'not-available'

type CheckMode = 'silent' | 'visible'

interface UpdaterHandlerProps {
  checkRequestId: number
}

interface ModalContent {
  title: () => ReactNode
  body: () => ReactNode
  footer: () => ReactNode
}

const activeUpdateStatuses = new Set<UpdateStatus>([
  'checking',
  'available',
  'downloading',
  'ready'
])

const UpdaterHandler = ({ checkRequestId }: UpdaterHandlerProps) => {
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [updateInfo, setUpdateInfo] = useState<UpdateAvailableInfo | null>(null)
  const statusRef = useRef<UpdateStatus>('idle')
  const hasStartedStartupCheckRef = useRef(false)
  const lastHandledCheckRequestIdRef = useRef(0)
  const downloadStartedRef = useRef(false)

  const modalState = useOverlayState()
  const { open: openModal, close: closeModal } = modalState

  const setUpdateStatus = useCallback((nextStatus: UpdateStatus) => {
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }, [])

  const startUpdateDownload = useCallback(() => {
    if (downloadStartedRef.current) {
      return
    }

    downloadStartedRef.current = true
    setProgress(0)
    setUpdateStatus('downloading')

    window.api.downloadUpdate().catch(() => {
      downloadStartedRef.current = false
      setUpdateStatus('error')
    })
  }, [openModal, setUpdateStatus])

  const checkForUpdates = useCallback(
    async (mode: CheckMode) => {
      const shouldShowModal = mode === 'visible'

      if (activeUpdateStatuses.has(statusRef.current)) {
        if (shouldShowModal) {
          openModal()
        }
        return
      }

      downloadStartedRef.current = false
      setProgress(0)
      setUpdateInfo(null)
      setUpdateStatus('checking')

      if (shouldShowModal) {
        openModal()
      }

      try {
        const response = await window.api.checkForUpdates()

        if (response.skipped && statusRef.current === 'checking') {
          setUpdateStatus('not-available')
        }
      } catch (error) {
        setUpdateStatus('error')
      }
    },
    [openModal, setUpdateStatus]
  )

  useEffect(() => {
    const removeUpdateAvailable = window.api.onUpdateAvailable((info) => {
      setUpdateInfo(info)
      setUpdateStatus('available')
      startUpdateDownload()
    })

    const removeUpdateDownloaded = window.api.onUpdateDownloaded(() => {
      downloadStartedRef.current = false
      setProgress(100)
      setUpdateStatus('ready')
      openModal()
    })

    const removeDownloadProgress = window.api.onDownloadProgress((prog) => {
      setUpdateStatus('downloading')
      setProgress(prog.percent)
    })

    const removeUpdateError = window.api.onUpdateError(() => {
      downloadStartedRef.current = false
      setUpdateStatus('error')
    })

    const removeChecking = window.api.onCheckingForUpdate(() => {
      setProgress(0)
      setUpdateStatus('checking')
    })

    const removeNotAvailable = window.api.onUpdateNotAvailable(() => {
      downloadStartedRef.current = false
      setUpdateStatus('not-available')
    })

    return () => {
      removeUpdateAvailable()
      removeUpdateDownloaded()
      removeDownloadProgress()
      removeUpdateError()
      removeChecking()
      removeNotAvailable()
    }
  }, [openModal, setUpdateStatus, startUpdateDownload])

  useEffect(() => {
    if (hasStartedStartupCheckRef.current) {
      return
    }

    hasStartedStartupCheckRef.current = true
    checkForUpdates('silent')
  }, [checkForUpdates])

  useEffect(() => {
    if (checkRequestId === 0 || lastHandledCheckRequestIdRef.current === checkRequestId) {
      return
    }

    lastHandledCheckRequestIdRef.current = checkRequestId
    checkForUpdates('visible')
  }, [checkForUpdates, checkRequestId])

  const handleInstall = () => {
    window.api.quitAndInstall()
  }

  const renderModalByStatus: Partial<Record<UpdateStatus, ModalContent>> = {
    checking: {
      title: () => 'Checking for Updates',
      body: () => <p>Checking for the latest version...</p>,
      footer: () => null
    },
    available: {
      title: () => 'Update Available',
      body: () => (
        <>
          <p>A new version {updateInfo?.version} is available.</p>
          <p>Downloading will start automatically.</p>
        </>
      ),
      footer: () => null
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
          <Button variant="danger" onPress={() => closeModal()}>
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
        <Button variant="primary" onPress={() => closeModal()}>
          OK
        </Button>
      )
    },
    error: {
      title: () => 'Update Check Failed',
      body: () => <p>Unable to check for updates right now. Please try again later.</p>,
      footer: () => (
        <Button variant="primary" onPress={() => closeModal()}>
          OK
        </Button>
      )
    },
    idle: {
      title: () => 'Check for Updates',
      body: () => <p>Checking for updates...</p>,
      footer: () => null
    }
  }
  const modalContent = renderModalByStatus[status] ?? renderModalByStatus.idle

  return (
    <Modal state={modalState}>
      <Modal.Backdrop isDismissable={false} variant="blur">
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{modalContent?.title()}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>{modalContent?.body()}</Modal.Body>
            <Modal.Footer>{modalContent?.footer()}</Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

export default UpdaterHandler
