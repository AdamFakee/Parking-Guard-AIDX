import * as v from 'valibot';

export const LoginSchema = v.object({
  phone: v.pipe(
    v.string('Số điện thoại bắt buộc nhập'),
    v.nonEmpty('Vui lòng nhập số điện thoại'),
    v.regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại Việt Nam không hợp lệ')
  ),
  pin: v.pipe(
    v.string('Mã PIN bắt buộc nhập'),
    v.length(4, 'Mã PIN phải có đúng 4 chữ số'),
    v.regex(/^\d+$/, 'Mã PIN chỉ được chứa chữ số (0-9)')
  )
});