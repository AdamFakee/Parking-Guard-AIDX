import { differenceInMinutes } from 'date-fns';
import { TParkingEntry, TPricingResult, TPricingRule, TSystemConfig } from '../types';

export const calculateParkingPricing = (
  entry: TParkingEntry | null,
  sysConfig?: TSystemConfig | null,
  pricingRules?: TPricingRule[] | null,
  isLostCard: boolean = false,
  isMonthly: boolean = false
): TPricingResult => {
  if (!entry) return { duration: '0 phút', fee: 0, surcharge: 0, total: 0 };
  
  const minutes = differenceInMinutes(new Date(), entry.entryTime);
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const remainingMinutes = minutes % 60;
  
  let durationStr = '';
  if (days > 0) {
    durationStr = `${days} ngày ${hours} giờ ${remainingMinutes} phút`;
  } else if (hours > 0) {
    durationStr = `${hours} giờ ${remainingMinutes} phút`;
  } else {
    durationStr = `${minutes} phút`;
  }
  
  let baseFee = 0;
  
  if (!isMonthly) {
    if (pricingRules && pricingRules.length > 0) {
      // Find matching rule for daytime/vehicleType as base logic
      const rule = pricingRules.find(r => r.vehicleType === entry.vehicleType && r.timeType === 'daytime') 
                || pricingRules.find(r => r.vehicleType === entry.vehicleType);
                
      if (rule) {
        const totalHours = Math.ceil(minutes / 60);
        let calculatedFee = 0;
        
        // Simple fee calculation ignoring overnight for now if not strictly configured 
        // Real logic could be much more complex day/night splitting
        if (totalHours <= rule.firstHours) {
          calculatedFee = rule.firstPrice;
        } else {
          const extraHours = totalHours - rule.firstHours;
          calculatedFee = rule.firstPrice + (extraHours * rule.extraPerHour);
        }
        
        // Apply max per day if configured
        if (rule.maxPerDay && calculatedFee > rule.maxPerDay && days === 0) {
          calculatedFee = rule.maxPerDay;
        } else if (rule.maxPerDay && days > 0) {
          calculatedFee = rule.maxPerDay * days + Math.min(rule.maxPerDay, rule.firstPrice + (hours - rule.firstHours > 0 ? (hours - rule.firstHours) * rule.extraPerHour : 0));
        }
        baseFee = calculatedFee;
      }
    } else {
      // Fallback
      baseFee = entry.vehicleType === 'car' ? 20000 : 5000;
    }
    
    // Check if under free minutes
    if (sysConfig?.freeMinutes && minutes < sysConfig.freeMinutes) {
      baseFee = 0;
    }
  }
  
  const lostCardFee = sysConfig?.lostCardFee || 50000;
  const surcharge = isLostCard ? lostCardFee : 0;
  
  return {
    duration: durationStr,
    fee: baseFee,
    surcharge,
    total: baseFee + surcharge
  };
};

export const checkPlateMatch = (entryPlate?: string | null, outPlate?: string | null): boolean => {
  if (!entryPlate || !outPlate) return false;
  return entryPlate.replace(/[^A-Z0-9]/gi, '') === outPlate.replace(/[^A-Z0-9]/gi, '');
};
