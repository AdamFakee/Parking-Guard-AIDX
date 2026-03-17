import { CheckInPhotoPreview, CheckInStatusCards, EditPlateModal, VehicleSelector } from '@/shared/features/gate';
import { useCheckIn } from '@/shared/features/gate/hooks';
import { TVehicleType } from '@/shared/features/gate/types';
import { useShiftStore } from '@/shared/features/shift';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

export default function CheckInScreen() {
  const router = useRouter();
  const { tagUid, image, plate } = useLocalSearchParams<{ tagUid: string, image: string, plate: string }>();
  const { currentShift } = useShiftStore();
  const { mutate: performCheckIn, isPending } = useCheckIn();
  
  const [plateText, setPlateText] = useState(plate || '');
  const [vehicleType, setVehicleType] = useState<TVehicleType>('motorbike');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    if (plate) setPlateText(plate);
  }, [plate]);

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
      onError: (error) => {
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
        <CheckInPhotoPreview image={image} plateText={plateText} />

        <CheckInStatusCards 
          plateText={plateText} 
          tagUid={tagUid} 
          onEditPlatePress={() => setIsEditModalVisible(true)} 
        />

        <VehicleSelector 
          value={vehicleType} 
          onChange={setVehicleType} 
        />
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
          style={{ width: '100%', paddingVertical: 16, borderRadius: 8, backgroundColor: '#22c55e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: isPending ? 0.7 : 1 }}
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

