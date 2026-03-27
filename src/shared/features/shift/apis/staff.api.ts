import { db } from '@/shared/db';
import * as schema from '@/shared/db/schemas';
import { and, eq } from 'drizzle-orm';

export const getAllStaff = async (role?: 'admin' | 'staff', includeDeleted = false) => {
  if (role) {
    if (includeDeleted) {
      return await db.select().from(schema.staff).where(eq(schema.staff.role, role));
    }
    return await db
      .select()
      .from(schema.staff)
      .where(and(eq(schema.staff.role, role), eq(schema.staff.isDeleted, false)));
  }
  if (includeDeleted) {
    return await db.select().from(schema.staff);
  }
  return await db.select().from(schema.staff).where(eq(schema.staff.isDeleted, false));
};

export const addStaff = async (data: Omit<typeof schema.staff.$inferInsert, 'id'>) => {
  return await db.insert(schema.staff).values(data).returning();
};

export const updateStaff = async (id: string, data: Partial<Omit<typeof schema.staff.$inferInsert, 'id'>>) => {
  return await db.update(schema.staff).set(data).where(eq(schema.staff.id, id)).returning();
};

export const deleteStaff = async (id: string) => {
  return await db
    .update(schema.staff)
    .set({ isDeleted: true })
    .where(eq(schema.staff.id, id))
    .returning();
};

export const restoreStaff = async (id: string) => {
  return await db
    .update(schema.staff)
    .set({ isDeleted: false })
    .where(eq(schema.staff.id, id))
    .returning();
};

export const verifyStaffPin = async ({ staffId, passcode }: { staffId: string; passcode: string }) => {
  const [targetStaff] = await db
    .select()
    .from(schema.staff)
    .where(and(eq(schema.staff.id, staffId), eq(schema.staff.isDeleted, false)))
    .limit(1);

  if (!targetStaff) {
    throw new Error('Không tìm thấy nhân viên');
  }

  // In a real app, you would hash the passcode and compare with targetStaff.pinHash
  // For this mock/local setup, we check if they match directly
  if (targetStaff.pinHash !== passcode) {
    throw new Error('Mã PIN không chính xác');
  }

  return targetStaff;
};