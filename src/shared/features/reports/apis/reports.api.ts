import { db, lostCardReports, monthlySubscriptions, parkingEntries, shifts } from '@/shared/db';
import { endOfDay, startOfDay } from 'date-fns';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { ReportOverview } from '../types';

export const reportApis = {
  /**
   * Lấy tổng quan báo cáo theo khoảng thời gian
   */
  async getOverview(startDate?: Date, endDate?: Date): Promise<ReportOverview> {
    const today = new Date();
    const start = startDate ? startOfDay(startDate).getTime() : startOfDay(today).getTime();
    const end = endDate ? endOfDay(endDate).getTime() : endOfDay(today).getTime();

    // 1. Nhóm Tài chính (Finance)
    const financeResult = await db
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

    // Doanh thu thẻ tháng
    const monthlyResult = await db
      .select({
        total: sql<number>`sum(${monthlySubscriptions.price})`,
      })
      .from(monthlySubscriptions)
      .where(
        and(
          gte(monthlySubscriptions.createdAt, new Date(start)),
          lte(monthlySubscriptions.createdAt, new Date(end))
        )
      );

    // 2. Nhóm Vận hành (Traffic)
    const trafficResult = await db
      .select({
        entries: sql<number>`count(case when ${parkingEntries.entryTime} >= ${start} and ${parkingEntries.entryTime} <= ${end} then 1 end)`,
        exits: sql<number>`count(case when ${parkingEntries.exitTime} >= ${start} and ${parkingEntries.exitTime} <= ${end} then 1 end)`,
      })
      .from(parkingEntries);

    // Xe hiện tại đang trong bãi (Real-time, không phụ thuộc filter)
    const inYardResult = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(parkingEntries)
      .where(eq(parkingEntries.status, 'IN'));

    // 3. Nhóm An ninh (Security)
    const securityResult = await db
      .select({
        mismatch: sql<number>`count(case when ${parkingEntries.plateMatch} = 0 and ${parkingEntries.status} = 'OUT' then 1 end)`,
        voids: sql<number>`count(case when ${parkingEntries.status} = 'VOID' then 1 end)`,
      })
      .from(parkingEntries)
      .where(
        and(
          gte(parkingEntries.exitTime, new Date(start)),
          lte(parkingEntries.exitTime, new Date(end))
        )
      );

    const lostCardsResult = await db
      .select({
        count: sql<number>`count(*)`,
        totalFee: sql<number>`sum(${lostCardReports.compensationFee})`,
      })
      .from(lostCardReports)
      .where(
        and(
          gte(lostCardReports.createdAt, new Date(start)),
          lte(lostCardReports.createdAt, new Date(end))
        )
      );

    return {
      finance: {
        total: (financeResult[0]?.total || 0) + (monthlyResult[0]?.total || 0) + (lostCardsResult[0]?.totalFee || 0),
        cash: financeResult[0]?.cash || 0,
        qr: financeResult[0]?.qr || 0,
        monthly: monthlyResult[0]?.total || 0,
        lostCardFee: lostCardsResult[0]?.totalFee || 0,
      },
      traffic: {
        entries: trafficResult[0]?.entries || 0,
        exits: trafficResult[0]?.exits || 0,
        inYard: inYardResult[0]?.count || 0,
      },
      security: {
        mismatchCount: securityResult[0]?.mismatch || 0,
        voidCount: securityResult[0]?.voids || 0,
        lostCardsCount: lostCardsResult[0]?.count || 0,
      },
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
