import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useIsFocused } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

// Internal Store & Utils
import { useScanPlateStore } from '@/shared/features/gate/store/scan-plate.store';
import { BBox, TScanPlateResultParams } from '@/shared/features/gate/types';
import { checkLegitPlate, mlKitResultToOcrLines, processOcrResult } from '@/shared/features/gate/utils';
import {
  calcLetterbox,
  getCropRect,
  parseYoloOutput,
  preprocessImage
} from '@/shared/features/gate/utils/yolo-processing.utils';

// Shared Components & Providers
import { AppHeader } from '@/shared/components/ui';
import { useTensorflowStore } from '@/shared/store/useTensorflowStore';

// Local Feature Components
import {
  ActionPanel,
  CameraOverlay,
  ErrorModal,
  ErrorModalRef
} from '@/shared/features/gate';

/**
 * Màn hình nhận diện biển số xe (License Plate Recognition)
 */
export default function ScanPlateScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { mode, tagUid } = useLocalSearchParams<{ mode: string; tagUid: string }>();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  
  const camera = useRef<Camera>(null);
  const modalRef = useRef<ErrorModalRef>(null);
  const { model } = useTensorflowStore();

  const { 
    setDetectedPlate, setConfidence, setIsCorrected, setIsCapturing, 
    setCapturedFull, setCapturedCrop
  } = useScanPlateStore();

  useEffect(() => { 
    if (!hasPermission) requestPermission(); 
  }, [hasPermission, requestPermission]);

  const handleConfirm = useCallback(() => {
    const { detectedPlate, capturedFull, capturedCrop } = useScanPlateStore.getState();

    const results: TScanPlateResultParams = {
      plate: detectedPlate,
      fullImage: capturedFull || '',
      plateImage: capturedCrop || '',
      tagUid: (tagUid && tagUid !== 'undefined') ? tagUid : undefined
    };

    const params = new URLSearchParams(results as any);
    const path = mode === 'out' ? '/gate/check-out' : '/gate/check-in';
    router.push(`${path}?${params.toString()}` as any);
  }, [mode, tagUid, router]);

  const handleCapture = async () => {
    const state = useScanPlateStore.getState();
    if (!camera.current || state.isCapturing) return;

    setIsCapturing(true);
    
    // Reset kết quả cũ để đảm bảo không bị hiển thị nhầm
    setDetectedPlate('');
    setConfidence(0);
    setIsCorrected(false);
    setCapturedCrop(null);

    try {
      // 1. Chụp ảnh
      const photo = await camera.current.takeSnapshot();
      const rawUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      
      // CẬP NHẬT ẢNH GỐC NGAY: Để lỡ có lỗi thì Modal vẫn hiện ảnh vừa chụp
      setCapturedFull(rawUri);

      // 2. Xử lý Letterbox cho YOLO
      const lb = calcLetterbox(photo.width, photo.height);
      const input = await preprocessImage(rawUri, lb);

      // 3. Nhận diện vị trí bằng YOLOv8
      let box: BBox | null = null;
      if (model) {
        const out = await model.run([input]);
        const data = (out[0] as any) instanceof Float32Array 
          ? (out[0] as any) 
          : new Float32Array(Object.values(out[0] as any));
        box = parseYoloOutput(data);
      }

      // 4. Cắt ảnh biển số (nếu tìm thấy)
      let cropUri: string | null = null;
      let targetUri = rawUri;
      let targetH = photo.height;

      if (box) {
        const rect = getCropRect(box, lb, photo.width, photo.height);
        const res = await ImageManipulator.manipulateAsync(rawUri, [{ crop: rect }], { format: ImageManipulator.SaveFormat.JPEG });
        cropUri = res.uri.startsWith('file://') ? res.uri : `file://${res.uri}`;
        setCapturedCrop(cropUri); 
        targetUri = cropUri;
        targetH = rect.height;
      }

      // 5. OCR
      const result = await TextRecognition.recognize(targetUri);
      
      if (result?.blocks?.length) {
        const lines = mlKitResultToOcrLines(result as any);
        const { text, confidence, isCorrected: corrected } = processOcrResult(lines, targetH);
        
        setDetectedPlate(text);
        setConfidence(confidence);
        setIsCorrected(corrected);

        if (checkLegitPlate(text)) {
          handleConfirm();
        } else {
          modalRef.current?.open();
        }
      } else {
        setDetectedPlate('');
        modalRef.current?.open();
      }
    } catch (e) {
      console.error('[ScalePlate] Capture Error:', e);
    } finally {
      setIsCapturing(false);
    }
  };

  if (!hasPermission || !device) {
    return (
      <View className="flex-1 bg-black items-center justify-center gap-3">
        <ActivityIndicator color="#22c55e" size="large" />
        <Text className="text-[#94a3b8] text-sm">Khởi tạo Camera...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Camera 
        ref={camera} 
        style={StyleSheet.absoluteFill} 
        device={device} 
        isActive={isFocused} 
        photo={true} 
      />
      <View className="flex-1">
        <AppHeader title="Chụp biển số" variant={isDark ? 'dark' : 'surface'} showBorderBottom={false} />
        <CameraOverlay />
        <ActionPanel onCapture={handleCapture} onConfirm={handleConfirm} />
      </View>
      <ErrorModal 
        ref={modalRef} 
        onConfirm={handleConfirm} 
      />
    </View>
  );
}