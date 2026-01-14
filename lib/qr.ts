import QRCode from 'qrcode'

export async function generateQRCode(
  url: string,
  shape: 'square' | 'circle' = 'square'
): Promise<string> {
  const options: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 1,
    width: 512,
  }

  const dataUrl = await QRCode.toDataURL(url, options)

  // For circle shape, we'd need additional canvas manipulation
  // For now, returning the standard QR code
  // TODO: Implement circular mask for 'circle' shape

  return dataUrl
}

export function getVisitorUrl(slug: string, baseUrl?: string): string {
  // Use provided baseUrl, or try to get from window if in browser, otherwise fallback
  const url = baseUrl || (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  return `${url}/visitor/${slug}`
}
