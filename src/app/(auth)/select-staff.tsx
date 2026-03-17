import { StaffProfileSelection } from '@/shared/features/shift/components';
import { useLocalSearchParams } from 'expo-router';

export default function SelectStaffScreen() {
  const { role } = useLocalSearchParams<{ role: 'admin' | 'staff' }>();
  return <StaffProfileSelection role={role || 'staff'} />;
}
