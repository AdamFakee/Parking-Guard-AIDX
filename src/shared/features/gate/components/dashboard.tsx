import { Button } from '@/shared/components/ui';
import { useShiftStore } from '@/shared/features/shift/store/useShiftStore';
import { toastQueue } from '@/shared/utils/toast.util';
import { useFocusEffect, useRouter } from 'expo-router';
import { CreditCard, Nfc } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDashboardStats, useNfc } from '../hooks';
import { resolveCardGateMode } from '../services/gate-session.service';
import { NfcService } from '../services/nfc.service';
import { useGateSessionStore } from '../store/gate-session.store';
import { ExpiredMonthlyCardModal, ExpiredMonthlyCardModalRef } from './expired-monthly-card-modal';

/**
 * Gate dashboard — field ops, not SaaS analytics.
 * Visual DNA: slate-50 / white cards / 10px labels / big NFC / h-20 gate buttons.
 */
export const Dashboard = () => {
  const insets = useSafeAreaInsets();
  const { currentShift } = useShiftStore();
  const { data: stats } = useDashboardStats(currentShift?.id);
  const { startListening, stopListening, isReading } = useNfc();
  const router = useRouter();

  const modalRef = React.useRef<ExpiredMonthlyCardModalRef>(null);
  const navigatingRef = React.useRef(false);

  const goToScan = useCallback(
    (mode: 'in' | 'out', tagUid?: string) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;

      const noCard = !tagUid;
      useGateSessionStore.getState().setSession({
        mode,
        tagUid: tagUid || undefined,
        noCard,
      });

      try {
        router.push({
          pathname: '/gate/scan-plate',
          params: {
            mode,
            ...(tagUid ? { tagUid } : { noCard: '1' }),
          },
        });
      } catch (e) {
        console.error('[Dashboard] router.push failed', e);
        navigatingRef.current = false;
        toastQueue.show({
          type: 'error',
          text1: 'Không mở được camera',
          text2: e instanceof Error ? e.message : 'Navigation error',
        });
        return;
      }

      setTimeout(() => {
        navigatingRef.current = false;
      }, 1500);
    },
    [router]
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      navigatingRef.current = false;

      (async () => {
        const result = await startListening(async (tag) => {
          if (!isActive || navigatingRef.current) return;

          try {
            const tagUid = NfcService.tagId(tag);
            if (!tagUid) {
              toastQueue.show({
                type: 'error',
                text1: 'Không đọc được UID thẻ',
                text2: 'Chạm lại, giữ 1–2 giây',
              });
              return;
            }

            const mode = await resolveCardGateMode(tagUid);
            if (!isActive) return;

            if (mode === 'expired') {
              modalRef.current?.show(tagUid);
              return;
            }

            goToScan(mode === 'out' ? 'out' : 'in', tagUid);
          } catch (e) {
            console.error('[Dashboard] NFC navigate error', e);
            toastQueue.show({
              type: 'error',
              text1: 'Lỗi thẻ',
              text2: e instanceof Error ? e.message : 'Không xử lý được thẻ',
            });
          }
        });

        if (!isActive) return;
        if (result && !result.ok) {
          toastQueue.show({
            type: 'error',
            text1: 'NFC',
            text2: result.reason || 'Không bật được NFC trên Dashboard',
          });
        }
      })();

      return () => {
        isActive = false;
        void stopListening();
      };
    }, [startListening, stopListening, goToScan])
  );

  const handleModalSuccess = (tagUid: string, _type?: 'renew' | 'convert') => {
    goToScan('in', tagUid);
  };

  const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

  return (
    <View className="flex-1 bg-slate-50">
      <View
        className="bg-white px-5 pb-4 border-b border-slate-200"
        style={{ paddingTop: Math.max(insets.top, 12) + 10 }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-3 flex-1 min-w-0">
            <View className="size-10 rounded-full bg-blue-50 items-center justify-center border border-blue-100">
              <Text className="text-blue-500 font-bold">
                {currentShift?.staffName
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(-2) || 'NV'}
              </Text>
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Nhân viên trực
              </Text>
              <Text
                className="text-lg font-extrabold text-slate-900 leading-tight"
                numberOfLines={1}
              >
                {currentShift?.staffName || '---'}
              </Text>
            </View>
          </View>
          <View className="items-end ml-2">
            <View className="flex-row items-center bg-green-50 px-2 py-0.5 rounded-md border border-green-200 gap-1">
              <View className="size-1.5 bg-green-500 rounded-full" />
              <Text className="text-green-500 text-[10px] font-bold uppercase">
                Online
              </Text>
            </View>
            <Text className="text-[10px] font-semibold text-slate-400 mt-1">
              Bắt đầu:{' '}
              {currentShift?.startTime
                ? new Date(currentShift.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '--:--'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-3 px-4 mt-4">
          <View className="flex-1 bg-white p-3 rounded-lg  border border-slate-200">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">
              Trong bãi
            </Text>
            <Text className="text-2xl font-extrabold text-blue-500 font-mono">
              {stats?.inYard || 0}
            </Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-lg  border border-slate-200">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">
              Xe vào
            </Text>
            <Text className="text-2xl font-extrabold text-green-500 font-mono">
              {stats?.entries || 0}
            </Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-lg  border border-slate-200">
            <Text className="text-[10px] font-bold text-slate-400 uppercase">
              Xe ra
            </Text>
            <Text className="text-2xl font-extrabold text-orange-500 font-mono">
              {stats?.exits || 0}
            </Text>
          </View>
        </View>

        <View className="px-4 mt-4">
          <View className="bg-white p-4 rounded-lg  border border-slate-200 flex-col gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tổng doanh thu ca
              </Text>
              <View className="px-2 py-0.5 bg-green-50 rounded-md border border-green-100">
                <Text className="text-green-500 text-[10px] font-bold">
                  CA HIỆN TẠI
                </Text>
              </View>
            </View>
            <View className="flex-row items-baseline justify-center gap-1">
              <Text className="text-3xl font-extrabold text-green-500 tracking-tight font-mono">
                {formatCurrency(stats?.revenue || 0)}
              </Text>
              <Text className="text-lg font-bold text-green-500">đ</Text>
            </View>
          </View>
        </View>

        {/* NFC — primary action, no decoration chrome */}
        <View className="items-center justify-center py-12 px-6">
          <View
            className={`z-10 size-44 rounded-full bg-white shadow-xl shadow-blue-500/20 items-center justify-center border border-blue-500/10 ${
              isReading ? '' : 'opacity-70'
            }`}
            accessibilityRole="image"
            accessibilityLabel={
              isReading ? 'Đang chờ chạm thẻ NFC' : 'NFC chưa sẵn sàng'
            }
          >
            <View className="size-32 bg-blue-500 rounded-full items-center justify-center shadow-lg">
              <Nfc size={64} color="white" strokeWidth={1.5} />
            </View>
          </View>
          <View className="mt-8 items-center">
            <Text className="text-xl font-black text-slate-900 tracking-tight">
              CHẠM THẺ NFC
            </Text>
            {isReading ? (
              <Text className="mt-2 text-sm text-slate-400 font-medium">
                Giữ thẻ 1–2 giây
              </Text>
            ) : null}
          </View>
        </View>

        <View className="px-5 pb-10">
          <Button
            label="Đăng ký thẻ tháng"
            variant="outline"
            onPress={() => router.push('/gate/monthly-register' as any)}
            leftIcon={CreditCard}
          />
        </View>
      </ScrollView>

      <ExpiredMonthlyCardModal ref={modalRef} onSuccess={handleModalSuccess} />
    </View>
  );
};
