import { generateRandomPlate } from '@/shared/features/gate/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

export default function ScanPlateScreen() {
  const router = useRouter();
  const { mode, tagUid } = useLocalSearchParams<{ mode: string, tagUid: string }>();


  const handleCapture = () => {
    // Mock image payload
    const mockImage = encodeURIComponent('https://lh3.googleusercontent.com/aida-public/AB6AXuBQG8cCYOCZKDMyML5RhvvHifGdJNneBcL0nPM2kTWBvyKrhziaU6_66RyCYB2zWn02I164dDjQmwrogR1OaWFjabrjGcoLtgVSOr1jswrEedS96vQucB9zEgXXthuOhuVzinQG7HnHZsU4a68IV5kV2lTv5WboV9-coqzIhXHfps-mJ_WdFbMncaK2BF0BCg6RKxstZ0JywzgmiLhlDnnx6WtPP9ryaLSUvf8RM-51hHzApbadxZbza7HmYq70wVPZp9GskT_-rzs');
    const randomPlate = generateRandomPlate();


    const params = new URLSearchParams({
      image: mockImage,
      plate: randomPlate
    });

    if (tagUid && tagUid !== 'undefined') {
      params.append('tagUid', tagUid);
    }

    // Navigate to next screen based on gate mode
    const path = mode === 'out' ? '/gate/check-out' : '/gate/check-in';
    router.replace(`${path}?${params.toString()}` as any);
  };

  return (
    <View className="flex-1 bg-slate-900">
      <View className="flex-row items-center justify-between p-4 pt-12 z-10">
        <Pressable onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text className="text-lg font-bold text-white">Chụp ảnh biển số</Text>
        <View className="w-10" />
      </View>

      {/* Mock Camera View */}
      <View className="flex-1 items-center justify-center relative">
        <Text className="text-white/30 text-2xl font-bold uppercase tracking-widest absolute">CAMERA MOCK</Text>
        
        {/* Frame */}
        <View className="w-72 h-44 border border-green-500/50 rounded-lg relative items-center justify-center bg-black/20">
          <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white" style={{ transform: [{ translateX: -2 }, { translateY: -2 }] }} />
          <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white" style={{ transform: [{ translateX: 2 }, { translateY: -2 }] }} />
          <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white" style={{ transform: [{ translateX: -2 }, { translateY: 2 }] }} />
          <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white" style={{ transform: [{ translateX: 2 }, { translateY: 2 }] }} />
          
          <Text className="text-white/70 font-bold uppercase tracking-wider">Khung biển số</Text>
        </View>
        <Text className="text-white/80 mt-8 text-sm bg-black/50 px-4 py-2 rounded-full">Vui lòng hướng camera vào biển số xe</Text>
      </View>

      {/* Bottom Controls */}
      <View className="pb-12 pt-6 px-10 flex-row items-center justify-between bg-black/40">
        <Pressable className="size-14 rounded-full bg-slate-800 border border-slate-700 items-center justify-center">
          <ImageIcon size={24} color="white" />
        </Pressable>

        {/* Capture Button */}
        <Pressable 
          onPress={handleCapture}
          className="size-20 rounded-full border-4 border-slate-400 items-center justify-center bg-white active:scale-95"
        >
          <View className="size-[68px] rounded-full bg-slate-100 border border-slate-200" />
        </Pressable>

        <Pressable className="size-14 rounded-full bg-slate-800 border border-slate-700 items-center justify-center flex-row gap-2">
          <Camera size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );
}
