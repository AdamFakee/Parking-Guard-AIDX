import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';
import { Alert } from 'react-native';

export function useCamera() {
  const takePhoto = useCallback(async (options?: ImagePicker.ImagePickerOptions) => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền camera để chụp ảnh');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.5,
        mediaTypes: ['images'],
        ...options,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Camera Error:', error);
      Alert.alert('Lỗi', 'Không thể mở camera hoặc xử lý ảnh');
      return null;
    }
  }, []);

  return { takePhoto };
}
