import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImageManipulator from 'expo-image-manipulator';
import type { TensorflowModel } from 'react-native-fast-tflite';

import { BBox } from '../types';
import {
  checkLegitPlate,
  mlKitResultToOcrLines,
  processOcrResult,
} from '../utils/plate-processing.utils';
import {
  calcLetterbox,
  getCropRect,
  parseYoloOutput,
  preprocessImage,
} from '../utils/yolo-processing.utils';

export type CapturePhotoInput = {
  photoUri: string;
  width: number;
  height: number;
  model: TensorflowModel | null;
};

export type CaptureResult = {
  fullImage: string;
  plateImage: string | null;
  plate: string;
  confidence: number;
  isCorrected: boolean;
  isLegit: boolean;
};

/** YOLO crop + ML Kit OCR. Pure pipeline — no store / navigation. */
export async function recognizePlateFromPhoto(
  input: CapturePhotoInput
): Promise<CaptureResult> {
  const rawUri = input.photoUri.startsWith('file://')
    ? input.photoUri
    : `file://${input.photoUri}`;

  const lb = calcLetterbox(input.width, input.height);
  const tensor = await preprocessImage(rawUri, lb);

  let box: BBox | null = null;
  if (input.model) {
    const out = await input.model.run([tensor]);
    const data =
      (out[0] as any) instanceof Float32Array
        ? (out[0] as Float32Array)
        : new Float32Array(Object.values(out[0] as any));
    box = parseYoloOutput(data);
  }

  let cropUri: string | null = null;
  let targetUri = rawUri;
  let targetH = input.height;

  if (box) {
    const rect = getCropRect(box, lb, input.width, input.height);
    const res = await ImageManipulator.manipulateAsync(
      rawUri,
      [{ crop: rect }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
    cropUri = res.uri.startsWith('file://') ? res.uri : `file://${res.uri}`;
    targetUri = cropUri;
    targetH = rect.height;
  }

  const ocr = await TextRecognition.recognize(targetUri);

  if (!ocr?.blocks?.length) {
    return {
      fullImage: rawUri,
      plateImage: cropUri,
      plate: '',
      confidence: 0,
      isCorrected: false,
      isLegit: false,
    };
  }

  const lines = mlKitResultToOcrLines(ocr as any);
  const { text, confidence, isCorrected } = processOcrResult(lines, targetH);

  return {
    fullImage: rawUri,
    plateImage: cropUri,
    plate: text,
    confidence,
    isCorrected,
    isLegit: checkLegitPlate(text),
  };
}
