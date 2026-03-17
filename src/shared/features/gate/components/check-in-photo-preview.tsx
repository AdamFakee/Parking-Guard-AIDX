import React from 'react';
import { Image, Platform, Text, View } from 'react-native';

interface CheckInPhotoPreviewProps {
  image: string;
  plateText: string;
}

export const CheckInPhotoPreview = ({ image, plateText }: CheckInPhotoPreviewProps) => {
  return (
    <View style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', backgroundColor: '#e2e8f0', aspectRatio: 16/9, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 }}>
      {image ? (
        <Image 
          source={{ uri: image }} 
          style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.9 }}
          resizeMode="cover"
        />
      ) : null}
      <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 2, borderColor: '#22c55e', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8 }}>
        <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 30, fontWeight: 'bold', letterSpacing: 4, color: '#1e293b' }}>
          {plateText || '---'}
        </Text>
      </View>
    </View>
  );
};
