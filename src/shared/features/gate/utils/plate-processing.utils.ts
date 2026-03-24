/**
 * Plate Processing Utilities
 *
 * Logic kế thừa từ Python/Colab pipeline (YOLO + PaddleOCR).
 * Adapted cho React Native ML Kit TextRecognition output format.
 *
 * Biển số VN ví dụ:
 *   1 dòng:  51A-12345  (ô tô)
 *   2 dòng:  51A  / 12345  (xe máy – biển 2 hàng)
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface OcrLine {
  text: string;
  /** Toạ độ Y của góc trên bên trái (pixels) */
  top: number;
  /** Toạ độ X của góc trên bên trái (pixels) */
  left: number;
  /** Chiều cao block (pixels) */
  height: number;
  /** Chiều rộng block (pixels) */
  width: number;
  /** Confidence score [0..1], nếu có */
  confidence?: number;
}

export interface ProcessedPlate {
  /** Biển số đã làm sạch, ví dụ "51A-12345" */
  text: string;
  /** Độ tự tin trung bình [0..100] (thang %) */
  confidence: number;
}

// ─────────────────────────────────────────────────────────────
// 1. check_legit_plate  →  checkLegitPlate
// ─────────────────────────────────────────────────────────────

/**
 * Kiểm tra chuỗi có giống biển số hợp lệ không.
 *
 * Port từ Python:
 * ```python
 * def check_legit_plate(s):
 *     s_cleaned = re.sub(r'[.\-\s]', '', s)
 *     pattern1 = r'^[A-Za-z]{2}[0-9]{4}$'
 *     pattern2 = r'[A-Za-z][0-9]{4,}'
 *     if re.search(pattern1, s_cleaned) or \
 *        (re.search(pattern2, s_cleaned) and not re.match(r'^[A-Za-z]{2}', s_cleaned)):
 *         return True
 *     return False
 * ```
 *
 * Logic:
 *  - pattern1: đúng 2 chữ + 4 số (e.g. "AB1234") → hợp lệ
 *  - pattern2: có chữ + 4 số trở lên, BUT không bắt đầu bằng 2 chữ liên tiếp
 *               → bắt các biển VN kiểu "51A12345", "90B245230"
 */
