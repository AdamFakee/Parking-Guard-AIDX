import { db } from '@/shared/db';
import * as schema from '@/shared/db/schemas';
import { and, desc, eq, sql } from 'drizzle-orm';

export const getDashboardStats = async (shiftId: string) => {
  // Count cars currently in yard
  const [inYardCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.parkingEntries)
    .where(eq(schema.parkingEntries.status, 'IN'));

  // Count entries in this shift
  const [shiftEntryCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.parkingEntries)
    .where(eq(schema.parkingEntries.shiftId, shiftId));

  // Count exits in this shift
  const [shiftExitCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.parkingEntries)
    .where(
      and(
        eq(schema.parkingEntries.shiftId, shiftId),
        eq(schema.parkingEntries.status, 'OUT')
      )
    );

  // Total revenue in this shift
  const [shiftRevenue] = await db
    .select({ total: sql<number>`sum(${schema.parkingEntries.feeAmount})` })
    .from(schema.parkingEntries)
    .where(
      and(
        eq(schema.parkingEntries.shiftId, shiftId),
        eq(schema.parkingEntries.status, 'OUT')
      )
    );

  return {
    inYard: inYardCount?.count || 0,
    entries: shiftEntryCount?.count || 0,
    exits: shiftExitCount?.count || 0,
    revenue: shiftRevenue?.total || 0,
  };
};

export const getCardStatus = async (cardUid: string) => {
  const [latestEntry] = await db
    .select()
    .from(schema.parkingEntries)
    .where(eq(schema.parkingEntries.cardUid, cardUid))
    .orderBy(desc(schema.parkingEntries.entryTime))
    .limit(1);

  if (!latestEntry || latestEntry.status === 'OUT' || latestEntry.status === 'VOID') {
    return 'in'; // Next action is Check-In
  }
  
  return 'out'; // Next action is Check-Out
};

export type CheckInParams = {
  shiftId: string;
  cardUid: string;
  vehicleType: 'motorbike' | 'car' | 'ebike';
  plateText: string;
  photoIn1: string;
  photoIn2: string;
};

export const checkIn = async (params: CheckInParams) => {
  await db.insert(schema.nfcCards)
    .values({
      uid: params.cardUid,
      cardType: 'luot',
      status: 'using',
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.nfcCards.uid,
      set: { status: 'using', updatedAt: new Date() }
    });

  return await db.insert(schema.parkingEntries).values({
    shiftId: params.shiftId,
    cardUid: params.cardUid,
    vehicleType: params.vehicleType,
    plateText: params.plateText,
    photoIn1: params.photoIn1,
    photoIn2: params.photoIn2,
    entryTime: new Date(),
    status: 'IN',
    manualInputIn: false,
  });
};

