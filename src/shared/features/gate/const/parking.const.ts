import { TVehicleType } from '../types/gate.types';

export const DEFAULT_RENEWAL_MONTHS = 1;

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
