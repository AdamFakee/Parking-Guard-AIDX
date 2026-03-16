import { relations } from 'drizzle-orm'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { generateUUID } from '../../lib/utils'
import { shifts } from './shift'

export const staff = sqliteTable('staff', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()), // UUID
  pinHash: text('pin_hash').notNull().unique(),
  role: text('role', { enum: ['admin', 'staff'] }).notNull(),
})

// Quan hệ: 1 Nhân viên có thể mở nhiều Ca trực
export const staffRelations = relations(staff, ({ many }) => ({
  shifts: many(shifts),
}))
