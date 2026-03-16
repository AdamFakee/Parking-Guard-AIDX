import { db } from '@/shared/db';
import * as schema from '@/shared/db/schemas';
import { eq, and } from 'drizzle-orm';

export const startShift = async ({ staffId, openingCash }: { staffId: string; openingCash: number }) => {
  // Check if there's already an open shift for this staff (though usually only one shift can be open at a time in the system)
  // For simplicity, we just create a new one.
  
  const [newShift] = await db.insert(schema.shifts).values({
    staffId,
    openingCash,
    startTime: new Date(),
    status: 'open',
  }).returning();

  return newShift;
};

export const getActiveShift = async (staffId: string) => {
  const [activeShift] = await db
    .select()
    .from(schema.shifts)
    .where(
      and(
        eq(schema.shifts.staffId, staffId),
        eq(schema.shifts.status, 'open')
      )
    )
    .limit(1);
  return activeShift;
};
