import { relations } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { generateUUID } from '../../lib/utils'
import { shifts } from './shift'

// --- THẺ NFC ---
export const nfcCards = sqliteTable('nfc_cards', {
  uid: text('uid').primaryKey(),
  cardType: text('card_type', { enum: ['luot', 'thang'] }).notNull(),
  status: text('status', { enum: ['free', 'using', 'active', 'locked'] }).notNull(),
  registeredPlate: text('registered_plate'),
  expirationDate: integer('expiration_date', { mode: 'timestamp_ms' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
})

// --- GIAO DỊCH XE RA VÀO ---
export const parkingEntries = sqliteTable(
  'parking_entries',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateUUID()),
    shiftId: text('shift_id')
      .notNull()
      .references(() => shifts.id),
    cardUid: text('card_uid').references(() => nfcCards.uid),
    vehicleType: text('vehicle_type', { enum: ['motorbike', 'car', 'ebike'] }).notNull(),

    // VÀO
    entryTime: integer('entry_time', { mode: 'timestamp_ms' }).notNull(),
    photoIn1: text('photo_in_1').notNull(),
    photoIn2: text('photo_in_2').notNull(),
    plateText: text('plate_text').notNull(),
    plateConfidence: real('plate_confidence'),
    manualInputIn: integer('manual_input_in', { mode: 'boolean' }).default(false),

    // RA
    exitTime: integer('exit_time', { mode: 'timestamp_ms' }),
    photoOut1: text('photo_out_1'),
    photoOut2: text('photo_out_2'),
    exitPlate: text('exit_plate'),
    plateMatch: integer('plate_match', { mode: 'boolean' }),
    mismatchReason: text('mismatch_reason'),
    manualInputOut: integer('manual_input_out', { mode: 'boolean' }).default(false),

    // THANH TOÁN
    feeAmount: integer('fee_amount').default(0),
    paymentMethod: text('payment_method', { enum: ['cash', 'qr_transfer', 'monthly'] }),
    status: text('status', { enum: ['IN', 'OUT', 'VOID'] }).notNull(),
    voidReason: text('void_reason'),
    isLostCard: integer('is_lost_card', { mode: 'boolean' }).default(false),
    synced: integer('synced', { mode: 'boolean' }).default(false),
  },
  (table) => ({
    plateIdx: index('idx_plate').on(table.plateText),
    statusIdx: index('idx_status').on(table.status),
    cardStatusIdx: index('idx_card_status').on(table.cardUid, table.status),
  }),
)

// --- BIÊN BẢN MẤT THẺ ---
export const lostCardReports = sqliteTable('lost_card_reports', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  entryId: text('entry_id')
    .notNull()
    .unique()
    .references(() => parkingEntries.id),
  reportedPlate: text('reported_plate').notNull(),
  compensationFee: integer('compensation_fee').notNull(),
  photoVehicle: text('photo_vehicle').notNull(),
  photoPerson: text('photo_person').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }),
  synced: integer('synced', { mode: 'boolean' }).default(false),
})

// --- QUAN HỆ (RELATIONS) ---
export const parkingEntriesRelations = relations(parkingEntries, ({ one }) => ({
  shift: one(shifts, {
    fields: [parkingEntries.shiftId],
    references: [shifts.id],
  }),
  card: one(nfcCards, {
    fields: [parkingEntries.cardUid],
    references: [nfcCards.uid],
  }),
  lostReport: one(lostCardReports, {
    fields: [parkingEntries.id],
    references: [lostCardReports.entryId],
  }),
}))
