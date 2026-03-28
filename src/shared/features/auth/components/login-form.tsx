import { Button } from '@/shared/components/ui';
import { ControlledInput } from '@/shared/components/ui/form/controlled-input';
import { ControlledPasswordInput } from '@/shared/components/ui/form/controlled-password-input';
import { COLORS } from '@/shared/constants';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Lock, Phone } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLogin } from '@/shared/features/auth/hooks/use-login';
import { LoginSchema } from '@/shared/features/auth/schemas/login.schemas';
import type { TLoginForm } from '@/shared/features/auth/types/login.type';

export const LoginForm = () => {
  const { mutateAsync: loginMutation } = useLogin();

  const {
    control,
    handleSubmit,
    setError,
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

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 w-full max-w-[480px] self-center justify-center">
        {/* Top Branding Section */}
        <View className="items-center justify-center pb-10">
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg shadow-primary/20 p-2 overflow-hidden">
            <Image
              source={require('@/assets/images/logo.png')}
              className="h-full w-full"
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Main Login Card */}
        <Text className="text-pageTitle font-bold leading-tight text-slate-900 mb-8 text-center">
          Đăng nhập
        </Text>

        <View className="gap-6">
          {/* Phone Number Input */}
          <ControlledInput
            control={control}
            name="phone"
            label="Số điện thoại"
            leftElement={<Phone size={24} color={COLORS.slate[400]} />}
            className="w-full pl-12 bg-slate-50 border-slate-200 text-slate-900"
            placeholder="090 123 4567"
            keyboardType="phone-pad"
          />

          {/* Password (PIN) Input */}
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

          {/* Submit Button */}
          <View>
            <Button
              label="Đăng nhập"
              className="mt-4 bg-primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
            {errors.root && (
              <Text className="text-brand-red text-center mt-3 text-sm font-medium">
                {errors.root.message}
              </Text>
            )}
          </View>
        </View>

        {/* Footer Links */}
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
