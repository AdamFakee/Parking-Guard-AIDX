import * as v from 'valibot'

/** Chung online + offline: mã NV / SĐT + PIN 4 số */
export const LoginSchema = v.object({
  employeeCode: v.pipe(
    v.string('Mã nhân viên bắt buộc'),
    v.nonEmpty('Vui lòng nhập mã NV hoặc SĐT'),
    v.minLength(1),
  ),
  pin: v.pipe(
    v.string('Mã PIN bắt buộc'),
    v.length(4, 'Mã PIN phải có đúng 4 chữ số'),
    v.regex(/^\d+$/, 'Mã PIN chỉ được chứa chữ số'),
  ),
})
