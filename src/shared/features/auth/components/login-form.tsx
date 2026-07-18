import { Button } from '@/shared/components/ui';
import { ControlledInput } from '@/shared/components/ui/form/controlled-input';
import { ControlledPasswordInput } from '@/shared/components/ui/form/controlled-password-input';
import { COLORS } from '@/shared/constants';
import { useLogin } from '@/shared/features/auth/hooks/use-login';
import { LoginSchema } from '@/shared/features/auth/schemas/login.schemas';
import type { TLoginForm } from '@/shared/features/auth/types/login.type';
import { startShift } from '@/shared/features/shift/apis';
import { useShiftStore } from '@/shared/features/shift/store';
import { toastQueue } from '@/shared/utils/toast.util';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Lock, Phone, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEV_LOGIN: TLoginForm = { phone: '0901234567', pin: '1234' };
const DEV_STAFF = { id: 'staff_1', name: 'staff1', role: 'admin' as const };
const DEV_OPENING_CASH = 500_000;

export const LoginForm = () => {
  const { mutateAsync: loginMutation } = useLogin();
  const setCurrentShift = useShiftStore((s) => s.setCurrentShift);
  const [devBusy, setDevBusy] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<TLoginForm>({
    resolver: valibotResolver(LoginSchema),
    defaultValues: {
      phone: '',
      pin: '',
    },
  });

  const onSubmit = async (data: TLoginForm) => {
    try {
      await loginMutation(data);
    } catch (err: any) {
      setError('root', {
        type: 'server',
        message: err.message,
      });
    }
  };

  /** Fill form only — still need Đăng nhập (or use full bypass). */
  const handleDevFill = () => {
    setValue('phone', DEV_LOGIN.phone, { shouldValidate: true });
    setValue('pin', DEV_LOGIN.pin, { shouldValidate: true });
  };

  /** Login mock + mở ca staff_1 → thẳng dashboard. __DEV__ only. */
  const handleDevEnterApp = async () => {
    if (devBusy) return;
    setDevBusy(true);
    try {
      await loginMutation(DEV_LOGIN);
      const shift = await startShift({
        staffId: DEV_STAFF.id,
        openingCash: DEV_OPENING_CASH,
      });
      setCurrentShift({
        id: shift.id,
        staffId: shift.staffId,
        staffName: DEV_STAFF.name,
        openingCash: shift.openingCash,
        startTime: shift.startTime.toISOString(),
        status: shift.status as 'open' | 'closed',
        role: DEV_STAFF.role,
      });
      toastQueue.show({
        type: 'success',
        text1: 'DEV',
        text2: 'Đã login + mở ca',
      });
    } catch (err: any) {
      setError('root', {
        type: 'server',
        message: err?.message || 'Dev enter failed',
      });
    } finally {
      setDevBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 w-full max-w-[480px] self-center justify-center">
        <View className="items-center justify-center pb-10">
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg shadow-primary/20 p-2 overflow-hidden">
            <Image
              source={require('@/assets/images/logo.png')}
              className="h-full w-full"
              resizeMode="contain"
            />
          </View>
        </View>

        <Text className="text-pageTitle font-bold leading-tight text-slate-900 mb-8 text-center">
          Đăng nhập
        </Text>

        <View className="gap-6">
          <ControlledInput
            control={control}
            name="phone"
            label="Số điện thoại"
            leftElement={<Phone size={24} color={COLORS.slate[400]} />}
            className="w-full pl-12 bg-slate-50 border-slate-200 text-slate-900"
            placeholder="090 123 4567"
            keyboardType="phone-pad"
          />

          <ControlledPasswordInput
            control={control}
            name="pin"
            label="Mã PIN"
            leftElement={<Lock size={24} color={COLORS.slate[400]} />}
            topRightElement={
              <Pressable>
                <Text className="text-note font-medium text-primary">
                  Quên mã PIN?
                </Text>
              </Pressable>
            }
            className="w-full pl-12 pr-12 bg-slate-50 border-slate-200 text-slate-900"
            placeholder="••••"
            keyboardType="numeric"
          />

          <View>
            <Button
              label="Đăng nhập"
              className="mt-4 bg-primary"
              loading={isSubmitting}
              disabled={isSubmitting || devBusy}
              onPress={handleSubmit(onSubmit)}
            />
            {errors.root && (
              <Text className="text-brand-red text-center mt-3 text-sm font-medium">
                {errors.root.message}
              </Text>
            )}
          </View>

          {__DEV__ && (
            <View className="gap-2 mt-2 p-3 rounded-2xl border border-dashed border-brand-orange/40 bg-orange-50">
              <Text className="text-[10px] font-black text-brand-orange uppercase tracking-widest text-center">
                Dev only
              </Text>
              <Button
                label="Login nhanh (điền form)"
                variant="outline"
                className="h-12 border-brand-orange"
                textClassName="text-brand-orange text-sm"
                disabled={isSubmitting || devBusy}
                onPress={handleDevFill}
              />
              <Button
                label="Vào app ngay (login + mở ca)"
                leftIcon={Zap}
                className="h-12 bg-brand-orange border-0"
                textClassName="text-white text-sm font-bold"
                loading={devBusy}
                disabled={isSubmitting || devBusy}
                onPress={handleDevEnterApp}
              />
              <Text className="text-[10px] text-slate-400 text-center">
                PIN 1234 · staff1 · tiền đầu ca {DEV_OPENING_CASH.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          )}
        </View>

        <View className="mt-10 flex-row justify-center">
          <Text className="text-note1 text-slate-500">
            Chưa có tài khoản?{' '}
          </Text>
          <Pressable>
            <Text className="text-note1 font-bold text-primary ml-1">
              Đăng ký ngay
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};
