import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { storage } from '@/shared/lib/mmkv'
import { ActorRefFrom, createActor } from 'xstate'
import { create } from 'zustand'
import { appMachine } from '../machines/app.machine'
import type { AppContext } from '../types'

const STORAGE_KEY = STORAGE_KEYS.APP_MACHINE
const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN

interface PersistedAppState {
  device: AppContext['device']
  accessToken: AppContext['accessToken']
  employee: AppContext['employee']
  cashSessionId: AppContext['cashSessionId']
}

function loadFromStorage(): PersistedAppState {
  try {
    const raw = storage.getString(STORAGE_KEY)
    if (!raw) {
      return { device: null, accessToken: null, employee: null, cashSessionId: null }
    }
    return JSON.parse(raw) as PersistedAppState
  } catch {
    return { device: null, accessToken: null, employee: null, cashSessionId: null }
  }
}

function saveToStorage(ctx: AppContext) {
  try {
    const toSave: PersistedAppState = {
      device: ctx.device,
      accessToken: ctx.accessToken,
      employee: ctx.employee,
      cashSessionId: ctx.cashSessionId,
    }
    storage.set(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    /* ignore */
  }
}

function loadRefreshToken(): string | null {
  try {
    return storage.getString(REFRESH_TOKEN_KEY) ?? null
  } catch {
    return null
  }
}

function saveRefreshToken(token: string) {
  try {
    storage.set(REFRESH_TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

function clearRefreshToken() {
  try {
    storage.remove(REFRESH_TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

interface AppStoreState {
  appService: ActorRefFrom<typeof appMachine> | null
  initApp: () => void
  destroyApp: () => void
  getRefreshToken: () => string | null
  saveRefreshToken: (token: string) => void
  clearRefreshToken: () => void
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  appService: null,

  getRefreshToken: () => loadRefreshToken(),
  saveRefreshToken: (token: string) => saveRefreshToken(token),
  clearRefreshToken: () => clearRefreshToken(),

  initApp: () => {
    if (get().appService) return

    const persisted = loadFromStorage()
    const service = createActor(appMachine, {
      input: {
        device: persisted.device,
        accessToken: persisted.accessToken,
        employee: persisted.employee,
        cashSessionId: persisted.cashSessionId,
      },
    }).start()

    service.subscribe((state) => {
      saveToStorage(state.context)
    })

    set({ appService: service })
  },

  destroyApp: () => {
    const service = get().appService
    if (service) {
      service.stop()
      set({ appService: null })
    }
  },
}))
