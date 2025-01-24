import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type {} from '@redux-devtools/extension' // required for devtools typing

interface PlayerState {
  fastforward: boolean
  includeExited: boolean
  resetCounter: number,
  toggleFastForward: () => void
  toggleIncludeExited: () => void
  getWebSocketLocation: (logId?: string) => string
  resetPlayers: () => void
}

export const usePlayerStore = create<PlayerState>()(
  subscribeWithSelector(devtools(
    persist(
      (set, get) => ({
        fastforward: true,
        includeExited: false,
        resetCounter: 0,
        toggleFastForward() {
            set((state) => ({fastforward: !state.fastforward}));
            get().resetPlayers()
        },
        toggleIncludeExited() {
            set((state) => {
                return {
                    includeExited: !state.includeExited,
                    fastforward: (!state.includeExited ? false : state.fastforward)
                }
            });
        },
        getWebSocketLocation(logId="") {
            let params = ""
            if (logId) {
                params = "?" + Object.keys(['fastforward', 'includeExited']).map((key) => {
                    return key + '=' + encodeURIComponent(get()[key as keyof PlayerState] as string | number | boolean);
                  }).join('&');
            }
            return `${window.location.origin.replace(/^http/, "ws")}/ws/${logId}${params}`
        },
        resetPlayers() {
          set((state) => ({resetCounter: state.resetCounter + 1}));
        }
      }),
      {
        name: 'bear-storage',
      },
    ),
  ),
));

export function extractPlayerValues({fastforward, includeExited}: PlayerState) {
  return {
    fastforward,
    includeExited
  }
}