/**
 * Unit tests cho plate-processing.utils.ts
 * Port logic từ Python/Colab pipeline.
 *
 * Chạy: npx jest plate-processing.utils --no-coverage
 */
import {
  checkLegitPlate,
  isValidPlate,
  mlKitResultToOcrLines,
  OcrLine,
  processOcrResult,
} from './plate-processing.utils';

// ─────────────────────────────────────────────────
// checkLegitPlate
// ─────────────────────────────────────────────────
describe('checkLegitPlate', () => {
  describe('hợp lệ', () => {
    it('biển 1 dòng không gạch', () => {
      expect(checkLegitPlate('51A12345')).toBe(true);
    });
    it('biển 1 dòng có gạch ngang', () => {
      expect(checkLegitPlate('51A-12345')).toBe(true);
    });
    it('biển 2 dòng xe máy', () => {
      expect(checkLegitPlate('90B2-45230')).toBe(true);
    });
    it('pattern1: 2 chữ + 4 số', () => {
      expect(checkLegitPlate('AB1234')).toBe(true);
    });
    it('có khoảng trắng & dấu chấm → clean rồi check', () => {
      expect(checkLegitPlate('51A.12345')).toBe(true);
    });
  });

  describe('không hợp lệ', () => {
    it('chuỗi ngắn', () => {
      expect(checkLegitPlate('12A')).toBe(false);
    });
    it('toàn chữ cái', () => {
      expect(checkLegitPlate('ABCDEF')).toBe(false);
    });
    it('toàn số', () => {
      expect(checkLegitPlate('123456')).toBe(false);
    });
    it('bắt đầu 2 chữ nhưng không khớp pattern1', () => {
      // pattern2 bị loại vì startsWithTwoLetters=true
      // pattern1 thì length > 6 nên cũng không match
      expect(checkLegitPlate('AB12345678')).toBe(false);
    });
    it('rác OCR', () => {
      expect(checkLegitPlate('KHONGBIENSO')).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────
// processOcrResult
// ─────────────────────────────────────────────────
describe('processOcrResult', () => {
  it('trả về rỗng khi không có line', () => {
    const result = processOcrResult([], 100);
    expect(result.text).toBe('');
    expect(result.confidence).toBe(0);
  });

  it('1 dòng đơn giản', () => {
    const lines: OcrLine[] = [{ text: '51A-12345', top: 10, height: 30 }];
    const { text } = processOcrResult(lines, 100);
    expect(text).toBe('51A-12345');
  });

  it('2 dòng → ghép bằng gạch ngang', () => {
    const lines: OcrLine[] = [
      { text: '51A', top: 5, height: 20 },   // center_y = 15 → dòng trên (divider = 50)
      { text: '12345', top: 60, height: 20 }, // center_y = 70 → dòng dưới
    ];
    const { text } = processOcrResult(lines, 100);
    expect(text).toBe('51A-12345');
  });

  it('sort theo Y (dòng dưới trước trong input) → vẫn đúng thứ tự', () => {
    const lines: OcrLine[] = [
      { text: '12345', top: 60, height: 20 }, // dòng dưới, vào trước
      { text: '51A', top: 5, height: 20 },    // dòng trên, vào sau
    ];
    const { text } = processOcrResult(lines, 100);
    expect(text).toBe('51A-12345');
  });

  it('fix C→0 ở vị trí thứ 3 của phần đầu', () => {
    // "51C-12345" → vị trí 2 là 'C', và char[0]='5' không phải chữ → fix
    const lines: OcrLine[] = [{ text: '51C-12345', top: 10, height: 30 }];
    const { text } = processOcrResult(lines, 100);
    expect(text).toBe('510-12345');
  });

  it('KHÔNG fix C→0 khi ký tự đầu là chữ cái (pattern1 plate)', () => {
    // "AB1234" → char[0]='A' là chữ cái → không fix
    const lines: OcrLine[] = [{ text: 'AB1234', top: 10, height: 30 }];
    const { text } = processOcrResult(lines, 100);
    expect(text).toBe('AB1234');
  });

  it('clean ký tự đặc biệt giữ lại chỉ [A-Za-z0-9\\-.]', () => {
    const lines: OcrLine[] = [{ text: '51A #@! 12345', top: 10, height: 30 }];
    const { text } = processOcrResult(lines, 100);
    expect(text).toBe('51A12345');
  });

  it('tính confidence trung bình', () => {
    const lines: OcrLine[] = [
      { text: '51A', top: 5, height: 20, confidence: 0.9 },
      { text: '12345', top: 60, height: 20, confidence: 0.8 },
    ];
    const { confidence } = processOcrResult(lines, 100);
    // (0.9 + 0.8) / 2 * 100 = 85
    expect(confidence).toBeCloseTo(85, 0);
  });
});

// ─────────────────────────────────────────────────
// isValidPlate
// ─────────────────────────────────────────────────
describe('isValidPlate', () => {
  it('biển chuẩn có gạch ngang', () => expect(isValidPlate('51A-12345')).toBe(true));
  it('biển chuẩn không gạch ngang', () => expect(isValidPlate('51A12345')).toBe(true));
  it('biển 2 chữ cái', () => expect(isValidPlate('90B2-45230')).toBe(true));
  it('thiếu serial', () => expect(isValidPlate('51A')).toBe(false));
  it('mã tỉnh bằng chữ', () => expect(isValidPlate('AA-12345')).toBe(false));
});

// ─────────────────────────────────────────────────
// mlKitResultToOcrLines
// ─────────────────────────────────────────────────
describe('mlKitResultToOcrLines', () => {
  it('flatten blocks → lines với đúng fields', () => {
    const result = {
      blocks: [
        {
          lines: [
            { text: '51A', frame: { top: 5, height: 20 }, confidence: 0.9 },
            { text: '12345', frame: { top: 60, height: 20 }, confidence: 0.8 },
          ],
        },
      ],
    };
    const lines = mlKitResultToOcrLines(result);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ text: '51A', top: 5, height: 20, confidence: 0.9 });
    expect(lines[1]).toMatchObject({ text: '12345', top: 60, height: 20, confidence: 0.8 });
  });

  it('xử lý blocks rỗng không crash', () => {
    const lines = mlKitResultToOcrLines({ blocks: [] });
    expect(lines).toHaveLength(0);
  });

  it('frame undefined → top=0, height=0', () => {
    const result = { blocks: [{ lines: [{ text: 'FOO', confidence: 0.5 }] }] };
    const lines = mlKitResultToOcrLines(result);
    expect(lines[0].top).toBe(0);
    expect(lines[0].height).toBe(0);
  });
});
