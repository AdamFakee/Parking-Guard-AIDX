import { Button, ControlledInput } from '@/shared/components/ui';
import { COLORS } from '@/shared/constants';
import { useDashboardStats } from '@/shared/features/gate';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
} from 'lucide-react-native';
import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import * as v from 'valibot';
import { useCloseShift } from '../hooks';
import { useShiftStore } from '../store';

const LogoutSchema = v.object({
  actualCash: v.pipe(
    v.string(),
    v.minLength(1, 'Vui lòng nhập số tiền'),
    v.regex(/^\d+$/, 'Vui lòng chỉ nhập số')
  ),
  reason: v.optional(v.string()),
});

type LogoutForm = v.InferOutput<typeof LogoutSchema>;

export interface CloseShiftModalRef {
  open: () => void;
  close: () => void;
}

export const CloseShiftModal = forwardRef<CloseShiftModalRef>((_, ref) => {
  const router = useRouter();
  const { currentShift, clearShift } = useShiftStore();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats(currentShift?.id);
  const { mutateAsync: performCloseShift, isPending: isClosing } = useCloseShift();

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'declare' | 'confirm'>('declare');

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  const { control, watch, handleSubmit, reset } = useForm<LogoutForm>({
    resolver: valibotResolver(LogoutSchema),
    defaultValues: {
      actualCash: '',
      reason: '',
    },
  });

  const watchedActualCash = watch('actualCash');

  const openingCash = currentShift?.openingCash || 0;
  const cashRevenue = stats?.cashRevenue || 0;
  const qrRevenue = stats?.qrRevenue || 0;
  const expectedCash = openingCash + cashRevenue;

  const { actualCashNum, discrepancy, isBalanced } = useMemo(() => {
    const num = parseInt(watchedActualCash || '0', 10);
    const diff = num - expectedCash;
    return {
      actualCashNum: num,
      discrepancy: diff,
      isBalanced: diff === 0,
    };
  }, [watchedActualCash, expectedCash]);

  const onConfirmExit = async (data: LogoutForm) => {
    if (!isBalanced && !data.reason?.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do chênh lệch tiền mặt.');
      return;
    }

    try {
      if (!currentShift) return;

      await performCloseShift({
        shiftId: currentShift.id,
        actualCash: actualCashNum,
        expectedCash,
        cashRevenue,
        qrRevenue,
        discrepancyReason: data.reason,
      });

      clearShift();
      setVisible(false);
      reset();
      router.replace('/auth/login' as any);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể kết thúc ca làm. Vui lòng thử lại.');
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => setVisible(false)}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAwareScrollView
          bottomOffset={20}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        >
          <View className="bg-white rounded-t-3xl p-6 min-h-[70%]">
            <View className="w-12 h-1 bg-slate-200 rounded-full self-center mb-6" />

            <Text className="text-2xl font-black text-slate-900 mb-1">
              {step === 'declare' ? 'Khai báo tiền mặt' : 'Xác nhận bàn giao'}
            </Text>
            <Text className="text-slate-500 mb-6">
              {step === 'declare'
                ? 'Nhập số tiền thực tế bạn đang giữ trong két.'
                : 'Đối soát dữ liệu hệ thống và thực tế.'}
            </Text>

            {step === 'declare' ? (
              <View className="flex-1">
                <View className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
                  <View className="flex-row items-center gap-3 mb-2">
                    <Banknote size={20} color={COLORS.slate[400]} />
                    <Text className="text-slate-400 font-bold uppercase text-xs">Tiền mặt thực tế</Text>
                  </View>
                  <ControlledInput
                    control={control}
                    name="actualCash"
                    keyboardType="numeric"
                    placeholder="0"
                    className="text-4xl font-mono font-black text-slate-900 bg-transparent border-0 px-0 h-auto"
                  />
                  <Text className="text-slate-500 mt-2 text-xs">Nhập số tiền mặt VNĐ</Text>
                </View>

                {isLoadingStats ? (
                  <ActivityIndicator color={COLORS.brand.blue} />
                ) : (
                  <Button
                    label="Tiếp tục đối soát"
                    onPress={handleSubmit(() => setStep('confirm'))}
                    disabled={!watchedActualCash}
                  />
                )}

                <Button
                  label="Hủy bỏ"
                  variant="secondary"
                  className="mt-3 border-0"
                  onPress={() => setVisible(false)}
                />
              </View>
            ) : (
              <View className="flex-1">
                <View className="flex-col gap-4 mb-6">
                  {/* Stats Comparison */}
                  <View className="bg-slate-50 p-4 rounded-xl">
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-3 text-center">Bảng đối soát</Text>

                    <View className="flex-row justify-between py-2 border-b border-slate-200">
                      <Text className="text-slate-600">Tiền đầu ca</Text>
                      <Text className="font-bold">{formatCurrency(openingCash)}</Text>
                    </View>
                    <View className="flex-row justify-between py-2 border-b border-slate-200">
                      <Text className="text-slate-600">Doanh thu tiền mặt (+)</Text>
                      <Text className="font-bold text-green-600">{formatCurrency(cashRevenue)}</Text>
                    </View>
                    <View className="flex-row justify-between py-2 bg-blue-50/50">
                      <Text className="text-blue-900 font-bold">Tiền kỳ vọng (=)</Text>
                      <Text className="text-blue-900 font-black">{formatCurrency(expectedCash)}</Text>
                    </View>
                    <View className="flex-row justify-between py-2 border-t border-slate-200 mt-2">
                      <Text className="text-slate-600">Thực tế đã nhập</Text>
                      <Text className="font-bold text-slate-900">{formatCurrency(actualCashNum)}</Text>
                    </View>
                  </View>

                  {/* Discrepancy Status */}
                  <View className={`p-4 rounded-xl flex-row items-center gap-3 ${isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
                    {isBalanced ? (
                      <CheckCircle2 color="#22C55E" />
                    ) : (
                      <AlertTriangle color="#EF4444" />
                    )}
                    <View className="flex-1">
                      <Text className={`font-bold ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                        {isBalanced ? 'Số liệu hoàn toàn trùng khớp' : `Chênh lệch: ${formatCurrency(discrepancy)}`}
                      </Text>
                      <Text className={`text-xs ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                        {isBalanced
                          ? 'Dòng tiền chính xác, bạn có thể bàn giao ngay.'
                          : discrepancy > 0 ? 'Tiền thực tế nhiều hơn hệ thống.' : 'Tiền thực tế ít hơn hệ thống.'}
                      </Text>
                    </View>
                  </View>

                  {/* Reason if not balanced */}
                  {!isBalanced && (
                    <View>
                      <Text className="text-sm font-bold text-slate-700 mb-2">Lý do chênh lệch (Bắt buộc)</Text>
                      <ControlledInput
                        control={control}
                        name="reason"
                        multiline
                        placeholder="Ví dụ: Thất thoát do trả nhầm tiền, khách nợ chưa trả..."
                        className="bg-white border border-slate-200 rounded-xl p-4 h-24 text-slate-800"
                        textAlignVertical="top"
                      />
                    </View>
                  )}
                </View>

                <View className="flex-col gap-3 pb-8">
                  <Button
                    label="Khóa ca & Bàn giao"
                    loading={isClosing}
                    onPress={handleSubmit(onConfirmExit)}
                  />
                  <Button
                    label="Quay lại kiểm tra"
                    variant="outline"
                    onPress={() => setStep('declare')}
                  />
                </View>
              </View>
            )}
          </View>
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
});

CloseShiftModal.displayName = 'CloseShiftModal';
