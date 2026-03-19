import { Button, ControlledInput } from '@/shared/components/ui';
import { checkNfcCardUsage } from '@/shared/features/gate/apis/gate.api';
import { useMonthlyRegistration, useNfc, useSystemConfig } from '@/shared/features/gate/hooks';
import { useShiftStore } from '@/shared/features/shift';
import { cn } from '@/shared/utils';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bike,
  Calendar,
  Camera,
  Car,
  CheckCircle2,
  Scan,
  Trash2,
  Zap
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import * as v from 'valibot';

// --- SCHEMA ---

const MonthlyRegistrationSchema = v.object({
  cardUid: v.pipe(v.string(), v.minLength(1, 'Vui lòng quét thẻ NFC')),
  customerName: v.pipe(v.string(), v.minLength(1, 'Vui lòng nhập tên khách hàng')),
  customerPhone: v.string(),
  vehicleType: v.picklist(['motorbike', 'car', 'ebike']),
  vehiclePlate: v.pipe(v.string(), v.minLength(1, 'Vui lòng nhập biển số')),
  startDate: v.any(),
  endDate: v.any(),
  price: v.pipe(
    v.string(),
    v.regex(/^\d*$/, 'Vui lòng chỉ nhập số'),
    v.transform((val) => Number(val || 0))
  ),
});

type MonthlyRegistrationForm = v.InferOutput<typeof MonthlyRegistrationSchema>;

