import { db } from '@/shared/db'; // Cần import instance của db thật ở đây
import * as schema from '@/shared/db/schemas';
import { useAuthStore } from '@/shared/store';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth.api';

type LoginPayload = Parameters<typeof login>[0];

export function useLogin() {
  const { mutateAsync: loginMutation, isPending, error } = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: async (res) => {
      if(!res.auth) return;

      useAuthStore.getState().login(res.auth);

      const data = res.data;
      if (!data) return;

      try {
        await db.transaction(async (tx) => {
          if (data.systemConfig) {
            await tx.insert(schema.systemConfigs)
              .values({ id: 1, ...data.systemConfig })
              .onConflictDoUpdate({ target: schema.systemConfigs.id, set: data.systemConfig });
          }

          if (data.pricingRules && data.pricingRules.length > 0) {
            await tx.delete(schema.pricingRules);
            await tx.insert(schema.pricingRules).values(data.pricingRules);
          }

          if (data.staffList && data.staffList.length > 0) {
            await tx.delete(schema.staff);
            await tx.insert(schema.staff).values(data.staffList);
          }
        });
      } catch (dbError) {
        console.error('Failed to save data to local DB:', dbError);
      }
    },
    onError: (err) => {
      console.error('Login failed:', err);
    },
  });

  return { mutateAsync: loginMutation, isPending, error };
}
