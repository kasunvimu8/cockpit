import { create } from 'zustand'

interface SearchUIState {
  open: boolean
  toggle: () => void
  close: () => void
}

/** Visibility of the destination search flyout, toggled from the floating search button. */
export const useSearchUIStore = create<SearchUIState>()((set) => ({
  open: false,
  toggle: () => set((state) => ({ open: !state.open })),
  close: () => set({ open: false })
}))
