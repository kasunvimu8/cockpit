import { create } from 'zustand'

const TOAST_DURATION_MS = 2400

interface ToastState {
  message: string
  visible: boolean
  show: (message: string) => void
}

let hideTimer: number | undefined

export const useToastStore = create<ToastState>()((set) => ({
  message: '',
  visible: false,
  show: (message) => {
    set({ message, visible: true })
    window.clearTimeout(hideTimer)
    hideTimer = window.setTimeout(() => set({ visible: false }), TOAST_DURATION_MS)
  }
}))
