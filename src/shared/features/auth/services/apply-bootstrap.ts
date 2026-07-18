import { db } from '@/shared/db'
import * as schema from '@/shared/db/schemas'
import type { LocalBootstrap } from '../types'

/**
 * Seed local config/staff sau activate.
 * Không hard-delete staff (FK → shifts) — upsert theo id.
 */
export async function applyLocalBootstrap(data?: LocalBootstrap) {
  if (!data) return

  await db.transaction(async (tx) => {
    if (data.systemConfig) {
      await tx
        .insert(schema.systemConfigs)
        .values({ id: 1, ...data.systemConfig })
        .onConflictDoUpdate({
          target: schema.systemConfigs.id,
          set: data.systemConfig,
        })
    }

    if (data.pricingRules?.length) {
      await tx.delete(schema.pricingRules)
      await tx.insert(schema.pricingRules).values(data.pricingRules)
    }

    if (data.staffList?.length) {
      for (const s of data.staffList) {
        await tx
          .insert(schema.staff)
          .values({
            id: s.id,
            name: s.name,
            pinHash: s.pinHash,
            role: s.role,
            isDeleted: s.isDeleted ?? false,
          })
          .onConflictDoUpdate({
            target: schema.staff.id,
            set: {
              name: s.name,
              pinHash: s.pinHash,
              role: s.role,
              isDeleted: s.isDeleted ?? false,
            },
          })
      }
    }
  })
}
