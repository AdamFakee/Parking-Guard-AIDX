import { crc16ccitt } from 'crc';

interface VietQROfflineParams {
    bin: string;
    stk: string;
    amount?: number | string;
    desc?: string;
    accountName?: string;
}

/**
 * Hàm tạo VietQR mã Napas (Offline) dựa trên đặc tả EMVCo
 * @param bin: Mã BIN ngân hàng (6 chữ số)
 * @param stk: Số tài khoản
 * @param amount: Số tiền
 * @param desc: Nội dung chuyển khoản
 * @param accountName: Tên chủ tài khoản
 */
export const generateVietQROffline = ({
    bin,
    stk,
    amount,
    desc,
    accountName
}: VietQROfflineParams): string => {
    const f = (id: string, val: string | number) => {
        const v = String(val);
        return `${id}${v.length.toString().padStart(2, '0')}${v}`;
    };

    const guid = f('00', 'A000000727');
    const bankAccount = f('00', bin) + f('01', stk);
    const serviceCode = f('02', 'QRIBFTTA'); 
    
    const consumerInfo = f('38', guid + f('01', bankAccount) + serviceCode);

    let payload = 
        f('00', '01') +                             // Payload Format Indicator
        f('01', amount ? '12' : '11') +             // 11: Tĩnh (không số tiền), 12: Động (có số tiền)
        consumerInfo + 
        f('53', '704') +                            // Mã tiền tệ (VND)
        (amount ? f('54', amount) : '') +           // Số tiền thanh toán
        f('58', 'VN') +                             // Quốc gia (Vietnam)
        (accountName ? f('59', accountName) : '') + // Tên chủ tài khoản
        (desc ? f('62', f('08', desc)) : '') +      // Nội dung thanh toán (Additional Data)
        '6304';                                     // ID tag của CRC và độ dài cố định 04

    const crc = crc16ccitt(payload).toString(16).toUpperCase().padStart(4, '0');
    
    return payload + crc;
};
