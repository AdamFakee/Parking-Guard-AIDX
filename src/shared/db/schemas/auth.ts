import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { generateUUID } from '../../lib/utils'

export const staff = sqliteTable('staff', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()), // UUID
  name: text('name').notNull(),
  pinHash: text('pin_hash').notNull(),
  role: text('role', { enum: ['admin', 'staff'] }).notNull(),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
})
