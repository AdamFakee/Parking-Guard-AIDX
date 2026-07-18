import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

import { AppHeader } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants/color.const';
import {
  ActionPanel,
  CameraOverlay,
  ErrorModal,
  ErrorModalRef,
  InConfirmModal,
  InConfirmPayload,
  OutConfirmPayload,
  OutConfirmSheet,
  recognizePlateFromPhoto,
  useGateSessionStore,
  useScanPlateStore,
} from '@/shared/features/gate';
import { useTensorflowStore } from '@/shared/store/useTensorflowStore';
import { toastQueue } from '@/shared/utils/toast.util';

type SessionMode = 'in' | 'out';

/**
 * Cam sau Dashboard:
 * - NFC: mode + tagUid
 * - Nút không thẻ: mode + noCard
 * Chụp tay → bottom sheet. Không NFC trên màn này.
 */
export default function ScanPlateScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const params = useLocalSearchParams<{
    mode?: string;
    tagUid?: string;
    noCard?: string;
  }>();
  const storeSession = useGateSessionStore((s) => s.session);

  const sessionMode: SessionMode =
    storeSession?.mode ?? (params.mode === 'out' ? 'out' : 'in');
  const sessionTagUid =
    storeSession?.tagUid ||
    (params.tagUid && params.tagUid !== 'undefined' ? params.tagUid : undefined);
  const noCard =
    storeSession?.noCard === true ||
    params.noCard === '1' ||
    !sessionTagUid;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const errorModalRef = useRef<ErrorModalRef>(null);
  const { model } = useTensorflowStore();

  const {
    setDetectedPlate,
    setConfidence,
    setIsCorrected,
    setIsCapturing,
    setCapturedFull,
    setCapturedCrop,
    reset: resetScanStore,
  } = useScanPlateStore();

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [inPayload, setInPayload] = useState<InConfirmPayload | null>(null);
  const [outPayload, setOutPayload] = useState<OutConfirmPayload | null>(null);
  const capturingRef = useRef(false);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // Chỉ back nếu không có session store VÀ không có params (mở nhầm)
  useEffect(() => {
    if (storeSession || params.mode || params.tagUid || params.noCard) return;
    const t = setTimeout(() => {
      const again = useGateSessionStore.getState().session;
      if (again) return;
      router.replace('/');
    }, 1500);
    return () => clearTimeout(t);
  }, [storeSession, params.mode, params.tagUid, params.noCard, router]);

  const openSheet = useCallback(() => {
    const { detectedPlate, capturedFull, capturedCrop } = useScanPlateStore.getState();
    const base = {
      plate: detectedPlate,
      fullImage: capturedFull || '',
      plateImage: capturedCrop,
      tagUid: sessionTagUid,
      noCard: noCard || !sessionTagUid,
    };
    setOverlayOpen(true);
    if (sessionMode === 'out') {
      setOutPayload(base);
      setInPayload(null);
    } else {
      setInPayload(base);
      setOutPayload(null);
    }
  }, [sessionMode, sessionTagUid, noCard]);

  const handleCapture = useCallback(async () => {
    if (!camera.current || capturingRef.current || overlayOpen) return;

    capturingRef.current = true;
    setIsCapturing(true);
    setDetectedPlate('');
    setConfidence(0);
    setIsCorrected(false);
    setCapturedCrop(null);

    try {
      const photo = await camera.current.takeSnapshot();
      const rawUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      setCapturedFull(rawUri);

      const result = await recognizePlateFromPhoto({
        photoUri: rawUri,
        width: photo.width,
        height: photo.height,
        model,
      });

      setCapturedFull(result.fullImage);
      setCapturedCrop(result.plateImage);
      setDetectedPlate(result.plate);
      setConfidence(result.confidence);
      setIsCorrected(result.isCorrected);

      if (result.isLegit) {
        openSheet();
      } else {
        errorModalRef.current?.open();
      }
    } catch (e) {
      console.error('[ScanPlate] Capture Error:', e);
      toastQueue.show({ type: 'error', text1: 'Lỗi', text2: 'Không chụp được ảnh' });
    } finally {
      capturingRef.current = false;
      setIsCapturing(false);
    }
  }, [
    overlayOpen,
    model,
    openSheet,
    setCapturedCrop,
    setCapturedFull,
    setConfidence,
    setDetectedPlate,
    setIsCapturing,
    setIsCorrected,
  ]);

  const finishAndGoHome = useCallback(() => {
    // visible=false trước — tất cả modal đã dùng animationType="none"
    setOverlayOpen(false);
    setInPayload(null);
    setOutPayload(null);
    resetScanStore();
    // setTimeout(0): nhường 1 event-loop tick để React flush visible=false
    // xuống native bridge TRƯỚC khi unmount toàn bộ screen
    setTimeout(() => {
      useGateSessionStore.getState().clearSession();
      router.replace('/');
    }, 0);
  }, [resetScanStore, router]);

  const stayOnCamera = useCallback(() => {
    setOverlayOpen(false);
    setInPayload(null);
    setOutPayload(null);
    resetScanStore();
  }, [resetScanStore]);

  if (!hasPermission || !device) {
    return (
      <View className="flex-1 bg-black items-center justify-center gap-3">
        <ActivityIndicator color={COLORS.brand.blue} size="large" />
        <Text className="text-slate-400 text-sm">Khởi tạo Camera...</Text>
      </View>
    );
  }

  const title =
    sessionMode === 'out'
      ? noCard
        ? 'Cổng · XE RA · không thẻ'
        : 'Cổng · XE RA'
      : noCard
        ? 'Cổng · XE VÀO · không thẻ'
        : 'Cổng · XE VÀO';

  return (
    <View className="flex-1 bg-black">
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused && !overlayOpen}
        photo={true}
      />
      <View className="flex-1" pointerEvents={overlayOpen ? 'none' : 'auto'}>
        <AppHeader title={title} variant={isDark ? 'dark' : 'surface'} showBorderBottom={false} />
        <CameraOverlay />
        <ActionPanel onCapture={handleCapture} onConfirm={openSheet} />
      </View>

      <ErrorModal ref={errorModalRef} onConfirm={openSheet} />

      <InConfirmModal
        visible={overlayOpen && !!inPayload}
        payload={inPayload}
        onDismiss={stayOnCamera}
        onSuccess={finishAndGoHome}
      />
      <OutConfirmSheet
        visible={overlayOpen && !!outPayload}
        payload={outPayload}
        onDismiss={stayOnCamera}
        onSuccess={finishAndGoHome}
      />
    </View>
  );
}
