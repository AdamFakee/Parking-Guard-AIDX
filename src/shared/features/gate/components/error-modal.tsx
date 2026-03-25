import { Button } from '@/shared/components/ui';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Check, X } from 'lucide-react-native';
import React, { forwardRef, memo, useImperativeHandle, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Modal, Platform, Pressable, Text, TextInput, useColorScheme, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { PlateForm, PlateSchema } from '../schemas';
import { useScanPlateStore } from '../store';
import { formatDisplayPlate } from '../utils';

export interface ErrorModalRef {
  open: () => void;
  close: () => void;
}

interface ErrorModalProps {
  onConfirm: () => void;
}

export const ErrorModal = memo(forwardRef<ErrorModalRef, ErrorModalProps>(({ onConfirm }, ref) => {
  const [visible, setVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { detectedPlate, capturedCrop: plateImage, setDetectedPlate } = useScanPlateStore();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PlateForm>({
    resolver: valibotResolver(PlateSchema),
    defaultValues: {
      value: '',
    },
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      const currentPlate = useScanPlateStore.getState().detectedPlate;
      reset({ value: currentPlate });
      setVisible(true);
    },
    close: () => setVisible(false),
  }));

  const handleClose = () => setVisible(false);

  const handleConfirm = (data: { value: string }) => {
    setDetectedPlate(data.value.toUpperCase());
    setVisible(false);
    onConfirm();
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center items-center px-10">
        <Pressable 
          onPress={handleClose}
          className={`absolute inset-0 ${isDark ? 'bg-black/80' : 'bg-black/60'}`}
        />
        
        <KeyboardAwareScrollView
          bottomOffset={0}
          className={`w-full ${isDark ? 'bg-[#1e293b]' : 'bg-white'} rounded-3xl`}
          style={{ maxHeight: '80%' }}
          contentContainerStyle={{ flexGrow: 0 }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable 
            onPress={(e) => e.stopPropagation()}
            className="p-6 pb-7"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className={`${isDark ? 'text-white' : 'text-slate-900'} text-xl font-bold`}>
                  Hiệu chỉnh biển số
                </Text>
                <Text className="text-slate-500 text-xs mt-1">Vui lòng kiểm tra và chỉnh sửa nếu AI đọc sai</Text>
              </View>
              <Pressable onPress={handleClose} className={`p-2 ${isDark ? 'bg-slate-700' : 'bg-slate-100'} rounded-full`}>
                <X size={20} color="#64748b" />
              </Pressable>
            </View>
            
            {/* Cropped Image Preview */}
            <View className="mb-6">
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Ảnh biển số đã cắt</Text>
              <View className={`bg-black rounded-2xl overflow-hidden h-24 border-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                {plateImage ? (
                  <Image 
                    source={{ uri: plateImage }} 
                    className="w-full h-full" 
                    resizeMode="contain" 
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-slate-500 text-xs italic">Không tìm thấy vùng biển số</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Editing Field */}
            <View className="mb-8">
               <View className="flex-row justify-between items-end mb-2">
                 <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Nhập biển số đúng</Text>
                 <Text className="text-slate-400 text-[10px]">AI nhận diện: <Text className={`${isDark ? 'text-slate-300' : 'text-slate-500'} font-bold`}>{detectedPlate}</Text></Text>
               </View>
               
               <Controller
                 control={control}
                 name="value"
                 render={({ field: { onChange, value } }) => (
                   <>
                     <View className={`border-2 ${errors.value ? 'border-red-500 bg-red-50/10' : (isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50')} rounded-2xl p-4 flex-row items-center`}>
                        <TextInput
                          value={value}
                          onChangeText={(val) => onChange(val.toUpperCase())}
                          placeholder="VD: 51A12345"
                          placeholderTextColor="#94a3b8"
                          autoFocus
                          autoCapitalize="characters"
                          className={`${isDark ? 'text-white' : 'text-slate-900'} text-3xl font-black flex-1 text-center`}
                          style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 2 }}
                        />
                     </View>
                     {errors.value ? (
                       <Text className="text-red-500 text-[10px] font-bold mt-2 ml-1 italic">{errors.value.message}</Text>
                     ) : (
                       <Text className="text-center text-slate-400 text-xs mt-3 italic">
                          Hiển thị: {formatDisplayPlate(value)}
                       </Text>
                     )}
                   </>
                 )}
               />
            </View>

            {/* Actions */}
            <Button 
              label="XÁC NHẬN VÀ TIẾP TỤC"
              onPress={handleSubmit(handleConfirm)}
              leftIcon={Check}
              className="h-16 rounded-2xl"
              iconSize={22}
            />
          </Pressable>
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
}));

ErrorModal.displayName = 'ErrorModal';
