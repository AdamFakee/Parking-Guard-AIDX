import { Button, ControlledInput } from '@/shared/components/ui';
import { cn } from '@/shared/utils';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Bike, Car, Check, ChevronRight, Edit2, Moon, Plus, Save, Search, Settings2, Sun, Trash2, X, Zap } from 'lucide-react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import * as v from 'valibot';
import {
  DEFAULT_MONTHLY_PRICE_CAR,
  DEFAULT_MONTHLY_PRICE_EBIKE,
  DEFAULT_MONTHLY_PRICE_MOTORBIKE
} from '../const';
import {
  useCreatePricingRule,
  useDeletePricingRule,
  usePricingRules,
  useSystemConfig,
  useUpdatePricingRule,
  useUpdateSystemConfig
} from '../hooks';
import banksData from '@/assets/bank.json';

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

const PricingRuleSchema = v.object({
  vehicleType: v.picklist(['motorbike', 'car', 'ebike']),
  timeType: v.picklist(['daytime', 'overnight']),
  firstHours: v.pipe(
    v.string(),
    v.regex(/^\d+$/, 'Vui lòng chỉ nhập số'),
    v.transform((val) => Number(val))
  ),
  firstPrice: v.pipe(
    v.string(),
    v.regex(/^\d+$/, 'Vui lòng chỉ nhập số'),
    v.transform((val) => Number(val))
  ),
  extraPerHour: v.pipe(
    v.string(),
    v.regex(/^\d+$/, 'Vui lòng chỉ nhập số'),
    v.transform((val) => Number(val))
  ),
  maxPerDay: v.nullable(v.pipe(
    v.string(),
    v.transform((val) => val === '' ? null : Number(val))
  )),
  overnightPrice: v.nullable(v.pipe(
    v.string(),
    v.transform((val) => val === '' ? null : Number(val))
  )),
  overnightStartTime: v.string(),
  overnightEndTime: v.string(),
});

type ConfigForm = v.InferOutput<typeof ConfigSchema>;
type PricingRuleForm = v.InferOutput<typeof PricingRuleSchema>;

// --- COMPONENTS ---

