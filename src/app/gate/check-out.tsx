import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

export default function CheckOutScreen() {
  const router = useRouter();
  const { tagUid, image, plate } = useLocalSearchParams<{ tagUid: string, image: string, plate: string }>();


  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white border-b border-slate-200 p-4 pt-12 flex-row items-center justify-between z-10">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#475569" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-800">Thông tin xe ra</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Plate Comparison */}
        <View className="bg-white rounded-lg p-5 shadow-sm mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-col">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hình ảnh vào</Text>
              <View className="w-28 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <Image 
                  source={{ uri: image }} 
                  className="w-full h-full" resizeMode="cover" 
                />
              </View>
              <Text className="text-sm font-bold text-slate-800 mt-2">VÀO: {plate || '59A1-12345'}</Text>
            </View>
            
            <View className="flex-col items-center justify-center">
              <View className="bg-green-50 px-2 py-1 rounded-full border border-green-200 mb-2">
                <Text className="text-green-600 text-[10px] font-bold">✓ KHỚP</Text>
              </View>
              <View className="w-8 h-[1px] bg-slate-200" />
            </View>

            <View className="flex-col items-end">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hình ảnh ra</Text>
              <View className="w-28 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <Image 
                  source={{ uri: image }} 
                  className="w-full h-full" resizeMode="cover" 
                />
              </View>
              <Text className="text-sm font-bold text-slate-800 mt-2">RA: {plate || '59A1-12345'}</Text>
            </View>
          </View>
        </View>

        {/* Fee Details */}
        <View className="bg-white rounded-lg overflow-hidden shadow-sm">
          <View className="p-5">
            <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-3">Chi tiết phí</Text>
            
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-slate-500">Mã thẻ NFC</Text>
              <Text className="text-sm font-bold text-blue-500">{tagUid ? tagUid : 'CHƯA QUÉT'}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-slate-500">Loại phương tiện</Text>
              <Text className="text-sm font-semibold text-slate-800">Xe ô tô con</Text>
            </View>
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-sm text-slate-500">Thời gian vào</Text>
              <View className="items-end">
                <Text className="text-sm font-semibold text-slate-800">08:30:15</Text>
                <Text className="text-[10px] text-slate-400">15/10/2023</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-sm text-slate-500">Thời gian ra</Text>
              <View className="items-end">
                <Text className="text-sm font-semibold text-slate-800">10:15:45</Text>
                <Text className="text-[10px] text-slate-400">15/10/2023</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm text-slate-500">Thời gian gửi</Text>
              <Text className="text-sm font-semibold text-slate-800">1h45</Text>
            </View>
            <View className="pt-3 border-t border-dashed border-slate-200 flex-row justify-between items-center">
              <Text className="text-sm text-slate-500">Đơn giá</Text>
              <Text className="text-sm font-semibold text-slate-800">5,000đ</Text>
            </View>
          </View>
          
          <View className="bg-orange-50 p-5 items-center justify-center border-t border-orange-100">
            <Text className="text-xs font-bold text-orange-500 uppercase mb-1">TỔNG CỘNG</Text>
            <Text className="text-4xl font-mono font-bold text-orange-500">5,000đ</Text>
          </View>
        </View>
      </ScrollView>

      {/* Payment Actions */}
      <View className="bg-white p-4 pt-6 pb-8 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] border-t border-slate-100">
        <Text className="text-center text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-[0.2em]">Chọn phương thức thanh toán</Text>
        <View className="flex-row gap-3">
          <Pressable 
            onPress={() => router.back()}
            className="flex-1 bg-green-500 py-4 px-2 rounded-lg items-center justify-center gap-2"
          >
            <Text className="text-2xl">💵</Text>
            <Text className="font-bold text-sm text-white">Tiền mặt</Text>
          </Pressable>
          <Pressable 
            onPress={() => router.push('/gate/qr-payment' as any)}
            className="flex-1 bg-purple-500 py-4 px-2 rounded-lg items-center justify-center gap-2"
          >
            <Text className="text-2xl">📱</Text>
            <Text className="font-bold text-sm text-white text-center">QR Chuyển khoản</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.back()} className="mt-5 mb-2">
          <Text className="text-center text-sm font-medium text-slate-400">Hủy bỏ giao dịch</Text>
        </Pressable>
      </View>
    </View>
  );
}
