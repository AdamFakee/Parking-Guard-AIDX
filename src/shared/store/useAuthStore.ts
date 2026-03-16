import { Tokens } from '../features/auth/types'
import { appSecureStorage } from '@/shared/utils'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface AuthData {
  tokens: Tokens | null
  isAuthenticated: boolean
}

export interface AuthState extends AuthData {
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  login: (tokens: Tokens, isAuthenticated?: boolean) => void
  logout: () => void
  setTokens: (tokens: Tokens) => void
}

const defaultState: AuthData = {
  tokens: null,
  isAuthenticated: false,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...defaultState,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      login: (tokens, isAuthenticated = true) =>
        set({
          tokens,
          isAuthenticated,
        }),

      logout: () => set({ ...defaultState }),

      setTokens: (tokens) => set({ tokens }),
    }),
    {
      name: 'AUTH_STORAGE',
      storage: createJSONStorage(() => appSecureStorage),
      partialize: (state) => ({
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
