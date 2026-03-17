import { AppHeader } from '@/shared/components/ui';
import { COLORS, SHADOW } from '@/shared/constants/color.const';
import { checkoutSchema, TCheckoutForm, TParkingEntry, useCheckOut, usePricingRules, useSystemConfig } from '@/shared/features/gate';
import { getActiveEntryByCard } from '@/shared/features/gate/apis/gate.api';
import { SearchActiveEntryModal, SearchActiveEntryModalRef } from '@/shared/features/gate/components/search-active-entry-modal';
import { calculateParkingPricing, checkPlateMatch } from '@/shared/features/gate/utils';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, AlertTriangle, Calculator, CheckCircle2, Circle, MessageSquare, Wallet } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';


export default function CheckOutScreen() {
  const router = useRouter();
  const { tagUid, image: outImage, plate: outPlate } = useLocalSearchParams<{ tagUid: string, image: string, plate: string }>();
  
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<TParkingEntry | null>(null);
  const { mutate: performCheckOut, isPending } = useCheckOut();
  
  const { data: sysConfig } = useSystemConfig();
  const { data: pricingRules } = usePricingRules();
  
  const searchModalRef = useRef<SearchActiveEntryModalRef>(null);

  const { control, handleSubmit, watch, setValue } = useForm<TCheckoutForm>({
    resolver: valibotResolver(checkoutSchema),
    defaultValues: {
      checkoutType: tagUid && tagUid !== 'undefined' ? 'normal' : undefined,
      reason: ''
    }
  });

  const checkoutType = watch('checkoutType');

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
      const timer = setTimeout(() => {
         searchModalRef.current?.open(outPlate, true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tagUid, outPlate, loadEntryByCard, setValue]);

  const handleSelectEntry = (selectedEntry: TParkingEntry) => {
    setEntry(selectedEntry);
    if (!tagUid || tagUid === 'undefined') {
      setValue('checkoutType', undefined);
    }
  };

  const plateMatch = useMemo(() => {
    return checkPlateMatch(entry?.plateText, outPlate);
  }, [entry, outPlate]);

  const isLostCard = checkoutType === 'lost';

  const pricing = useMemo(() => {
    return calculateParkingPricing(entry, sysConfig, pricingRules, isLostCard);
  }, [entry, isLostCard, sysConfig, pricingRules]);

  const onConfirmCheckout = (data: TCheckoutForm, paymentMethod: 'cash' | 'qr_transfer') => {
    if (!entry) return;

    const finalize = () => {
      performCheckOut({
        entryId: entry.id,
        cardUid: tagUid && tagUid !== 'undefined' ? tagUid : entry.cardUid,
        exitPlate: outPlate || entry.plateText,
        photoOut1: outImage || '',
        photoOut2: outImage || '',
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

    if (data.checkoutType === 'lost') {
      Alert.alert(
        "Xác nhận MẤT THẺ",
        "Bạn đang xác nhận xe ra trong tình trạng mất thẻ. Phụ thu 50.000đ sẽ được áp dụng. Bạn có chắc chắn?",
        [
          { text: "Bỏ qua", style: "cancel" },
          { text: "Xác nhận", onPress: finalize }
        ]
      );
    } else {
      finalize();
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
        {!tagUid && (
          <Pressable 
            onPress={() => searchModalRef.current?.open(outPlate, true)}
            className="bg-blue-500 px-8 py-3 rounded-xl"
            style={SHADOW.bottom}
          >
            <Text className="text-white font-bold">Tìm xe bằng biển số</Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-slate-400 font-medium">Quay lại</Text>
        </Pressable>
        <SearchActiveEntryModal ref={searchModalRef} onSelect={handleSelectEntry} />
      </View>
    );
  }

  const isFormValid = !!checkoutType;

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <AppHeader 
        title="Thông tin xe ra"
        variant="white"
        showBorderBottom={true}
        borderBottomColor={COLORS.slate[200]}
        rightIcon={!tagUid || tagUid === 'undefined' ? <Text className="text-blue-500 font-bold">Sửa</Text> : null}
        onRightPress={() => searchModalRef.current?.open(outPlate, true)}
      />

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Plate Comparison */}
        <View 
          className="bg-white rounded-2xl p-5 mb-4 border border-[#F1F5F9]"
          style={[SHADOW.bottom, { elevation: 2 }]}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hình ảnh vào</Text>
              <View className="w-full aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <Image source={{ uri: entry.photoIn1 }} className="w-full h-full" resizeMode="cover" />
              </View>
              <Text className="text-sm font-black text-[#1E293B] mt-2">{entry.plateText}</Text>
            </View>
            
            <View className="px-4 items-center justify-center">
              <View 
                className="px-2 py-1 rounded-full border mb-2"
                style={{ 
                  backgroundColor: plateMatch ? '#f0fdf4' : '#fef2f2', 
                  borderColor: plateMatch ? '#bbf7d0' : '#fecaca' 
                }}
              >
                <Text className="text-[10px] font-bold uppercase" style={{ color: plateMatch ? COLORS.brand.green : COLORS.brand.red }}>
                  {plateMatch ? 'Khớp' : 'Lệch'}
                </Text>
              </View>
              <View className="w-8 h-[1px] bg-slate-200" />
            </View>

            <View className="flex-1 items-end">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hình ảnh ra</Text>
              <View className="w-full aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <Image source={{ uri: outImage }} className="w-full h-full" resizeMode="cover" />
              </View>
              <Text className="text-sm font-black text-[#1E293B] mt-2">{outPlate || '---'}</Text>
            </View>
          </View>
        </View>

        {/* Manual Checkout Options */}
        {(!tagUid || tagUid === 'undefined') && (
          <View 
            className="bg-white rounded-2xl p-5 mb-4 border border-[#F1F5F9]"
            style={[SHADOW.bottom, { elevation: 2 }]}
          >
            <View className="flex-row items-center mb-4">
              <AlertTriangle size={18} color={COLORS.slate[500]} />
              <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-2">Hình thức ra (Bắt buộc)</Text>
            </View>
            
            <View className="flex-row gap-3">
              <Pressable 
                onPress={() => setValue('checkoutType', 'virtual')}
                className={`flex-1 flex-row items-center p-4 rounded-xl border ${checkoutType === 'virtual' ? 'bg-[#eff6ff] border-[#bfdbfe]' : 'bg-[#F8FAFC] border-slate-200'}`}
              >
                {checkoutType === 'virtual' ? <CheckCircle2 size={16} color={COLORS.brand.blue} /> : <Circle size={16} color={COLORS.slate[200]} />}
                <Text className={`ml-2 text-sm font-bold ${checkoutType === 'virtual' ? 'text-blue-500' : 'text-slate-500'}`}>Xe không thẻ</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => setValue('checkoutType', 'lost')}
                className={`flex-1 flex-row items-center p-4 rounded-xl border ${checkoutType === 'lost' ? 'bg-[#fff7ed] border-[#fed7aa]' : 'bg-[#F8FAFC] border-slate-200'}`}
              >
                {checkoutType === 'lost' ? <CheckCircle2 size={16} color={COLORS.brand.orange} /> : <Circle size={16} color={COLORS.slate[200]} />}
                <Text className={`ml-2 text-sm font-bold ${checkoutType === 'lost' ? 'text-amber-500' : 'text-slate-500'}`}>Mất thẻ</Text>
              </Pressable>
            </View>

            {checkoutType === 'lost' && (
              <View className="mt-4">
                <View className="flex-row items-center mb-2">
                  <MessageSquare size={14} color={COLORS.slate[400]} />
                  <Text className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lý do/Ghi chú</Text>
                </View>
                <Controller
                  control={control}
                  name="reason"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Nhập lý do mất thẻ hoặc ghi chú..."
                      multiline
                      numberOfLines={3}
                      className="bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm text-[#1E293B] min-h-[80px]"
                      textAlignVertical="top"
                    />
                  )}
                />
              </View>
            )}
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
              <Text className="text-sm font-bold text-[#1E293B]">{entry.cardUid || 'N/A'}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-500">Thời gian đỗ</Text>
              <Text className="text-sm font-bold text-[#1E293B]">{pricing.duration}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-slate-500">Tiền gửi xe</Text>
              <Text className="text-sm font-bold text-[#1E293B]">{pricing.fee.toLocaleString()}đ</Text>
            </View>
            {isLostCard && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-red-500 font-bold">Phụ thu mất thẻ</Text>
                <Text className="text-sm font-bold text-red-500">+{pricing.surcharge.toLocaleString()}đ</Text>
              </View>
            )}
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
          <Pressable 
            disabled={!isFormValid || isPending}
            onPress={handleSubmit((data) => onConfirmCheckout(data, 'cash'))}
            className={`flex-1 py-4 rounded-2xl items-center justify-center flex-row gap-2 ${!isFormValid || isPending ? 'bg-slate-200' : 'bg-green-500'}`}
          >
            <Wallet size={20} color="white" />
            <Text className="text-white font-black uppercase text-xs">Tiền mặt</Text>
          </Pressable>
          
          <Pressable 
            disabled={!isFormValid || isPending}
            onPress={handleSubmit((data) => onConfirmCheckout(data, 'qr_transfer'))}
            className={`flex-1 py-4 rounded-2xl items-center justify-center flex-row gap-2 ${!isFormValid || isPending ? 'bg-slate-200' : 'bg-violet-500'}`}
          >
             <CheckCircle2 size={20} color="white" />
            <Text className="text-white font-black uppercase text-xs">Chuyển khoản</Text>
          </Pressable>
        </View>
        
        {isPending && <ActivityIndicator className="mt-4" color={COLORS.brand.blue} />}
      </View>

      <SearchActiveEntryModal ref={searchModalRef} onSelect={handleSelectEntry} />
    </View>
  );
}

