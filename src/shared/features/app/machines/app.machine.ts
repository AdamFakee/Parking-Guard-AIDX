import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { AuthAPI } from '@/shared/features/auth'
import { ShiftRemoteAPI } from '@/shared/features/shift/apis/shift.remote.api'
import { storage } from '@/shared/lib/mmkv'
import { AxiosError } from 'axios'
import { assign, fromPromise, setup } from 'xstate'
import {
  DEFAULT_APP_CONTEXT,
  type AppContext,
  type AppEvent,
} from '../types'

const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false
  return !error.response
}

export const appMachine = setup({
  types: {
    context: {} as AppContext,
    events: {} as AppEvent,
    input: {} as {
      device?: AppContext['device']
      accessToken?: AppContext['accessToken']
      employee?: AppContext['employee']
      cashSessionId?: AppContext['cashSessionId']
    },
  },
  actions: {
    saveDevice: assign(({ event }) => {
      if (event.type !== 'DEVICE_ACTIVATED') return {}
      return { device: event.device, error: null }
    }),
    saveAuth: assign(({ event, context }) => {
      if (event.type !== 'LOGIN_SUCCESS') return {}
      return {
        accessToken: event.accessToken,
        employee: event.employee,
        device: {
          ...event.device,
          // keep license fields from activation if login omits
          licenseType: event.device.licenseType ?? context.device?.licenseType ?? 'online',
          expiredAt: event.device.expiredAt ?? context.device?.expiredAt ?? event.device.expiredAt,
          lotName: event.device.lotName || context.device?.lotName || '',
        },
        error: null,
      }
    }),
    saveShift: assign(({ event }) => {
      if (event.type !== 'SHIFT_OPENED') return {}
      return { cashSessionId: event.cashSessionId, error: null }
    }),
    clearShift: assign({ cashSessionId: null }),
    clearAuth: assign(() => {
      try {
        storage.remove(REFRESH_TOKEN_KEY)
      } catch {
        /* ignore */
      }
      return { accessToken: null, employee: null }
    }),
    resetDevice: assign(() => {
      try {
        storage.remove(REFRESH_TOKEN_KEY)
      } catch {
        /* ignore */
      }
      return { ...DEFAULT_APP_CONTEXT }
    }),
  },
  actors: {
    refreshAuthFlow: fromPromise(
      async ({
        input,
      }: {
        input: {
          deviceId: string
          licenseType: 'offline' | 'online'
          refreshToken: string | null
          onTokenRotated: (newToken: string) => void
        }
      }) => {
        // Offline license: no cloud — keep MMKV employee/session
        if (input.licenseType === 'offline') {
          return {
            accessToken: null as string | null,
            employee: null as AppContext['employee'],
            cashSessionId: null as string | null,
            skipAuth: true as const,
          }
        }

        if (!input.refreshToken) {
          throw new Error('No refresh token — PIN login required')
        }

        const { accessToken, refreshToken: newRefreshToken } = await AuthAPI.refresh(
          input.refreshToken,
        )
        input.onTokenRotated(newRefreshToken)

        const employee = await AuthAPI.getMe()

        try {
          const deviceContext = await AuthAPI.getDeviceContext()
          if (!deviceContext.isActive) {
            const err = new Error('DEVICE_INACTIVE')
            ;(err as { code?: string }).code = 'DEVICE_INACTIVE'
            throw err
          }
        } catch (e: unknown) {
          if ((e as { code?: string })?.code === 'DEVICE_INACTIVE') throw e
        }

        const sessions = await ShiftRemoteAPI.getOpenSessions(input.deviceId)
        const cashSessionId = sessions.length > 0 ? sessions[0].id : null

        return { accessToken, employee, cashSessionId, skipAuth: false as const }
      },
    ),

    revalidateShiftFlow: fromPromise(
      async ({
        input,
      }: {
        input: { deviceId: string; licenseType?: string }
      }) => {
        if (input.licenseType === 'offline') {
          return { cashSessionId: null as string | null }
        }

        try {
          const deviceContext = await AuthAPI.getDeviceContext()
          if (!deviceContext.isActive) {
            const err = new Error('DEVICE_INACTIVE')
            ;(err as { code?: string }).code = 'DEVICE_INACTIVE'
            throw err
          }
        } catch (e: unknown) {
          if ((e as { code?: string })?.code === 'DEVICE_INACTIVE') throw e
        }

        const sessions = await ShiftRemoteAPI.getOpenSessions(input.deviceId)
        return { cashSessionId: sessions.length > 0 ? sessions[0].id : null }
      },
    ),
  },
  guards: {
    hasDevice: ({ context }) => context.device !== null,
    isNetworkError: ({ event }) => isNetworkError((event as { error?: unknown }).error),
    isDeviceInactive: ({ event }) =>
      (event as { error?: { code?: string } }).error?.code === 'DEVICE_INACTIVE',
    hasCachedSession: ({ context }) => context.cashSessionId !== null,
    isOfflineLicense: ({ context }) => context.device?.licenseType === 'offline',
  },
}).createMachine({
  id: 'app',
  initial: 'initializing',
  context: ({ input }) => ({
    ...DEFAULT_APP_CONTEXT,
    device: input?.device ?? null,
    accessToken: input?.accessToken ?? null,
    employee: input?.employee ?? null,
    cashSessionId: input?.cashSessionId ?? null,
  }),
  on: {
    ACCESS_TOKEN_REFRESHED: {
      actions: assign({
        accessToken: ({ event }) => event.accessToken,
      }),
    },
  },
  states: {
    initializing: {
      always: [{ guard: 'hasDevice', target: 'refreshingAuth' }, { target: 'deviceInactive' }],
    },

    refreshingAuth: {
      invoke: {
        src: 'refreshAuthFlow',
        input: ({ context }) => ({
          deviceId: context.device!.id,
          licenseType: context.device!.licenseType,
          refreshToken: storage.getString(REFRESH_TOKEN_KEY) ?? null,
          onTokenRotated: (newToken: string) => {
            try {
              storage.set(REFRESH_TOKEN_KEY, newToken)
            } catch {
              /* ignore */
            }
          },
        }),
        onDone: [
          {
            // offline + ca còn trong MMKV → vào app
            guard: ({ event, context }) =>
              event.output.skipAuth === true && context.cashSessionId != null,
            target: 'shiftOpen',
          },
          {
            // offline chưa ca → chọn NV local
            guard: ({ event }) => event.output.skipAuth === true,
            target: 'unauthenticated',
          },
          {
            guard: ({ event }) => event.output.cashSessionId !== null,
            target: 'shiftOpen',
            actions: assign({
              accessToken: ({ event }) => event.output.accessToken,
              employee: ({ event }) => event.output.employee,
              cashSessionId: ({ event }) => event.output.cashSessionId,
            }),
          },
          {
            target: 'noShift',
            actions: assign({
              accessToken: ({ event }) => event.output.accessToken,
              employee: ({ event }) => event.output.employee,
              cashSessionId: null,
            }),
          },
        ],
        onError: [
          { guard: 'isDeviceInactive', target: 'deviceLockedByServer' },
          { guard: 'isNetworkError', target: 'restoreOffline' },
          { target: 'unauthenticated', actions: 'clearAuth' },
        ],
      },
    },

    restoreOffline: {
      always: [{ guard: 'hasCachedSession', target: 'shiftOpen' }, { target: 'noShift' }],
    },

    deviceInactive: {
      on: {
        DEVICE_ACTIVATED: {
          target: 'unauthenticated',
          actions: 'saveDevice',
        },
      },
    },

    unauthenticated: {
      on: {
        LOGIN_SUCCESS: [
          {
            // Offline: không revalidate cloud — vào noShift rồi mở ca local
            guard: 'isOfflineLicense',
            target: 'noShift',
            actions: 'saveAuth',
          },
          {
            target: 'revalidatingShift',
            actions: 'saveAuth',
          },
        ],
        DEVICE_RESET: {
          target: 'deviceInactive',
          actions: 'resetDevice',
        },
      },
    },

    revalidatingShift: {
      invoke: {
        src: 'revalidateShiftFlow',
        input: ({ context }) => ({
          deviceId: context.device!.id,
          licenseType: context.device?.licenseType,
        }),
        onDone: [
          {
            guard: ({ event }) => event.output.cashSessionId !== null,
            target: 'shiftOpen',
            actions: assign({
              cashSessionId: ({ event }) => event.output.cashSessionId,
            }),
          },
          {
            target: 'noShift',
            actions: assign({ cashSessionId: null }),
          },
        ],
        onError: [
          {
            guard: ({ event }) =>
              (event as { error?: { code?: string } }).error?.code === 'DEVICE_INACTIVE',
            target: 'deviceLockedByServer',
          },
          {
            target: 'noShift',
            actions: assign({ cashSessionId: null }),
          },
        ],
      },
    },

    deviceLockedByServer: {
      on: {
        DEVICE_UNLOCKED: { target: 'refreshingAuth' },
        DEVICE_RESET: {
          target: 'deviceInactive',
          actions: 'resetDevice',
        },
      },
    },

    noShift: {
      on: {
        SHIFT_OPENED: { target: 'shiftOpen', actions: 'saveShift' },
        LOGGED_OUT: { target: 'unauthenticated', actions: 'clearAuth' },
        TOKEN_EXPIRED: { target: 'unauthenticated', actions: 'clearAuth' },
        NETWORK_RESTORED: { target: 'refreshingAuth' },
      },
    },

    shiftOpen: {
      on: {
        // Kết ca = logout → staff-login
        SHIFT_CLOSED: {
          target: 'unauthenticated',
          actions: ['clearShift', 'clearAuth'],
        },
        LOGGED_OUT: { target: 'unauthenticated', actions: ['clearShift', 'clearAuth'] },
        TOKEN_EXPIRED: { target: 'unauthenticated', actions: ['clearShift', 'clearAuth'] },
        NETWORK_RESTORED: { target: 'refreshingAuth' },
      },
    },
  },
})
