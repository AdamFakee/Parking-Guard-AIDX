import * as v from 'valibot';

export const MonthlyRegistrationSchema = v.object({
  cardUid: v.pipe(v.string(), v.minLength(1, 'Vui lòng quét thẻ NFC')),
  customerName: v.pipe(v.string(), v.minLength(1, 'Vui lòng nhập tên khách hàng')),
  customerPhone: v.string(),
  vehicleType: v.picklist(['motorbike', 'car', 'ebike']),
  vehiclePlate: v.pipe(v.string(), v.minLength(1, 'Vui lòng nhập biển số')),
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
