import * as ImageManipulator from 'expo-image-manipulator'
import { Directory, File, Paths } from 'expo-file-system'
import { Image } from 'react-native'

/**
 * Đảm bảo các ảnh được lưu trữ trong thư mục Document vĩnh viễn.
 * Mới: Sử dụng API mới của expo-file-system (SDK 54+)
 */
const IMAGES_DIR = new Directory(Paths.document, 'parking_images')

/** Preset nén gate — full ~200–250KB, crop biển nhỏ hơn. */
export const IMAGE_COMPRESS = {
  /** Toàn cảnh xe vào/ra */
  full: { maxWidth: 1280, compress: 0.7 },
  /** Crop biển / thumbnail */
  crop: { maxWidth: 640, compress: 0.8 },
  /** Ảnh phụ (mất thẻ, hồ sơ…) */
  doc: { maxWidth: 1280, compress: 0.7 },
} as const

export type ImageCompressPreset = keyof typeof IMAGE_COMPRESS

export type CompressImageOptions = {
  maxWidth?: number
  /** 0–1 JPEG quality */
  compress?: number
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    )
  })
}

/**
 * Resize (chỉ khi cạnh dài > maxWidth) + JPEG compress. Trả URI cache mới.
 * Non-file URI → trả nguyên. Không upscale.
 */
export async function compressImage(
  uri: string | null | undefined,
  options: CompressImageOptions = {},
): Promise<string> {
  if (!uri || !uri.startsWith('file://')) return uri || ''

  const maxWidth = options.maxWidth ?? IMAGE_COMPRESS.full.maxWidth
  const compress = options.compress ?? IMAGE_COMPRESS.full.compress

  try {
    const actions: ImageManipulator.Action[] = []
    try {
      const { width, height } = await getImageSize(uri)
      const long = Math.max(width, height)
      if (long > maxWidth) {
        // Giữ aspect — resize theo cạnh tương ứng
        if (width >= height) actions.push({ resize: { width: maxWidth } })
        else actions.push({ resize: { height: maxWidth } })
      }
    } catch {
      // Không đọc được size → vẫn compress, resize width an toàn
      actions.push({ resize: { width: maxWidth } })
    }

    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    return result.uri.startsWith('file://') ? result.uri : `file://${result.uri}`
  } catch (error) {
    console.warn('[FileUtils] compressImage failed, keep original:', error)
    return uri
  }
}

export async function compressImagePreset(
  uri: string | null | undefined,
  preset: ImageCompressPreset = 'full',
): Promise<string> {
  return compressImage(uri, IMAGE_COMPRESS[preset])
}

/**
 * Lưu ảnh từ một đường dẫn tạm thời sang đường dẫn vĩnh viễn.
 *
 * @param uri URI của ảnh hiện tại
 * @returns URI của ảnh sau khi đã được lưu vĩnh viễn
 */
export async function ensurePermanentImage(uri: string | null | undefined): Promise<string> {
  if (!uri || !uri.startsWith('file://')) {
    return uri || ''
  }

  try {
    // Nếu ảnh đã nằm trong thư mục Document rồi thì không cần làm gì
    if (uri.startsWith(Paths.document.uri)) {
      return uri
    }

    // Đảm bảo thư mục đích tồn tại
    if (!IMAGES_DIR.exists) {
      IMAGES_DIR.create({ intermediates: true, idempotent: true })
    }

    const sourceFile = new File(uri)
    // Lấy tên file từ URI hoặc dùng timestamp nếu không lấy được
    const filename = uri.split('/').pop() || `img_${Date.now()}.jpg`
    const destinationFile = new File(IMAGES_DIR, filename)

    // Thực hiện copy file (API mới là đồng bộ hoặc trả về void)
    sourceFile.copy(destinationFile)

    return destinationFile.uri
  } catch (error) {
    console.warn('[FileUtils] Không thể lưu ảnh vĩnh viễn:', error)
    return uri
  }
}

/** Nén theo preset rồi copy vào document — path chính khi ghi DB. */
export async function ensurePermanentCompressedImage(
  uri: string | null | undefined,
  preset: ImageCompressPreset = 'full',
): Promise<string> {
  if (!uri) return ''
  const compressed = await compressImagePreset(uri, preset)
  return ensurePermanentImage(compressed)
}
