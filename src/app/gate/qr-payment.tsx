import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';

export default function QRPaymentScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white border-b border-slate-200 p-4 pt-12 flex-row items-center z-10">
        <Pressable onPress={() => router.back()} className="p-1 -ml-1">
          <ArrowLeft size={24} color="#475569" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-purple-700 mr-6">Thanh toán QR</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="items-center pb-20">
          {/* Amount Card */}
          <View className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 items-center">
            <Text className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-medium">Số tiền cần thanh toán</Text>
            <Text className="text-4xl font-mono font-bold text-orange-500">5,000đ</Text>
          </View>

          {/* QR Code Section */}
          <View className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8 w-full max-w-[280px] aspect-square items-center justify-center relative">
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARdRblaaTR1LF77j-uNlnxUlxFwkA5NJU_PamhAdnQ0SP3zg_QiEgM2bePjhjCwdDXtTGuVK-Bcl9mumTFKVrzzNW7tv-3JXXarw0kY6wxi1AKoJNaELO9kh0ynhyG3etyPNjxwN4XNP7JEXIi-jtoY9Zv93zG3sDxnwy26mWGdYUlgrbA6FTqRPuEQarzokjwETNmwFTGuFUdKyu4b_Sv4jSZbii6XL9o54OFBGI8axIjhwj9zIgmLqhbPkASUTXVxvDXwFrrXpU' }} 
              className="w-full h-full" resizeMode="contain" 
            />
            <View className="absolute bg-white p-2 rounded-lg shadow-sm border border-slate-100 bottom-[-15px]">
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5DYyQLxxEydTNURt_6JD8KRq83VZgnHYbJoecN1WGOE-ie4eo1R4qaA_GTSN_2HRuY_gpz0yJcLcLLId4lUapiENhKvnsW_nUBQ207E1rgCUX8_OvAmeMiFlGmsPx3KOdBWbfT9hmp-OGjHhIXl_UELMUlGLuEHGMATPew7KWrk5wji7FOGIr59Z6676asCuou_6qP1JL_DUG5P8ctehbz7py8El1rKZvkzr1V_GnwzCxSnGZC9LpL2sPyQUCo17zlYYQ8hVyfmg' }} 
                className="h-6 w-16" resizeMode="contain" 
              />
            </View>
          </View>

          {/* Bank Details */}
          <View className="w-full space-y-4">
            <View className="bg-white rounded-xl p-4 border border-slate-100">
              <View className="flex-row justify-between py-3 border-b border-slate-50">
                <Text className="text-slate-500">Ngân hàng</Text>
                <Text className="font-semibold text-slate-800">Vietcombank</Text>
              </View>
              <View className="flex-row justify-between py-3 border-b border-slate-50">
                <Text className="text-slate-500">Chủ tài khoản</Text>
                <Text className="font-semibold text-slate-800 uppercase">NGUYEN VAN A</Text>
              </View>
              <View className="flex-row justify-between py-3 border-b border-slate-50">
                <Text className="text-slate-500">Số tài khoản</Text>
                <Text className="font-mono font-bold text-slate-800">1234 5678 9012</Text>
              </View>
              <View className="flex-row justify-between py-3">
                <Text className="text-slate-500">Nội dung</Text>
                <Text className="font-mono font-bold text-purple-600">GX 59A1-12345</Text>
              </View>
            </View>

            <Text className="text-center text-sm font-medium text-red-500 px-4 mt-4">
              ⚠️ Kiểm tra SMS banking trước khi xác nhận!
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-4 bg-white border-t border-slate-100 pb-8 absolute bottom-0 left-0 right-0">
        <Pressable 
          onPress={() => router.replace('/' as any)}
          className="w-full py-4 rounded-xl bg-green-500 flex-row items-center justify-center gap-2"
        >
          <Check size={24} color="white" />
          <Text className="text-white font-bold text-lg">ĐÃ NHẬN TIỀN</Text>
        </Pressable>
      </View>
    </View>
  );
}
