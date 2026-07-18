import { Button } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants/color.const';
import { useShiftStore } from '@/shared/features/shift';
import { toastQueue } from '@/shared/utils/toast.util';
import { useRouter } from 'expo-router';
import { AlertCircle, ChevronLeft, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_PLATE_CHARS, PREDEFINED_REASONS } from '../const/parking.const';
import { useCheckOut, usePricingRules, useSystemConfig } from '../hooks';
import {
  isFreeCheckout,
  prepareCheckOut,
  PreparedCheckOut,
} from '../services/gate-session.service';
import { TParkingEntry } from '../types';
import { cleanPlateInput, formatDisplayPlate } from '../utils';
import { checkPlateMatch } from '../utils/pricing.util';
import { QRPaymentContent } from './qr-payment-content';
import {
  SearchActiveEntryModal,
  SearchActiveEntryModalRef,
} from './search-active-entry-modal';

function plateFromOcr(raw: string): { text: string; invalid: boolean } {
  const cleaned = cleanPlateInput(raw, 99);
  return {
    text: cleaned.slice(0, MAX_PLATE_CHARS),
    invalid: cleaned.length > MAX_PLATE_CHARS,
  };
}

export type OutConfirmPayload = {
  plate: string;
  fullImage: string;
  plateImage?: string | null;
  tagUid?: string;
  noCard?: boolean;
};

type Props = {
  visible: boolean;
  payload: OutConfirmPayload | null;
  onDismiss: () => void;
  onSuccess: () => void;
};

/**
 * Bottom sheet xe ra — layout đồng bộ sheet vào:
 * 2 ảnh ngang (vào | ra), palette brand-blue, không green.
 */
