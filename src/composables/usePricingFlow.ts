import { reactive } from 'vue'
import { account, type Blocker } from '@/data/account'
import type { BillingPeriod } from '@/data/plans'

/**
 * Shared state for the Boost activation flow. Module-level singleton so the
 * resolution progress + billing period survive across components.
 */
interface ResolvableBlocker extends Blocker {
  disabled: boolean
}

export interface FlowState {
  period: BillingPeriod
  /** Boost card is showing the in-place resolution view. */
  boostResolving: boolean
  /** Re-check passed — show the Ready (success) state. */
  boostPassed: boolean
  /** Integrations disabled in-modal (Iterations 1–3). */
  blockers: ResolvableBlocker[]
  /** Blockers only switchable in Settings (Iteration 3 resume flow). */
  settingsBlockers: ResolvableBlocker[]
  /** Iteration 3: user left for Settings mid-flow — show the resume banner. */
  resumePending: boolean
}

function seedBlockers(): ResolvableBlocker[] {
  return account.boostBlockers.map((b) => ({ ...b, disabled: false }))
}

function seedSettings(): ResolvableBlocker[] {
  return account.settingsBlockers.map((b) => ({ ...b, disabled: false }))
}

const state = reactive<FlowState>({
  period: 'monthly',
  boostResolving: false,
  boostPassed: false,
  blockers: seedBlockers(),
  settingsBlockers: seedSettings(),
  resumePending: false,
})

export function usePricingFlow() {
  return {
    state,
    enterResolution() {
      state.boostResolving = true
      state.boostPassed = false
    },
    closeResolution() {
      state.boostResolving = false
      state.boostPassed = false
      // Re-seed so the blocked flow is replayable within the session.
      state.blockers = seedBlockers()
    },
    /** Re-seed blockers to all-active (Iteration 3 modal opens fresh each time). */
    resetBlockers() {
      state.blockers = seedBlockers()
      state.settingsBlockers = seedSettings()
      state.boostPassed = false
      state.resumePending = false
    },
    /**
     * Re-check re-queries entitlements. In production the backend reports what
     * is now clear; here we simulate the admin having switched everything off
     * in Settings, so all remaining blockers resolve and we move to Ready.
     */
    resolveAll() {
      state.blockers.forEach((b) => (b.disabled = true))
      state.settingsBlockers.forEach((b) => (b.disabled = true))
      state.boostPassed = true
    },
  }
}
