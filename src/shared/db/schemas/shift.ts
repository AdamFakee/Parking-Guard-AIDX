import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { generateUUID } from '../../lib/utils'
import { staff } from './auth'
import { parkingEntries } from './gate'

export const shifts = sqliteTable('shifts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  staffId: text('staff_id')
    .notNull()
    .references(() => staff.id),
  startTime: integer('start_time', { mode: 'timestamp_ms' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp_ms' }),

  openingCash: integer('opening_cash').notNull(),
  cashRevenue: integer('cash_revenue').default(0),
  qrRevenue: integer('qr_revenue').default(0),

  expectedCash: integer('expected_cash'),
  actualCash: integer('actual_cash'),
  discrepancyReason: text('discrepancy_reason'),

  status: text('status', { enum: ['open', 'closed'] }).default('open'),
  synced: integer('synced', { mode: 'boolean' }).default(false),
})

// Quan hệ: 1 Ca trực thuộc về 1 NV, và có chứa nhiều Lượt gửi xe
export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  staff: one(staff, {
    fields: [shifts.staffId],
    references: [staff.id],
  }),
  entries: many(parkingEntries),
}))
