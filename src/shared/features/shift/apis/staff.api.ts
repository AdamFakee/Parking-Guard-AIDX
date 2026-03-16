import { db } from '@/shared/db';
import * as schema from '@/shared/db/schemas';
import { eq } from 'drizzle-orm';

export const getAllStaff = async (role: 'admin' | 'staff') => {
  return await db.select().from(schema.staff).where(eq(schema.staff.role, role));
};

export const verifyStaffPin = async ({ staffId, passcode }: { staffId: string; passcode: string }) => {
  const [targetStaff] = await db
    .select()
    .from(schema.staff)
    .where(eq(schema.staff.id, staffId))
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