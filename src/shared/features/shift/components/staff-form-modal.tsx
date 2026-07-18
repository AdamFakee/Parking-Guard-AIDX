import { Button, ControlledInput } from '@/shared/components/ui';
import { ControlledPasswordInput } from '@/shared/components/ui/form/controlled-password-input';
import { useStaffMutation } from '@/shared/features/shift/hooks';
import { cn } from '@/shared/utils';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Shield, User } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Modal,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StaffFormValues, StaffSchema } from '../schemas';

const defaultValues: StaffFormValues = {
  name: '',
  pinHash: '',
  role: 'staff',
};

export interface StaffFormModalRef {
  open: (staff?: any) => void;
  close: () => void;
}

export const StaffFormModal = forwardRef<StaffFormModalRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  
  const { control, handleSubmit, reset, watch } = useForm<StaffFormValues>({
    resolver: valibotResolver(StaffSchema),
    defaultValues
  });

  const staffId = watch('id');

  const { addMutation, updateMutation } = useStaffMutation({
    onSuccess: () => {
      setVisible(false);
      reset(defaultValues);
    }
  });

  useImperativeHandle(ref, () => ({
    open: (staff?: any) => {
      if (staff) {
        reset({
          id: staff.id,
          name: staff.name,
          pinHash: staff.pinHash,
          role: staff.role,
        });
      } else {
        reset(defaultValues);
      }
      setVisible(true);
    },
    close: () => setVisible(false),
  }));

  const onSave = (data: StaffFormValues) => {
    if (data.id) {
       updateMutation.mutate({ 
         id: data.id, 
         data: { name: data.name, pinHash: data.pinHash, role: data.role } 
       });
    } else {
      addMutation.mutate({ 
        name: data.name, 
        pinHash: data.pinHash, 
        role: data.role 
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setVisible(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <TouchableOpacity 
          className="flex-1" 
          activeOpacity={1} 
          onPress={() => setVisible(false)} 
        />
        
        <View className="bg-white rounded-t-[32px]">
          <KeyboardAwareScrollView 
            showsVerticalScrollIndicator={false}
            bottomOffset={30}
            className="p-6 pb-10"
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-slate-900">
                {staffId ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}
              </Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text className="text-blue-500 font-bold">Hủy</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <ControlledInput
                control={control}
                name="name"
                label="Tên tài khoản"
                placeholder=""
              />

              <ControlledPasswordInput
                control={control}
                name="pinHash"
                label="Mã PIN"
                placeholder="Nhập 4 số"
                maxLength={4}
                keyboardType="number-pad"
              />

              <View>
                <Text className="text-sm font-bold text-slate-500 mb-2 ml-1">Vai trò</Text>
                <Controller
                  control={control}
                  name="role"
                  render={({ field: { value, onChange } }) => (
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => onChange('staff')}
                        className={cn(
                          "flex-1 p-4 rounded-2xl border items-center",
                          value === 'staff' ? "bg-blue-50 border-blue-500" : "bg-white border-slate-200"
                        )}
                      >
                        <User size={24} color={value === 'staff' ? "#3B82F6" : "#64748B"} />
                        <Text className={cn(
                          "mt-1 font-bold",
                          value === 'staff' ? "text-blue-500" : "text-slate-500"
                        )}>Nhân viên</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => onChange('admin')}
                        className={cn(
                          "flex-1 p-4 rounded-2xl border items-center",
                          value === 'admin' ? "bg-orange-50 border-orange-500" : "bg-white border-slate-200"
                        )}
                      >
                        <Shield size={24} color={value === 'admin' ? "#F97316" : "#64748B"} />
                        <Text className={cn(
                          "mt-1 font-bold",
                          value === 'admin' ? "text-orange-500" : "text-slate-500"
                        )}>Admin</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>

              <Button
                label={staffId ? 'Lưu thay đổi' : 'Tạo nhân viên'}
                variant="primary"
                className="mt-4 h-16 rounded-[24px]"
                onPress={handleSubmit(onSave)}
                loading={addMutation.isPending || updateMutation.isPending}
              />
            </View>
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
});

StaffFormModal.displayName = 'StaffFormModal';
