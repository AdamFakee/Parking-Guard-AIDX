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

/** 1 row / loại xe — giá sáng, tối, qua ngày (null = sáng+tối). */
export const pricingRules = sqliteTable('pricing_rules', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => generateUUID()),
  vehicleType: text('vehicle_type', { enum: ['motorbike', 'car', 'ebike'] })
    .notNull()
    .unique(),
  dayPrice: integer('day_price').notNull(),
  nightPrice: integer('night_price').notNull(),
  /** null → fallback dayPrice + nightPrice */
  crossDayPrice: integer('cross_day_price'),
})
