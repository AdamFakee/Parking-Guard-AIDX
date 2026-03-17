import * as v from 'valibot';

export const checkoutSchema = v.object({
  checkoutType: v.optional(v.picklist(['normal', 'virtual', 'lost'] as const)),
  reason: v.optional(v.string())
});

export type TCheckoutForm = v.InferOutput<typeof checkoutSchema>;
