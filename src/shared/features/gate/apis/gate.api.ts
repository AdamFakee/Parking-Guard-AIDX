import { db } from '@/shared/db';
import * as schema from '@/shared/db/schemas';
import { eq, and, sql } from 'drizzle-orm';

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
