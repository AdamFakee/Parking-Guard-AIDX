import {
  checkLegitPlate,
  mlKitResultToOcrLines,
  processOcrResult,
} from '@/shared/features/gate/utils';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import {
  AlphaType,
  ColorType,
  Skia,
} from '@shopify/react-native-skia';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Camera as CameraIcon,
  RotateCcw,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const MODEL_INPUT_SIZE = 640;
const YOLO_CONF_THRESHOLD = 0.5;
const CROP_MARGIN = 0.08; // 8% padding quanh biển số

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface BBox {
  /** Tâm X, đã chuẩn hóa 0→1 trong không gian 640×640 */
  cx: number;
  /** Tâm Y, đã chuẩn hóa 0→1 trong không gian 640×640 */
  cy: number;
  /** Width, đã chuẩn hóa 0→1 */
  w: number;
  /** Height, đã chuẩn hóa 0→1 */
  h: number;
  conf: number;
}

interface LetterboxInfo {
  /** Scale từ ảnh gốc sang không gian 640×640 */
  scale: number;
  /** Padding ngang (pixel trong không gian 640) */
  padX: number;
  /** Padding dọc (pixel trong không gian 640) */
  padY: number;
  /** Width sau khi scale (trước padding) */
  scaledW: number;
  /** Height sau khi scale (trước padding) */
  scaledH: number;
}

// ─────────────────────────────────────────────
// Tính thông số letterbox để giữ tỷ lệ ảnh
// ─────────────────────────────────────────────
function calcLetterbox(origW: number, origH: number): LetterboxInfo {
  const scale = Math.min(MODEL_INPUT_SIZE / origW, MODEL_INPUT_SIZE / origH);
  const scaledW = Math.round(origW * scale);
  const scaledH = Math.round(origH * scale);
  const padX = Math.floor((MODEL_INPUT_SIZE - scaledW) / 2);
  const padY = Math.floor((MODEL_INPUT_SIZE - scaledH) / 2);
  return { scale, padX, padY, scaledW, scaledH };
}

// ─────────────────────────────────────────────
// Decode ảnh JPEG → Float32Array RGB (0→1)
// Dùng Skia để đọc pixel thật thay vì mảng 0 giả
// ─────────────────────────────────────────────
async function decodeImageToFloat32(uri: string): Promise<Float32Array> {
  const skData = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(skData);

  if (!image) {
    throw new Error(`[Skia] Không decode được ảnh: ${uri}`);
  }

  const w = image.width();
  const h = image.height();

  // Đọc pixel RGBA thô
  const pixels = image.readPixels(0, 0, {
    width: w,
    height: h,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  }) as Uint8Array;

  if (!pixels) {
    throw new Error('[Skia] readPixels trả về null');
  }

  // RGBA → RGB Float32 chuẩn hóa 0→1
  const totalPixels = w * h;
  const result = new Float32Array(totalPixels * 3);

  for (let i = 0, j = 0; i < totalPixels; i++, j += 3) {
    const base = i * 4;
    result[j]     = pixels[base]     / 255.0; // R
    result[j + 1] = pixels[base + 1] / 255.0; // G
    result[j + 2] = pixels[base + 2] / 255.0; // B
    // Bỏ Alpha (index base+3)
  }

  return result;
}

// ─────────────────────────────────────────────
// Parse output tensor YOLOv8
// Output shape: [1, 5, 8400] — layout: [cx,cy,w,h,conf] × 8400 anchors
// Tọa độ trong tensor là pixel tuyệt đối (0→640), cần chia 640 để về 0→1
// ─────────────────────────────────────────────
function parseYoloV8Output(tensor: Float32Array): BBox | null {
  const numAnchors = 8400;
  let bestConf = 0;
  let bestIdx = -1;

  for (let i = 0; i < numAnchors; i++) {
    const conf = tensor[4 * numAnchors + i];
    if (conf > bestConf) {
      bestConf = conf;
      bestIdx = i;
    }
  }

  if (bestConf < YOLO_CONF_THRESHOLD || bestIdx === -1) {
    console.log(`[YOLO] Không đủ confidence: ${bestConf.toFixed(3)}`);
    return null;
  }

  // ✅ Chia cho MODEL_INPUT_SIZE để chuẩn hóa về 0→1
  const box: BBox = {
    cx:   tensor[0 * numAnchors + bestIdx] ,
    cy:   tensor[1 * numAnchors + bestIdx] ,
    w:    tensor[2 * numAnchors + bestIdx] ,
    h:    tensor[3 * numAnchors + bestIdx] ,
    conf: bestConf,
  };

  console.log(`[YOLO] Box (normalized): cx=${box.cx.toFixed(3)} cy=${box.cy.toFixed(3)} w=${box.w.toFixed(3)} h=${box.h.toFixed(3)} conf=${box.conf.toFixed(3)}`);
  return box;
}

