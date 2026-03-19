import { OptionCard } from '@/shared/components/ui';
import { Edit2, Nfc, ScanText } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface CheckInStatusCardsProps {
  plateText: string;
  tagUid: string;
  onEditPlatePress: () => void;
  isMonthly?: boolean;
}

export const CheckInStatusCards = ({ plateText, tagUid, onEditPlatePress, isMonthly }: CheckInStatusCardsProps) => {
  return (
    <View style={{ marginBottom: 24 }}>
      <OptionCard
        isSelected={false}
        leftIcon={
          <View style={{ backgroundColor: '#22c55e', padding: 8, borderRadius: 8 }}>
            <ScanText size={20} color="white" />
          </View>
        }
        rightIcon={
          <View style={{ backgroundColor: 'white', borderColor: '#bbf7d0', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center' }}>
            <Edit2 size={14} color="#10b981" />
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#16a34a', marginLeft: 4 }}>SỬA</Text>
          </View>
        }
        onPress={onEditPlatePress}
        className='border-green-200 bg-green-50'
      >
        <View>
          <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Biển số</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1e293b', marginTop: 2 }}>{plateText || 'Trống'}</Text>
        </View>
      </OptionCard>

      <OptionCard
        isSelected={false}
        leftIcon={
          <View style={{ backgroundColor: '#3b82f6', padding: 8, borderRadius: 8 }}>
            <Nfc size={20} color="white" />
          </View>
        }
        className='border-blue-200 bg-blue-50'
      >
        <View>
          <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Thẻ NFC</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1e293b', marginTop: 2 }}>
            {tagUid && tagUid !== 'undefined' ? `UID: ${tagUid}` : 'Không sử dụng thẻ'} 
            <Text style={{ fontSize: 14, fontWeight: 'normal', color: '#64748b' }}>
              ({isMonthly ? 'Thẻ tháng' : 'Thẻ lượt'})
            </Text>
          </Text>
        </View>
      </OptionCard>
    </View>
  );
};