const styles = {
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// --- SUB-COMPONENTS ---

const VehicleTypeSelector = ({ 
  value, 
  onSelect 
}: { 
  value: 'motorbike' | 'car' | 'ebike', 
  onSelect: (type: 'motorbike' | 'car' | 'ebike') => void 
}) => {
  const options = [
    { type: 'motorbike' as const, label: 'Xe máy', icon: Bike },
    { type: 'car' as const, label: 'Ô tô', icon: Car },
    { type: 'ebike' as const, label: 'Xe đạp điện', icon: Zap },
  ];

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        {options.slice(0, 2).map(({ type, label, icon: Icon }) => {
          const isSelected = value === type;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => onSelect(type)}
              className={cn(
                'flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl border',
                isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'
              )}
              style={!isSelected ? styles.shadowSm : undefined}
            >
              <Icon size={18} color={isSelected ? 'white' : '#64748B'} />
              <Text className={cn('font-bold text-xs', isSelected ? 'text-white' : 'text-slate-500')}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => onSelect('ebike')}
          className={cn(
            'flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl border',
            value === 'ebike' ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'
          )}
          style={value !== 'ebike' ? styles.shadowSm : undefined}
        >
          <Zap size={18} color={value === 'ebike' ? 'white' : '#64748B'} />
          <Text className={cn('font-bold text-xs', value === 'ebike' ? 'text-white' : 'text-slate-500')}>
            Xe đạp điện
          </Text>
        </TouchableOpacity>
        <View className="flex-1" />
      </View>
    </View>
  );
};

const NfcScannerCard = ({ 
  uid, 
  isReading, 
  onPress 
}: { 
  uid: string | null, 
  isReading: boolean, 
  onPress: () => void 
}) => (
  <View className="gap-4">
    <Text className="text-sm font-bold text-slate-900 pl-1">1. Xác thực thẻ NFC</Text>
    <TouchableOpacity 
      onPress={onPress}
      disabled={isReading}
      className={cn(
        "h-28 border-2 border-dashed rounded-3xl items-center justify-center gap-3",
        uid ? "bg-green-50 border-green-500" : "bg-white border-blue-200"
      )}
      style={!uid ? styles.shadowSm : undefined}
    >
      {uid ? (
        <>
          <View className="size-12 bg-green-500 rounded-full items-center justify-center">
            <CheckCircle2 size={24} color="white" />
          </View>
          <Text className="text-green-600 font-black tracking-tight text-base">Thẻ: {uid}</Text>
        </>
      ) : (
        <>
          <View className="size-12 bg-blue-50 rounded-full items-center justify-center">
            <Scan size={24} color="#3B82F6" />
          </View>
          <Text className="text-blue-500 font-bold">{isReading ? 'Đang chờ thẻ...' : 'Chạm thẻ vào đầu đọc'}</Text>
        </>
      )}
    </TouchableOpacity>
  </View>
);

const PhotoCaptureCard = ({ 
  photo, 
  onCapture, 
  onRemove 
}: { 
  photo: string | null, 
  onCapture: () => void, 
  onRemove: () => void 
}) => (
  <View className="gap-4">
    <Text className="text-sm font-bold text-slate-900 pl-1">2. Ảnh định danh (Khách/Xe)</Text>
    {photo ? (
      <View className="relative" style={styles.shadowMd}>
        <Image source={{ uri: photo }} className="w-full h-56 rounded-3xl" />
        <TouchableOpacity 
          onPress={onRemove}
          className="absolute top-3 right-3 size-10 bg-red-500 rounded-full items-center justify-center"
          style={styles.shadowLg}
        >
          <Trash2 size={20} color="white" />
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity 
        onPress={onCapture}
        className="h-56 bg-white rounded-3xl items-center justify-center gap-3 border-2 border-slate-200 border-dashed"
        style={styles.shadowSm}
      >
        <View className="size-16 bg-slate-50 rounded-full items-center justify-center">
          <Camera size={32} color="#94A3B8" />
        </View>
        <Text className="text-slate-400 font-bold">Chụp ảnh định danh</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function MonthlyRegisterScreen() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const { startListening, stopListening, isReading } = useNfc();
  const { currentShift } = useShiftStore();
  const { data: config } = useSystemConfig();
  const { mutateAsync: register, isPending } = useMonthlyRegistration();

  const { control, handleSubmit, setValue, watch, reset } = useForm<MonthlyRegistrationForm>({
    resolver: valibotResolver(MonthlyRegistrationSchema as any),
    defaultValues: {
      cardUid: '',
      customerName: '',
      customerPhone: '',
      vehicleType: 'motorbike',
      vehiclePlate: '',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      price: '100000' as any,
    },
  });

  const cardUid = watch('cardUid');
  const vehicleType = watch('vehicleType');

  // Auto-update price when vehicle type or config changes
  useEffect(() => {
    if (!config) return;
    
    let defaultPrice = 100000;
    if (vehicleType === 'car') defaultPrice = config.monthlyPriceCar || 500000;
    else if (vehicleType === 'motorbike') defaultPrice = config.monthlyPriceMotorbike || 100000;
    else if (vehicleType === 'ebike') defaultPrice = config.monthlyPriceEbike || 100000;
    
    setValue('price', String(defaultPrice) as any);
  }, [vehicleType, config, setValue]);

  const handleCapturePhoto = useCallback(async () => {
    // Reverted to mock as requested
    const mockImage = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop';
    setPhoto(mockImage);
  }, []);

  const handleScanNfc = useCallback(async () => {
    if (isReading) return;
    
    try {
      await startListening(async (tag) => {
        if (tag?.id) {
          const check = await checkNfcCardUsage(tag.id);
          
          if (check.status === 'existing' && check.cardStatus === 'active') {
            Alert.alert(
              'Thẻ đã sử dụng',
              `Thẻ này đang được sử dụng cho xe ${check.registeredPlate}. Bạn có muốn cập nhật thông tin?`,
              [
                { text: 'Hủy', onPress: () => stopListening(), style: 'cancel' },
                { text: 'Tiếp tục', onPress: () => {
                  setValue('cardUid', tag.id);
                  stopListening();
                  setTimeout(() => handleCapturePhoto(), 500);
                }}
              ]
            );
            return;
          }

          setValue('cardUid', tag.id);
          stopListening();
          // Automatically trigger photo after NFC
          setTimeout(() => {
            handleCapturePhoto();
          }, 500);
        }
      });
    } catch (err) {
      console.error('NFC Trigger Error:', err);
    }
  }, [startListening, stopListening, isReading, setValue, handleCapturePhoto]);

  useEffect(() => {
    // Only trigger if we don't have a card UID yet
    if (!cardUid) {
      const timer = setTimeout(() => {
        handleScanNfc();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cardUid, handleScanNfc]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const onSave = async (data: MonthlyRegistrationForm) => {
    try {
      if (!photo) {
        Alert.alert('Thiếu ảnh', 'Vui lòng chụp ảnh khách hàng/phương tiện');
        return;
      }

      if (!currentShift?.id) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin ca trực');
        return;
      }

      await register({
        ...data,
        photoProfile: photo,
        shiftId: currentShift.id,
        paymentMethod: 'cash', // Default to cash
      });

      Alert.alert('Thành công', 'Đã đăng ký thẻ tháng thành công', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      reset();
      setPhoto(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể đăng ký thẻ tháng');
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-slate-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="size-10 bg-slate-100 rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color="#64748B" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-lg font-black text-slate-900 uppercase">Đăng ký thẻ tháng</Text>
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cấp mới & Định danh</Text>
          </View>
          <View className="size-10" />
        </View>
      </View>

      <KeyboardAwareScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ paddingVertical: 24, gap: 24 }}
        bottomOffset={62}
      >
        <NfcScannerCard 
          uid={cardUid} 
          isReading={isReading} 
          onPress={handleScanNfc} 
        />

        <PhotoCaptureCard 
          photo={photo} 
          onCapture={handleCapturePhoto} 
          onRemove={() => setPhoto(null)} 
        />

        <View className="gap-5 bg-white p-5 rounded-3xl border border-slate-100" style={styles.shadowSm}>
          <Text className="text-sm font-bold text-slate-900 mb-1">3. Thông tin chi tiết</Text>
          
          <VehicleTypeSelector 
            value={vehicleType} 
            onSelect={(type) => setValue('vehicleType', type)} 
          />

          <ControlledInput
            control={control}
            name="vehiclePlate"
            label="Biển số xe"
            placeholder="Ví dụ: 29A-123.45"
            autoCapitalize="characters"
          />

          <ControlledInput
            control={control}
            name="customerName"
            label="Họ và tên khách hàng"
            placeholder="Nhập tên khách hàng..."
          />

          <ControlledInput
            control={control}
            name="customerPhone"
            label="Số điện thoại liên hệ"
            keyboardType="phone-pad"
            placeholder="09xxx..."
          />

          <View className="flex-row gap-4">
            <View className="flex-1">
              <ControlledInput
                control={control}
                name="price"
                label="Giá vé (₫)"
                keyboardType="numeric"
                editable={false}
              />
            </View>
            <View className="flex-1">
              <View className="gap-2">
                <Text className="text-note1 text-slate-500 font-medium ml-1">Chu kỳ gia hạn</Text>
                <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex-row items-center gap-2">
                  <Calendar size={14} color="#64748B" />
                  <Text className="text-slate-600 font-bold text-xs uppercase">30 Ngày</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-4 pb-12">
          <Button
            label="Xác nhận Đăng ký"
            onPress={handleSubmit(onSave)}
            loading={isPending}
            disabled={isPending}
            className="h-16 rounded-2xl"
            textClassName="text-lg"
            leftIcon={CheckCircle2}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
