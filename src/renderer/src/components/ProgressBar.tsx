import { FC } from 'react'
import { ProgressBar as HeroProgressBar, Label, ProgressBarProps } from '@heroui/react'

interface IProgressBarProps extends ProgressBarProps {
  label?: string
}

const ProgressBar: FC<IProgressBarProps> = ({ label, ...progressBarProps }) => {
  return (
    <HeroProgressBar {...progressBarProps}>
      {!!label && <Label>{label}</Label>}
      <HeroProgressBar.Output />
      <HeroProgressBar.Track>
        <HeroProgressBar.Fill />
      </HeroProgressBar.Track>
    </HeroProgressBar>
  )
}

export default ProgressBar
