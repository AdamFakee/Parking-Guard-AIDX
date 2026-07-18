import { db } from '@/shared/db'
import {
  lostCardReports,
  monthlySubscriptions,
  parkingEntries,
  shifts,
} from '@/shared/db/schemas'
import { Directory, Paths } from 'expo-file-system'
import { and, count, eq, inArray, isNotNull, lt, ne, or, sql } from 'drizzle-orm'

export const CLEANUP_DAY_OPTIONS = [3, 5, 7, 15, 30] as const
export type CleanupDays = (typeof CLEANUP_DAY_OPTIONS)[number]

/** Dưới ngưỡng này → UI gợi ý chưa cần dọn */
export const CLEANUP_MIN_WORTH_BYTES = 30 * 1024 * 1024 // 30 MB
export const CLEANUP_MIN_WORTH_RECORDS = 80

export type CleanupPreview = {
  days: CleanupDays
  cutoff: Date
  entries: number
  closedShifts: number
  monthly: number
  lostReports: number
  unsyncedEntries: number
  unsyncedMonthly: number
  unsyncedLost: number
  unsyncedShifts: number
}

export type CleanupResult = {
  days: CleanupDays
  deletedEntries: number
  deletedShifts: number
  deletedMonthly: number
  deletedLostReports: number
}

function cutoffMs(days: CleanupDays) {
  return Date.now() - days * 24 * 60 * 60 * 1000
}

function cutoffDate(days: CleanupDays) {
  return new Date(cutoffMs(days))
}

async function countWhere(table: any, where?: any) {
  const q = db.select({ n: count() }).from(table)
  const [row] = where ? await q.where(where) : await q
  return Number(row?.n ?? 0)
}

/**
 * Preview / purge data older than N days.
 * Keeps: IN entries (xe trong bãi), open shifts, staff/config/cards.
 * Online: surface unsynced counts so UI can warn before delete.
 */
export async function previewDataCleanup(days: CleanupDays): Promise<CleanupPreview> {
  const cutoff = cutoffDate(days)
  const oldOut = and(
    lt(parkingEntries.entryTime, cutoff),
    ne(parkingEntries.status, 'IN'),
  )
  const oldClosedShift = and(eq(shifts.status, 'closed'), lt(shifts.startTime, cutoff))
  const oldMonthly = lt(
    sql`coalesce(${monthlySubscriptions.createdAt}, ${monthlySubscriptions.startDate})`,
    cutoff,
  )
  const oldLost = and(isNotNull(lostCardReports.createdAt), lt(lostCardReports.createdAt, cutoff))

  const [
    entries,
    closedShifts,
    monthly,
    lostReports,
    unsyncedEntries,
    unsyncedMonthly,
    unsyncedLost,
    unsyncedShifts,
  ] = await Promise.all([
    countWhere(parkingEntries, oldOut),
    countWhere(shifts, oldClosedShift),
    countWhere(monthlySubscriptions, oldMonthly),
    countWhere(lostCardReports, oldLost),
    countWhere(parkingEntries, and(oldOut, eq(parkingEntries.synced, false))),
    countWhere(monthlySubscriptions, and(oldMonthly, eq(monthlySubscriptions.synced, false))),
    countWhere(lostCardReports, and(oldLost, eq(lostCardReports.synced, false))),
    countWhere(shifts, and(oldClosedShift, eq(shifts.synced, false))),
  ])

  return {
    days,
    cutoff,
    entries,
    closedShifts,
    monthly,
    lostReports,
    unsyncedEntries,
    unsyncedMonthly,
    unsyncedLost,
    unsyncedShifts,
  }
}

export function totalCleanupItems(p: CleanupPreview) {
  return p.entries + p.closedShifts + p.monthly + p.lostReports
}

export function totalUnsynced(p: CleanupPreview) {
  return p.unsyncedEntries + p.unsyncedMonthly + p.unsyncedLost + p.unsyncedShifts
}

