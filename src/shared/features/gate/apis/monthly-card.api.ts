import { db } from '@/shared/db';
import * as schema from '@/shared/db/schemas';

export type MonthlySubscriptionParams = {
  cardUid: string;
  customerName: string;
  customerPhone?: string;
  photoProfile?: string;
  photoVehicle?: string;
  vehicleType: 'motorbike' | 'car' | 'ebike';
  vehiclePlate: string;
  startDate: Date;
  endDate: Date;
  price?: number;
  shiftId: string;
  paymentMethod: 'cash' | 'qr_transfer';
};

export const registerMonthlyCard = async (params: MonthlySubscriptionParams) => {
  // 1. Update/Insert NFC Card
  await db.insert(schema.nfcCards)
    .values({
      uid: params.cardUid,
      cardType: 'thang',
      status: 'active',
      registeredPlate: params.vehiclePlate,
      expirationDate: params.endDate,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.nfcCards.uid,
      set: { 
        cardType: 'thang', 
        status: 'active', 
        registeredPlate: params.vehiclePlate,
        expirationDate: params.endDate,
        updatedAt: new Date() 
      }
    });

  // 2. Create the Detailed Subscription Record
  return await db.insert(schema.monthlySubscriptions).values({
    ...params,
    status: 'active',
    createdAt: new Date(),
  }).returning();
};

export const getMonthlySubscriptions = async () => {
  return await db.query.monthlySubscriptions.findMany({
    with: {
      card: true,
    },
    orderBy: (subs, { desc }) => [desc(subs.createdAt)],
  });
};
