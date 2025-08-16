import { customAlphabet } from 'nanoid'

// Custom alphabet without ambiguous characters (no 0, O, l, I)
const generateShareId = customAlphabet(
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  12 // 12 characters for good collision resistance
)

export function createShareableId(): string {
  return generateShareId()
}

export function isValidShareId(id: string): boolean {
  return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{12}$/.test(id)
}

// Generate shareable URL
export function getShareableUrl(shareId: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/share/setlist/${shareId}`
}

// QR code URL
export function getQRCodeUrl(shareId: string): string {
  const shareUrl = getShareableUrl(shareId)
  return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(shareUrl)}`
}