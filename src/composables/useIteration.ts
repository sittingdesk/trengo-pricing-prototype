import { ref } from 'vue'
import { iterations } from '@/data/iterations'

/**
 * Which prototype iteration is being viewed (bottom-left switcher).
 * Opens on the LATEST iteration by default — adding a new entry to
 * `src/data/iterations.ts` automatically makes it the landing view.
 * Module-level singleton so the control and the page share it.
 */
const current = ref(iterations[iterations.length - 1].id)

export function useIteration() {
  return { current }
}
