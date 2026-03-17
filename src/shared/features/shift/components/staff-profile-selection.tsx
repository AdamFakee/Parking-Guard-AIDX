import { AppHeader } from '@/shared/components/ui';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useGetAllStaff } from '../hooks';

/**
 * StaffProfileSelection component allows picking a staff profile from a list or scanning a code.
 * Matches the provided HTML mockup design.
 */
export const StaffProfileSelection = ({ role = 'staff' }: { role?: 'admin' | 'staff' }) => {
  const router = useRouter();
  const { data: staffList, isLoading } = useGetAllStaff(role);

  // For UI demo purposes, we still use some static data or defaults since the DB only has name/role
  const getAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`;
  };

  const handleStaffPress = (staff: any) => {
    router.push({
      pathname: '/(auth)/staff-passcode',
      params: {
        staffId: staff.id,
        name: staff.name,
        avatar: getAvatar(staff.name),
      }
    });
  };

  return (
    <View className="flex-1 bg-white">
      <AppHeader 
        title="Chọn hồ sơ nhân viên" 
        variant="white" 
        showBorderBottom={true} 
        borderBottomColor="#E2E8F0" 
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563EB" />
        </View>
      ) : (
        <ScrollView 
          className="flex-1 px-4 pt-6" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >        

          {/* Staff List Section */}
          <View className="mb-6">
            <Text className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.15em] px-1 mb-3">
              Danh sách nhân viên ({staffList?.length || 0})
            </Text>
            <View className="gap-3">
              {staffList?.map((staff) => (
                <Pressable
                  key={staff.id}
                  onPress={() => handleStaffPress(staff)}
                  className="flex-row items-center p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl active:bg-slate-100"
                >
                  <Image
                    source={{ uri: getAvatar(staff.name) }}
                    className="w-14 h-14 rounded-2xl bg-slate-200"
                  />
                  <View className="ml-4 flex-1">
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text className="font-medium text-lg text-[#1E293B]">{staff.name}</Text>
                      <View className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full">
                        <Text className="text-[10px] font-bold text-[#64748B] uppercase tracking-tighter">
                          {staff.role === 'admin' ? 'Quản lý' : 'Nhân viên'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm text-[#64748B]">
                      {staff.role === 'admin' ? 'Quyền quản trị hệ thống' : 'Nhân viên trực bãi'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};
