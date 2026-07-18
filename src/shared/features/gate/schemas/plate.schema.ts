import * as v from 'valibot';
import { checkLegitPlate } from '../utils';

export const PlateSchema = v.object({
  value: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(7, 'Biển số phải có ít nhất 7 ký tự'),
    v.maxLength(15, 'Biển số không được quá 15 ký tự'),
    v.check((val) => checkLegitPlate(val), 'Định dạng biển số không hợp lệ. Vui lòng kiểm tra lại.')
  )
});

export type PlateForm = v.InferOutput<typeof PlateSchema>;
