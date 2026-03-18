import { relations } from 'drizzle-orm';
import { staff } from './auth';
import { shifts } from './shift';
import { parkingEntries, nfcCards, lostCardReports, monthlySubscriptions } from './gate';

// Quan hệ: 1 Nhân viên có thể mở nhiều Ca trực
export const staffRelations = relations(staff, ({ many }) => ({
  shifts: many(shifts),
}));

// Quan hệ: 1 Ca trực thuộc về 1 NV, và có chứa nhiều Lượt gửi xe
export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  staff: one(staff, {
    fields: [shifts.staffId],
    references: [staff.id],
  }),
  entries: many(parkingEntries),
}));

// --- QUAN HỆ CỔNG ---
export const parkingEntriesRelations = relations(parkingEntries, ({ one }) => ({
  entryShift: one(shifts, {
    fields: [parkingEntries.entryShiftId],
    references: [shifts.id],
    relationName: 'entry_shift',
  }),
  exitShift: one(shifts, {
    fields: [parkingEntries.exitShiftId],
    references: [shifts.id],
    relationName: 'exit_shift',
  }),
  card: one(nfcCards, {
    fields: [parkingEntries.cardUid],
    references: [nfcCards.uid],
  }),
  lostReport: one(lostCardReports, {
    fields: [parkingEntries.id],
    references: [lostCardReports.entryId],
  }),
}));

export const monthlySubscriptionsRelations = relations(monthlySubscriptions, ({ one }) => ({
  card: one(nfcCards, {
    fields: [monthlySubscriptions.cardUid],
    references: [nfcCards.uid],
  }),
}));