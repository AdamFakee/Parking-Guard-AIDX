import * as v from 'valibot';
import { checkLegitPlate } from '../utils';

export const PlateSchema = v.object({
  value: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(8, 'Biển số phải có ít nhất 8 ký tự'),
    v.maxLength(9, 'Biển số không được quá 9 ký tự (Vd: 51A12345)'),
    v.check((val) => checkLegitPlate(val), 'Định dạng biển số không hợp lệ. Vui lòng kiểm tra lại.')
  )
});

export type PlateForm = v.InferOutput<typeof PlateSchema>;
