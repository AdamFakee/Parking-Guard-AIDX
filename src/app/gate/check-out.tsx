import { AppHeader, Button } from '@/shared/components/ui';
import { COLORS, SHADOW } from '@/shared/constants/color.const';
import { checkoutSchema, PREDEFINED_REASONS, QRPaymentModal, QRPaymentModalRef, TCheckoutForm, TParkingEntry, TScanPlateResultParams, useCheckOut, usePricingRules, useSystemConfig } from '@/shared/features/gate';
import { checkNfcCardUsage, getActiveEntryByCard, searchActiveEntries } from '@/shared/features/gate/apis/gate.api';
import { SearchActiveEntryModal, SearchActiveEntryModalRef } from '@/shared/features/gate/components/search-active-entry-modal';
import { calculateParkingPricing, checkPlateMatch, formatDisplayPlate } from '@/shared/features/gate/utils';
import { useShiftStore } from '@/shared/features/shift';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, AlertTriangle, Calculator, CheckCircle2, Circle, Info, Wallet } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';


export default function CheckOutScreen() {
  const router = useRouter();
  const { tagUid, fullImage: outFullImage, plateImage: outPlateImage, plate: outPlate } = useLocalSearchParams<TScanPlateResultParams>();
  
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<TParkingEntry | null>(null);
  const { currentShift } = useShiftStore();
  const { mutate: performCheckOut, isPending } = useCheckOut();
  
  const { data: sysConfig } = useSystemConfig();
  const { data: pricingRules } = usePricingRules();
  
  const searchModalRef = useRef<SearchActiveEntryModalRef>(null);
  const qrModalRef = useRef<QRPaymentModalRef>(null);
  const [pendingFormData, setPendingFormData] = useState<TCheckoutForm | null>(null);

  const [isMonthly, setIsMonthly] = useState(false);
  const [monthlyInfo, setMonthlyInfo] = useState<{ customerName?: string, isExpired?: boolean } | null>(null);

  const { control, handleSubmit, watch, setValue } = useForm<TCheckoutForm>({
    resolver: valibotResolver(checkoutSchema),
    defaultValues: {
      checkoutType: tagUid && tagUid !== 'undefined' ? 'normal' : undefined,
      reason: ''
    }
  });

  const checkoutType = watch('checkoutType');
  const reason = watch('reason');

  const loadEntryByCard = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const activeEntry = await getActiveEntryByCard(uid);
      if (activeEntry) {
        setEntry(activeEntry as TParkingEntry);
      } else {
        Alert.alert(
          "Thẻ không hợp lệ", 
          "Thẻ này chưa được quẹt vào hoặc đã ra khỏi bãi.",
          [{ text: "Quay lại", onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Load entry error:', error);
      Alert.alert("Lỗi", "Không thể truy vấn thông tin thẻ");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (tagUid && tagUid !== 'undefined') {
      loadEntryByCard(tagUid);
      setValue('checkoutType', 'normal');
    } else {
      setLoading(false);
      
      // Auto-search by plate if outPlate is available
      if (outPlate) {
        searchActiveEntries(outPlate).then(results => {
          if (results.length === 1) {
             const foundEntry = results[0] as TParkingEntry;
             
             // Nếu xe vào có thẻ nhưng ra không có thẻ => Luôn chuyển sang Mất thẻ
             if (foundEntry.cardUid) {
                router.push({
                  pathname: '/gate/lost-card',
                  params: { 
                    plate: outPlate, 
                    fullImage: outFullImage, 
                    plateImage: outPlateImage,
                    entryId: foundEntry.id
                  }
                });
                return;
             }

             // Ngược lại (xe vào không thẻ, ra không thẻ) => Checkout ảo
             setEntry(foundEntry);
             setValue('checkoutType', 'virtual');
          } else {
             // No unique match, show search modal
             searchModalRef.current?.open(outPlate, false);
          }
        }).catch(err => {
          console.error('Auto search error:', err);
          searchModalRef.current?.open(outPlate, false);
        });
      } else {
        const timer = setTimeout(() => {
           searchModalRef.current?.open(outPlate, false);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [tagUid, outPlate, loadEntryByCard, setValue, outFullImage, outPlateImage, router]);

  useEffect(() => {
    async function checkCardType() {
      const uidToCheck = tagUid && tagUid !== 'undefined' ? tagUid : entry?.cardUid;
      if (uidToCheck) {
        const usage = await checkNfcCardUsage(uidToCheck);
        if (usage.status === 'existing' && usage.cardType === 'thang') {
          if (usage.isExpired) {
            setIsMonthly(false);
            setMonthlyInfo({ customerName: usage.customerName, isExpired: true });
          } else {
            setIsMonthly(true);
            setMonthlyInfo({ customerName: usage.customerName, isExpired: false });
          }
        } else {
          setIsMonthly(false);
          setMonthlyInfo(null);
        }
      } else {
        setIsMonthly(false);
        setMonthlyInfo(null);
      }
    }
    if (entry || tagUid) {
      checkCardType();
    }
  }, [entry, tagUid]);

  const handleSelectEntry = (selectedEntry: TParkingEntry) => {
    setEntry(selectedEntry);
    if (!tagUid || tagUid === 'undefined') {
      // Nếu xe vào có dùng thẻ nhưng ra không có thẻ => Chuyển thẳng sang Mất thẻ
      if (selectedEntry.cardUid) {
        router.push({
          pathname: '/gate/lost-card',
          params: { 
            plate: outPlate, 
            fullImage: outFullImage, 
            plateImage: outPlateImage,
            entryId: selectedEntry.id
          }
        });
        return;
      }

      // Nếu xe vào không dùng thẻ (vào lụi/không thẻ) => Checkout không thẻ
      setValue('checkoutType', 'virtual');
    }
  };

  const plateMatch = useMemo(() => {
    return checkPlateMatch(entry?.plateText, outPlate);
  }, [entry, outPlate]);

  const isLostCard = false;
  const isReasonRequired = !plateMatch;

  const pricing = useMemo(() => {
    return calculateParkingPricing(entry, sysConfig, pricingRules, isLostCard, isMonthly);
  }, [entry, isLostCard, sysConfig, pricingRules, isMonthly]);

  const onConfirmCheckout = (data: TCheckoutForm, paymentMethod: 'cash' | 'qr_transfer') => {
    if (!entry || !currentShift?.id) {
      if (!currentShift?.id) Alert.alert("Lỗi", "Không tìm thấy phiên làm việc hiện tại");
      return;
    }

    const finalize = () => {
      performCheckOut({
        entryId: entry.id,
        shiftId: currentShift.id,
        cardUid: tagUid && tagUid !== 'undefined' ? tagUid : entry.cardUid,
        exitPlate: outPlate || entry.plateText,
        photoOut1: outFullImage || '',
        photoOut2: outPlateImage || outFullImage || '',
        feeAmount: pricing.total,
        paymentMethod,
        isLostCard: data.checkoutType === 'lost',
        mismatchReason: data.reason,
        plateMatch
      }, {
        onSuccess: () => {
          Alert.alert("Thành công", `Đã lưu lượt xe ra (${pricing.total.toLocaleString()}đ)`, [
            { text: "Hoàn tất", onPress: () => router.dismissAll() }
          ]);
        },
        onError: (err) => {
          Alert.alert("Lỗi", "Không thể lưu lượt xe: " + err.message);
        }
      });
    };

    finalize();
  };

  const triggerQRPayment = (data: TCheckoutForm) => {
    setPendingFormData(data);
    qrModalRef.current?.open(pricing.total, entry?.plateText);
  };

  const handleQRConfirm = () => {
    if (pendingFormData) {
      onConfirmCheckout(pendingFormData, 'qr_transfer');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.brand.blue} />
        <Text className="mt-4 text-slate-500 text-sm">Đang kiểm tra trạng thái thẻ...</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-[#F8FAFC]">
        <AlertCircle size={64} color={COLORS.brand.red} />
        <Text className="text-xl font-bold text-[#1E293B] mt-4">Không có dữ liệu xe</Text>
        <Text className="text-slate-500 text-center mt-2 mb-8 text-sm">Vui lòng quẹt thẻ lại hoặc tìm kiếm xe bằng biển số</Text>
        <View className="w-full gap-3 mt-8">
          <Button 
            label="Tìm xe trong bãi"
            onPress={() => searchModalRef.current?.open(outPlate, false)}
            className="border-0 h-14 rounded-2xl"
            textClassName="font-bold text-white"
          />
          <Button 
            label="Quay lại"
            variant="outline"
            onPress={() => router.back()}
            className="border-slate-200 h-14 rounded-2xl"
            textClassName="text-slate-400 font-medium"
          />
        </View>
        <SearchActiveEntryModal ref={searchModalRef} onSelect={handleSelectEntry} />
      </View>
    );
  }

  const isFormValid = !!checkoutType && (!isReasonRequired || (!!reason && reason.trim().length > 0));
  
  // Logic cho việc chọn hình thức ra thủ công (không thẻ)
  const canBeVirtual = entry && !entry.cardUid; // Chỉ cho phép nếu xe vào không thẻ
  const canBeLost = entry && entry.cardUid;    // Chỉ cho phép nếu xe vào có thẻ

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader 
        title="Thông tin xe ra"
        variant="white"
        showBorderBottom={true}
        borderBottomColor={COLORS.slate[200]}
        rightIcon={!tagUid || tagUid === 'undefined' ? <Text className="text-blue-500 font-bold">Tìm xe trong bãi</Text> : null}
        onRightPress={() => searchModalRef.current?.open(outPlate, false)}
      />

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 160 }}>
        {monthlyInfo && (
          <View 
            style={{ 
              backgroundColor: isMonthly ? '#eff6ff' : '#fef2f2', 
              padding: 12, 
              borderRadius: 12, 
              marginBottom: 16, 
              flexDirection: 'row', 
              alignItems: 'center',
              borderWidth: 1,
              borderColor: isMonthly ? '#bfdbfe' : '#fecaca'
            }}
          >
            {isMonthly ? (
              <Info size={20} color="#3b82f6" style={{ marginRight: 8 }} />
            ) : (
              <AlertTriangle size={20} color="#ef4444" style={{ marginRight: 8 }} />
            )}
            <View>
              <Text style={{ color: isMonthly ? '#1e40af' : '#b91c1c', fontWeight: 'bold' }}>
                Thẻ tháng: {monthlyInfo?.customerName} {isMonthly ? '' : '(HẾT HẠN)'}
              </Text>
              <Text style={{ color: isMonthly ? '#1e40af' : '#b91c1c', fontSize: 12 }}>
                {isMonthly ? 'Đã được miễn phí tiền gửi xe' : 'Hết hạn sử dụng - Tính tiền như vé lượt'}
              </Text>
            </View>
          </View>
        )}

        {/* Plate Comparison */}
        <View 
          className="bg-white rounded-2xl p-5 mb-4 border border-[#F1F5F9]"
          style={[SHADOW.bottom, { elevation: 2 }]}
        >
          {/* Hình ảnh vào */}
          <View className="w-full">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hình ảnh vào</Text>
              <Text className="text-sm font-black text-[#1E293B]">{formatDisplayPlate(entry.plateText)}</Text>
            </View>
            <View className="w-full aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <Image source={{ uri: entry.photoIn1 }} className="w-full h-full" resizeMode="cover" />
              {entry.photoIn2 && entry.photoIn2 !== entry.photoIn1 && (
                <View className="absolute bottom-2 left-2 w-1/3 aspect-[3/1] border border-white rounded overflow-hidden">
                  <Image source={{ uri: entry.photoIn2 }} className="w-full h-full" resizeMode="contain" />
                </View>
              )}
            </View>
          </View>

          {/* Divider with Match Status */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-[1px] bg-slate-100" />
            <View 
              className="px-3 py-1.5 rounded-full border mx-4"
              style={{ 
                backgroundColor: plateMatch ? '#f0fdf4' : '#fef2f2', 
                borderColor: plateMatch ? '#bbf7d0' : '#fecaca' 
              }}
            >
              <Text className="text-[10px] font-bold uppercase" style={{ color: plateMatch ? COLORS.brand.green : COLORS.brand.red }}>
                {plateMatch ? 'Biển số trùng khớp ✓' : 'Biển số không khớp ✗'}
              </Text>
            </View>
            <View className="flex-1 h-[1px] bg-slate-100" />
          </View>

          {/* Hình ảnh ra */}
          <View className="w-full">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hình ảnh ra</Text>
              <Text className="text-sm font-black text-[#1E293B]">{formatDisplayPlate(outPlate) || '---'}</Text>
            </View>
            <View className="w-full aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              <Image source={{ uri: outFullImage }} className="w-full h-full" resizeMode="cover" />
              {outPlateImage && (
                <View className="absolute bottom-2 right-2 w-1/3 aspect-[3/1] border border-white rounded overflow-hidden">
                  <Image source={{ uri: outPlateImage }} className="w-full h-full" resizeMode="contain" />
                </View>
              )}
            </View>
          </View>

          {/* Plate Mismatch Reason Input */}
          {!plateMatch && (
            <View className="mt-4 pt-4 border-t border-slate-100">
              <View className="flex-row items-center mb-3">
                <AlertCircle size={14} color={COLORS.brand.red} />
                <Text className="text-[10px] font-bold text-red-500 uppercase ml-1">Lý do không khớp (Bắt buộc)</Text>
              </View>

              <View className="flex-row flex-wrap gap-2 mb-3">
                {PREDEFINED_REASONS.map((r) => (
                  <Pressable 
                    key={r}
                    onPress={() => setValue('reason', r)}
                    className={`px-3 py-2 rounded-lg border ${reason === r ? 'bg-red-100 border-red-200' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <Text className={`text-[12px] ${reason === r ? 'text-red-700 font-bold' : 'text-slate-600'}`}>{r}</Text>
                  </Pressable>
                ))}
                <Pressable 
                  onPress={() => {
                    if (PREDEFINED_REASONS.includes(reason || '')) {
                      setValue('reason', '');
                    }
                  }}
                  className={`px-3 py-2 rounded-lg border ${reason !== '' && !PREDEFINED_REASONS.includes(reason || '') ? 'bg-red-100 border-red-200' : 'bg-slate-50 border-slate-100'}`}
                >
                  <Text className={`text-[12px] ${reason !== '' && !PREDEFINED_REASONS.includes(reason || '') ? 'text-red-700 font-bold' : 'text-slate-600'}`}>Lý do khác (Nhập tay)...</Text>
                </Pressable>
              </View>

              {(!PREDEFINED_REASONS.includes(reason || '') || reason === '') && (
                <Controller
                  control={control}
                  name="reason"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Mô tả lý do khác..."
                      multiline
                      numberOfLines={2}
                      className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-[#1E293B] min-h-[60px]"
                      textAlignVertical="top"
                    />
                  )}
                />
              )}
            </View>
          )}
        </View>

        {/* Manual Checkout Options */}
        {(!tagUid || tagUid === 'undefined') && (
          <View 
            className="bg-white rounded-2xl p-5 mb-4 border border-[#F1F5F9]"
            style={[SHADOW.bottom, { elevation: 2 }]}
          >
            <View className="flex-row items-center mb-4">
              <AlertTriangle size={18} color={COLORS.slate[500]} />
              <View className="flex-1 ml-2">
                <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Hình thức ra</Text>
                <Text className="text-[10px] text-slate-400">Dựa trên dữ liệu lúc xe vào bãi</Text>
              </View>
            </View>
            
            <View className="flex-row gap-3">
              <Pressable 
                onPress={() => canBeVirtual && setValue('checkoutType', 'virtual')}
                disabled={!canBeVirtual}
                className={`flex-1 flex-row items-center p-4 rounded-xl border ${checkoutType === 'virtual' ? 'bg-[#eff6ff] border-[#bfdbfe]' : 'bg-[#F8FAFC] border-slate-200'} ${!canBeVirtual ? 'opacity-40' : ''}`}
              >
                {checkoutType === 'virtual' ? <CheckCircle2 size={16} color={COLORS.brand.blue} /> : <Circle size={16} color={COLORS.slate[200]} />}
                <View className="ml-2">
                  <Text className={`text-sm font-bold ${checkoutType === 'virtual' ? 'text-blue-500' : 'text-slate-500'}`}>Xe không thẻ</Text>
                  {!canBeVirtual && <Text className="text-[8px] text-slate-400">Xe này có dùng thẻ lúc vào</Text>}
                </View>
              </Pressable>
              
              <Pressable 
                onPress={() => {
                  if (canBeLost) {
                    router.push({
                      pathname: '/gate/lost-card',
                      params: { 
                        plate: outPlate, 
                        fullImage: outFullImage, 
                        plateImage: outPlateImage,
                        entryId: entry?.id
                      }
                    });
                  }
                }}
                disabled={!canBeLost}
                className={`flex-1 flex-row items-center p-4 rounded-xl border ${canBeLost ? 'bg-[#fff7ed] border-[#fed7aa]' : 'bg-slate-50 border-slate-100 opacity-40'}`}
              >
                <AlertTriangle size={16} color={canBeLost ? COLORS.brand.orange : COLORS.slate[400]} />
                <View className="ml-2">
                  <Text className={`text-sm font-bold ${canBeLost ? 'text-amber-500' : 'text-slate-400'}`}>Mất thẻ</Text>
                  {!canBeLost && <Text className="text-[8px] text-slate-400">Xe này không thẻ lúc vào</Text>}
                </View>
              </Pressable>
            </View>
          </View>
        )}

        {/* Pricing Card */}
        <View 
          className="bg-white rounded-2xl overflow-hidden border border-[#F1F5F9]"
          style={[SHADOW.bottom, { elevation: 2 }]}
        >
          <View className="p-5">
            <View className="flex-row items-center mb-4">
              <Calculator size={18} color={COLORS.slate[500]} />
              <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-2">Thanh toán</Text>
            </View>
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-500">Mã thẻ</Text>
              <Text className="text-sm font-bold text-[#1E293B]">{entry.cardUid || 'Không sử dụng thẻ'}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-500">Thời gian đỗ</Text>
              <Text className="text-sm font-bold text-[#1E293B]">{pricing.duration}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-500">Tiền gửi xe</Text>
              <Text className="text-sm font-bold text-[#1E293B]">{pricing.fee.toLocaleString()}đ</Text>
            </View>
            {/* Phụ thu mất thẻ đã được tách sang màn hình riêng */}
          </View>
          
          <View className="bg-[#fff7ed] p-6 items-center justify-center border-t border-[#ffedd5]">
            <Text className="text-[10px] font-black text-amber-500 uppercase tracking-[2px] mb-1">Tổng cộng</Text>
            <Text className="text-[32px] font-black text-amber-500" style={{ fontFamily: 'monospace' }}>
              {pricing.total.toLocaleString()}đ
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View 
        className="bg-white p-4 pb-10 border-t border-[#F1F5F9] absolute bottom-0 left-0 right-0"
        style={SHADOW.up}
      >
        <Text className="text-center text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[1.5px]">Phương thức thanh toán</Text>
        <View className="flex-row gap-3">
          <Button 
            disabled={!isFormValid || isPending}
            loading={isPending}
            onPress={handleSubmit((data) => onConfirmCheckout(data, 'cash'))}
            label="TIỀN MẶT"
            leftIcon={Wallet}
            iconSize={20}
            className={`flex-1 rounded-2xl h-14 border-0 ${!isFormValid || isPending ? 'bg-slate-200' : 'bg-green-500'}`}
            textClassName="text-white font-black text-xs"
          />
          
          <Button 
            disabled={!isFormValid || isPending}
            onPress={handleSubmit((data) => triggerQRPayment(data))}
            label="CHUYỂN KHOẢN"
            leftIcon={CheckCircle2}
            iconSize={20}
            className={`flex-1 rounded-2xl h-14 border-0 ${!isFormValid || isPending ? 'bg-slate-200' : 'bg-violet-500'}`}
            textClassName="text-white font-black text-xs"
          />
        </View>
      </View>

      <SearchActiveEntryModal ref={searchModalRef} onSelect={handleSelectEntry} />
      <QRPaymentModal ref={qrModalRef} onConfirm={handleQRConfirm} isPending={isPending} />
    </View>
  );
}

