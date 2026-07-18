import { Button } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants/color.const';
import { useShiftStore } from '@/shared/features/shift';
import { toastQueue } from '@/shared/utils/toast.util';
import { Info, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
import { findActiveInYardByPlate } from '../apis/gate.api';
import { MAX_PLATE_CHARS } from '../const/parking.const';
import { useCheckIn } from '../hooks';
import { prepareCheckIn } from '../services/gate-session.service';
import { TVehicleType } from '../types';
import { cleanPlateInput, formatDisplayPlate } from '../utils';
import { VehicleSelector } from './vehicle-selector';

/** State = clean; invalid nếu OCR dài hơn max */
function plateFromOcr(raw: string): { text: string; invalid: boolean } {
  const cleaned = cleanPlateInput(raw, 99);
  return {
    text: cleaned.slice(0, MAX_PLATE_CHARS),
    invalid: cleaned.length > MAX_PLATE_CHARS,
  };
}

export type InConfirmPayload = {
  plate: string;
  fullImage: string;
  plateImage?: string | null;
  tagUid?: string;
  noCard?: boolean;
};

type Props = {
  visible: boolean;
  payload: InConfirmPayload | null;
  onDismiss: () => void;
  onSuccess: () => void;
};

export function InConfirmModal({ visible, payload, onDismiss, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const { currentShift } = useShiftStore();
  const { mutate: performCheckIn, isPending } = useCheckIn();

  const [plateText, setPlateText] = useState('');
  const [plateInvalid, setPlateInvalid] = useState(false);
  const [vehicleType, setVehicleType] = useState<TVehicleType>('motorbike');
  const [isMonthly, setIsMonthly] = useState(false);
  const [customerName, setCustomerName] = useState<string | undefined>();
  const [loadingMeta, setLoadingMeta] = useState(false);
  /** Biển đã có lượt IN trong bãi — chặn vào (đặc biệt no-card) */
  const [alreadyInYard, setAlreadyInYard] = useState(false);
  const [checkingInYard, setCheckingInYard] = useState(false);

  useEffect(() => {
    if (!visible || !payload) return;
    const fromOcr = plateFromOcr(payload.plate || '');
    setPlateText(fromOcr.text);
    setPlateInvalid(fromOcr.invalid);
    setAlreadyInYard(false);
    setLoadingMeta(true);
    let cancelled = false;
    (async () => {
      const prepared = await prepareCheckIn(payload.tagUid);
      if (cancelled) return;
      setIsMonthly(prepared.isMonthly);
      setVehicleType(prepared.vehicleType);
      setCustomerName(prepared.customerName);
      let plate = fromOcr.text;
      if (prepared.isMonthly && prepared.suggestedPlate) {
        const reg = plateFromOcr(prepared.suggestedPlate);
        plate = reg.text;
        setPlateText(reg.text);
        setPlateInvalid(reg.invalid);
      }
      setLoadingMeta(false);

      // Check biển đã trong bãi (no-card hoặc luôn check an toàn)
      if (plate) {
        setCheckingInYard(true);
        try {
          const active = await findActiveInYardByPlate(plate);
          if (!cancelled) setAlreadyInYard(!!active);
        } finally {
          if (!cancelled) setCheckingInYard(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, payload]);

  // Re-check khi user sửa biển
  useEffect(() => {
    if (!visible || !plateText.trim() || plateInvalid) {
      setAlreadyInYard(false);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setCheckingInYard(true);
      try {
        const active = await findActiveInYardByPlate(plateText);
        if (!cancelled) setAlreadyInYard(!!active);
      } finally {
        if (!cancelled) setCheckingInYard(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [visible, plateText, plateInvalid]);

  const handleConfirm = async () => {
    if (!currentShift?.id) {
      toastQueue.show({ type: 'error', text1: 'Lỗi', text2: 'Không tìm thấy thông tin ca trực' });
      return;
    }
    if (!payload) return;
    if (alreadyInYard) {
      toastQueue.show({
        type: 'error',
        text1: 'Xe đang trong bãi',
        text2: 'Phải xử lý xe ra trước khi cho vào lại',
      });
      return;
    }

    // Double-check trước khi ghi (tránh race)
    const active = await findActiveInYardByPlate(plateText);
    if (active) {
      setAlreadyInYard(true);
      toastQueue.show({
        type: 'error',
        text1: 'Xe đang trong bãi',
        text2: 'Phải xử lý xe ra trước khi cho vào lại',
      });
      return;
    }

    performCheckIn(
      {
        entryShiftId: currentShift.id,
        cardUid: payload.noCard ? undefined : payload.tagUid,
        vehicleType,
        plateText,
        photoIn1: payload.fullImage || '',
        photoIn2: payload.plateImage || payload.fullImage || '',
      },
      {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error: Error) => {
          toastQueue.show({
            type: 'error',
            text1: 'Lỗi',
            text2: 'Không thể lưu lượt vào: ' + error.message,
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
            <Text className="text-lg font-black text-slate-900">Xác nhận xe vào</Text>
            <Pressable
              onPress={onDismiss}
              className="size-10 rounded-full bg-slate-100 items-center justify-center"
              hitSlop={8}
            >
              <X size={18} color={COLORS.slate[500]} />
            </Pressable>
          </View>

          {loadingMeta ? (
            <View className="py-10 items-center">
              <ActivityIndicator color={COLORS.brand.blue} />
            </View>
          ) : (
            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {isMonthly ? (
                <View className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 flex-row items-center gap-2">
                  <Info size={18} color={COLORS.brand.blue} />
                  <View className="flex-1">
                    <Text className="text-brand-blue font-bold text-sm">
                      Thẻ tháng{customerName ? `: ${customerName}` : ''}
                    </Text>
                    <Text className="text-brand-blue text-xs opacity-80">Biển/loại xe theo đăng ký</Text>
                  </View>
                </View>
              ) : payload?.noCard || !payload?.tagUid ? (
                <View className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
                  <Text className="text-slate-600 text-sm font-bold">Không dùng thẻ</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">
                    Lượt vào ghi nhận theo biển số (manual)
                  </Text>
                </View>
              ) : null}

              {/* Ảnh ngang 2 cột — giống chi tiết lượt xe */}
              <Text className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">
                Ảnh khi vào
              </Text>
              <View className="flex-row gap-3 mb-4">
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
                    Toàn cảnh
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                    {(payload?.plateImage || payload?.fullImage) ? (
                      <Image
                        source={{ uri: payload.plateImage || payload.fullImage }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                    ) : null}
                  </View>
                  <Text className="text-center text-[10px] text-slate-400 mt-1.5 font-medium">
                    Biển số
                  </Text>
                </View>
              </View>

              <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1">Biển số</Text>
              <TextInput
                value={formatDisplayPlate(plateText)}
                onChangeText={(t) => {
                  setPlateText(cleanPlateInput(t, MAX_PLATE_CHARS));
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
                <Text className="text-brand-red text-xs text-center mb-3">
                  Biển số không hợp lệ — nhập lại (tối đa {MAX_PLATE_CHARS} ký tự)
                </Text>
              ) : alreadyInYard ? (
                <View className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
                  <Text className="text-brand-red text-sm font-bold text-center">
                    Biển này đang trong bãi
                  </Text>
                  <Text className="text-red-600/80 text-xs text-center mt-1">
                    Phải cho xe ra trước — dùng «Xe ra» trên Dashboard
                  </Text>
                </View>
              ) : (
                <View className="mb-3" />
              )}

              {!isMonthly ? (
                <VehicleSelector value={vehicleType} onSelect={setVehicleType} />
              ) : (
                <Text className="text-slate-400 text-xs text-center mb-2">
                  Loại xe cố định theo thẻ tháng
                </Text>
              )}

              <Button
                label="XÁC NHẬN XE VÀO"
                onPress={handleConfirm}
                loading={isPending || checkingInYard}
                disabled={
                  isPending ||
                  checkingInYard ||
                  !plateText.trim() ||
                  plateInvalid ||
                  alreadyInYard
                }
                className="h-14 mt-4 mb-2 bg-brand-blue border-0 rounded-2xl"
                textClassName="text-base font-black text-white"
              />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
