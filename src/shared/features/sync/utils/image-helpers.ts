import * as FileSystem from 'expo-file-system/legacy';

/**
 * Đọc file ảnh từ URI và chuyển đổi sang chuỗi Base64
 */
export const imageToBase64 = async (imageUri: string): Promise<string | null> => {
  if (!imageUri) return null;
  
  try {
    // Nếu là URL từ xa (http/https), trả về null hoặc chính URL đó tùy logic.
    // Ở đây ta trả về null vì Google Drive chỉ cần lưu ảnh local được capture.
    if (!imageUri.startsWith('file://')) {
      return null;
    }

    // Kiểm tra file có tồn tại không
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      console.warn(`File không tồn tại: ${imageUri}`);
      return null;
    }
    
    // Đọc file dưới dạng base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return base64;
  } catch (error) {
    console.error('Lỗi khi chuyển đổi ảnh sang Base64:', error);
    return null;
  }
};
