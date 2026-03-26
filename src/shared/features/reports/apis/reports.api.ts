import { db, lostCardReports, monthlySubscriptions, parkingEntries, shifts } from '@/shared/db';
import { endOfDay, startOfDay } from 'date-fns';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

export interface DailyOverview {
  revenue: {
    total: number;
    cash: number;
    qr: number;
  };
  traffic: {
    entries: number;
    exits: number;
  };
  inYard: number;
}

export const reportApis = {
  /**
   * Lấy tổng quan báo cáo trong ngày hiện tại
   */
  async getDailyOverview() {
    const today = new Date();
    const start = startOfDay(today).getTime();
    const end = endOfDay(today).getTime();

    // 1. Tổng doanh thu trong ngày (đã checkout)
    const revenueResult = await db
      .select({
        total: sql<number>`sum(${parkingEntries.feeAmount})`,
        cash: sql<number>`sum(case when ${parkingEntries.paymentMethod} = 'cash' then ${parkingEntries.feeAmount} else 0 end)`,
        qr: sql<number>`sum(case when ${parkingEntries.paymentMethod} = 'qr_transfer' then ${parkingEntries.feeAmount} else 0 end)`,
      })
      .from(parkingEntries)
      .where(
        and(
          eq(parkingEntries.status, 'OUT'),
          gte(parkingEntries.exitTime, new Date(start)),
          lte(parkingEntries.exitTime, new Date(end))
        )
      );

    // 2. Lưu lượng xe trong ngày
    const trafficResult = await db
      .select({
        entries: sql<number>`count(case when ${parkingEntries.entryTime} >= ${start} and ${parkingEntries.entryTime} <= ${end} then 1 end)`,
        exits: sql<number>`count(case when ${parkingEntries.exitTime} >= ${start} and ${parkingEntries.exitTime} <= ${end} then 1 end)`,
      })
      .from(parkingEntries);

    // 3. Xe hiện tại đang trong bãi
    const inYardResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(parkingEntries)
      .where(eq(parkingEntries.status, 'IN'));

    return {
      revenue: {
        total: revenueResult[0]?.total || 0,
        cash: revenueResult[0]?.cash || 0,
        qr: revenueResult[0]?.qr || 0,
      },
      traffic: {
        entries: trafficResult[0]?.entries || 0,
        exits: trafficResult[0]?.exits || 0,
      },
      inYard: inYardResult[0]?.count || 0,
    };
  },

  /**
   * Lấy danh sách các ca làm việc gần đây
   */
  async getShifts(limit = 20) {
    return await db.query.shifts.findMany({
      orderBy: [desc(shifts.startTime)],
      limit,
      with: {
        staff: true,
      },
    });
  },

  /**
   * Lấy chi tiết thông tin và giao dịch của một ca
   */
  async getShiftDetails(shiftId: string) {
    // 1. Thông tin ca
    const shiftInfo = await db.query.shifts.findFirst({
      where: eq(shifts.id, shiftId),
      with: {
        staff: true,
      },
    });

    if (!shiftInfo) return null;

    // 2. Danh sách xe VÀO trong ca
    const entries = await db.query.parkingEntries.findMany({
      where: eq(parkingEntries.entryShiftId, shiftId),
      orderBy: [desc(parkingEntries.entryTime)],
    });

    // 3. Danh sách xe RA trong ca
    const exits = await db.query.parkingEntries.findMany({
      where: eq(parkingEntries.exitShiftId, shiftId),
      orderBy: [desc(parkingEntries.exitTime)],
    });

    // 4. Đăng ký vé tháng trong ca
    const monthlySubs = await db.query.monthlySubscriptions.findMany({
      where: eq(monthlySubscriptions.shiftId, shiftId),
    });

    // 5. Báo cáo mất thẻ trong ca (liên kết qua entryId của giao dịch trong ca)
    const entryIds = [...entries.map(e => e.id), ...exits.map(e => e.id)];
    const lostCards = entryIds.length > 0 
      ? await db.query.lostCardReports.findMany({
          where: inArray(lostCardReports.entryId, entryIds)
        })
      : [];

    return {
      shift: shiftInfo,
      transactions: {
        entries,
        exits,
        monthlySubs,
        lostCards,
      },
    };
  },

  /**
   * Thống kê doanh thu chi tiết (có thể lọc theo thời gian)
   */
  async getRevenueReport(startDate?: Date, endDate?: Date) {
    const whereClause = [];
    if (startDate) whereClause.push(gte(parkingEntries.exitTime, startDate));
    if (endDate) whereClause.push(lte(parkingEntries.exitTime, endDate));
    whereClause.push(eq(parkingEntries.status, 'OUT'));

    return await db
      .select({
        date: sql<string>`date(${parkingEntries.exitTime} / 1000, 'unixepoch')`,
        total: sql<number>`sum(${parkingEntries.feeAmount})`,
        count: sql<number>`count(*)`,
      })
      .from(parkingEntries)
      .where(and(...whereClause))
      .groupBy(sql`date(${parkingEntries.exitTime} / 1000, 'unixepoch')`)
      .orderBy(sql`date(${parkingEntries.exitTime} / 1000, 'unixepoch') desc`);
  },
};
