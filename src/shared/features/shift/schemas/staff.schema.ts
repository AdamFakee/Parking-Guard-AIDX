import * as v from 'valibot';

export const StaffSchema = v.object({
  id: v.optional(v.string()),
  name: v.pipe(v.string(), v.minLength(1, 'Vui lòng nhập tên')),
  pinHash: v.pipe(
    v.string(), 
    v.length(4, 'Mã PIN phải có đúng 4 số'),
    v.regex(/^\d+$/, 'Vui lòng chỉ nhập số')
  ),
  role: v.picklist(['admin', 'staff']),
});

export type StaffFormValues = v.InferOutput<typeof StaffSchema>;