const ControlledBadgeSelect = ({
  control,
  name,
  label,
  options,
}: {
  control: any;
  name: string;
  label: string;
  options: { label: string; value: string; icon?: React.ReactNode }[];
}) => {
  const {
    field: { value, onChange },
  } = useController({ control, name });

  return (
    <View className="gap-2">
      <Text className="text-note1 text-slate-500 font-medium ml-1">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className={cn(
                'flex-row items-center gap-2 px-4 py-2.5 rounded-xl border',
                isSelected 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'bg-white border-slate-200'
              )}
            >
              {opt.icon && React.cloneElement(opt.icon as any, { 
                color: isSelected ? 'white' : '#64748B' 
              })}
              <Text className={cn(
                'font-bold text-xs',
                isSelected ? 'text-white' : 'text-slate-500'
              )}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

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

export const SystemConfigModal = forwardRef<SystemConfigModalRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'pricing'>('general');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const bankPickerRef = React.useRef<BankPickerRef>(null);
  
  const { data: config } = useSystemConfig();
  const { mutateAsync: updateConfig, isPending: configPending } = useUpdateSystemConfig();
  
  const { data: pricingRules } = usePricingRules();
  const { mutateAsync: createRule } = useCreatePricingRule();
  const { mutateAsync: updateRule } = useUpdatePricingRule();
  const { mutateAsync: deleteRule } = useDeletePricingRule();

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

  const { control: ruleControl, handleSubmit: handleRuleSubmit, reset: resetRule } = useForm<PricingRuleForm>({
    resolver: valibotResolver(PricingRuleSchema as any),
    defaultValues: {
      vehicleType: 'motorbike',
      timeType: 'daytime',
      firstHours: 1 as any,
      firstPrice: 5000 as any,
      extraPerHour: 2000 as any,
      maxPerDay: '' as any,
      overnightPrice: '' as any,
      overnightStartTime: '22:00',
      overnightEndTime: '05:00',
    },
  });

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
      Alert.alert('Thành công', 'Cài đặt hệ thống đã được cập nhật.');
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể cập nhật cấu hình.');
    }
  };

  const onSaveRule = async (data: PricingRuleForm) => {
    try {
      if (editingRule) {
        await updateRule({ id: editingRule.id, values: data });
      } else {
        await createRule(data);
      }
      setEditingRule(null);
      setIsAddingNew(false);
      resetRule();
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể lưu bảng giá.');
    }
  };

  const handleDeleteRule = (id: string) => {
    Alert.alert('Xoá bảng giá', 'Bạn có chắc muốn xoá bảng giá này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => deleteRule(id) },
    ]);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car size={18} color="#3B82F6" />;
      case 'ebike': return <Zap size={18} color="#10B981" />;
      default: return <Bike size={18} color="#F59E0B" />;
    }
  };

  const getTimeIcon = (type: string) => {
    return type === 'daytime' ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} color="#6366F1" />;
  };

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
              <>
                {/* Pricing Rules Management */}
                <View className="gap-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Các quy tắc tính phí</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setIsAddingNew(true);
                        setEditingRule(null);
                        resetRule({
                          vehicleType: 'motorbike',
                          timeType: 'daytime',
                          firstHours: 1 as any,
                          firstPrice: 5000 as any,
                          extraPerHour: 2000 as any,
                          maxPerDay: '' as any,
                          overnightPrice: '' as any,
                          overnightStartTime: '22:00',
                          overnightEndTime: '05:00',
                        });
                      }}
                      className="bg-blue-500/10 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5"
                    >
                      <Plus size={16} color="#3B82F6" />
                      <Text className="text-blue-500 font-bold text-xs">Thêm mới</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Rule List */}
                  <View className="gap-3">
                    {pricingRules?.map((rule: any) => (
                      <View key={rule.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <View className="flex-row justify-between items-start mb-2">
                          <View className="flex-row items-center gap-2">
                            {getVehicleIcon(rule.vehicleType)}
                            <Text className="font-bold text-slate-800 capitalize">
                              {rule.vehicleType === 'motorbike' ? 'Xe máy' : rule.vehicleType === 'car' ? 'Ô tô' : 'Xe đạp điện'}
                            </Text>
                            <View className="bg-slate-200 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                              {getTimeIcon(rule.timeType)}
                              <Text className="text-[10px] font-bold text-slate-500 uppercase">
                                {rule.timeType === 'daytime' ? 'Ngày' : 'Đêm'}
                              </Text>
                            </View>
                          </View>
                          <View className="flex-row gap-2">
                            <TouchableOpacity 
                              onPress={() => {
                                setIsAddingNew(false);
                                setEditingRule(rule);
                                resetRule({
                                  ...rule,
                                  firstHours: String(rule.firstHours) as any,
                                  firstPrice: String(rule.firstPrice) as any,
                                  extraPerHour: String(rule.extraPerHour) as any,
                                  maxPerDay: rule.maxPerDay ? String(rule.maxPerDay) : '' as any,
                                  overnightPrice: rule.overnightPrice ? String(rule.overnightPrice) : '' as any,
                                });
                              }}
                              className="size-8 bg-blue-50 rounded-lg items-center justify-center"
                            >
                              <Edit2 size={14} color="#3B82F6" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => handleDeleteRule(rule.id)}
                              className="size-8 bg-red-50 rounded-lg items-center justify-center"
                            >
                              <Trash2 size={14} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text className="text-xs text-slate-500">
                          {rule.firstHours}h đầu: {rule.firstPrice.toLocaleString()}đ • Phụ trội: {rule.extraPerHour.toLocaleString()}đ/h
                        </Text>
                        {rule.overnightPrice && (
                          <Text className="text-xs text-slate-500 mt-1">
                            Qua đêm: {rule.overnightPrice.toLocaleString()}đ ({rule.overnightStartTime} - {rule.overnightEndTime})
                          </Text>
                        )}
                      </View>
                    ))}
                    
                    {pricingRules?.length === 0 && (
                      <View className="py-8 items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <Text className="text-slate-400 text-sm">Chưa có bảng giá nào</Text>
                      </View>
                    )}
                  </View>

                  {/* Pricing Rule Form (Editing/Adding) */}
                  {(isAddingNew || editingRule || pricingRules?.length === 0 || !pricingRules) && (
                    <View className="bg-white p-5 rounded-2xl border-2 border-blue-500 mt-6 gap-6">
                      <View className="flex-row justify-between items-center">
                        <Text className="font-black text-blue-500 uppercase tracking-tighter">
                          {editingRule ? 'Chỉnh sửa bảng giá' : 'Thêm bảng giá mới'}
                        </Text>
                        {(editingRule || isAddingNew) && (
                          <TouchableOpacity onPress={() => {
                            setEditingRule(null);
                            setIsAddingNew(false);
                          }}>
                            <Text className="text-slate-400 text-xs font-bold">Hủy</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* We'd normally use a Picker/Select here, for now using direct inputs for the enums simplified */}
                      <View className="gap-6">
                        <ControlledBadgeSelect
                          control={ruleControl}
                          name="vehicleType"
                          label="Loại phương tiện"
                          options={[
                            { label: 'Xe máy', value: 'motorbike', icon: <Bike size={16} /> },
                            { label: 'Ô tô', value: 'car', icon: <Car size={16} /> },
                            { label: 'Xe đạp điện', value: 'ebike', icon: <Zap size={16} /> },
                          ]}
                        />

                        <ControlledBadgeSelect
                          control={ruleControl}
                          name="timeType"
                          label="Khung giờ hiệu lực"
                          options={[
                            { label: 'Ban ngày', value: 'daytime', icon: <Sun size={16} /> },
                            { label: 'Qua đêm', value: 'overnight', icon: <Moon size={16} /> },
                          ]}
                        />

                        <View className="flex-row gap-4">
                          <View className="flex-1">
                            <ControlledInput control={ruleControl} name="firstHours" label="Số giờ đầu" keyboardType="numeric" />
                          </View>
                          <View className="flex-1">
                            <ControlledInput control={ruleControl} name="firstPrice" label="Giá giờ đầu (₫)" keyboardType="numeric" />
                          </View>
                        </View>

                        <View className="flex-row gap-4">
                          <View className="flex-1">
                            <ControlledInput control={ruleControl} name="extraPerHour" label="Phí phụ trội/h (₫)" keyboardType="numeric" />
                          </View>
                          <View className="flex-1">
                            <ControlledInput control={ruleControl} name="maxPerDay" label="Trần tối đa/ngày" keyboardType="numeric" placeholder="Bỏ trống nếu không có..." />
                          </View>
                        </View>

                        <View className="h-px bg-slate-100 my-2" />
                        
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Cấu hình qua đêm (Tuỳ chọn)</Text>
                        <ControlledInput control={ruleControl} name="overnightPrice" label="Giá vé qua đêm (₫)" keyboardType="numeric" />
                        
                        <View className="flex-row gap-4">
                          <View className="flex-1">
                            <ControlledInput control={ruleControl} name="overnightStartTime" label="Bắt đầu đêm" placeholder="22:00" />
                          </View>
                          <View className="flex-1">
                            <ControlledInput control={ruleControl} name="overnightEndTime" label="Kết thúc đêm" placeholder="05:00" />
                          </View>
                        </View>
                      </View>

                      <Button
                        label={editingRule ? "Cập nhật bảng giá" : "Thêm bảng giá"}
                        onPress={handleRuleSubmit(onSaveRule)}
                        leftIcon={editingRule ? Save : Plus}
                      />
                    </View>
                  )}
                </View>
              </>
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
