import { AppHeader, Button, Card, ControlledInput, Input } from '@/shared/components/ui';
import {
  DEFAULT_MONTHLY_PRICE,
  DEFAULT_MONTHLY_PRICE_CAR,
  DEFAULT_MONTHLY_PRICE_EBIKE,
  DEFAULT_MONTHLY_PRICE_MOTORBIKE,
  MonthlyPaymentMethodSelector,
  MonthlyRegistrationForm, MonthlyRegistrationSchema,
  NfcScannerCard,
  PhotoCaptureCard,
  QRPaymentModal, QRPaymentModalRef,
  StatusModal,
  StatusModalRef,
  VehicleSelector,
  checkNfcCardUsage,
  useMonthlyRegistration,
  useNfc,
  useSystemConfig
} from '@/shared/features/gate';
import { useShiftStore } from '@/shared/features/shift';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export default function MonthlyRegisterScreen() {
  const router = useRouter();
  const [photoCustomer, setPhotoCustomer] = useState<string | null>(null);
  const [photoVehicle, setPhotoVehicle] = useState<string | null>(null);
  const { startListening, stopListening, isReading } = useNfc();
  const { currentShift } = useShiftStore();
  const { data: config } = useSystemConfig();
  const { mutateAsync: register, isPending } = useMonthlyRegistration();
  const qrRef = React.useRef<QRPaymentModalRef>(null);
  const statusRef = React.useRef<StatusModalRef>(null);

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
      price: String(DEFAULT_MONTHLY_PRICE) as any,
      paymentMethod: 'cash',
    },
  });

  const cardUid = watch('cardUid');
  const vehicleType = watch('vehicleType');

  const vehiclePrices = useMemo(() => ({
    car: config?.monthlyPriceCar || DEFAULT_MONTHLY_PRICE_CAR,
    motorbike: config?.monthlyPriceMotorbike || DEFAULT_MONTHLY_PRICE_MOTORBIKE,
    ebike: config?.monthlyPriceEbike || DEFAULT_MONTHLY_PRICE_EBIKE,
  }), [config]);

  // Auto-update price when vehicle type or config changes
  useEffect(() => {
    if (!config) return;
    const selectedPrice = vehiclePrices[vehicleType as keyof typeof vehiclePrices] || DEFAULT_MONTHLY_PRICE;
    setValue('price', String(selectedPrice) as any);
  }, [vehicleType, vehiclePrices, setValue, config]);


  const handleScanNfc = useCallback(async () => {
    if (isReading) return;
    
    try {
      await startListening(async (tag) => {
        if (tag?.id) {
          const check = await checkNfcCardUsage(tag.id);
          
          if (check.status === 'existing') {
            // Trường hợp 1: Thẻ tháng vẫn còn hạn
            if (check.cardType === 'thang' && !check.isExpired) {
              statusRef.current?.show({
                title: 'Thẻ đang hoạt động',
                variant: 'warning',
                message: `Thẻ này đã được đăng ký cho xe ${check.registeredPlate} (${check.customerName}) và vẫn còn hạn sử dụng. Không cần đăng ký mới.`,
                onClose: () => stopListening()
              });
              return;
            }

            // Trường hợp 2: Thẻ đang được sử dụng (có thể là vé lượt hoặc thẻ tháng đã hết hạn nhưng đang trong bãi)
            if (check.cardStatus === 'active' || check.cardStatus === 'using') {
               statusRef.current?.show({
                title: 'Thẻ đã sử dụng',
                variant: 'error',
                message: `Thẻ này đang được sử dụng cho xe ${check.registeredPlate}. Vui lòng kiểm tra lại.`,
                onClose: () => stopListening()
              });
              return;
            }
          }

          setValue('cardUid', tag.id);
          stopListening();
        }
      });
    } catch (err) {
      console.error('NFC Trigger Error:', err);
    }
  }, [startListening, stopListening, isReading, setValue]);

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

  const handleRegister = useCallback(async (data: MonthlyRegistrationForm) => {
    try {
      if (!photoCustomer || !photoVehicle) {
        Alert.alert('Thiếu ảnh', 'Vui lòng chụp đầy đủ ảnh khách hàng & phương tiện');
        return;
      }

      if (!currentShift?.id) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin ca trực');
        return;
      }

      await register({
        ...data,
        photoProfile: photoCustomer,
        photoVehicle: photoVehicle,
        shiftId: currentShift.id,
      });

      Alert.alert('Thành công', 'Đã đăng ký thẻ tháng thành công', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      reset();
      setPhotoCustomer(null);
      setPhotoVehicle(null);
      qrRef.current?.close();
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể đăng ký thẻ tháng');
    }
  }, [photoCustomer, photoVehicle, currentShift, register, reset, router]);

  const onSave = async (data: MonthlyRegistrationForm) => {
    if (!photoCustomer || !photoVehicle) {
      Alert.alert('Thiếu ảnh', 'Vui lòng chụp đầy đủ ảnh khách hàng & phương tiện');
      return;
    }

    if (data.paymentMethod === 'qr_transfer') {
      qrRef.current?.open(data.price, `DK_${data.vehiclePlate.replace(/[^A-Za-z0-9]/g, '')}`);
      return;
    }

    await handleRegister(data);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <AppHeader 
        title="Đăng ký thẻ tháng" 
        subtitle="Cấp mới & Định danh"
        variant="white"
      />

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

        <View className="flex-row gap-4">
          <View className="flex-1">
            <PhotoCaptureCard 
              title="2. Ảnh khách hàng"
              buttonLabel="ảnh khách"
              photo={photoCustomer} 
              onChange={setPhotoCustomer} 
            />
          </View>
          <View className="flex-1">
            <PhotoCaptureCard 
              title="3. Ảnh phương tiện"
              buttonLabel="ảnh xe"
              photo={photoVehicle} 
              onChange={setPhotoVehicle} 
            />
          </View>
        </View>

        <Card 
          shadow 
          className="gap-5 p-5 rounded-3xl border border-slate-100"
        >
          <Text className="text-sm font-bold text-slate-900 mb-1">4. Thông tin chi tiết</Text>
          
          <VehicleSelector 
            value={vehicleType} 
            onSelect={(type) => setValue('vehicleType', type)} 
            showLabel={false}
          />

          <ControlledInput
            control={control}
            name="vehiclePlate"
            label="Biển số xe"
            placeholder="Ví dụ: 29A12345"
            autoCapitalize="characters"
            required
          />

          <ControlledInput
            control={control}
            name="customerName"
            label="Họ và tên khách hàng"
            placeholder="Nhập tên khách hàng..."
            required
          />

          <ControlledInput
            control={control}
            name="customerPhone"
            label="Số điện thoại liên hệ"
            keyboardType="phone-pad"
            placeholder="09xxx..."
          />

          <MonthlyPaymentMethodSelector 
            value={watch('paymentMethod')} 
            onSelect={(method) => setValue('paymentMethod', method)} 
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
                <Text className="text-note1 text-black font-medium ml-1">Chu kỳ gia hạn</Text>
                <Input
                  value="30 Ngày"
                  editable={false}
                />
              </View>
            </View>
          </View>
        </Card>

        <View className="mt-4 pb-12">
          <Button
            label={watch('paymentMethod') === 'qr_transfer' ? "Thanh toán & Đăng ký" : "Xác nhận Đăng ký"}
            onPress={handleSubmit(onSave)}
            loading={isPending}
            disabled={isPending}
            className="h-16 rounded-2xl"
            textClassName="text-lg"
            leftIcon={CheckCircle2}
          />
        </View>
      </KeyboardAwareScrollView>

      <QRPaymentModal 
        ref={qrRef}
        onConfirm={handleSubmit(handleRegister)}
        isPending={isPending}
      />
      <StatusModal ref={statusRef} />
    </View>
  );
}
