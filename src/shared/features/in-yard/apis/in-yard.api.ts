import { db } from '@/shared/db';
import * as schema from '@/shared/db/schemas';
import { and, desc, eq, like } from 'drizzle-orm';
import { TVehicleType } from '../../gate';

export type GetInYardParams = {
  vehicleType?: TVehicleType | 'all';
  status?: 'IN' | 'OUT' | 'all';
  query?: string;
  page?: number;
  limit?: number;
};

export const getInYardEntries = async ({ vehicleType, status = 'IN', query, page = 1, limit = 20 }: GetInYardParams) => {
  const conditions = [];

  if (status !== 'all') {
    conditions.push(eq(schema.parkingEntries.status, status));
  }

  if (vehicleType && vehicleType !== 'all') {
    conditions.push(eq(schema.parkingEntries.vehicleType, vehicleType));
  }

  if (query && query.trim().length > 0) {
    conditions.push(like(schema.parkingEntries.plateText, `%${query.trim()}%`));
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
