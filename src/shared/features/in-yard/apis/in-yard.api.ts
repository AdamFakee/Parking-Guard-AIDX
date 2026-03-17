import { db } from '@/shared/db';
import * as schema from '@/shared/db/schemas';
import { and, desc, eq } from 'drizzle-orm';
import { TVehicleType } from '../../gate';

export type GetInYardParams = {
  vehicleType?: TVehicleType | 'all';
  page?: number;
  limit?: number;
};

export const getInYardEntries = async ({ vehicleType, page = 1, limit = 20 }: GetInYardParams) => {
  const conditions = [eq(schema.parkingEntries.status, 'IN')];

  if (vehicleType && vehicleType !== 'all') {
    conditions.push(eq(schema.parkingEntries.vehicleType, vehicleType));
  }

  const offset = (page - 1) * limit;

  return await db
    .select()
    .from(schema.parkingEntries)
    .where(and(...conditions))
    .orderBy(desc(schema.parkingEntries.entryTime))
    .limit(limit)
    .offset(offset);
};
