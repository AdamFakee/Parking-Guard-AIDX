import { AppHeader } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants/color.const';
import {
  CheckoutFooter,
  checkoutSchema,
  formatDisplayPlate,
  LOST_CARD_REASONS,
  MonthlyInfoBanner,
  PhotoCaptureCard,
  PricingBreakdown,
  QRPaymentModal,
  QRPaymentModalRef,
  TCheckoutForm,
  TParkingEntry,
  TScanPlateResultParams,
  useCheckOut,
  usePricingRules,
  useSystemConfig,
  VehicleImageComparison,
  VehicleSearch
} from '@/shared/features/gate';
import { checkNfcCardUsage, getEntryById } from '@/shared/features/gate/apis/gate.api';
import { calculateParkingPricing, checkPlateMatch } from '@/shared/features/gate/utils';
import { useShiftStore } from '@/shared/features/shift';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Circle, Lock, MessageSquare as MessageSquareIcon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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

  // Additional Proof Photos for Lost Card
  const [docPhoto, setDocPhoto] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [personPhoto, setPersonPhoto] = useState<string | null>(null);
  const [cancelMonthly, setCancelMonthly] = useState(true);

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

  const plateMatch = useMemo(() => {
    return checkPlateMatch(entry?.plateText, initialPlate);
  }, [entry, initialPlate]);

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
        plateMatch,
        photoDocument: docPhoto || '',
        photoVehicle: vehiclePhoto || '',
        photoPerson: personPhoto || '',
        cancelMonthly: isMonthly && cancelMonthly,
      }, {
        onSuccess: () => {
          Alert.alert("Thành công", `Đã lưu lượt xe ra MẤT THẺ (${pricing.total.toLocaleString()}đ)`, [
            { text: "Hoàn tất", onPress: () => {
              router.dismissAll();
              router.replace('/');
            }}
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

  const isFormValid = !!reason && reason.trim().length > 0 && !!docPhoto && !!vehiclePhoto && !!personPhoto;

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

            <MonthlyInfoBanner 
              isMonthly={isMonthly}
              customerName={monthlyInfo?.customerName}
              isExpired={monthlyInfo?.isExpired}
            />

            {/* Comparison Images */}
            <VehicleImageComparison
              entryPlate={entry.plateText}
              exitPlate={initialPlate || ''}
              entryPhoto={entry.photoIn1}
              entryPhoto2={entry.photoIn2}
              exitPhoto={outFullImage || ''}
              exitPhoto2={outPlateImage}
              plateMatch={plateMatch}
            >
              {/* Reason Input - Required */}
              <View className="mt-4 pt-4 border-t border-slate-100">
                <View className="flex-row items-center mb-3">
                  <MessageSquareIcon size={16} color={COLORS.brand.red} />
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

              {/* Security Proof Photos */}
              <View className="mt-6 pt-6 border-t border-slate-100 gap-6">
                <View className="flex-row items-center">
                  <Text className="text-[12px] font-bold text-slate-500 uppercase">Hình ảnh minh chứng an ninh (Bắt buộc)</Text>
                </View>

                <PhotoCaptureCard 
                  title="1. Giấy tờ xe"
                  buttonLabel="giấy tờ"
                  photo={docPhoto}
                  onChange={setDocPhoto}
                />

                <PhotoCaptureCard 
                  title="2. Hình ảnh xe (Tổng thể)"
                  buttonLabel="hình xe"
                  photo={vehiclePhoto}
                  onChange={setVehiclePhoto}
                />

                <PhotoCaptureCard 
                  title="3. Hình ảnh người lấy xe"
                  buttonLabel="người lấy xe"
                  photo={personPhoto}
                  onChange={setPersonPhoto}
                />
              </View>

              {/* Card Security Warning */}
              <View className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex-row">
                <Lock size={20} color="#d97706" />
                <View className="flex-1 ml-3">
                  <Text className="text-amber-800 font-bold text-sm">Bảo mật thẻ</Text>
                  <Text className="text-amber-700 text-[12px] leading-5">Hệ thống sẽ tự động CHỐT KHÓA mã thẻ này để tránh kẻ dối lợi dụng.</Text>
                </View>
              </View>

              {isMonthly && (
                <Pressable 
                  onPress={() => setCancelMonthly(!cancelMonthly)}
                  className="mt-4 p-4 bg-white rounded-2xl border border-slate-100 flex-row items-center"
                >
                  {cancelMonthly ? <CheckCircle2 size={24} color="#3b82f6" /> : <Circle size={24} color="#CBD5E1" />}
                  <View className="ml-3 flex-1">
                    <Text className="text-slate-800 font-bold text-sm">Hủy đăng ký thẻ tháng</Text>
                    <Text className="text-slate-400 text-[11px]">Khách hàng cần đăng ký thẻ mới để tiếp tục sử dụng dịch vụ tháng.</Text>
                  </View>
                </Pressable>
              )}
            </VehicleImageComparison>

            {/* Pricing */}
            <PricingBreakdown 
              cardUid={entry.cardUid}
              pricing={pricing}
              showSurcharge={true}
            />
          </ScrollView>

          {/* Footer Actions */}
          <CheckoutFooter 
            isFormValid={isFormValid}
            isPending={isPending}
            onCashPress={handleSubmit((data) => onConfirmCheckout(data, 'cash'))}
            onQRPress={handleSubmit((data) => {
              setPendingFormData(data);
              qrModalRef.current?.open(pricing.total, entry.plateText);
            })}
          />
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
