import sanitize from 'sanitize-filename'

export type TFileNameFormatOption = 'id' | 'timestamp' | 'numericalOrder' | 'title'
export const getFilename = ({
  order,
  id,
  title,
  timestamp,
  format
}: {
  order?: number | string
  id?: string
  title?: string
  timestamp?: number | string
  format: TFileNameFormatOption[]
}) => {
  const defaultFilename = [order, id].filter((part) => Boolean(part)).join('_')

  if (!format || format.length === 0) {
    return sanitize(defaultFilename)
  }

  const parts = format.map((f) => {
    switch (f) {
      case 'numericalOrder':
        return order
      case 'id':
        return id
      case 'title':
        return title ? sanitize(title) : ''
      case 'timestamp':
        return timestamp
      default:
        return ''
    }
  })

  // Remove empty parts and join by underscore
  let filename = parts.filter((part) => Boolean(part)).join('_')

  /**
   * Remove zero-width characters and format control characters.
   * These valid unicode characters can cause "Invalid filename" errors in chrome.downloads API.
   *
   * \u200B-\u200F: Zero Width Space, ZWNJ, ZWJ, LRM, RLM
   * \u202A-\u202E: LRE, RLE, PDF, LRO, RLO
   * \u2060-\u206F: Word Joiner, Function Application, Invisible Separator, Bidi Isolates...
   * \uFE00-\uFE0F: Variation Selectors (inclusive of \uFE0E)
   */
  filename = filename.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F]/g, '')

  return sanitize(filename || defaultFilename)
}

const tiktokUtils = {
  getFilename
}

export default tiktokUtils
