import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncTime: (time: Date) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncTime: null,
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
}));
