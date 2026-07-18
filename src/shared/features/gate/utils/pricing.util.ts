import { differenceInCalendarDays, differenceInMinutes } from 'date-fns'
import {
  DAY_START_HOUR,
  DEFAULT_FLAT_PRICES,
  NIGHT_START_HOUR,
} from '../const/parking.const'
import {
  TParkingEntry,
  TPricingResult,
  TPricingRule,
  TSystemConfig,
  TVehicleType,
} from '../types'

export type ExitBand = 'day' | 'night'

export function getExitBand(at: Date = new Date()): ExitBand {
  const h = at.getHours()
  return h >= DAY_START_HOUR && h < NIGHT_START_HOUR ? 'day' : 'night'
}

export function getFlatPrices(
  rules: TPricingRule[] | null | undefined,
  vehicleType: TVehicleType,
): { dayPrice: number; nightPrice: number; crossDayPrice: number | null } {
  const row = rules?.find((r) => r.vehicleType === vehicleType)
  if (row) {
    return {
      dayPrice: row.dayPrice,
      nightPrice: row.nightPrice,
      crossDayPrice: row.crossDayPrice ?? null,
    }
  }
  const fb = DEFAULT_FLAT_PRICES.find((d) => d.vehicleType === vehicleType)
  return {
    dayPrice: fb?.dayPrice ?? 5000,
    nightPrice: fb?.nightPrice ?? 5000,
    crossDayPrice: fb?.crossDayPrice ?? null,
  }
}

function formatDuration(minutes: number): string {
  const days = Math.floor(minutes / (24 * 60))
  const hours = Math.floor((minutes % (24 * 60)) / 60)
  const remainingMinutes = minutes % 60
  if (days > 0) return `${days} ngày ${hours} giờ ${remainingMinutes} phút`
  if (hours > 0) return `${hours} giờ ${remainingMinutes} phút`
  return `${minutes} phút`
}

/**
 * Giá phẳng 2 khung + qua ngày.
 * - Cùng ngày: theo giờ ra (6–18 sáng, còn lại tối)
 * - Qua ngày: (crossDayPrice ?? day+night) × calendarDayDiff
 */
export const calculateParkingPricing = (
  entry: TParkingEntry | null,
  sysConfig?: TSystemConfig | null,
  pricingRules?: TPricingRule[] | null,
  isLostCard: boolean = false,
  isMonthly: boolean = false,
  exitAt: Date = new Date(),
): TPricingResult => {
  if (!entry) return { duration: '0 phút', fee: 0, surcharge: 0, total: 0 }

  const minutes = Math.max(0, differenceInMinutes(exitAt, entry.entryTime))
  const duration = formatDuration(minutes)

  let fee = 0

  if (!isMonthly) {
    const freeMinutes = sysConfig?.freeMinutes ?? 15
    if (minutes < freeMinutes) {
      fee = 0
    } else {
      const { dayPrice, nightPrice, crossDayPrice } = getFlatPrices(
        pricingRules,
        entry.vehicleType,
      )
      const dayDiff = differenceInCalendarDays(exitAt, entry.entryTime)

      if (dayDiff <= 0) {
        fee = getExitBand(exitAt) === 'day' ? dayPrice : nightPrice
      } else {
        const perCross = crossDayPrice ?? dayPrice + nightPrice
        fee = perCross * dayDiff
      }
    }
  }

  const surcharge = isLostCard ? sysConfig?.lostCardFee || 50000 : 0

  return {
    duration,
    fee,
    surcharge,
    total: fee + surcharge,
  }
}

export const checkPlateMatch = (
  entryPlate?: string | null,
  outPlate?: string | null,
): boolean => {
  if (!entryPlate || !outPlate) return false
  return (
    entryPlate.replace(/[^A-Z0-9]/gi, '') === outPlate.replace(/[^A-Z0-9]/gi, '')
  )
}

/** Self-check — chạy 1 lần khi load module (dev). */
function assertPricing() {
  const entry = (t: string, v: TVehicleType = 'motorbike') =>
    ({
      entryTime: new Date(t),
      vehicleType: v,
    }) as TParkingEntry

  const rules: TPricingRule[] = [
    {
      id: 'm',
      vehicleType: 'motorbike',
      dayPrice: 5000,
      nightPrice: 7000,
      crossDayPrice: null,
    },
    {
      id: 'c',
      vehicleType: 'car',
      dayPrice: 20000,
      nightPrice: 25000,
      crossDayPrice: 30000,
    },
  ]
  const cfg = { freeMinutes: 15, lostCardFee: 50000 } as TSystemConfig

  const run = (ein: string, eout: string, v: TVehicleType = 'motorbike') =>
    calculateParkingPricing(entry(ein, v), cfg, rules, false, false, new Date(eout))

  // free
  if (run('2026-07-18T10:00:00', '2026-07-18T10:10:00').fee !== 0) {
    throw new Error('pricing: free minutes')
  }
  // same day day band
  if (run('2026-07-18T10:00:00', '2026-07-18T12:00:00').fee !== 5000) {
    throw new Error('pricing: same-day day')
  }
  // same day night band (exit 20h)
  if (run('2026-07-18T10:00:00', '2026-07-18T20:00:00').fee !== 7000) {
    throw new Error('pricing: same-day night')
  }
  // cross 1 day, null cross → day+night
  if (run('2026-07-18T10:00:00', '2026-07-19T20:00:00').fee !== 12000) {
    throw new Error('pricing: cross null')
  }
  // cross set
  if (run('2026-07-18T10:00:00', '2026-07-19T12:00:00', 'car').fee !== 30000) {
    throw new Error('pricing: cross set')
  }
  // cross 2 days
  if (run('2026-07-18T10:00:00', '2026-07-20T12:00:00', 'car').fee !== 60000) {
    throw new Error('pricing: cross 2d')
  }
}

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  try {
    assertPricing()
  } catch (e) {
    console.error('[pricing.util] self-check failed', e)
  }
}