export function OutConfirmSheet({ visible, payload, onDismiss, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentShift } = useShiftStore();
  const { mutate: performCheckOut, isPending } = useCheckOut();
  const { data: sysConfig } = useSystemConfig();
  const { data: pricingRules } = usePricingRules();
  const searchModalRef = useRef<SearchActiveEntryModalRef>(null);

  const [loading, setLoading] = useState(true);
  const [prepared, setPrepared] = useState<PreparedCheckOut | null>(null);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<'pay' | 'qr'>('pay');
  const [exitPlate, setExitPlate] = useState('');
  const [plateInvalid, setPlateInvalid] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TParkingEntry | null>(null);

  const onDismissRef = React.useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Chỉ reset khi mở sheet / đổi payload — KHÔNG reset khi sysConfig refetch
  useEffect(() => {
    if (!visible || !payload) return;
    setLoading(true);
    setReason('');
    setStep('pay');
    setPrepared(null);
    setSelectedEntry(null);
    const fromOcr = plateFromOcr(payload.plate || '');
    setExitPlate(fromOcr.text);
    setPlateInvalid(fromOcr.invalid);
  }, [visible, payload?.tagUid, payload?.plate, payload?.fullImage, payload?.noCard]);

  useEffect(() => {
    if (!visible || !payload) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await prepareCheckOut({
        tagUid: payload.tagUid,
        outPlate: payload.plate,
        sysConfig,
        pricingRules,
        noCard: payload.noCard || !payload.tagUid,
        entry: selectedEntry,
      });
      if (cancelled) return;
      setPrepared(result);
      setLoading(false);

      if (result.error === 'lost_card' && result.entry) {
        onDismissRef.current();
        router.push({
          pathname: '/gate/lost-card',
          params: {
            plate: payload.plate,
            fullImage: payload.fullImage,
            plateImage: payload.plateImage || '',
            entryId: result.entry.id,
          },
        });
        return;
      }

      if (result.error === 'need_search') {
        setTimeout(() => {
          searchModalRef.current?.open(payload.plate || '', false);
        }, 150);
        return;
      }

      if (result.error === 'no_entry') {
        toastQueue.show({
          type: 'error',
          text1: 'Thẻ không hợp lệ',
          text2: 'Thẻ chưa quẹt vào hoặc đã ra bãi',
        });
        onDismissRef.current();
      } else if (result.error === 'load_failed') {
        toastQueue.show({ type: 'error', text1: 'Lỗi', text2: 'Không tải được lượt xe' });
        onDismissRef.current();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, payload, sysConfig, pricingRules, selectedEntry, router]);

  const entry = prepared?.entry;
  const pricing = prepared?.pricing;
  const plateMatch = checkPlateMatch(entry?.plateText, exitPlate);
  const free = pricing ? isFreeCheckout(pricing.total) : false;
  const reasonOk = plateMatch || reason.trim().length > 0;
  const canSubmit =
    !!entry && !!exitPlate.trim() && !plateInvalid && reasonOk && !isPending;

  const handleSelectEntry = async (picked: TParkingEntry) => {
    if (picked.cardUid && (payload?.noCard || !payload?.tagUid)) {
      onDismiss();
      router.push({
        pathname: '/gate/lost-card',
        params: {
          plate: exitPlate || payload?.plate || '',
          fullImage: payload?.fullImage || '',
          plateImage: payload?.plateImage || '',
          entryId: picked.id,
        },
      });
      return;
    }
    setSelectedEntry(picked);
    setLoading(true);
  };

  const submit = (paymentMethod: 'cash' | 'qr_transfer') => {
    if (!entry || !currentShift?.id || !payload || !pricing) {
      if (!currentShift?.id) {
        toastQueue.show({ type: 'error', text1: 'Lỗi', text2: 'Không tìm thấy ca trực' });
      }
      return;
    }

    performCheckOut(
      {
        entryId: entry.id,
        shiftId: currentShift.id,
        cardUid:
          payload.tagUid && payload.tagUid !== 'undefined'
            ? payload.tagUid
            : entry.cardUid,
        exitPlate: exitPlate || entry.plateText,
        photoOut1: payload.fullImage || '',
        photoOut2: payload.plateImage || payload.fullImage || '',
        feeAmount: pricing.total,
        paymentMethod,
        isLostCard: false,
        mismatchReason: reason || undefined,
        plateMatch,
      },
      {
        onSuccess: () => {
          setTimeout(() => onSuccess(), 50);
        },
        onError: (err) => {
          toastQueue.show({
            type: 'error',
            text1: 'Lỗi',
            text2: 'Không thể lưu lượt xe: ' + err.message,
          });
        },
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable
          className="absolute inset-0"
          onPress={() => {
            if (!isPending) onDismiss();
          }}
        />
        <View
          className="bg-white rounded-t-3xl max-h-[90%]"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-slate-200" />
          </View>

          <View className="flex-row items-center justify-between px-5 mb-3">
            {step === 'qr' ? (
              <Pressable onPress={() => setStep('pay')} className="flex-row items-center gap-1 min-h-11">
                <ChevronLeft size={20} color={COLORS.slate[500]} />
                <Text className="text-slate-500 font-semibold">Quay lại</Text>
              </Pressable>
            ) : (
              <Text className="text-lg font-black text-slate-900">Xác nhận xe ra</Text>
            )}
            <Pressable
              onPress={onDismiss}
              className="size-10 rounded-full bg-slate-100 items-center justify-center"
              hitSlop={8}
            >
              <X size={18} color={COLORS.slate[500]} />
            </Pressable>
          </View>

          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator color={COLORS.brand.blue} />
              <Text className="text-slate-400 text-sm mt-3">Đang tính phí...</Text>
            </View>
          ) : prepared?.error === 'need_search' || !entry || !pricing ? (
            <View className="px-5 py-10 items-center gap-4">
              <Text className="text-slate-700 font-bold text-center">
                Chưa chọn xe trong bãi
              </Text>
              <Text className="text-slate-400 text-sm text-center px-4">
                Không tìm thấy đúng 1 lượt theo biển — tìm thủ công
              </Text>
              <Button
                label="TÌM XE TRONG BÃI"
                onPress={() =>
                  searchModalRef.current?.open(exitPlate || payload?.plate || '', false)
                }
                className="h-14 w-full bg-brand-blue border-0 rounded-2xl"
                textClassName="text-white font-black"
              />
              <Button
                label="Đóng"
                variant="outline"
                onPress={onDismiss}
                className="h-12 w-full rounded-2xl"
              />
            </View>
          ) : (
            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {/* Cùng sheet — QR nhúng, không đổi cả body / không modal mới */}
              {step === 'qr' ? (
                <>
                  <QRPaymentContent
                    amount={pricing.total}
                    content={exitPlate || entry.plateText}
                    embedded
                  />
                  <Button
                    label="TÔI ĐÃ NHẬN TIỀN"
                    onPress={() => submit('qr_transfer')}
                    loading={isPending}
                    disabled={isPending}
                    className="h-14 mt-4 bg-brand-blue border-0 rounded-2xl"
                    textClassName="text-white font-black"
                  />
                </>
              ) : (
                <>
                  {prepared.isMonthly && (
                    <View className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                      <Text className="text-brand-blue font-bold text-sm">
                        Thẻ tháng
                        {prepared.monthlyInfo?.customerName
                          ? ` · ${prepared.monthlyInfo.customerName}`
                          : ''}
                        {free ? ' · Miễn phí' : ''}
                      </Text>
                    </View>
                  )}

                  <Text className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">
                    Ảnh đối soát
                  </Text>
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <View className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                        {entry.photoIn1 ? (
                          <Image
                            source={{ uri: entry.photoIn1 }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : null}
                      </View>
                      <Text className="text-center text-[10px] text-slate-400 mt-1.5 font-medium">
                        Lúc vào
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                        {payload?.fullImage ? (
                          <Image
                            source={{ uri: payload.fullImage }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : null}
                      </View>
                      <Text className="text-center text-[10px] text-slate-400 mt-1.5 font-medium">
                        Lúc ra
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase">Biển số lúc ra</Text>
                    <View
                      className={`px-2.5 py-1 rounded-full border ${
                        plateMatch ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          plateMatch ? 'text-brand-blue' : 'text-brand-red'
                        }`}
                      >
                        {plateMatch ? 'Khớp' : 'Lệch'}
                      </Text>
                    </View>
                  </View>
                  <TextInput
                    value={formatDisplayPlate(exitPlate)}
                    onChangeText={(t) => {
                      setExitPlate(cleanPlateInput(t, MAX_PLATE_CHARS));
                      setPlateInvalid(false);
                    }}
                    maxLength={MAX_PLATE_CHARS + 2}
                    autoCapitalize="characters"
                    placeholder="xx-xx-xxxx"
                    className={`bg-slate-50 border rounded-xl px-4 py-3.5 text-2xl font-black text-slate-900 font-mono mb-1 text-center tracking-widest ${
                      plateInvalid ? 'border-brand-red' : 'border-slate-200'
                    }`}
                  />
                  {plateInvalid ? (
                    <Text className="text-brand-red text-xs text-center mb-2">
                      Biển số không hợp lệ — nhập lại (tối đa {MAX_PLATE_CHARS} ký tự)
                    </Text>
                  ) : null}
                  <Text className="text-slate-400 text-xs mb-4 text-center">
                    Vào: {formatDisplayPlate(entry.plateText)} · {pricing.duration}
                  </Text>

                  <View className="items-center py-5 mb-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <Text className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">
                      {free ? 'Miễn phí' : 'Tổng thu'}
                    </Text>
                    <Text className="text-[36px] font-black font-mono text-brand-blue">
                      {pricing.total.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>

                  {!plateMatch && (
                    <View className="mb-4">
                      <View className="flex-row items-center mb-2">
                        <AlertCircle size={14} color={COLORS.brand.red} />
                        <Text className="text-[10px] font-bold text-brand-red uppercase ml-1">
                          Lý do không khớp (bắt buộc)
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap gap-2 mb-2">
                        {PREDEFINED_REASONS.map((r) => (
                          <Pressable
                            key={r}
                            onPress={() => setReason(r)}
                            className={`px-3 py-2.5 rounded-lg border min-h-11 ${
                              reason === r
                                ? 'bg-blue-50 border-brand-blue'
                                : 'bg-slate-50 border-slate-100'
                            }`}
                          >
                            <Text
                              className={`text-xs ${
                                reason === r ? 'text-brand-blue font-bold' : 'text-slate-600'
                              }`}
                            >
                              {r}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      {(!PREDEFINED_REASONS.includes(reason) || reason === '') && (
                        <TextInput
                          value={PREDEFINED_REASONS.includes(reason) ? '' : reason}
                          onChangeText={setReason}
                          placeholder="Lý do khác..."
                          className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 min-h-[56px]"
                          multiline
                          textAlignVertical="top"
                        />
                      )}
                    </View>
                  )}

                  {free ? (
                    <Button
                      label="XÁC NHẬN XE RA"
                      onPress={() => submit('cash')}
                      loading={isPending}
                      disabled={!canSubmit}
                      className={`h-14 rounded-2xl border-0 mb-2 ${canSubmit ? 'bg-brand-blue' : 'bg-slate-200'}`}
                      textClassName={canSubmit ? 'text-white font-black' : 'text-slate-400'}
                    />
                  ) : (
                    <View className="flex-row gap-3 mb-2">
                      <Button
                        label="TIỀN MẶT"
                        onPress={() => submit('cash')}
                        loading={isPending}
                        disabled={!canSubmit}
                        className={`flex-1 h-14 rounded-2xl border-0 ${canSubmit ? 'bg-brand-blue' : 'bg-slate-200'}`}
                        textClassName={canSubmit ? 'text-white font-black text-xs' : 'text-slate-400'}
                      />
                      <Button
                        label="CHUYỂN KHOẢN"
                        onPress={() => setStep('qr')}
                        disabled={!canSubmit}
                        className={`flex-1 h-14 rounded-2xl border-2 ${
                          canSubmit ? 'bg-white border-brand-blue' : 'bg-slate-100 border-slate-200'
                        }`}
                        textClassName={canSubmit ? 'text-brand-blue font-black text-xs' : 'text-slate-400'}
                      />
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          )}
        </View>
        <SearchActiveEntryModal ref={searchModalRef} onSelect={handleSelectEntry} />
      </View>
    </Modal>
  );
}
