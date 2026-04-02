const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.75

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap

  let targetW = width
  let targetH = height
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    targetW = Math.round(width * ratio)
    targetH = Math.round(height * ratio)
  }

  const canvas = new OffscreenCanvas(targetW, targetH)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close()

  return canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })
}
