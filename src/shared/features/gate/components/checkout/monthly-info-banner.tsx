import { AlertTriangle, Info } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  isMonthly: boolean;
  customerName?: string;
  isExpired?: boolean;
}

export const MonthlyInfoBanner = ({ isMonthly, customerName, isExpired }: Props) => {
  if (!customerName) return null;

  const bgColor = isMonthly ? '#eff6ff' : '#fef2f2';
  const borderColor = isMonthly ? '#bfdbfe' : '#fecaca';
  const textColor = isMonthly ? '#1e40af' : '#b91c1c';
  const iconColor = isMonthly ? '#3b82f6' : '#ef4444';

  return (
    <View 
      style={{ 
        backgroundColor: bgColor, 
        padding: 12, 
        borderRadius: 12, 
        marginBottom: 16, 
        flexDirection: 'row', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: borderColor
      }}
    >
      {isMonthly ? (
        <Info size={20} color={iconColor} style={{ marginRight: 8 }} />
      ) : (
        <AlertTriangle size={20} color={iconColor} style={{ marginRight: 8 }} />
      )}
      <View>
        <Text style={{ color: textColor, fontWeight: 'bold' }}>
          Thẻ tháng: {customerName} {isMonthly ? '' : '(HẾT HẠN)'}
        </Text>
        <Text style={{ color: textColor, fontSize: 12 }}>
          {isMonthly ? 'Đã được miễn phí tiền gửi xe' : 'Hết hạn sử dụng - Tính tiền như vé lượt'}
        </Text>
      </View>
    </View>
  );
};
