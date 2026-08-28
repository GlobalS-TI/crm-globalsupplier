export type FileKind = 'image' | 'pdf' | 'video' | 'other'

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
const VIDEO_EXT  = ['mp4', 'mov', 'webm', 'avi']

export function getFileKind(mimeType: string | null | undefined, nameOrUrl: string): FileKind {
  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType?.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf') return 'pdf'

  const ext = nameOrUrl.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXT.includes(ext)) return 'image'
  if (VIDEO_EXT.includes(ext)) return 'video'
  if (ext === 'pdf') return 'pdf'
  return 'other'
}
