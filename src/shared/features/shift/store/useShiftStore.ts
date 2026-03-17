import { appStorage } from '@/shared/utils'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface ShiftData {
  id: string
  staffId: string
  staffName: string
  openingCash: number
  startTime: string
  status: 'open' | 'closed'
  role: 'admin' | 'staff'
}

export interface ShiftState {
  currentShift: ShiftData | null
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  setCurrentShift: (shift: ShiftData | null) => void
  clearShift: () => void
}

export const useShiftStore = create<ShiftState>()(
  persist(
    (set) => ({
      currentShift: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setCurrentShift: (shift) => set({ currentShift: shift }),

      clearShift: () => set({ currentShift: null }),
    }),
    {
      name: 'SHIFT_STORAGE',
      storage: createJSONStorage(() => appStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
