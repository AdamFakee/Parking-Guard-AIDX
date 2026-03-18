import { CheckInPhotoPreview, CheckInStatusCards, EditPlateModal, VehicleSelector } from '@/shared/features/gate';
import { checkNfcCardUsage } from '@/shared/features/gate/apis/gate.api';
import { useCheckIn } from '@/shared/features/gate/hooks';
import { TVehicleType } from '@/shared/features/gate/types';
import { useShiftStore } from '@/shared/features/shift';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle, Info } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

export default function CheckInScreen() {
  const router = useRouter();
  const { tagUid, image, plate } = useLocalSearchParams<{ tagUid: string, image: string, plate: string }>();
  const { currentShift } = useShiftStore();
  const { mutate: performCheckIn, isPending } = useCheckIn();
  
  const [plateText, setPlateText] = useState(plate || '');
  const [vehicleType, setVehicleType] = useState<TVehicleType>('motorbike');
  const [isMonthly, setIsMonthly] = useState(false);
  const [monthlyInfo, setMonthlyInfo] = useState<{ customerName?: string, registeredPlate?: string } | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

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
            Alert.alert('Cảnh báo', 'Thẻ tháng này đã hết hạn!');
          }
        }
      }
    }
    checkCard();
  }, [tagUid]);

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
      shiftId: currentShift.id,
      cardUid: tagUid,
      vehicleType,
      plateText,
      photoIn1: image,
      photoIn2: image,
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: 'white', paddingTop: 48 }}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <ArrowLeft size={24} color="#1E293B" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Xác nhận xe vào</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: 'white', padding: 16 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {isMonthly && (
          <View style={{ backgroundColor: '#eff6ff', padding: 12, borderRadius: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Info size={20} color="#3b82f6" style={{ marginRight: 8 }} />
            <View>
              <Text style={{ color: '#1e40af', fontWeight: 'bold' }}>Thẻ tháng: {monthlyInfo?.customerName}</Text>
              <Text style={{ color: '#1e40af', fontSize: 12 }}>Biển số đăng ký: {monthlyInfo?.registeredPlate}</Text>
            </View>
          </View>
        )}

        <CheckInPhotoPreview image={image} plateText={plateText} />

        <CheckInStatusCards 
          plateText={plateText} 
          tagUid={tagUid} 
          onEditPlatePress={() => setIsEditModalVisible(true)} 
          isMonthly={isMonthly}
        />

        <View pointerEvents={isMonthly ? 'none' : 'auto'} style={{ opacity: isMonthly ? 0.6 : 1 }}>
          <VehicleSelector 
            value={vehicleType} 
            onChange={setVehicleType} 
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

      {/* Bottom Action */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingBottom: 32 }}>
        <Pressable 
          onPress={handleConfirm}
          disabled={isPending}
          style={{ width: '100%', paddingVertical: 16, borderRadius: 8, backgroundColor: isMonthly ? '#3b82f6' : '#22c55e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <CheckCircle size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>XÁC NHẬN XE VÀO</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