export function checkLegitPlate(s: string): boolean {
  const cleaned = s.replace(/[.\-\s]/g, '');

  // pattern1: chuỗi toàn là 2 chữ + 4 số
  const pattern1 = /^[A-Za-z]{2}[0-9]{4}$/;

  // pattern2: có chữ rồi tới 4+ số (ở bất kỳ vị trí nào)
  const pattern2 = /[A-Za-z][0-9]{4,}/;

  // Không được bắt đầu bằng 2 chữ liên tiếp (VN plate bắt đầu = số tỉnh)
  const startsWithTwoLetters = /^[A-Za-z]{2}/.test(cleaned);

  if (pattern1.test(cleaned)) return true;
  if (pattern2.test(cleaned) && !startsWithTwoLetters) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────
// 2. process_ocr_result  →  processOcrResult
// ─────────────────────────────────────────────────────────────

/**
 * Xử lý danh sách các line từ ML Kit OCR để tạo ra biển số cuối cùng.
 *
 * Port từ Python:
 * ```python
 * def process_ocr_result(ocr_results, img_height):
 *     boxes = ocr_results[0]
 *     for b in boxes: b.append((b[0][0][1] + b[0][2][1]) / 2)  # center_y
 *     boxes.sort(key=lambda x: x[-1])
 *
 *     divider_y = img_height / 2
 *     line1, line2, confs = [], [], []
 *     for b in boxes:
 *         confs.append(b[1][1])
 *         if b[-1] < divider_y: line1.append(b[1][0])
 *         else: line2.append(b[1][0])
 *
 *     raw_text = f"{''.join(line1)}-{''.join(line2)}" if line2 else "".join(line1)
 *     cleaned_text = re.sub(r"[^A-Za-z0-9\-.]", "", raw_text).strip('-')
 *     # Fix C→0 ở vị trí thứ 3 của part[0]
 *     ...
 *     conf = sum(confs) / len(confs) if confs else 0.0
 *     return cleaned_text, conf * 100
 * ```
 *
 * @param lines   Các dòng OCR từ ML Kit, mỗi phần tử có { text, top, height, confidence? }
 * @param imgHeight Chiều cao ảnh crop (pixels) — dùng để xác định divider_y
 */
export function processOcrResult(lines: OcrLine[], imgHeight: number): ProcessedPlate {
  if (!lines || lines.length === 0) {
    return { text: '', confidence: 0 };
  }

  // Tính center_y cho mỗi line rồi sort từ trên xuống dưới
  const withCenterY = lines.map((l) => ({
    ...l,
    centerY: l.top + l.height / 2,
  }));
  withCenterY.sort((a, b) => a.centerY - b.centerY);

  // Chia 2 dòng: trên / dưới theo divider_y = imgHeight / 2
  const dividerY = imgHeight / 2;
  const line1Parts: string[] = [];
  const line2Parts: string[] = [];
  const confs: number[] = [];

  for (const block of withCenterY) {
    if (block.confidence !== undefined) {
      confs.push(block.confidence);
    }
    const normalized = block.text.trim();
    if (block.centerY < dividerY) {
      line1Parts.push(normalized);
    } else {
      line2Parts.push(normalized);
    }
  }

  // Ghép: nếu có 2 hàng thì nối bằng '-'
  const rawText =
    line2Parts.length > 0
      ? `${line1Parts.join('')}-${line2Parts.join('')}`
      : line1Parts.join('');

  // Clean: chỉ giữ [A-Za-z0-9\-.], sau đó trim dấu '-' hai đầu
  let cleanedText = rawText.replace(/[^A-Za-z0-9\-.]/g, '').replace(/^-+|-+$/g, '');

  // ── Fix lỗi OCR: C → 0 tại vị trí thứ 3 của phần đầu ──
  // Python: if len(temp) > 2 and temp[0].isalpha() and temp[2] == 'C':
  //            parts[0] = parts[0][:2] + '0' + parts[0][3:]
  //
  // Biển VN: "51C-12345" → vị trí 0="5", 1="1", 2="C" (sai) → sửa thành "510-12345"
  const temp = cleanedText.replace(/[-\.]/g, '');
  if (
    temp.length > 2 &&
    /[A-Za-z]/.test(temp[0]) === false && // char[0] KHÔNG phải chữ → là số tỉnh
    temp[2] === 'C'
  ) {
    const parts = cleanedText.split('-');
    if (parts.length > 0 && parts[0].length >= 3 && parts[0][2] === 'C') {
      parts[0] = parts[0].slice(0, 2) + '0' + parts[0].slice(3);
      cleanedText = parts.join('-');
    }
  }

  // Tính confidence trung bình (scale 0–100 như Python)
  const avgConf =
    confs.length > 0
      ? (confs.reduce((a, b) => a + b, 0) / confs.length) * 100
      : 0;

  return {
    text: cleanedText,
    confidence: avgConf,
  };
}

// ─────────────────────────────────────────────────────────────
// 3. isValidPlate  (giữ nguyên — dùng để trigger auto-navigate)
// ─────────────────────────────────────────────────────────────

/**
 * Validate nhanh format biển số VN để quyết định có navigate không.
 * Chặt hơn checkLegitPlate: yêu cầu đúng format chuẩn.
 *
 * Valid examples:
 *   "51A-12345"  "90B2-45230"  "51A12345"  "90B245230"
 */
export function isValidPlate(plate: string): boolean {
  const cleaned = plate.replace(/[-\.]/g, '');
  // 2 số (tỉnh) + 1-2 chữ (loại xe) + 3-5 số (serial)
  return /^[0-9]{2}[A-Z]{1,2}[0-9]{3,5}$/.test(cleaned);
}

// ─────────────────────────────────────────────────────────────
// Helpers (internal)
// ─────────────────────────────────────────────────────────────

/**
 * Adapter: chuyển `TextRecognitionResult` từ ML Kit
 * sang mảng `OcrLine[]` mà processOcrResult cần.
 *
 * Usage:
 *   const result = await TextRecognition.recognize(imagePath);
 *   const lines  = mlKitResultToOcrLines(result);
 *   const plate  = processOcrResult(lines, frameHeight);
 */
export function mlKitResultToOcrLines(result: any): OcrLine[] {
  const lines: OcrLine[] = [];
  if (!result || !result.blocks) return lines;

  for (const block of result.blocks) {
    for (const line of block.lines) {
      if (!line || !line.frame) continue;
      
      lines.push({
        text: line.text || '',
        top: line.frame.top || 0,
        left: line.frame.left || 0,
        height: line.frame.height || 0,
        width: line.frame.width || 0,
        confidence: line.confidence || 0,
      });
    }
  }
  return lines;
}
