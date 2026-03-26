import { DateRangeType } from '../types';

export const RANGES: { label: string; value: DateRangeType }[] = [
  { label: 'Hôm nay', value: 'today' },
  { label: 'Hôm qua', value: 'yesterday' },
  { label: '7 ngày qua', value: 'last7days' },
  { label: 'Tháng này', value: 'thisMonth' },
  { label: 'Tùy chỉnh', value: 'custom' },
];

export const RANGE_LABELS: Record<DateRangeType, string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  last7days: '7 ngày qua',
  thisMonth: 'Tháng này',
  custom: '',
};
