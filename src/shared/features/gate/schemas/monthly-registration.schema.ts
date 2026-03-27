import * as v from 'valibot';
import { checkLegitPlate } from '../utils';

export const MonthlyRegistrationSchema = v.object({
  cardUid: v.pipe(v.string(), v.minLength(1, 'Vui lòng quét thẻ NFC')),
  customerName: v.pipe(v.string(), v.minLength(1, 'Vui lòng nhập tên khách hàng')),
  customerPhone: v.string(),
  photoProfile: v.optional(v.string()),
  photoVehicle: v.optional(v.string()),
  vehicleType: v.picklist(['motorbike', 'car', 'ebike']),
  vehiclePlate: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(8, 'Biển số phải có ít nhất 8 ký tự'),
    v.maxLength(9, 'Biển số không được quá 9 ký tự (Vd: 51A12345)'),
    v.check((val) => checkLegitPlate(val), 'Định dạng biển số không hợp lệ')
  ),
  startDate: v.any(),
  endDate: v.any(),
  price: v.pipe(
    v.string(),
    v.regex(/^\d*$/, 'Vui lòng chỉ nhập số'),
    v.transform((val) => Number(val || 0))
  ),
  paymentMethod: v.picklist(['cash', 'qr_transfer']),
});

export type MonthlyRegistrationForm = v.InferOutput<typeof MonthlyRegistrationSchema>;
