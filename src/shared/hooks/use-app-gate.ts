import { ROUTES } from '@/shared/constants/routes.const'
import { useAppStore } from '@/shared/features/app'
import { useSelector } from '@xstate/react'
import { useRootNavigationState, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'

/**
 * Gate: activation → staff-login → open-shift → (tab)|gate
 * Không còn select-role / select-staff / passcode.
 */
export function useAppGate() {
  const appService = useAppStore((s) => s.appService)
  const stateValue = useSelector(appService ?? undefined, (s) => s?.value)
  const router = useRouter()
  const segments = useSegments()
  const rootNavigationState = useRootNavigationState()

  const segment0 = segments[0]
  const segment1 = segments[1]

  useEffect(() => {
    if (!rootNavigationState?.key) return
    if (!appService) return

    const inTabGroup = segment0 === '(tab)'
    const inGate = segment0 === 'gate'

    switch (stateValue) {
      case 'deviceInactive':
        if (segment1 !== 'device-activation') {
          router.replace(ROUTES.DEVICE_ACTIVATION.path())
        }
        break
      case 'deviceLockedByServer':
        if (segment1 !== 'device-locked') {
          router.replace(ROUTES.DEVICE_LOCKED.path())
        }
        break
      case 'unauthenticated':
        if (segment1 !== 'staff-login') {
          router.replace(ROUTES.STAFF_LOGIN.path())
        }
        break
      case 'noShift': {
        const emp = appService.getSnapshot().context.employee
        if (segment1 !== 'open-shift') {
          if (emp) {
            router.replace(
              ROUTES.OPEN_SHIFT.path({
                staffId: emp.id,
                name: emp.displayName,
                role: emp.role,
              }),
            )
          } else {
            router.replace(ROUTES.STAFF_LOGIN.path())
          }
        }
        break
      }
      case 'shiftOpen':
        if (!inTabGroup && !inGate) router.replace(ROUTES.HOME.path())
        break
      default:
        break
    }
  }, [stateValue, segment0, segment1, rootNavigationState?.key, appService, router])
}
