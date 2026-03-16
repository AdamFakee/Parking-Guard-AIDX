import { NfcCard, PricingRule, Staff, SystemConfig } from '@/shared/db';
import type { InferInput } from 'valibot';
import { LoginSchema } from '../schemas';

export type TLoginForm = InferInput<typeof LoginSchema>;

export interface IAuthUser {
  id: string;
  role: 'admin' | 'staff';
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  auth: Tokens;
  data?: {
    systemConfig?: Omit<SystemConfig, 'id'>;
    pricingRules?: PricingRule[];
    staffList?: Staff[];
    nfcCards?: NfcCard[];
  };
}