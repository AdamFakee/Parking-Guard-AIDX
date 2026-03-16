import { AppHeader } from '@/shared/components/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LucideDelete } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useVerifyStaffPin } from '../hooks';

const PIN_LENGTH = 4;

export const StaffPasscode = () => {
  const router = useRouter();
  const { staffId, name, avatar } = useLocalSearchParams<{ staffId: string; name: string; avatar: string }>();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isErrorState, setIsErrorState] = useState(false);

  const { mutate: verifyPin } = useVerifyStaffPin();

  const handleNumberPress = (num: string) => {
    if (passcode.length < PIN_LENGTH) {
      const newPasscode = passcode + num;
      setPasscode(newPasscode);
      setError(null);
      setIsErrorState(false);
    }
  };

  const handleDelete = () => {
    setPasscode(prev => prev.slice(0, -1));
    setError(null);
    setIsErrorState(false);
  };

  useEffect(() => {
    if (passcode.length === PIN_LENGTH) {
      if (!staffId) return;

      verifyPin(
        { staffId: staffId as string, passcode },
        {
          onSuccess: () => {
             router.replace({
               pathname: '/start-shift',
               params: { staffId, name, avatar }
             });
          },
          onError: (err: any) => {
            setError(err.message || 'Mã PIN sai');
            setIsErrorState(true);
            setPasscode(''); // Reset on error
          }
        }
      );
    }
  }, [passcode, staffId, verifyPin, router, name, avatar]);

  return (
    <View className="flex-1 bg-white">
      <AppHeader title="Xác thực mã PIN" variant="white" onLeftPress={() => router.back()} />

      <View className="flex-1 items-center pt-8 px-6">
        {/* Staff Card */}
        <View className={`w-full flex-row items-center p-5 bg-white border ${isErrorState ? 'border-red-500' : 'border-slate-100'} rounded-[24px] shadow-sm mb-12`}>
          <Image
            source={{ uri: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Staff')}&background=random&size=128` }}
            className="w-16 h-16 rounded-full bg-slate-100"
          />
          <View className="ml-4">
            <Text className="text-xl font-bold text-slate-900">{name || 'Nhân viên'}</Text>
            <Text className="text-slate-500 text-sm mt-0.5">Ca làm việc: 08:00 - 14:00</Text>
          </View>
        </View>

        {/* Passcode Indicators */}
        <View className="flex-row gap-4 mb-20">
          {[...Array(PIN_LENGTH)].map((_, i) => (
            <View
              key={i}
              className={`size-4 rounded-full border-2 ${
                i < passcode.length 
                  ? 'bg-blue-500 border-blue-500' 
                  : isErrorState ? 'bg-white border-red-500' : 'bg-white border-slate-200'
              }`}
            />
          ))}
        </View>

        {/* Numeric Keypad */}
        <View className="w-full gap-4">
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'delete'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row gap-4 justify-between">
              {row.map((val, i) => {
                if (val === '') {
                  return <View key={i} className="flex-1 h-20" />;
                }
                
                return (
                  <Pressable
                    key={i}
                    onPress={() => val === 'delete' ? handleDelete() : handleNumberPress(val)}
                    className="flex-1 h-20 bg-slate-50 active:bg-slate-200 rounded-2xl items-center justify-center"
                  >
                    {val === 'delete' ? (
                       <LucideDelete size={28} color="#475569" />
                    ) : (
                      <Text className="text-3xl font-medium text-slate-800">{val}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View className="mt-12 items-center">
          {error ? (
             <Text className="text-red-500 font-medium text-sm">{error}</Text>
          ) : (
             <Text className="text-slate-400 text-sm">Vui lòng nhập mã PIN cá nhân để tiếp tục</Text>
          )}
        </View>
      </View>
    </View>
  );
};
