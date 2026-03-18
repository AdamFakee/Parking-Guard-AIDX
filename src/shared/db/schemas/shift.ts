import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { generateUUID } from '../../lib/utils'
import { staff } from './auth'

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
