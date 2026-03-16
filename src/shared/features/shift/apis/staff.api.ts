import { db } from '@/shared/db';
import * as schema from '@/shared/db/schemas';
import { eq } from 'drizzle-orm';

export const getAllStaff = async (role: 'admin' | 'staff') => {
  return await db.select().from(schema.staff).where(eq(schema.staff.role, role));
};