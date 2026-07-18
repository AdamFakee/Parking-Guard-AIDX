import { Button, ControlledInput } from '@/shared/components/ui';
import { cn } from '@/shared/utils';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Bike, Car, Check, ChevronRight, Save, Search, Settings2, X, Zap } from 'lucide-react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { toast } from '@/shared/store/use-alert-store';
import { toastQueue } from '@/shared/utils/toast.util';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import * as v from 'valibot';
import {
  DAY_START_HOUR,
  DEFAULT_FLAT_PRICES,
  DEFAULT_MONTHLY_PRICE_CAR,
  DEFAULT_MONTHLY_PRICE_EBIKE,
  DEFAULT_MONTHLY_PRICE_MOTORBIKE,
  NIGHT_START_HOUR,
  VEHICLE_TYPE_LABELS,
} from '../const';
import {
  usePricingRules,
  useReplacePricingRules,
  useSystemConfig,
  useUpdateSystemConfig
} from '../hooks';
import banksData from '@/assets/bank.json';
import type { TVehicleType } from '../types';

// --- SCHEMAS ---

const ConfigSchema = v.object({
  lotName: v.pipe(v.string(), v.minLength(1, 'Tên bãi xe không được để trống')),
  freeMinutes: v.pipe(
    v.string(),
    v.regex(/^\d+$/, 'Vui lòng chỉ nhập số'),
    v.transform((val) => Number(val))
  ),
  lostCardFee: v.pipe(
    v.string(),
    v.regex(/^\d+$/, 'Vui lòng chỉ nhập số'),
    v.transform((val) => Number(val))
  ),
  bankName: v.string(),
  accountNumber: v.string(),
  accountName: v.string(),
  qrImageUrl: v.string(),
  monthlyPriceMotorbike: v.pipe(
    v.string(),
    v.regex(/^\d+$/, 'Vui lòng chỉ nhập số'),
    v.transform((val) => Number(val))
  ),
  monthlyPriceCar: v.pipe(
    v.string(),
    v.regex(/^\d+$/, 'Vui lòng chỉ nhập số'),
    v.transform((val) => Number(val))
  ),
  monthlyPriceEbike: v.pipe(
    v.string(),
    v.regex(/^\d+$/, 'Vui lòng chỉ nhập số'),
    v.transform((val) => Number(val))
  ),
});

const moneyStr = v.pipe(
  v.string(),
  v.regex(/^\d*$/, 'Vui lòng chỉ nhập số'),
)

const PricingMatrixSchema = v.object({
  motorbikeDay: moneyStr,
  motorbikeNight: moneyStr,
  motorbikeCross: moneyStr,
  carDay: moneyStr,
  carNight: moneyStr,
  carCross: moneyStr,
  ebikeDay: moneyStr,
  ebikeNight: moneyStr,
  ebikeCross: moneyStr,
})

type ConfigForm = v.InferOutput<typeof ConfigSchema>
type PricingMatrixForm = v.InferOutput<typeof PricingMatrixSchema>

const VEHICLES: TVehicleType[] = ['motorbike', 'car', 'ebike']
const VEHICLE_ICON = {
  motorbike: Bike,
  car: Car,
  ebike: Zap,
} as const

// --- INTERFACES ---

export interface SystemConfigModalRef {
  open: () => void;
  close: () => void;
}

export interface BankPickerRef {
  open: () => void;
  close: () => void;
}

// --- SUB-COMPONENTS ---

