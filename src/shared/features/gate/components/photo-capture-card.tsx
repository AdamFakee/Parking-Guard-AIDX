import { useCamera } from '@/shared/hooks';
import { Camera, Trash2 } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const styles = {
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

interface PhotoCaptureCardProps {
  photo: string | null;
  onChange: (uri: string | null) => void;
  title: string;
  buttonLabel: string;
}

export const PhotoCaptureCard = ({ 
  photo, 
  onChange,
  title,
  buttonLabel
}: PhotoCaptureCardProps) => {
  const { takePhoto } = useCamera();

  const handleCapture = useCallback(async () => {
    const uri = await takePhoto({
      quality: 0.5,
      mediaTypes: ['images'],
    });
    if (uri) onChange(uri);
  }, [takePhoto, onChange]);

  return (
    <View className="gap-4">
      <Text className="text-sm font-bold text-slate-900 pl-1">{title}</Text>
      {photo ? (
        <View className="relative" style={styles.shadowMd}>
          <Image source={{ uri: photo }} className="w-full h-56 rounded-3xl" resizeMode="contain"/>
          <TouchableOpacity 
            onPress={() => onChange(null)}
            className="absolute top-3 right-3 size-10 bg-red-500 rounded-full items-center justify-center"
            style={styles.shadowLg}
          >
            <Trash2 size={20} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          onPress={handleCapture}
          className="h-56 bg-white rounded-3xl items-center justify-center gap-3 border-2 border-slate-200 border-dashed"
          style={styles.shadowSm}
        >
          <View className="size-16 bg-slate-50 rounded-full items-center justify-center">
            <Camera size={32} color="#94A3B8" />
          </View>
          <Text className="text-slate-400 font-bold">Chụp {buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
