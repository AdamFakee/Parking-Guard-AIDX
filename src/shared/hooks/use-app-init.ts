import { useAppStore } from '@/shared/features/app'
import NetInfo from '@react-native-community/netinfo'
import { useEffect, useRef } from 'react'

/**
 * Boot appMachine once. NetInfo → NETWORK_RESTORED on reconnect.
 */
export function useAppInit() {
  const wasOffline = useRef(false)

  useEffect(() => {
    useAppStore.getState().initApp()

    const unsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected
      if (!online) {
        wasOffline.current = true
        return
      }
      if (wasOffline.current) {
        wasOffline.current = false
        useAppStore.getState().appService?.send({ type: 'NETWORK_RESTORED' })
      }
    })

    return () => {
      unsub()
      useAppStore.getState().destroyApp()
    }
  }, [])
}
