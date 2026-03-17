import { Edit2, Nfc, ScanText } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface CheckInStatusCardsProps {
  plateText: string;
  tagUid: string;
  onEditPlatePress: () => void;
}

export const CheckInStatusCards = ({ plateText, tagUid, onEditPlatePress }: CheckInStatusCardsProps) => {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1, padding: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#22c55e', padding: 8, borderRadius: 8, marginRight: 12 }}>
            <ScanText size={20} color="white" />
          </View>
          <View>
            <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Biển số</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1e293b' }}>{plateText || 'Trống'}</Text>
            </View>
          </View>
        </View>
        
        <Pressable 
          onPress={onEditPlatePress}
          style={{ backgroundColor: 'white', borderColor: '#bbf7d0', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center' }}
        >
          <Edit2 size={14} color="#10b981" />
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#16a34a', marginLeft: 4 }}>SỬA</Text>
        </Pressable>
      </View>

      <View style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, padding: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#3b82f6', padding: 8, borderRadius: 8, marginRight: 12 }}>
          <Nfc size={20} color="white" />
        </View>
        <View>
          <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Thẻ NFC</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1e293b', marginTop: 2 }}>{tagUid && tagUid !== 'undefined' ? `UID: ${tagUid}` : 'Không sử dụng thẻ'} <Text style={{ fontSize: 14, fontWeight: 'normal', color: '#64748b' }}>(Thẻ lượt)</Text></Text>
        </View>
      </View>
    </View>
  );
};
