import React, { forwardRef, memo, useImperativeHandle, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Image, useColorScheme } from 'react-native';
import { X, AlertTriangle, Info, RotateCcw } from 'lucide-react-native';
import { Button } from '@/shared/components/ui';
import { useScanPlateStore } from '../store/scan-plate.store';

export interface ErrorModalRef {
  open: () => void;
  close: () => void;
}

/** 
 * Modal cảnh báo khi biển số nhận diện sai định dạng 
 * Cho phép xem ảnh đã chụp và ảnh cắt biển số để kiểm chứng
 */
export const ErrorModal = memo(forwardRef<ErrorModalRef, any>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { detectedPlate, isCorrected, capturedFull, capturedCrop, reset } = useScanPlateStore();

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  const handleClose = () => setVisible(false);
  const handleReset = () => { 
    setVisible(false); 
    reset(); 
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={handleClose}
    >
      <View className={`flex-1 ${isDark ? 'bg-black/90' : 'bg-black/60'} justify-center p-5`}>
        <View className={`${isDark ? 'bg-[#1e293b]' : 'bg-white'} rounded-[28px] overflow-hidden shadow-2xl`}>
          <View className={`flex-row items-center justify-between p-5 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <Text className={`${isDark ? 'text-white' : 'text-slate-900'} text-lg font-bold`}>
              Nhận diện chưa chuẩn
            </Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>
          
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View className="gap-3">
              <View className="bg-black rounded-2xl overflow-hidden h-[280px]">
                <Image source={{ uri: capturedFull || undefined }} className="w-full h-full" resizeMode="contain" />
              </View>
              <View className="gap-2">
                <Text className="text-[#94a3b8] text-xs font-semibold">Cắt tự động:</Text>
                <View className="bg-black rounded-xl overflow-hidden h-20">
                    <Image source={{ uri: capturedCrop || undefined }} className="w-full h-full" resizeMode="contain" />
                </View>
              </View>
            </View>

            <View className="flex-row rounded-2xl p-4 gap-3 border bg-orange-500/10 border-orange-500/20">
              <AlertTriangle size={20} color="#f59e0b" />
              <Text className={`flex-1 ${isDark ? 'text-white/80' : 'text-slate-700'} text-[13px] leading-5`}>
                Kết quả: <Text className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{detectedPlate}</Text>. Định dạng này không hợp lệ cho biển số VN. Hãy kiểm tra lại góc chụp.
              </Text>
            </View>

            {isCorrected && (
               <View className="flex-row rounded-2xl p-4 gap-3 border bg-blue-500/10 border-blue-500/20">
                 <Info size={18} color="#3b82f6" />
                 <Text className={`flex-1 ${isDark ? 'text-white/80' : 'text-slate-700'} text-[13px] leading-5`}>
                   Hệ thống đã tự sửa lỗi sai ký tự phổ biến.
                 </Text>
               </View>
            )}

            <Button 
              label="Chụp lại ngay"
              onPress={handleReset}
              leftIcon={RotateCcw}
              variant="outline"
              className="border-red-500 h-14 rounded-2xl mt-2"
              textClassName="text-red-500"
              iconSize={18}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}));

ErrorModal.displayName = 'ErrorModal';
