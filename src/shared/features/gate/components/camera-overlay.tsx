import React, { memo } from 'react';
import { ActivityIndicator, Dimensions, Text, View } from 'react-native';
import { useScanPlateStore } from '../store/scan-plate.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** 
 * Khung quét: Lấy isCapturing trực tiếp từ Store 
 * Cải tiến: Tăng chiều cao khung quét và sử dụng class Tailwind chuẩn
 */
export const CameraOverlay = memo(() => {
  const isCapturing = useScanPlateStore(s => s.isCapturing);

  return (
    <View className="flex-1 items-center justify-center bg-transparent">
      {/* Khung quét với chiều cao được tăng lên (h-56 ~ 224px) */}
      <View 
        style={{ width: SCREEN_WIDTH - 40 }} 
        className="h-56 border border-white/30 rounded-3xl overflow-hidden relative"
      >
        {/* Góc bo góc (Corners) */}
        <View className="absolute w-6 h-6 border-t-4 border-l-4 border-[#22c55e] top-[-2px] left-[-2px]" />
        <View className="absolute w-6 h-6 border-t-4 border-r-4 border-[#22c55e] top-[-2px] right-[-2px]" />
        <View className="absolute w-6 h-6 border-b-4 border-l-4 border-[#22c55e] bottom-[-2px] left-[-2px]" />
        <View className="absolute w-6 h-6 border-b-4 border-r-4 border-[#22c55e] bottom-[-2px] right-[-2px]" />
        
        {isCapturing && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center gap-3">
            <ActivityIndicator color="#22c55e" size="large" />
            <Text className="text-white text-sm font-bold tracking-wide">ĐANG PHÂN TÍCH...</Text>
          </View>
        )}
      </View>

      <View className="mt-8 bg-black/40 px-6 py-2 rounded-full border border-white/10">
        <Text className="text-white/90 text-[13px] font-medium">
          {isCapturing ? '⚡ Hệ thống đang xử lý...' : 'Căn chỉnh biển số vào giữa khung hình'}
        </Text>
      </View>
    </View>
  );
});

CameraOverlay.displayName = 'CameraOverlay';
