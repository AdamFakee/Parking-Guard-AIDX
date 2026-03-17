import { db } from '@/shared/db';
import * as schema from '@/shared/db/schemas';
import { and, desc, eq, isNull, like, sql } from 'drizzle-orm';

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

  // Cash revenue in this shift
  const [cashRevenue] = await db
    .select({ total: sql<number>`sum(${schema.parkingEntries.feeAmount})` })
    .from(schema.parkingEntries)
    .where(
      and(
        eq(schema.parkingEntries.shiftId, shiftId),
        eq(schema.parkingEntries.status, 'OUT'),
        eq(schema.parkingEntries.paymentMethod, 'cash')
      )
    );

  // QR revenue in this shift
  const [qrRevenue] = await db
    .select({ total: sql<number>`sum(${schema.parkingEntries.feeAmount})` })
    .from(schema.parkingEntries)
    .where(
      and(
        eq(schema.parkingEntries.shiftId, shiftId),
        eq(schema.parkingEntries.status, 'OUT'),
        eq(schema.parkingEntries.paymentMethod, 'qr_transfer')
      )
    );

  return {
    inYard: inYardCount?.count || 0,
    entries: shiftEntryCount?.count || 0,
    exits: shiftExitCount?.count || 0,
    revenue: (cashRevenue?.total || 0) + (qrRevenue?.total || 0),
    cashRevenue: cashRevenue?.total || 0,
    qrRevenue: qrRevenue?.total || 0,
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
  cardUid?: string;
  vehicleType: 'motorbike' | 'car' | 'ebike';
  plateText: string;
  photoIn1: string;
  photoIn2: string;
};

export const checkIn = async (params: CheckInParams) => {
  // Only update card status if a valid card UID is provided
  if (params.cardUid) {
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
  }

  return await db.insert(schema.parkingEntries).values({
    shiftId: params.shiftId,
    cardUid: (params.cardUid === 'undefined' ? null : params.cardUid) || null,
    vehicleType: params.vehicleType,
    plateText: params.plateText,
    photoIn1: params.photoIn1,
    photoIn2: params.photoIn2,
    entryTime: new Date(),
    status: 'IN',
    manualInputIn: !params.cardUid || params.cardUid === 'undefined',
  });
};

export const searchActiveEntries = async (plate: string, onlyNoUid: boolean = false) => {

  const conditions = [
    eq(schema.parkingEntries.status, 'IN'),
    like(schema.parkingEntries.plateText, `%${plate}%`),
  ];

  if (onlyNoUid) {
    conditions.push(isNull(schema.parkingEntries.cardUid));
  }

  return await db
    .select()
    .from(schema.parkingEntries)
    .where(and(...conditions))
    .orderBy(desc(schema.parkingEntries.entryTime));
};

export const getActiveEntryByCard = async (cardUid: string) => {
  const [entry] = await db
    .select()
    .from(schema.parkingEntries)
    .where(
      and(
        eq(schema.parkingEntries.status, 'IN'),
        eq(schema.parkingEntries.cardUid, cardUid)
      )
    )
    .orderBy(desc(schema.parkingEntries.entryTime))
    .limit(1);

  return entry;
};

export type CheckOutParams = {
  entryId: string;
  cardUid?: string | null;
  exitPlate: string;
  photoOut1: string;
  photoOut2: string;
  feeAmount: number;
  paymentMethod: 'cash' | 'qr_transfer';
  isLostCard?: boolean;
  mismatchReason?: string;
  plateMatch: boolean;
};

export const checkOut = async (params: CheckOutParams) => {
  // 1. Update card status to 'free' if present
  if (params.cardUid && params.cardUid !== 'undefined') {
    await db.update(schema.nfcCards)
      .set({ status: 'free', updatedAt: new Date() })
      .where(eq(schema.nfcCards.uid, params.cardUid));
  }

  // 2. Update parking entry
  return await db.update(schema.parkingEntries)
    .set({
      exitTime: new Date(),
      exitPlate: params.exitPlate,
      photoOut1: params.photoOut1,
      photoOut2: params.photoOut2,
      plateMatch: params.plateMatch,
      feeAmount: params.feeAmount,
      paymentMethod: params.paymentMethod,
      status: 'OUT',
      isLostCard: params.isLostCard || false,
      mismatchReason: params.mismatchReason || null,
      manualInputOut: false,
    })
    .where(eq(schema.parkingEntries.id, params.entryId));
};

export const getSystemConfig = async () => {
  const [config] = await db.select().from(schema.systemConfigs).limit(1);
  return config;
};

export const getPricingRules = async () => {
  return await db.select().from(schema.pricingRules);
};
export const updateSystemConfig = async (id: number, values: Partial<typeof schema.systemConfigs.$inferInsert>) => {
  return await db.update(schema.systemConfigs)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(schema.systemConfigs.id, id));
};

export const updatePricingRule = async (id: string, values: Partial<typeof schema.pricingRules.$inferInsert>) => {
  return await db.update(schema.pricingRules)
    .set(values)
    .where(eq(schema.pricingRules.id, id));
};

export const deletePricingRule = async (id: string) => {
  return await db.delete(schema.pricingRules).where(eq(schema.pricingRules.id, id));
};

export const createPricingRule = async (values: typeof schema.pricingRules.$inferInsert) => {
  return await db.insert(schema.pricingRules).values(values);
};
