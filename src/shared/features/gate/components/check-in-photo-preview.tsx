import React from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { formatDisplayPlate } from '../utils';

interface CheckInPhotoPreviewProps {
  fullImage: string;
  plateImage?: string;
  plateText: string;
}

export const CheckInPhotoPreview = ({ fullImage, plateImage, plateText }: CheckInPhotoPreviewProps) => {
  // Ưu tiên ảnh biển số (plateImage), nếu không có mới dùng ảnh gốc (fullImage)
  const displayImage = plateImage || fullImage;

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ 
        position: 'relative', 
        borderRadius: 12, 
        overflow: 'hidden', 
        backgroundColor: '#f1f5f9', 
        aspectRatio: 16/9, 
        borderWidth: 1, 
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Focused Image (Prefer crop) */}
        {displayImage ? (
          <Image 
            source={{ uri: displayImage }} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : null}
      </View>

      {/* Plate Recognition Result Overlay (Bottom) */}
      <View style={{ 
        marginTop: -25,
        alignSelf: 'center',
        backgroundColor: 'white', 
        borderWidth: 3, 
        borderColor: '#22c55e', 
        paddingHorizontal: 20, 
        paddingVertical: 6, 
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 8,
      }}>
        <Text style={{ 
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
          fontSize: 24, 
          fontWeight: 'bold', 
          letterSpacing: 2, 
          color: '#1e293b' 
        }}>
          {formatDisplayPlate(plateText) || '---'}
        </Text>
      </View>
    </View>
  );
};
