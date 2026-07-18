import { TVehicleType } from '../types/gate.types';

export const DEFAULT_RENEWAL_MONTHS = 1;

/** OCR dump dài hơn → coi là sai, không hiển thị full */
export const MAX_PLATE_CHARS = 15;

export const VEHICLE_TYPE_LABELS: Record<TVehicleType, string> = {
  car: 'Ô tô',
  motorbike: 'Xe máy',
  ebike: 'Xe điện',
};

export const PREDEFINED_REASONS = [
  'Hệ thống đọc sai/thiếu ký tự',
  'Biển số bị che khuất (treo đồ, áo mưa)',
  'Khách dùng sai thẻ / Đi mượn thẻ',
  'Sai số liệu từ lúc xe vào (Lỗi nhân viên)',
  'Biển số bị chói sáng / Quá tối',
];


export const LOST_CARD_REASONS = [
  'Khách làm mất thẻ trên đường',
  'Làm rơi thẻ trong bãi xe',
  'Thẻ bị gãy / Hỏng chip NFC',
  'Khách để quên thẻ trên xe (Đã lấy hàng ra)',
  'Thẻ không phản hồi (Lỗi kỹ thuật)',
];

export const DEFAULT_MONTHLY_PRICE = 100000;
export const DEFAULT_MONTHLY_PRICE_CAR = 500000;
export const DEFAULT_MONTHLY_PRICE_MOTORBIKE = 100000;
export const DEFAULT_MONTHLY_PRICE_EBIKE = 100000;
