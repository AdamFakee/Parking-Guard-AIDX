import { create } from 'zustand';

export type GateSessionMode = 'in' | 'out';

export type GateSession = {
  mode: GateSessionMode;
  /** Có thẻ NFC; optional khi noCard */
  tagUid?: string;
  /** Bấm Xe vào/ra trên Dashboard — không quẹt thẻ */
  noCard?: boolean;
};

/**
 * Handoff Dashboard → scan-plate.
 * Không phụ thuộc Expo Router params (hay delay / mất).
 */
type State = {
  session: GateSession | null;
  setSession: (s: GateSession) => void;
  clearSession: () => void;
  peek: () => GateSession | null;
};

export const useGateSessionStore = create<State>((set, get) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
  peek: () => get().session,
}));
