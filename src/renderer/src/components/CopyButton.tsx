import { Button, ButtonProps, Tooltip } from '@heroui/react'
import { Check, Copy } from 'lucide-react'
import { FC, useState } from 'react'

interface CopyButtonProps {
  textToCopy: string
  onCopySuccess?: () => void
  onCopyError?: (error: Error) => void
  buttonProps?: ButtonProps
}

const CopyButton: FC<CopyButtonProps> = ({
  textToCopy,
  onCopySuccess,
  onCopyError,
  buttonProps
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onCopySuccess?.()
    } catch (error) {
      onCopyError?.(error as Error)
    }
  }

  return (
    <Tooltip delay={0} closeDelay={0}>
      <Button
        isIconOnly
        aria-label="Copy"
        size="sm"
        variant="ghost"
        onPress={handleCopy}
        {...buttonProps}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </Button>
      <Tooltip.Content>{copied ? 'Copied!' : 'Copy to clipboard'}</Tooltip.Content>
    </Tooltip>
  )
}

export default CopyButton