// ─────────────────────────────────────────────
// Map tọa độ YOLO (không gian 640×640 có padding)
// về tọa độ crop trong ảnh gốc
// ─────────────────────────────────────────────
function mapBoxToOriginal(
  box: BBox,
  lb: LetterboxInfo,
  origW: number,
  origH: number,
): { x: number; y: number; width: number; height: number } {
  // Pixel tuyệt đối trong không gian 640×640
  const px_cx = box.cx * MODEL_INPUT_SIZE;
  const px_cy = box.cy * MODEL_INPUT_SIZE;
  const px_w  = box.w  * MODEL_INPUT_SIZE;
  const px_h  = box.h  * MODEL_INPUT_SIZE;

  // Bỏ padding letterbox → tọa độ trong vùng ảnh đã scale (không có padding)
  const inScaled_cx = px_cx - lb.padX;
  const inScaled_cy = px_cy - lb.padY;

  // Chia scale → tọa độ trong ảnh gốc
  const orig_cx = inScaled_cx / lb.scale;
  const orig_cy = inScaled_cy / lb.scale;
  const orig_w  = px_w / lb.scale;
  const orig_h  = px_h / lb.scale;

  // Thêm margin
  const marginX = orig_w * CROP_MARGIN;
  const marginY = orig_h * CROP_MARGIN;

  const cropX = Math.max(0, orig_cx - orig_w / 2 - marginX);
  const cropY = Math.max(0, orig_cy - orig_h / 2 - marginY);
  const cropW = Math.min(origW - cropX, orig_w + marginX * 2);
  const cropH = Math.min(origH - cropY, orig_h + marginY * 2);

  console.log(`[Crop] Ảnh gốc ${origW}×${origH} → Crop: x=${cropX.toFixed(0)} y=${cropY.toFixed(0)} w=${cropW.toFixed(0)} h=${cropH.toFixed(0)}`);

  return { x: cropX, y: cropY, width: cropW, height: cropH };
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function ScanPlateScreen() {
  const router = useRouter();
  const { mode, tagUid } = useLocalSearchParams<{ mode: string; tagUid: string }>();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);

  const [detectedPlate, setDetectedPlate] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);

  const [capturedFull, setCapturedFull] = useState<string | null>(null);
  const [capturedCrop, setCapturedCrop] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Performance metrics
  const [perf, setPerf] = useState({
    capture: 0,
    preprocess: 0,
    inference: 0,
    crop: 0,
    ocr: 0,
    total: 0
  });

  const btnScale = useRef(new Animated.Value(1)).current;

  // ── Load model với GPU delegate (iOS: core-ml, Android: android-gpu) ──
  const delegate = Platform.OS === 'ios' ? 'core-ml' : 'android-gpu';
  const model = useTensorflowModel(
    require('@/assets/models/best_int8.tflite'),
    delegate,
  );

  useEffect(() => {
    if (model.state === 'loaded') {
      console.log(`✅ [Model] Loaded với delegate: ${delegate}`);
    }
    if (model.state === 'error') {
      console.warn(`⚠️ [Model] GPU delegate lỗi, fallback CPU:`, model.error);
    }
  }, [model.state]);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const animateBtn = () => {
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1.00, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  // ─────────────────────────────────────────────
  // Pipeline chính: Chụp → YOLO → Crop → OCR
  // ─────────────────────────────────────────────
  const handleCapture = async () => {
    if (!camera.current || isCapturing) return;
    animateBtn();
    setIsCapturing(true);

    const t0 = Date.now();
    let t_capture = 0;
    let t_preprocess = 0;
    let t_inference = 0;
    let t_crop = 0;
    let t_ocr = 0;

    try {
      // ── Bước 1: Chụp ảnh ──
      const photo = await camera.current.takeSnapshot();
      t_capture = Date.now() - t0;

      const rawUri = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;

      const origW = photo.width;
      const origH = photo.height;
      console.log(`[1] Chụp xong: ${origW}×${origH} — ${t_capture}ms`);

      const t1 = Date.now();
      // ── Bước 2: Letterbox resize về 640×640 (giữ tỷ lệ) ──
      const lb = calcLetterbox(origW, origH);

      const scaledImage = await ImageManipulator.manipulateAsync(
        rawUri,
        [{ resize: { width: lb.scaledW, height: lb.scaledH } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.95 },
      );

      const modelInput = await ImageManipulator.manipulateAsync(
        scaledImage.uri,
        [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.95 },
      );
      t_preprocess = Date.now() - t1;
      console.log(`[2] Resize xong — ${t_preprocess}ms`);

      const t2 = Date.now();
      // ── Bước 3: Decode ảnh → Float32Array ──
      let inputData: Float32Array;
      try {
        inputData = await decodeImageToFloat32(modelInput.uri);
      } catch (err) {
        console.error('[3] Decode lỗi:', err);
        throw err;
      }
      console.log(`[3] Decode xong — ${Date.now() - t2}ms`);

      const t3 = Date.now();
      // ── Bước 4: Chạy YOLO inference ──
      let box: BBox | null = null;

      if (model.model) {
        const outputs = await model.model.run([inputData]);
        const rawOutput = (outputs as any)[0] ?? outputs[0];
        const tensor = rawOutput instanceof Float32Array
          ? rawOutput
          : new Float32Array(Object.values(rawOutput));

        box = parseYoloV8Output(tensor);
      }
      t_inference = Date.now() - t3;
      console.log(`[4] YOLO xong — ${t_inference}ms`);

      const t4 = Date.now();
      // ── Bước 5: Crop vật lý nếu YOLO thấy biển số ──
      let ocrUri = rawUri;
      let cropUri: string | null = null;
      let ocrTargetHeight = origH;

      if (box) {
        const cropRect = mapBoxToOriginal(box, lb, origW, origH);

        if (cropRect.width > 10 && cropRect.height > 10) {
          const croppedImage = await ImageManipulator.manipulateAsync(
            rawUri,
            [{
              crop: {
                originX: cropRect.x,
                originY: cropRect.y,
                width:   cropRect.width,
                height:  cropRect.height,
              },
            }],
            { format: ImageManipulator.SaveFormat.JPEG, compress: 1 },
          );

          cropUri = croppedImage.uri.startsWith('file://')
            ? croppedImage.uri
            : `file://${croppedImage.uri}`;

          ocrUri = cropUri;
          ocrTargetHeight = cropRect.height;
        }
      }
      t_crop = Date.now() - t4;
      console.log(`[5] Crop xong — ${t_crop}ms`);

      const t5 = Date.now();
      // ── Bước 6: ML Kit OCR ──
      const result = await TextRecognition.recognize(ocrUri);
      t_ocr = Date.now() - t5;
      console.log(`[6] OCR xong — ${t_ocr}ms`);

      let finalPlate = '—';
      let finalConf = 0;

      if (result?.blocks?.length) {
        const lines = mlKitResultToOcrLines(result as any);
        const { text: plate, confidence: conf } = processOcrResult(lines, ocrTargetHeight);
        finalPlate = plate;
        finalConf  = conf;
      }

      const t_total = Date.now() - t0;
      console.log(`✅ Kết quả: "${finalPlate}" (${finalConf.toFixed(1)}%) — Tổng: ${t_total}ms`);

      // ── Cập nhật state & mở modal ──
      setPerf({
        capture: t_capture,
        preprocess: t_preprocess,
        inference: t_inference,
        crop: t_crop,
        ocr: t_ocr,
        total: t_total
      });

      setCapturedFull(rawUri);
      setCapturedCrop(cropUri);
      setDetectedPlate(finalPlate);
      setConfidence(finalConf);
      setShowModal(true);

    } catch (e: any) {
      console.error('[Capture] Lỗi:', e?.message ?? e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleReset = () => {
    setDetectedPlate('');
    setConfidence(0);
    setCapturedFull(null);
    setCapturedCrop(null);
  };

  const navigateNext = () => {
    if (!checkLegitPlate(detectedPlate)) return;
    const params = new URLSearchParams({ plate: detectedPlate });
    if (tagUid && tagUid !== 'undefined') params.append('tagUid', tagUid);
    const path = mode === 'out' ? '/gate/check-out' : '/gate/check-in';
    router.replace(`${path}?${params.toString()}` as any);
  };

  const isValid = checkLegitPlate(detectedPlate);

  // ─────────────────────────────────────────────
  // Render: Permission & Device Guards
  // ─────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Cần quyền truy cập Camera</Text>
        <Pressable onPress={requestPermission} style={styles.permBtn}>
          <Text style={styles.permBtnText}>Cấp quyền</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#22c55e" size="large" />
        <Text style={styles.permText}>Đang khởi động camera...</Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // Render: Main UI
  // ─────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Camera ── */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>Chụp biển số</Text>
        {/* Model state indicator */}
        <View style={styles.modelBadge}>
          <View style={[
            styles.modelDot,
            model.state === 'loaded'  && styles.modelDotReady,
            model.state === 'loading' && styles.modelDotLoading,
            model.state === 'error'   && styles.modelDotError,
          ]} />
          <Text style={styles.modelText}>
            {model.state === 'loaded'  ? 'GPU' :
             model.state === 'loading' ? '...' : 'CPU'}
          </Text>
        </View>
      </View>

      {/* ── Scan Frame ── */}
      <View style={styles.frameWrapper}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {isCapturing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator color="#22c55e" size="large" />
              <Text style={styles.processingText}>Đang nhận diện...</Text>
            </View>
          )}
        </View>

        <Text style={styles.hint}>
          {isCapturing
            ? '⚡ Đang xử lý...'
            : isValid
            ? '✅ Đã nhận diện xong!'
            : 'Đưa biển số vào khung rồi bấm chụp'}
        </Text>
      </View>

      {/* ── Bottom Panel ── */}
      <View style={styles.bottomPanel}>
        <View style={styles.plateBox}>
          <Text style={styles.plateLabel}>Biển số nhận diện</Text>
          <Text style={[styles.plateValue, isValid && styles.plateValueValid]}>
            {detectedPlate || '—'}
          </Text>
          {confidence > 0 && (
            <Text style={styles.confText}>Độ tin cậy: {confidence.toFixed(0)}%</Text>
          )}
        </View>

        <View style={styles.actionRow}>
          <Animated.View style={[styles.captureWrapper, { transform: [{ scale: btnScale }] }]}>
            <Pressable
              onPress={handleCapture}
              disabled={isCapturing || model.state === 'loading'}
              style={[styles.captureBtn, (isCapturing || model.state === 'loading') && styles.btnDisabled]}
            >
              <CameraIcon size={24} color="white" />
              <Text style={styles.captureBtnText}>
                {isCapturing          ? 'Đang chụp...'    :
                 model.state === 'loading' ? 'Đang tải AI...' : 'Chụp'}
              </Text>
            </Pressable>
          </Animated.View>

          {detectedPlate !== '' && !isCapturing && (
            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <RotateCcw size={20} color="#94a3b8" />
            </Pressable>
          )}
        </View>

        {isValid && (
          <Pressable onPress={navigateNext} style={styles.confirmBtn}>
            <Text style={styles.confirmBtnText}>Đi tiếp</Text>
            <ArrowRight size={20} color="white" />
          </Pressable>
        )}
      </View>

      {/* ── Result Modal ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kết quả nhận diện</Text>
              <Pressable onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Images */}
              <View style={styles.imageSection}>
                <View style={styles.imageWrapper}>
                  <Text style={styles.imageLabel}>Ảnh gốc</Text>
                  {capturedFull ? (
                    <Image
                      source={{ uri: capturedFull }}
                      style={styles.fullImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.fullImage, styles.imagePlaceholder]}>
                      <ActivityIndicator color="#64748b" />
                    </View>
                  )}
                </View>

                <View style={styles.imageWrapper}>
                  <Text style={styles.imageLabel}>Vùng biển số (đã cắt)</Text>
                  {capturedCrop ? (
                    <Image
                      source={{ uri: capturedCrop }}
                      style={styles.cropImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.cropImage, styles.imagePlaceholder]}>
                      <Text style={styles.placeholderText}>
                        {isCapturing ? 'Đang xử lý...' : 'Không phát hiện biển số'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Data */}
              <View style={styles.dataSection}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Biển số:</Text>
                  <Text style={[styles.resultValue, isValid && styles.resultValueValid]}>
                    {detectedPlate || '—'}
                  </Text>
                </View>
                {confidence > 0 && (
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Độ tin cậy OCR:</Text>
                    <Text style={styles.resultValue}>{confidence.toFixed(1)}%</Text>
                  </View>
                )}
              </View>

              {/* Performance */}
              <View style={[styles.dataSection, styles.perfSection]}>
                <Text style={styles.sectionTitle}>Hiệu năng xử lý</Text>
                <View style={styles.perfRow}>
                  <Text style={styles.perfLabel}>Chụp ảnh:</Text>
                  <Text style={styles.perfValue}>{perf.capture}ms</Text>
                </View>
                <View style={styles.perfRow}>
                  <Text style={styles.perfLabel}>Xử lý ảnh (resize):</Text>
                  <Text style={styles.perfValue}>{perf.preprocess}ms</Text>
                </View>
                <View style={styles.perfRow}>
                  <Text style={styles.perfLabel}>Inference YOLO (GPU):</Text>
                  <Text style={styles.perfValue}>{perf.inference}ms</Text>
                </View>
                <View style={styles.perfRow}>
                  <Text style={styles.perfLabel}>Cắt ảnh biển số:</Text>
                  <Text style={styles.perfValue}>{perf.crop}ms</Text>
                </View>
                <View style={styles.perfRow}>
                  <Text style={styles.perfLabel}>ML Kit OCR:</Text>
                  <Text style={styles.perfValue}>{perf.ocr}ms</Text>
                </View>
                <View style={[styles.perfRow, styles.perfTotalRow]}>
                  <Text style={styles.perfTotalLabel}>Tổng cộng:</Text>
                  <Text style={styles.perfTotalValue}>{perf.total}ms</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => { setShowModal(false); handleReset(); }}
                  style={styles.modalResetBtn}
                >
                  <RotateCcw size={18} color="#ef4444" />
                  <Text style={styles.modalResetText}>Chụp lại</Text>
                </Pressable>

                <Pressable
                  onPress={() => { setShowModal(false); navigateNext(); }}
                  disabled={!isValid}
                  style={[styles.modalConfirmBtn, !isValid && styles.btnDisabled]}
                >
                  <Text style={styles.modalConfirmText}>Xác nhận</Text>
                  <ArrowRight size={18} color="white" />
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modelDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#64748b',
  },
  modelDotReady: {
    backgroundColor: '#22c55e',
  },
  modelDotLoading: {
    backgroundColor: '#f59e0b',
  },
  modelDotError: {
    backgroundColor: '#ef4444',
  },
  modelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Scan Frame
  frameWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: SCREEN_WIDTH - 48,
    height: 180,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#22c55e',
  },
  cornerTL: { top: -2,    left: -2,  borderTopWidth: 4,    borderLeftWidth: 4 },
  cornerTR: { top: -2,    right: -2, borderTopWidth: 4,    borderRightWidth: 4 },
  cornerBL: { bottom: -2, left: -2,  borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  processingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    textAlign: 'center',
  },

  // Bottom Panel
  bottomPanel: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 14,
  },
  plateBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  plateLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  plateValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 4,
  },
  plateValueValid: {
    color: '#22c55e',
  },
  confText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  captureWrapper: {
    flex: 1,
  },
  captureBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
  },
  captureBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  resetBtn: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  permText: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  permBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  permBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: 20,
    gap: 20,
  },
  imageSection: {
    gap: 16,
  },
  imageWrapper: {
    gap: 8,
  },
  imageLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fullImage: {
    width: '100%',
    height: 380,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  cropImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 12,
  },
  dataSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  resultValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  resultValueValid: {
    color: '#22c55e',
  },
  perfSection: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  perfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  perfLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  perfValue: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  perfTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  perfTotalLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  perfTotalValue: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalResetBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalResetText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 15,
  },
  modalConfirmBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});