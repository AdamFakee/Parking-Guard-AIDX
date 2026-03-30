import { AppHeader, Button } from '@/shared/components/ui';
import { CheckInPhotoPreview, CheckInStatusCards, EditPlateModal, ExpiredMonthlyCardModal, ExpiredMonthlyCardModalRef, VehicleSelector } from '@/shared/features/gate';
import { checkNfcCardUsage } from '@/shared/features/gate/apis/gate.api';
import { useCheckIn } from '@/shared/features/gate/hooks';
import { TScanPlateResultParams, TVehicleType } from '@/shared/features/gate/types';
import { useShiftStore } from '@/shared/features/shift';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Info } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tagUid, fullImage, plateImage, plate } = useLocalSearchParams<TScanPlateResultParams>();
  const { currentShift } = useShiftStore();
  const { mutate: performCheckIn, isPending } = useCheckIn();
  
  const [plateText, setPlateText] = useState(plate || '');
  const [vehicleType, setVehicleType] = useState<TVehicleType>('motorbike');
  const [isMonthly, setIsMonthly] = useState(false);
  const [monthlyInfo, setMonthlyInfo] = useState<{ customerName?: string, registeredPlate?: string } | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const modalRef = useRef<ExpiredMonthlyCardModalRef>(null);

  useEffect(() => {
    async function checkCard() {
      if (tagUid) {
        const usage = await checkNfcCardUsage(tagUid);
        if (usage.status === 'existing' && usage.cardType === 'thang') {
          setIsMonthly(true);
          setMonthlyInfo({
            customerName: usage.customerName,
            registeredPlate: usage.registeredPlate || undefined,
          });
          
          if (usage.vehicleType) {
            setVehicleType(usage.vehicleType as TVehicleType);
          }
          
          if (usage.registeredPlate) {
            setPlateText(usage.registeredPlate);
          }

          if (usage.isExpired) {
            modalRef.current?.show(tagUid);
          }
        }
      }
    }
    checkCard();
  }, [tagUid, refreshSignal]);

  useEffect(() => {
    if (plate && !isMonthly) setPlateText(plate);
  }, [plate, isMonthly]);

  const handleSavePlate = (newPlate: string) => {
    setPlateText(newPlate);
  };

  const handleConfirm = () => {
    if (!currentShift?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin ca trực');
      return;
    }

    performCheckIn({
      entryShiftId: currentShift.id,
      cardUid: tagUid,
      vehicleType,
      plateText,
      photoIn1: fullImage || '',
      photoIn2: plateImage || fullImage || '',
    }, {
      onSuccess: () => {
        router.dismissAll();
        router.replace('/');
      },
      onError: (error: any) => {
        console.log(error);
        Alert.alert('Lỗi', 'Không thể lưu lượt vào: ' + error.message);
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Header */}
      <AppHeader title="Xác nhận xe vào" />

      <ScrollView style={{ flex: 1, backgroundColor: 'white', padding: 16 }} contentContainerStyle={{ paddingBottom: 140 }}>
        {isMonthly && (
          <View style={{ backgroundColor: '#eff6ff', padding: 12, borderRadius: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Info size={20} color="#3b82f6" style={{ marginRight: 8 }} />
            <View>
              <Text style={{ color: '#1e40af', fontWeight: 'bold' }}>Thẻ tháng: {monthlyInfo?.customerName}</Text>
              <Text style={{ color: '#1e40af', fontSize: 12 }}>Biển số đăng ký: {monthlyInfo?.registeredPlate}</Text>
            </View>
          </View>
        )}

        <CheckInPhotoPreview 
          fullImage={fullImage || ''} 
          plateImage={plateImage || ''}
          plateText={plateText} 
        />

        <CheckInStatusCards 
          plateText={plateText} 
          tagUid={tagUid} 
          onEditPlatePress={() => setIsEditModalVisible(true)} 
          isMonthly={isMonthly}
        />

        <View pointerEvents={isMonthly ? 'none' : 'auto'}>
          <VehicleSelector 
            value={vehicleType} 
            onSelect={setVehicleType} 
          />
        </View>
        {isMonthly && (
          <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            Loại phương tiện được cố định theo thẻ tháng
          </Text>
        )}
      </ScrollView>

      <EditPlateModal 
        isVisible={isEditModalVisible}
        initialPlate={plateText}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleSavePlate}
      />

      <View style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: 16, 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        borderTopWidth: 1, 
        borderTopColor: '#f1f5f9', 
        paddingBottom: Math.max(insets.bottom, 16) 
      }}>
        <Button 
          label="XÁC NHẬN XE VÀO"
          onPress={handleConfirm}
          loading={isPending}
          disabled={isPending}
          leftIcon={CheckCircle}
          className="flex-1 h-15"
          textClassName="text-lg font-bold"
        />
      </View>

      <ExpiredMonthlyCardModal 
        ref={modalRef}
        onSuccess={() => setRefreshSignal(s => s + 1)}
        onCancel={() => router.back()}
      />
    </View>
  );
}