const BankPicker = forwardRef<BankPickerRef, { 
  onSelect: (bankName: string) => void,
  selectedValue?: string 
}>(({ onSelect, selectedValue }, ref) => {
  const [visible, setVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setVisible(false)}
    >
      <View className="flex-1 bg-black/50 justify-center p-6">
        <View className="bg-white rounded-3xl max-h-[80%] overflow-hidden">
          <View className="p-4 border-b border-slate-100 flex-row items-center gap-3">
            <Search size={20} color="#64748B" />
            <TextInput
              placeholder="Tìm kiếm ngân hàng..."
              className="flex-1 text-slate-900 font-medium py-2"
              value={bankSearch}
              onChangeText={setBankSearch}
              autoFocus
            />
            <TouchableOpacity onPress={() => setVisible(false)}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={banksData.filter(b => 
              b.shortName.toLowerCase().includes(bankSearch.toLowerCase()) || 
              b.name.toLowerCase().includes(bankSearch.toLowerCase())
            )}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.shortName);
                  setVisible(false);
                  setBankSearch('');
                }}
                className="flex-row items-center p-4 border-b border-slate-50 gap-3"
              >
                <View className="size-10 bg-slate-50 rounded-lg items-center justify-center overflow-hidden border border-slate-100">
                  <Image source={{ uri: item.logo }} className="size-8" resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold">{item.shortName}</Text>
                  <Text className="text-slate-500 text-[10px]" numberOfLines={1}>{item.name}</Text>
                </View>
                {selectedValue === item.shortName && (
                  <Check size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            )}
            removeClippedSubviews={true}
            initialNumToRender={15}
            maxToRenderPerBatch={20}
            windowSize={10}
            ListEmptyComponent={
              <View className="p-10 items-center">
                <Text className="text-slate-400">Không tìm thấy ngân hàng</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
});

BankPicker.displayName = 'BankPicker';

// --- MODAL COMPONENT ---

function defaultMatrix(): PricingMatrixForm {
  const m = Object.fromEntries(
    VEHICLES.flatMap((v) => {
      const d = DEFAULT_FLAT_PRICES.find((x) => x.vehicleType === v)!
      return [
        [`${v}Day`, String(d.dayPrice)],
        [`${v}Night`, String(d.nightPrice)],
        [`${v}Cross`, ''],
      ]
    }),
  ) as PricingMatrixForm
  return m
}

