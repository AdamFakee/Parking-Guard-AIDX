import { Button } from '@/shared/components/ui';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Text, View } from 'react-native';

export interface StatusModalRef {
  show: (params: {
    title: string;
    message: string;
    variant?: 'info' | 'warning' | 'error' | 'success';
    onClose?: () => void;
  }) => void;
  hide: () => void;
}

export const StatusModal = forwardRef<StatusModalRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<{
    title: string;
    message: string;
    variant: 'info' | 'warning' | 'error' | 'success';
    onClose?: () => void;
  }>({
    title: '',
    message: '',
    variant: 'info',
  });

  useImperativeHandle(ref, () => ({
    show: (params) => {
      setData({
        title: params.title,
        message: params.message,
        variant: params.variant || 'info',
        onClose: params.onClose,
      });
      setVisible(true);
    },
    hide: () => setVisible(false),
  }));

  const handleClose = () => {
    setVisible(false);
    data.onClose?.();
  };

  const colors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
    success: '#10b981',
  };

  const bgColors = {
    info: 'bg-blue-50',
    warning: 'bg-amber-50',
    error: 'bg-red-50',
    success: 'bg-emerald-50',
  };

  const Icon = {
    info: Info,
    warning: AlertCircle,
    error: X,
    success: CheckCircle2,
  }[data.variant];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden p-8 items-center shadow-2xl">
          <View className={`size-20 ${bgColors[data.variant]} rounded-full items-center justify-center mb-6`}>
             {Icon && <Icon size={40} color={colors[data.variant]} />}
          </View>
          
          <Text className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tighter uppercase">
            {data.title}
          </Text>
          
          <Text className="text-[15px] text-slate-500 font-medium text-center mb-8 leading-6 px-2">
            {data.message}
          </Text>

          <Button 
            label="ĐÃ HIỂU"
            onPress={handleClose}
            className="w-full h-16 rounded-[24px]"
            textClassName="font-black tracking-widest"
          />
        </View>
      </View>
    </Modal>
  );
});

StatusModal.displayName = 'StatusModal';
