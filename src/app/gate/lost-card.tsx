import { AppHeader, Button } from '@/shared/components/ui';
import { COLORS, SHADOW } from '@/shared/constants/color.const';
import {
  calculateParkingPricing,
  checkoutSchema,
  formatDisplayPlate,
  LOST_CARD_REASONS,
  QRPaymentModal,
  QRPaymentModalRef,
  TCheckoutForm,
  TParkingEntry,
  TScanPlateResultParams,
  useCheckOut,
  usePricingRules,
  useSystemConfig,
  VehicleSearch
} from '@/shared/features/gate';
import { checkNfcCardUsage, getEntryById } from '@/shared/features/gate/apis/gate.api';
import { useShiftStore } from '@/shared/features/shift';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calculator, CheckCircle2, Info, MessageSquare, Search, Wallet } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

export default function LostCardScreen() {
  const router = useRouter();
  const { plate: initialPlate, fullImage: outFullImage, plateImage: outPlateImage, entryId } = useLocalSearchParams<TScanPlateResultParams>();
  
  const [entry, setEntry] = useState<TParkingEntry | null>(null);
  const { currentShift } = useShiftStore();
  const { mutate: performCheckOut, isPending } = useCheckOut();
  
  const { data: sysConfig } = useSystemConfig();
  const { data: pricingRules } = usePricingRules();
  
  const qrModalRef = useRef<QRPaymentModalRef>(null);
  const [pendingFormData, setPendingFormData] = useState<TCheckoutForm | null>(null);

  const [isMonthly, setIsMonthly] = useState(false);
  const [monthlyInfo, setMonthlyInfo] = useState<{ customerName?: string, isExpired?: boolean } | null>(null);

  const { control, handleSubmit, watch, setValue } = useForm<TCheckoutForm>({
    resolver: valibotResolver(checkoutSchema),
    defaultValues: {
      checkoutType: 'lost',
      reason: ''
    }
  });

  const reason = watch('reason');

  useEffect(() => {
    if (entryId) {
      getEntryById(entryId).then(res => {
        if (res) setEntry(res as TParkingEntry);
      }).catch(err => {
        console.error('Load entry by id error:', err);
      });
    }
  }, [entryId]);

  useEffect(() => {
    async function checkCardType() {
      if (entry?.cardUid) {
        const usage = await checkNfcCardUsage(entry.cardUid);
        if (usage.status === 'existing' && usage.cardType === 'thang') {
          setIsMonthly(!usage.isExpired);
          setMonthlyInfo({ customerName: usage.customerName, isExpired: usage.isExpired });
        } else {
          setIsMonthly(false);
          setMonthlyInfo(null);
        }
      }
    }
    if (entry) checkCardType();
  }, [entry]);

  const pricing = useMemo(() => {
    return calculateParkingPricing(entry, sysConfig, pricingRules, true, isMonthly);
  }, [entry, sysConfig, pricingRules, isMonthly]);

  const onConfirmCheckout = (data: TCheckoutForm, paymentMethod: 'cash' | 'qr_transfer') => {
    if (!entry || !currentShift?.id) {
      if (!currentShift?.id) Alert.alert("Lỗi", "Không tìm thấy phiên làm việc hiện tại");
      return;
    }

    const finalize = () => {
      performCheckOut({
        entryId: entry.id,
        shiftId: currentShift.id,
        cardUid: entry.cardUid || '',
        exitPlate: initialPlate || entry.plateText,
        photoOut1: outFullImage || '',
        photoOut2: outPlateImage || outFullImage || '',
        feeAmount: pricing.total,
        paymentMethod,
        isLostCard: true,
        lostCardReason: data.reason,
        plateMatch: false 
      }, {
        onSuccess: () => {
          Alert.alert("Thành công", `Đã lưu lượt xe ra MẤT THẺ (${pricing.total.toLocaleString()}đ)`, [
            { text: "Hoàn tất", onPress: () => router.dismissAll() }
          ]);
        },
        onError: (err) => {
          Alert.alert("Lỗi", "Không thể lưu lượt xe: " + err.message);
        }
      });
    };

    Alert.alert(
      "Xác nhận MẤT THẺ",
      `Hệ thống sẽ tính phụ thu mất thẻ. Tổng tiền: ${pricing.total.toLocaleString()}đ. Bạn có chắc chắn?`,
      [
        { text: "Bỏ qua", style: "cancel" },
        { text: "Xác nhận", onPress: finalize }
      ]
    );
  };

  const isFormValid = !!reason && reason.trim().length > 0;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader title="Xử lý Mất thẻ" variant="white" showBorderBottom />

      {!entry ? (
        <VehicleSearch 
          onSelect={setEntry} 
          initialPlate={initialPlate}
          autoFocus={true}
        />
      ) : (
        <View className="flex-1">
          <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 160 }}>
            {/* Entry Info Header */}
            <View className="flex-row items-center justify-between mb-4 bg-white p-4 rounded-2xl border border-slate-100">
              <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Xe đã chọn</Text>
                <Text className="text-xl font-black text-slate-800">{formatDisplayPlate(entry.plateText)}</Text>
              </View>
              <Pressable 
                onPress={() => {
                  setEntry(null);
                  setValue('reason', '');
                }}
                className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"
              >
                <Text className="text-blue-500 font-bold text-xs">Thay đổi</Text>
              </Pressable>
            </View>

            {monthlyInfo && (
              <View className={`p-3 rounded-xl mb-4 flex-row items-center border ${isMonthly ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                <Info size={20} color={isMonthly ? '#3b82f6' : '#ef4444'} />
                <View className="ml-2">
                  <Text className={`font-bold ${isMonthly ? 'text-blue-700' : 'text-red-700'}`}>
                    Thẻ tháng: {monthlyInfo.customerName} {isMonthly ? '' : '(HẾT HẠN)'}
                  </Text>
                </View>
              </View>
            )}

            {/* Comparison Images */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100" style={SHADOW.bottom}>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Ảnh vào</Text>
                  <View className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                    <Image source={{ uri: entry.photoIn1 }} className="w-full h-full" />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Ảnh ra hiện tại</Text>
                  <View className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                    {outFullImage ? (
                      <Image source={{ uri: outFullImage }} className="w-full h-full" />
                    ) : (
                      <View className="flex-1 items-center justify-center">
                        <Search size={24} color="#cbd5e1" />
                        <Text className="text-[8px] text-slate-400 mt-1">Không có ảnh</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Reason Input - Required */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100" style={SHADOW.bottom}>
              <View className="flex-row items-center mb-3">
                <MessageSquare size={16} color={COLORS.brand.red} />
                <Text className="text-[12px] font-bold text-red-500 uppercase ml-2">Lý do/Ghi chú mất thẻ (Bắt buộc)</Text>
              </View>
              
              <View className="flex-row flex-wrap gap-2 mb-3">
                {LOST_CARD_REASONS.map((r) => (
                  <Pressable 
                    key={r}
                    onPress={() => setValue('reason', r)}
                    className={`px-3 py-2 rounded-lg border ${reason === r ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <Text className={`text-[12px] ${reason === r ? 'text-red-700 font-bold' : 'text-slate-600'}`}>{r}</Text>
                  </Pressable>
                ))}
                <Pressable 
                    onPress={() => {
                        if (LOST_CARD_REASONS.includes(reason || '')) {
                            setValue('reason', '');
                        }
                    }}
                    className={`px-3 py-2 rounded-lg border ${reason !== '' && !LOST_CARD_REASONS.includes(reason || '') ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}
                >
                    <Text className={`text-[12px] ${reason !== '' && !LOST_CARD_REASONS.includes(reason || '') ? 'text-red-700 font-bold' : 'text-slate-600'}`}>Lý do khác...</Text>
                </Pressable>
              </View>

              <Controller
                control={control}
                name="reason"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Nhập chi tiết lý do mất thẻ..."
                    multiline
                    numberOfLines={3}
                    className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3 text-sm text-[#1E293B] min-h-[80px]"
                    textAlignVertical="top"
                  />
                )}
              />
            </View>

            {/* Pricing */}
            <View className="bg-white rounded-2xl overflow-hidden border border-slate-100" style={SHADOW.bottom}>
              <View className="p-4">
                <View className="flex-row items-center mb-3">
                  <Calculator size={16} color={COLORS.slate[500]} />
                  <Text className="text-[12px] font-bold text-slate-400 uppercase ml-2">Chi tiết thanh toán</Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-slate-500 text-xs">Tiền gửi xe ({pricing.duration})</Text>
                  <Text className="text-xs font-bold">{pricing.fee.toLocaleString()}đ</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-red-500 text-xs font-bold">Phụ thu mất thẻ</Text>
                  <Text className="text-xs font-bold text-red-500">+{pricing.surcharge.toLocaleString()}đ</Text>
                </View>
              </View>
              <View className="bg-amber-50 p-4 items-center border-t border-amber-100">
                <Text className="text-[24px] font-black text-amber-600 font-mono">
                  {pricing.total.toLocaleString()}đ
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="bg-white p-4 pb-10 border-t border-slate-100 absolute bottom-0 left-0 right-0 shadow-lg">
            <View className="flex-row gap-3">
              <Button 
                disabled={!isFormValid || isPending}
                loading={isPending}
                onPress={handleSubmit((data) => onConfirmCheckout(data, 'cash'))}
                label="TIỀN MẶT"
                leftIcon={Wallet}
                iconSize={20}
                className={`flex-1 rounded-2xl h-14 border-0 ${!isFormValid || isPending ? 'bg-slate-200' : 'bg-green-500'}`}
                textClassName={!isFormValid || isPending ? 'text-slate-400' : 'text-white font-black text-xs'}
              />
              <Button 
                disabled={!isFormValid || isPending}
                onPress={handleSubmit((data) => {
                  setPendingFormData(data);
                  qrModalRef.current?.open(pricing.total, entry.plateText);
                })}
                label="QR CHUYỂN KHOẢN"
                leftIcon={CheckCircle2}
                iconSize={20}
                className={`flex-1 rounded-2xl h-14 border-0 ${!isFormValid || isPending ? 'bg-slate-200' : 'bg-violet-500'}`}
                textClassName={!isFormValid || isPending ? 'text-slate-400' : 'text-white font-black text-xs'}
              />
            </View>
          </View>
        </View>
      )}

      <QRPaymentModal 
        ref={qrModalRef} 
        onConfirm={() => pendingFormData && onConfirmCheckout(pendingFormData, 'qr_transfer')} 
        isPending={isPending} 
      />
    </View>
  );
}