export const SystemConfigModal = forwardRef<SystemConfigModalRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'pricing'>('general');
  const bankPickerRef = React.useRef<BankPickerRef>(null);

  const { data: config } = useSystemConfig();
  const { mutateAsync: updateConfig, isPending: configPending } = useUpdateSystemConfig();

  const { data: pricingRules } = usePricingRules();
  const { mutateAsync: replaceRules, isPending: pricingPending } = useReplacePricingRules();

  const { control, handleSubmit: handleConfigSubmit, reset: resetConfig, setValue } = useForm<ConfigForm>({
    resolver: valibotResolver(ConfigSchema as any),
    defaultValues: {
      lotName: '',
      freeMinutes: 0 as any,
      lostCardFee: 0 as any,
      bankName: '',
      accountNumber: '',
      accountName: '',
      qrImageUrl: '',
      monthlyPriceMotorbike: DEFAULT_MONTHLY_PRICE_MOTORBIKE as any,
      monthlyPriceCar: DEFAULT_MONTHLY_PRICE_CAR as any,
      monthlyPriceEbike: DEFAULT_MONTHLY_PRICE_EBIKE as any,
    },
  });

  const watchBankName = useWatch({
    control,
    name: 'bankName'
  });

  const {
    control: matrixControl,
    handleSubmit: handleMatrixSubmit,
    reset: resetMatrix,
  } = useForm<PricingMatrixForm>({
    resolver: valibotResolver(PricingMatrixSchema as any),
    defaultValues: defaultMatrix(),
  })

  useEffect(() => {
    if (config && visible) {
      resetConfig({
        lotName: config.lotName,
        freeMinutes: String(config.freeMinutes) as any,
        lostCardFee: String(config.lostCardFee) as any,
        bankName: config.bankName || '',
        accountNumber: config.accountNumber || '',
        accountName: config.accountName || '',
        qrImageUrl: config.qrImageUrl || '',
        monthlyPriceMotorbike: String(config.monthlyPriceMotorbike || DEFAULT_MONTHLY_PRICE_MOTORBIKE) as any,
        monthlyPriceCar: String(config.monthlyPriceCar || DEFAULT_MONTHLY_PRICE_CAR) as any,
        monthlyPriceEbike: String(config.monthlyPriceEbike || DEFAULT_MONTHLY_PRICE_EBIKE) as any,
      });
    }
  }, [config, resetConfig, visible]);

  useEffect(() => {
    if (!visible) return
    const next = defaultMatrix()
    for (const v of VEHICLES) {
      const row = pricingRules?.find((r) => r.vehicleType === v)
      if (!row) continue
      ;(next as any)[`${v}Day`] = String(row.dayPrice)
      ;(next as any)[`${v}Night`] = String(row.nightPrice)
      ;(next as any)[`${v}Cross`] =
        row.crossDayPrice != null ? String(row.crossDayPrice) : ''
    }
    resetMatrix(next)
  }, [visible, pricingRules, resetMatrix])

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  const onSaveConfig = async (data: ConfigForm) => {
    try {
      if (!config?.id) return;
      await updateConfig({
        id: config.id,
        values: data,
      });
      toastQueue.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Cài đặt hệ thống đã được cập nhật.',
      });
    } catch (error) {
      console.error(error);
      toastQueue.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể cập nhật cấu hình.',
      });
    }
  };

  const onSaveMatrix = (data: PricingMatrixForm) => {
    const rows = VEHICLES.map((v) => {
      const day = Number((data as any)[`${v}Day`] || 0)
      const night = Number((data as any)[`${v}Night`] || 0)
      const crossRaw = String((data as any)[`${v}Cross`] ?? '').trim()
      return {
        vehicleType: v,
        dayPrice: day,
        nightPrice: night,
        crossDayPrice: crossRaw === '' ? null : Number(crossRaw),
      }
    })

    toast.confirm({
      title: 'Lưu bảng giá?',
      message: `Sáng ${DAY_START_HOUR}h–${NIGHT_START_HOUR}h · Tối ${NIGHT_START_HOUR}h–${DAY_START_HOUR}h. Qua ngày trống = sáng+tối.`,
      confirmLabel: 'Lưu',
      onConfirm: () => {
        void (async () => {
          try {
            await replaceRules(rows)
            toastQueue.show({
              type: 'success',
              text1: 'Đã lưu bảng giá',
              text2: 'Áp dụng cho lượt ra tiếp theo.',
            })
          } catch (e) {
            console.error(e)
            toastQueue.show({
              type: 'error',
              text1: 'Lỗi',
              text2: 'Không lưu được bảng giá.',
            })
          }
        })()
      },
    })
  }

  return (
    <>
      <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => setVisible(false)}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-3xl min-h-[95%] flex-col">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-slate-100">
            <View className="flex-row items-center gap-3">
              <View className="size-10 bg-blue-50 rounded-xl items-center justify-center">
                <Settings2 size={24} color="#3B82F6" />
              </View>
              <View>
                <Text className="text-xl font-bold text-slate-900">Cấu hình hệ thống</Text>
                <Text className="text-slate-500 text-xs">Quản lý bãi xe & Bảng giá</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setVisible(false)}
              className="size-10 bg-slate-50 rounded-full items-center justify-center"
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Bar */}
          <View className="flex-row px-6 py-2 border-b border-slate-50">
            <TouchableOpacity 
              onPress={() => setActiveTab('general')}
              className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'general' ? 'border-blue-500' : 'border-transparent'}`}
            >
              <Text className={`font-bold ${activeTab === 'general' ? 'text-blue-500' : 'text-slate-400'}`}>Cơ bản</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('pricing')}
              className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'pricing' ? 'border-blue-500' : 'border-transparent'}`}
            >
              <Text className={`font-bold ${activeTab === 'pricing' ? 'text-blue-500' : 'text-slate-400'}`}>Bảng giá</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView 
            className="flex-1 px-6 pb-12"
            contentContainerStyle={{ paddingVertical: 24, gap: 24 }}
            bottomOffset={62}
          >
            {activeTab === 'general' ? (
              <>
                {/* General Settings */}
                <View className="gap-4">
                  <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Vận hành chung</Text>
                  
                  <ControlledInput
                    control={control}
                    name="lotName"
                    label="Tên bãi xe"
                    placeholder="Nhập tên bãi xe..."
                  />

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <ControlledInput
                        control={control}
                        name="freeMinutes"
                        label="Phút miễn phí"
                        keyboardType="numeric"
                        placeholder="15"
                      />
                    </View>
                    <View className="flex-1">
                      <ControlledInput
                        control={control}
                        name="lostCardFee"
                        label="Phí mất thẻ (₫)"
                        keyboardType="numeric"
                        placeholder="50000"
                      />
                    </View>
                  </View>

                  <ControlledInput
                    control={control}
                    name="qrImageUrl"
                    label="URL Ảnh QR (Logo bãi xe)"
                    placeholder="https://..."
                  />
                </View>

                {/* Payment Settings */}
                <View className="gap-4 mt-4">
                  <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Thông tin thanh toán QR</Text>
                  
                  <View className="gap-2">
                    <Text className="text-note1 text-slate-500 font-medium ml-1">Ngân hàng</Text>
                    <TouchableOpacity 
                      onPress={() => bankPickerRef.current?.open()}
                      className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
                    >
                      <Text className={cn("text-slate-900 font-medium", !watchBankName && "text-slate-400 font-normal")}>
                        {watchBankName || "Chọn ngân hàng..."}
                      </Text>
                      <ChevronRight size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>

                  <ControlledInput
                    control={control}
                    name="accountNumber"
                    label="Số tài khoản"
                    keyboardType="numeric"
                    placeholder="Nhập số tài khoản..."
                  />

                  <ControlledInput
                    control={control}
                    name="accountName"
                    label="Tên chủ tài khoản"
                    placeholder="Nhập tên không dấu..."
                    autoCapitalize="characters"
                  />
                </View>

                {/* Monthly Ticket Prices */}
                <View className="gap-4 mt-4">
                  <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Giá vé tháng (Mặc định)</Text>
                  
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <ControlledInput
                        control={control}
                        name="monthlyPriceMotorbike"
                        label="Xe máy (₫)"
                        keyboardType="numeric"
                        placeholder={String(DEFAULT_MONTHLY_PRICE_MOTORBIKE)}
                      />
                    </View>
                    <View className="flex-1">
                      <ControlledInput
                        control={control}
                        name="monthlyPriceEbike"
                        label="Xe đạp điện (₫)"
                        keyboardType="numeric"
                        placeholder={String(DEFAULT_MONTHLY_PRICE_EBIKE)}
                      />
                    </View>
                  </View>

                  <ControlledInput
                    control={control}
                    name="monthlyPriceCar"
                    label="Xe ô tô (₫)"
                    keyboardType="numeric"
                    placeholder={String(DEFAULT_MONTHLY_PRICE_CAR)}
                  />
                </View>

                <View className="mt-8 pb-10">
                  <Button
                    label="Lưu cấu hình"
                    onPress={handleConfigSubmit(onSaveConfig)}
                    loading={configPending}
                    leftIcon={Save}
                  />
                </View>
              </>
            ) : (
              <View className="gap-4">
                <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Giá lượt (phẳng)
                </Text>
                <Text className="text-xs text-slate-500 leading-5 -mt-2">
                  Sáng {DAY_START_HOUR}h–{NIGHT_START_HOUR}h · Tối {NIGHT_START_HOUR}h–{DAY_START_HOUR}h.
                  Cùng ngày tính theo giờ ra. Qua ngày: để trống = sáng+tối, có số thì × số ngày lịch.
                </Text>

                {VEHICLES.map((v) => {
                  const Icon = VEHICLE_ICON[v]
                  return (
                    <View
                      key={v}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200 gap-3"
                    >
                      <View className="flex-row items-center gap-2">
                        <Icon size={18} color="#3B82F6" />
                        <Text className="font-bold text-slate-800">
                          {VEHICLE_TYPE_LABELS[v]}
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        <View className="flex-1">
                          <ControlledInput
                            control={matrixControl}
                            name={`${v}Day` as any}
                            label={`Sáng (₫)`}
                            keyboardType="numeric"
                          />
                        </View>
                        <View className="flex-1">
                          <ControlledInput
                            control={matrixControl}
                            name={`${v}Night` as any}
                            label={`Tối (₫)`}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                      <ControlledInput
                        control={matrixControl}
                        name={`${v}Cross` as any}
                        label="Qua ngày (₫) — trống = sáng+tối"
                        keyboardType="numeric"
                        placeholder="Mặc định sáng + tối"
                      />
                    </View>
                  )
                })}

                <View className="mt-2 pb-10">
                  <Button
                    label="Lưu bảng giá"
                    onPress={handleMatrixSubmit(onSaveMatrix)}
                    loading={pricingPending}
                    leftIcon={Save}
                  />
                </View>
              </View>
            )}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>

    <BankPicker 
      ref={bankPickerRef}
      selectedValue={watchBankName}
      onSelect={(val) => setValue('bankName', val)}
    />
  </>
);
});

SystemConfigModal.displayName = 'SystemConfigModal';
