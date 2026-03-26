import { Directory, File, Paths } from 'expo-file-system';

/**
 * Đảm bảo các ảnh được lưu trữ trong thư mục Document vĩnh viễn.
 * Mới: Sử dụng API mới của expo-file-system (SDK 54+)
 */
const IMAGES_DIR = new Directory(Paths.document, 'parking_images');

/**
 * Lưu ảnh từ một đường dẫn tạm thời sang đường dẫn vĩnh viễn.
 * 
 * @param uri URI của ảnh hiện tại
 * @returns URI của ảnh sau khi đã được lưu vĩnh viễn
 */
export async function ensurePermanentImage(uri: string | null | undefined): Promise<string> {
  if (!uri || !uri.startsWith('file://')) {
    return uri || '';
  }

  try {
    // Nếu ảnh đã nằm trong thư mục Document rồi thì không cần làm gì
    if (uri.startsWith(Paths.document.uri)) {
      return uri;
    }

    // Đảm bảo thư mục đích tồn tại
    if (!IMAGES_DIR.exists) {
      IMAGES_DIR.create({ intermediates: true });
    }

    const sourceFile = new File(uri);
    // Lấy tên file từ URI hoặc dùng timestamp nếu không lấy được
    const filename = uri.split('/').pop() || `img_${Date.now()}.jpg`;
    const destinationFile = new File(IMAGES_DIR, filename);

    // Thực hiện copy file (API mới là đồng bộ hoặc trả về void)
    sourceFile.copy(destinationFile);

    return destinationFile.uri;
  } catch (error) {
    console.warn('[FileUtils] Không thể lưu ảnh vĩnh viễn:', error);
    return uri;
  }
}
