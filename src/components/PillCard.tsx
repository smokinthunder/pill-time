import { View, Text, TouchableOpacity } from 'react-native';
import { Pill, AlertCircle, Check, Clock } from 'lucide-react-native';

type PillCardProps = {
  name: string;
  description: string;
  currentStock: number;
  totalStock: number;
  
  // NEW PROPS
  daysLeft: number; 
  showDaysSupply: boolean; // <--- This was likely missing in your file

  buttonLabel: string;
  buttonSubtext: string;
  isOverdue: boolean;
  isTomorrow: boolean;
  
  onTake: () => void;
  onLongPressTake: () => void;
};

export function PillCard({ 
  name, 
  description, 
  currentStock, 
  totalStock, 
  daysLeft, 
  showDaysSupply, // <--- Destructure it here
  buttonLabel,
  buttonSubtext,
  isOverdue,
  isTomorrow,
  onTake, 
  onLongPressTake 
}: PillCardProps) {
  
  const stockPercent = Math.min((currentStock / totalStock) * 100, 100);
  const isLowSupply = daysLeft < 5; 

  let btnBg = "bg-green-600 dark:bg-green-700"; 
  if (isOverdue) btnBg = "bg-red-600 dark:bg-red-700"; 
  if (isTomorrow) btnBg = "bg-blue-500/90 dark:bg-blue-600/90"; 

  // --- DYNAMIC TEXT LOGIC ---
  // If showDaysSupply is true, we show days. Otherwise, we show pill count.
  const mainText = showDaysSupply 
    ? (daysLeft > 365 ? '1+ Year' : `${daysLeft} Days`)
    : `${currentStock} Pills`;

  const subText = showDaysSupply
    ? 'Supply Left'
    : 'Remaining Stock';

  return (
    <View className="bg-white dark:bg-gray-800 rounded-3xl p-5 mb-5 shadow-sm border border-gray-100 dark:border-gray-700">
      
      {/* Header */}
      <View className="flex-row justify-between items-start mb-5">
        <View className="flex-row items-center gap-4 flex-1">
          <View className="bg-blue-50 dark:bg-blue-900/30 p-3.5 rounded-2xl">
            <Pill size={26} color="#2563EB" strokeWidth={1.5} />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900 dark:text-white" numberOfLines={1}>{name}</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-0.5" numberOfLines={1}>{description}</Text>
          </View>
        </View>
        <View className={`px-3 py-1.5 rounded-lg ${isLowSupply ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
          <Text className={`text-xs font-bold ${isLowSupply ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
            {currentStock} left
          </Text>
        </View>
      </View>

      {/* Supply Dashboard */}
      <View className="mb-6">
        <View className="flex-row justify-between items-baseline mb-2">
          <Text className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
             {mainText}
          </Text>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
             {subText}
          </Text>
        </View>

        <View className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <View 
            className={`h-full rounded-full ${isLowSupply ? 'bg-red-500' : 'bg-blue-500'}`} 
            style={{ width: `${stockPercent}%` }} 
          />
        </View>
        
        {isLowSupply && (
           <View className="flex-row items-center mt-2">
              <AlertCircle size={14} className="text-red-500" />
              <Text className="text-red-500 text-xs font-bold ml-1.5">Refill Recommended</Text>
           </View>
        )}
      </View>

      {/* Smart Button */}
      <TouchableOpacity 
        onPress={onTake}
        disabled={isTomorrow} 
        onLongPress={onLongPressTake}
        delayLongPress={500}
        activeOpacity={0.9}
        className={`${btnBg} py-4 px-5 rounded-2xl flex-row items-center justify-between shadow-sm`}
      >
        <View className="flex-row items-center gap-3">
           {isTomorrow ? <Clock size={22} color="white" strokeWidth={2.5} /> : <Check size={24} color="white" strokeWidth={3} />}
           <View>
              <Text className="text-white font-bold text-lg leading-tight">{buttonLabel}</Text>
              {buttonSubtext ? (
                <Text className="text-white/80 text-xs font-semibold uppercase tracking-wide">{buttonSubtext}</Text>
              ) : null}
           </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}