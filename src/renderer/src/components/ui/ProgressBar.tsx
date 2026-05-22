import { FC, ReactNode } from 'react'
import {
  ProgressBar as HeroProgressBar,
  Label,
  LabelProps,
  ProgressBarOutputProps,
  ProgressBarProps
} from '@heroui/react'

interface IProgressBarProps extends ProgressBarProps {
  label?: ReactNode | (() => ReactNode)
  labelProps?: LabelProps
  outputProps?: ProgressBarOutputProps
}

const ProgressBar: FC<IProgressBarProps> = ({
  label,
  labelProps,
  outputProps,
  ...progressBarProps
}) => {
  return (
    <HeroProgressBar {...progressBarProps}>
      {!!label && <Label {...labelProps}>{typeof label === 'function' ? label() : label}</Label>}
      <HeroProgressBar.Output {...outputProps} />
      <HeroProgressBar.Track>
        <HeroProgressBar.Fill />
      </HeroProgressBar.Track>
    </HeroProgressBar>
  )
}

export default ProgressBar
