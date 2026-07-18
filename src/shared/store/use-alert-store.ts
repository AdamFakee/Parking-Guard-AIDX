import { create } from 'zustand'

export type AlertType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: AlertType
  title: string
  message: string
}

interface AlertState {
  visible: boolean
  type: AlertType
  title: string
  message: string
  isConfirm: boolean
  popupType: 'confirm' | 'info' | null
  confirmLabel: string
  cancelLabel: string
  destructive: boolean
  onConfirm?: () => void
  onCancel?: () => void

  toasts: Toast[]

  show: (params: {
    type?: AlertType
    title: string
    message: string
    duration?: number
  }) => void
  hideToast: (id: string) => void
  confirm: (params: {
    title: string
    message: string
    onConfirm: () => void
    onCancel?: () => void
    confirmLabel?: string
    cancelLabel?: string
    destructive?: boolean
  }) => void
  infoPopup: (params: {
    title: string
    message: string
    onConfirm?: () => void
    confirmLabel?: string
  }) => void
  hide: () => void
}

export const useAlertStore = create<AlertState>((set, get) => ({
  visible: false,
  type: 'info',
  title: '',
  message: '',
  isConfirm: false,
  popupType: null,
  confirmLabel: 'Xác nhận',
  cancelLabel: 'Hủy',
  destructive: false,
  onConfirm: undefined,
  onCancel: undefined,
  toasts: [],

  show: ({ type = 'info', title, message, duration = 4000 }) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { id, type, title, message }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    if (duration > 0) {
      setTimeout(() => {
        get().hideToast(id)
      }, duration)
    }
  },

  hideToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  confirm: ({
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Xác nhận',
    cancelLabel = 'Hủy',
    destructive = false,
  }) =>
    set({
      visible: true,
      type: destructive ? 'warning' : 'info',
      title,
      message,
      isConfirm: true,
      popupType: 'confirm',
      confirmLabel,
      cancelLabel,
      destructive,
      onConfirm: () => {
        set({ visible: false })
        onConfirm()
      },
      onCancel: () => {
        set({ visible: false })
        onCancel?.()
      },
    }),

  infoPopup: ({ title, message, onConfirm, confirmLabel = 'Đã hiểu' }) =>
    set({
      visible: true,
      type: 'info',
      title,
      message,
      isConfirm: true,
      popupType: 'info',
      confirmLabel,
      cancelLabel: 'Hủy',
      destructive: false,
      onConfirm: () => {
        set({ visible: false })
        onConfirm?.()
      },
      onCancel: undefined,
    }),

  hide: () => set({ visible: false }),
}))

/** Gọi mọi nơi: toast.confirm / toast.error / … */
export const toast = {
  error: (message: string, title = 'Lỗi hệ thống') =>
    useAlertStore.getState().show({ type: 'error', title, message }),
  success: (message: string, title = 'Thành công') =>
    useAlertStore.getState().show({ type: 'success', title, message }),
  warning: (message: string, title = 'Cảnh báo') =>
    useAlertStore.getState().show({ type: 'warning', title, message }),
  info: (message: string, title = 'Thông báo') =>
    useAlertStore.getState().show({ type: 'info', title, message }),
  confirm: (params: {
    title: string
    message: string
    onConfirm: () => void
    onCancel?: () => void
    confirmLabel?: string
    cancelLabel?: string
    destructive?: boolean
  }) => useAlertStore.getState().confirm(params),
  infoPopup: (params: {
    title: string
    message: string
    onConfirm?: () => void
    confirmLabel?: string
  }) => useAlertStore.getState().infoPopup(params),
}
