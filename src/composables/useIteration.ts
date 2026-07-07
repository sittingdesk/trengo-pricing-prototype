import { ref } from 'vue'

/**
 * Which prototype iteration is being viewed (bottom-left switcher).
 * 1 = current 3-plan layout · 2 = 4-plan layout (Start/Boost/Pro + Custom band).
 * Module-level singleton so the control and the page share it.
 */
const current = ref(1)

export function useIteration() {
  return { current }
}
