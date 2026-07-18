import {
  checkNfcCardUsage,
  getActiveEntryByCard,
  getCardStatus,
  searchActiveEntries,
} from '../apis/gate.api';
import {
  TParkingEntry,
  TPricingResult,
  TPricingRule,
  TSystemConfig,
  TVehicleType,
} from '../types';
import { calculateParkingPricing, checkPlateMatch } from '../utils/pricing.util';

export type GateMode = 'in' | 'out' | 'expired';

export async function resolveCardGateMode(tagUid: string): Promise<GateMode> {
  return (await getCardStatus(tagUid)) as GateMode;
}

export type PreparedCheckIn = {
  isMonthly: boolean;
  isExpired: boolean;
  vehicleType: TVehicleType;
  suggestedPlate?: string;
  customerName?: string;
  registeredPlate?: string;
};

export async function prepareCheckIn(tagUid?: string): Promise<PreparedCheckIn> {
  const defaults: PreparedCheckIn = {
    isMonthly: false,
    isExpired: false,
    vehicleType: 'motorbike',
  };

  if (!tagUid || tagUid === 'undefined') return defaults;

  const usage = await checkNfcCardUsage(tagUid);
  if (usage.status !== 'existing' || usage.cardType !== 'thang') {
    return defaults;
  }

  return {
    isMonthly: true,
    isExpired: !!usage.isExpired,
    vehicleType: (usage.vehicleType as TVehicleType) || 'motorbike',
    suggestedPlate: usage.registeredPlate || undefined,
    customerName: usage.customerName,
    registeredPlate: usage.registeredPlate || undefined,
  };
}

export type PreparedCheckOut = {
  entry: TParkingEntry | null;
  plateMatch: boolean;
  pricing: TPricingResult;
  isMonthly: boolean;
  monthlyInfo: { customerName?: string; isExpired?: boolean } | null;
  error?: 'no_entry' | 'load_failed' | 'need_search' | 'lost_card';
  /** Khi no-card search ra nhiều / 0 kết quả */
  searchCandidates?: TParkingEntry[];
};

export async function prepareCheckOut(params: {
  tagUid?: string | null;
  outPlate?: string | null;
  sysConfig?: TSystemConfig | null;
  pricingRules?: TPricingRule[] | null;
  isLostCard?: boolean;
  /** When entry already loaded (e.g. search select) */
  entry?: TParkingEntry | null;
  /** Ra không thẻ — tìm theo biển */
  noCard?: boolean;
}): Promise<PreparedCheckOut> {
  const emptyPricing = calculateParkingPricing(null);
  let entry: TParkingEntry | null = params.entry ?? null;

  try {
    if (!entry && params.tagUid && params.tagUid !== 'undefined') {
      entry = (await getActiveEntryByCard(params.tagUid)) as TParkingEntry | null;
      if (!entry) {
        return {
          entry: null,
          plateMatch: false,
          pricing: emptyPricing,
          isMonthly: false,
          monthlyInfo: null,
          error: 'no_entry',
        };
      }
    }

    // No-card out: tìm lượt IN theo biển OCR
    if (!entry && params.noCard && params.outPlate) {
      const results = (await searchActiveEntries(params.outPlate)) as TParkingEntry[];
      if (results.length === 1) {
        const found = results[0];
        // Vào có thẻ, ra không thẻ → mất thẻ
        if (found.cardUid) {
          return {
            entry: found,
            plateMatch: checkPlateMatch(found.plateText, params.outPlate),
            pricing: emptyPricing,
            isMonthly: false,
            monthlyInfo: null,
            error: 'lost_card',
          };
        }
        entry = found;
      } else {
        return {
          entry: null,
          plateMatch: false,
          pricing: emptyPricing,
          isMonthly: false,
          monthlyInfo: null,
          error: 'need_search',
          searchCandidates: results,
        };
      }
    }

    if (!entry) {
      return {
        entry: null,
        plateMatch: false,
        pricing: emptyPricing,
        isMonthly: false,
        monthlyInfo: null,
        error: params.noCard ? 'need_search' : 'no_entry',
      };
    }

    let isMonthly = false;
    let monthlyInfo: PreparedCheckOut['monthlyInfo'] = null;
    const uidToCheck =
      params.tagUid && params.tagUid !== 'undefined'
        ? params.tagUid
        : entry?.cardUid;

    if (uidToCheck) {
      const usage = await checkNfcCardUsage(uidToCheck);
      if (usage.status === 'existing' && usage.cardType === 'thang') {
        if (usage.isExpired) {
          isMonthly = false;
          monthlyInfo = { customerName: usage.customerName, isExpired: true };
        } else {
          isMonthly = true;
          monthlyInfo = { customerName: usage.customerName, isExpired: false };
        }
      }
    }

    const plateMatch = checkPlateMatch(entry?.plateText, params.outPlate);
    const pricing = calculateParkingPricing(
      entry,
      params.sysConfig,
      params.pricingRules,
      !!params.isLostCard,
      isMonthly
    );

    return { entry, plateMatch, pricing, isMonthly, monthlyInfo };
  } catch {
    return {
      entry: null,
      plateMatch: false,
      pricing: emptyPricing,
      isMonthly: false,
      monthlyInfo: null,
      error: 'load_failed',
    };
  }
}

export function isFreeCheckout(total: number): boolean {
  return total === 0;
}
