import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as schema from "../schemas";


export type Staff = InferSelectModel<typeof schema.staff>;
export type SystemConfig = InferSelectModel<typeof schema.systemConfigs>;
export type NfcCard = InferSelectModel<typeof schema.nfcCards>;
export type PricingRule = InferSelectModel<typeof schema.pricingRules>;
export type Shift = InferSelectModel<typeof schema.shifts>;
export type ParkingEntry = InferSelectModel<typeof schema.parkingEntries>;
export type LostCardReport = InferSelectModel<typeof schema.lostCardReports>;


export type NewShift = InferInsertModel<typeof schema.shifts>;
export type NewParkingEntry = InferInsertModel<typeof schema.parkingEntries>;
export type NewLostCardReport = InferInsertModel<typeof schema.lostCardReports>;