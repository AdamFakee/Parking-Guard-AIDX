import { Card } from '@/shared/components/ui';
import React from 'react';
import { Text, View } from 'react-native';
import { FinanceRow } from './finance-row';

interface ShiftDetailSummaryProps {
  shift: any;
}

export const ShiftDetailSummary = ({ shift }: ShiftDetailSummaryProps) => {
  const expectedTotal = (shift.cashRevenue || 0) + (shift.qrRevenue || 0);
  const discrepancy = (shift.actualCash || 0) - (shift.cashRevenue || 0);

  return (
    <View className="py-md">
      <FinanceRow label="Tiền đầu ca" value={shift.openingCash} />
      <FinanceRow label="Doanh thu tiền mặt" value={shift.cashRevenue} color="text-green-500" />
      <FinanceRow label="Doanh thu QR/Chuyển khoản" value={shift.qrRevenue} color="text-blue-500" />
      <View className="h-[1px] bg-slate-200 my-md" />
      <FinanceRow label="Tổng nộp (Dự kiến)" value={expectedTotal} fontBold />
      {shift.status === 'closed' && (
        <>
          <FinanceRow label="Tiền thực tế nộp" value={shift.actualCash} />
          <FinanceRow 
            label="Chênh lệch" 
            value={discrepancy} 
            color={discrepancy < 0 ? 'text-red-500' : 'text-green-500'} 
          />
          {shift.discrepancyReason && (
            <Card className="p-sm mt-sm bg-red-500/10 border-red-500/20">
              <Text className="text-red-400 text-xs italic">
                Lý do chênh lệch: {shift.discrepancyReason}
              </Text>
            </Card>
          )}
        </>
      )}
    </View>
  );
};
