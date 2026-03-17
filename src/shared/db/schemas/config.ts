import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { generateUUID } from '../../lib/utils'

export const systemConfigs = sqliteTable('system_configs', {
  id: integer('id').primaryKey(),
  lotName: text('lot_name').notNull(),
  freeMinutes: integer('free_minutes').default(15),
  lostCardFee: integer('lost_card_fee').default(50000),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  accountName: text('account_name'),
  qrImageUrl: text('qr_image_url'),
  monthlyPriceMotorbike: integer('monthly_price_motorbike').default(100000),
  monthlyPriceCar: integer('monthly_price_car').default(500000),
  monthlyPriceEbike: integer('monthly_price_ebike').default(100000),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
})

export const pricingRules = sqliteTable('pricing_rules', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  vehicleType: text('vehicle_type', { enum: ['motorbike', 'car', 'ebike'] }).notNull(),
  timeType: text('time_type', { enum: ['daytime', 'overnight'] }).notNull(),
  firstHours: integer('first_hours').notNull(),
  firstPrice: integer('first_price').notNull(),
  extraPerHour: integer('extra_per_hour').notNull(),
  maxPerDay: integer('max_per_day'),
  overnightPrice: integer('overnight_price'),
  overnightStartTime: text('overnight_start_time'),
  overnightEndTime: text('overnight_end_time'),
})
