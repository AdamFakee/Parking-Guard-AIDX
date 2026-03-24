import { AlphaType, ColorType, Skia } from '@shopify/react-native-skia';
import { BBox, LetterboxInfo } from '../types/scan-plate.types';
import { MODEL_INPUT_SIZE, YOLO_CONF_THRESHOLD } from '../constants/scan-plate.constants';

/** Tính toán tỉ lệ và phần đệm để resize ảnh theo letterbox (không làm biến dạng tỉ lệ) */
export const calcLetterbox = (origW: number, origH: number): LetterboxInfo => {
  const scale = Math.min(MODEL_INPUT_SIZE / origW, MODEL_INPUT_SIZE / origH);
  const scaledW = Math.round(origW * scale);
  const scaledH = Math.round(origH * scale);
  const padX = Math.floor((MODEL_INPUT_SIZE - scaledW) / 2);
  const padY = Math.floor((MODEL_INPUT_SIZE - scaledH) / 2);
  return { scale, padX, padY, scaledW, scaledH };
};

/** Tiền xử lý ảnh (Resize Skia + Normalize) để đưa vào YOLO model */
export const preprocessImage = async (uri: string, lb: LetterboxInfo): Promise<Float32Array> => {
  const skData = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(skData);
  if (!image) throw new Error(`[Skia] Decode failed: ${uri}`);

  const surface = Skia.Surface.Make(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  if (!surface) throw new Error('[Skia] Surface creation failed');
  const canvas = surface.getCanvas();
  if (!canvas) throw new Error('[Skia] Surface canvas failed');
  
  canvas.clear(Skia.Color('black'));
  const src = Skia.XYWHRect(0, 0, image.width(), image.height());
  const dst = Skia.XYWHRect(lb.padX, lb.padY, lb.scaledW, lb.scaledH);
  canvas.drawImageRect(image, src, dst, Skia.Paint());

  const finalImage = surface.makeImageSnapshot();
  const pixels = finalImage.readPixels(0, 0, {
    width: MODEL_INPUT_SIZE,
    height: MODEL_INPUT_SIZE,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  }) as Uint8Array;

  const totalPixels = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const result = new Float32Array(totalPixels * 3);
  for (let i = 0, j = 0; i < totalPixels; i++, j += 3) {
    const base = i * 4;
    result[j]     = pixels[base]     / 255.0;
    result[j + 1] = pixels[base + 1] / 255.0;
    result[j + 2] = pixels[base + 2] / 255.0;
  }
  return result;
};

/** Parse output tensor từ YOLOv8 để lấy bounding box tốt nhất */
export const parseYoloOutput = (tensor: Float32Array): BBox | null => {
  const numAnchors = 8400; // YOLOv8 640x640 output
  let bestConf = 0;
  let bestIdx = -1;
  for (let i = 0; i < numAnchors; i++) {
    const conf = tensor[4 * numAnchors + i];
    if (conf > bestConf) { bestConf = conf; bestIdx = i; }
  }
  if (bestConf < YOLO_CONF_THRESHOLD || bestIdx === -1) return null;
  return {
    cx: tensor[0 * numAnchors + bestIdx],
    cy: tensor[1 * numAnchors + bestIdx],
    w:  tensor[2 * numAnchors + bestIdx],
    h:  tensor[3 * numAnchors + bestIdx],
    conf: bestConf,
  };
};

/** Chuyển đổi tọa độ BBox từ không gian model (640x640) về tọa độ ảnh gốc */
export const getCropRect = (box: BBox, lb: LetterboxInfo, origW: number, origH: number) => {
  const px_cx = box.cx * MODEL_INPUT_SIZE;
  const px_cy = box.cy * MODEL_INPUT_SIZE;
  const px_w  = box.w  * MODEL_INPUT_SIZE;
  const px_h  = box.h  * MODEL_INPUT_SIZE;
  const orig_cx = (px_cx - lb.padX) / lb.scale;
  const orig_cy = (px_cy - lb.padY) / lb.scale;
  const orig_w  = px_w / lb.scale;
  const orig_h  = px_h / lb.scale;
  return {
    originX: Math.max(0, orig_cx - orig_w / 2),
    originY: Math.max(0, orig_cy - orig_h / 2),
    width:   Math.min(origW, orig_w),
    height:  Math.min(origH, orig_h),
  };
};
