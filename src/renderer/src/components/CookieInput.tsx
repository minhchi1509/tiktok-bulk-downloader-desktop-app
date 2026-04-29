import { Input, InputProps } from '@heroui/react'
import { EAppSettingKey } from '@shared/constants/enum'
import { FC, useEffect, useState } from 'react'
import { useDebounceValue } from 'usehooks-ts'

interface ICookieInputProps extends InputProps {}

const CookieInput: FC<ICookieInputProps> = (props) => {
  const [tiktokCookie, setTiktokCookie] = useState('')
  const [debouncedCookie] = useDebounceValue(tiktokCookie, 500)

  useEffect(() => {
    const loadInitialSettings = async () => {
      const savedCookieResult = await window.api.getSettings<string>(EAppSettingKey.TIKTOK_COOKIE)

      if (savedCookieResult?.success && typeof savedCookieResult.data === 'string') {
        setTiktokCookie(savedCookieResult.data)
      }
    }

    loadInitialSettings()
  }, [])

  useEffect(() => {
    if (!debouncedCookie) return

    const saveCookie = async () => {
      try {
        await window.api.saveSettings(EAppSettingKey.TIKTOK_COOKIE, debouncedCookie.trim())
      } catch {}
    }

    saveCookie()
  }, [debouncedCookie])

  return (
    <Input label="TikTok Cookie" value={tiktokCookie} onValueChange={setTiktokCookie} {...props} />
  )
}

export default CookieInput
