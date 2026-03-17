import { Text, View, Image, Pressable } from 'react-native';
import { format } from 'date-fns';
import { Clock } from 'lucide-react-native';
import { TParkingEntry } from '../../gate';

interface ParkingEntryCardProps {
  entry: TParkingEntry;
  onPress?: (entry: TParkingEntry) => void;
  onOptionsPress?: (entry: TParkingEntry) => void;
}

export const ParkingEntryCard = ({ entry, onPress, onOptionsPress }: ParkingEntryCardProps) => {
  return (
    <Pressable 
      onPress={() => onPress?.(entry)}
      className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex-row gap-4 active:bg-slate-50"
    >
      <View className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100">
        <Image 
          source={{ uri: entry.photoIn1 }} 
          className="w-full h-full" 
          resizeMode="cover" 
        />
      </View>
      <View className="flex-1 flex flex-col justify-between py-0.5">
        <View>
          <View className="flex-row items-center mb-1">
            <View className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 self-start">
              <Text className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">Trong bãi</Text>
            </View>
          </View>
          <Text className="text-lg font-mono font-bold text-slate-800 leading-none mb-1">
            {entry.plateText}
          </Text>
          <Text className="text-[11px] font-mono text-slate-400">
            UID: {entry.cardUid || 'N/A'}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Clock size={12} color="#94a3b8" />
          <Text className="text-[11px] text-slate-500">
            Vào lúc: {format(new Date(entry.entryTime), 'HH:mm - dd/MM/yyyy')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