export type StorageOverview = {
  imageBytes: number
  entryCount: number
  closedShiftCount: number
  monthlyCount: number
  lostCount: number
  totalRecords: number
  /** true nếu data đủ lớn để dọn có ý nghĩa */
  worthCleaning: boolean
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/** Dung lượng ảnh local + số bản ghi — giúp user biết có đáng dọn không. */
export async function getStorageOverview(): Promise<StorageOverview> {
  const imagesDir = new Directory(Paths.document, 'parking_images')
  const imageBytes = imagesDir.exists ? Number(imagesDir.size ?? 0) : 0

  const [entryCount, closedShiftCount, monthlyCount, lostCount] = await Promise.all([
    countWhere(parkingEntries),
    countWhere(shifts, eq(shifts.status, 'closed')),
    countWhere(monthlySubscriptions),
    countWhere(lostCardReports),
  ])

  const totalRecords = entryCount + closedShiftCount + monthlyCount + lostCount
  const worthCleaning =
    imageBytes >= CLEANUP_MIN_WORTH_BYTES || totalRecords >= CLEANUP_MIN_WORTH_RECORDS

  return {
    imageBytes,
    entryCount,
    closedShiftCount,
    monthlyCount,
    lostCount,
    totalRecords,
    worthCleaning,
  }
}

export async function runDataCleanup(days: CleanupDays): Promise<CleanupResult> {
  const cutoff = cutoffDate(days)

  // 1) Collect old OUT/VOID entry ids (never delete IN)
  const oldEntries = await db
    .select({ id: parkingEntries.id })
    .from(parkingEntries)
    .where(and(lt(parkingEntries.entryTime, cutoff), ne(parkingEntries.status, 'IN')))
  const entryIds = oldEntries.map((e) => e.id)

  let deletedLostReports = 0
  if (entryIds.length) {
    // lost reports FK → entries
    const lost = await db
      .delete(lostCardReports)
      .where(
        or(
          inArray(lostCardReports.entryId, entryIds),
          and(isNotNull(lostCardReports.createdAt), lt(lostCardReports.createdAt, cutoff)),
        ),
      )
      .returning({ id: lostCardReports.id })
    deletedLostReports = lost.length

    await db.delete(parkingEntries).where(inArray(parkingEntries.id, entryIds))
  } else {
    const lost = await db
      .delete(lostCardReports)
      .where(and(isNotNull(lostCardReports.createdAt), lt(lostCardReports.createdAt, cutoff)))
      .returning({ id: lostCardReports.id })
    deletedLostReports = lost.length
  }

  const monthly = await db
    .delete(monthlySubscriptions)
    .where(
      lt(
        sql`coalesce(${monthlySubscriptions.createdAt}, ${monthlySubscriptions.startDate})`,
        cutoff,
      ),
    )
    .returning({ id: monthlySubscriptions.id })

  // Closed shifts older than cutoff — skip if still referenced by remaining entries
  const oldShifts = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(and(eq(shifts.status, 'closed'), lt(shifts.startTime, cutoff)))

  let deletedShifts = 0
  for (const s of oldShifts) {
    const [ref] = await db
      .select({ n: count() })
      .from(parkingEntries)
      .where(or(eq(parkingEntries.entryShiftId, s.id), eq(parkingEntries.exitShiftId, s.id)))
    if (Number(ref?.n ?? 0) > 0) continue
    const [mref] = await db
      .select({ n: count() })
      .from(monthlySubscriptions)
      .where(eq(monthlySubscriptions.shiftId, s.id))
    if (Number(mref?.n ?? 0) > 0) continue
    await db.delete(shifts).where(eq(shifts.id, s.id))
    deletedShifts += 1
  }

  return {
    days,
    deletedEntries: entryIds.length,
    deletedShifts,
    deletedMonthly: monthly.length,
    deletedLostReports,
  }
}
