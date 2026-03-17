import * as schema from '@/shared/db/schemas';
import { InferSelectModel } from 'drizzle-orm';

export type TVehicleType = 'motorbike' | 'car' | 'ebike';

export type TParkingEntry = InferSelectModel<typeof schema.parkingEntries>;
export type TSystemConfig = InferSelectModel<typeof schema.systemConfigs>;
export type TPricingRule = InferSelectModel<typeof schema.pricingRules>;

export type TPricingResult = {
  duration: string;
  fee: number;
  surcharge: number;
  total: number;
};
