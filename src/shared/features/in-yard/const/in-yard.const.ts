import { TSearchVehicleType } from '../../gate';

export const VEHICLE_FILTERS: { label: string; value: TSearchVehicleType }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Xe máy', value: 'motorbike' },
  { label: 'Ô tô', value: 'car' },
  { label: 'Xe điện', value: 'ebike' },
];

export const STATUS_FILTERS: { label: string; value: 'IN' | 'OUT' | 'all' }[] = [
  { label: 'Trong bãi', value: 'IN' },
  { label: 'Đã ra', value: 'OUT' },
  { label: 'Tất cả', value: 'all' },
];
