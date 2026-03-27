import { useShiftStore } from '@/shared/features/shift';
import { StaffFormModal, StaffFormModalRef } from '@/shared/features/shift/components';
import { useGetAllStaff, useStaffMutation } from '@/shared/features/shift/hooks';
import { cn } from '@/shared/utils';
import { useRouter } from 'expo-router';
import { Edit2, Plus, RotateCcw, Shield, Trash2, User, UserCheck } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AppHeader, Button } from '@/shared/components/ui';

export default function StaffManagementScreen() {
  const router = useRouter();
  const modalRef = React.useRef<StaffFormModalRef>(null);
  const currentShift = useShiftStore((state) => state.currentShift);
  const { data: allStaff, isLoading } = useGetAllStaff(undefined, true);

  const { deleteMutation, restoreMutation } = useStaffMutation();

  // Redirect if not admin
  useEffect(() => {
    if (currentShift && currentShift.role !== 'admin') {
      router.replace('/settings' as any);
    }
  }, [currentShift, router]);

  const handleOpenAdd = () => {
    modalRef.current?.open();
  };

  const handleOpenEdit = (staff: any) => {
    modalRef.current?.open(staff);
  };

  const handleDelete = (staff: any) => {
    Alert.alert(
      'Xóa nhân viên',
      `Bạn có chắc chắn muốn xóa nhân viên ${staff.name}? Nhân viên này sẽ không thể đăng nhập cho đến khi được khôi phục.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(staff.id)
        },
      ]
    );
  };

  const handleRestore = (staff: any) => {
    Alert.alert(
      'Khôi phục nhân viên',
      `Bạn muốn khôi phục nhân viên ${staff.name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Khôi phục', 
          onPress: () => restoreMutation.mutate(staff.id)
        },
      ]
    );
  };

  // Lọc trừ bản thân ra
  const displayStaff = allStaff?.filter(s => s.id !== currentShift?.staffId) || [];

  const renderStaffItem = ({ item }: { item: any }) => (
    <View className={cn(
      "bg-white p-4 rounded-2xl mb-3 flex-row items-center border border-slate-100 shadow-sm",
      item.isDeleted && "opacity-60 bg-slate-50 border-slate-200"
    )}>
      <View className={cn(
        "size-12 rounded-full items-center justify-center mr-4",
        item.role === 'admin' ? "bg-orange-100" : "bg-blue-100",
        item.isDeleted && "bg-slate-200"
      )}>
        {item.role === 'admin' ? (
          <Shield size={24} color={item.isDeleted ? "#94A3B8" : "#F97316"} />
        ) : (
          <User size={24} color={item.isDeleted ? "#94A3B8" : "#3B82F6"} />
        )}
      </View>
      
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-lg font-bold text-slate-900">{item.name}</Text>
          {item.isDeleted && (
            <View className="ml-2 px-2 py-0.5 bg-slate-200 rounded-md">
              <Text className="text-[10px] font-bold text-slate-500 uppercase">Đã xóa</Text>
            </View>
          )}
        </View>
        <Text className="text-slate-500 text-sm">
          {item.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
        </Text>
      </View>

      <View className="flex-row gap-2">
        {!item.isDeleted ? (
          <>
            <TouchableOpacity 
              onPress={() => handleOpenEdit(item)}
              className="p-2 bg-slate-50 rounded-full"
            >
              <Edit2 size={20} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDelete(item)}
              className="p-2 bg-red-50 rounded-full"
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            onPress={() => handleRestore(item)}
            className="p-2 bg-green-50 rounded-full"
          >
            <RotateCcw size={20} color="#22C55E" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader title="Quản lý nhân viên" />
      
      <View className="flex-1 px-4 pt-4">
        <View className="mb-4 flex-row justify-between items-center">
          <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            Danh sách ({displayStaff.length})
          </Text>
          <Button
            label="Thêm mới"
            variant="primary"
            className=" px-4 rounded-full"
            leftIcon={Plus}
            onPress={handleOpenAdd}
          />
        </View>

        {isLoading ? (
           <View className="flex-1 items-center justify-center">
             <Text className="text-slate-400">Đang tải...</Text>
           </View>
        ) : (
          <FlatList
            data={displayStaff}
            keyExtractor={(item) => item.id}
            renderItem={renderStaffItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <UserCheck size={64} color="#E2E8F0" />
                <Text className="text-slate-400 mt-4">Chưa có nhân viên nào khác</Text>
              </View>
            }
          />
        )}
      </View>

      <StaffFormModal ref={modalRef} />
    </View>
  );
}
