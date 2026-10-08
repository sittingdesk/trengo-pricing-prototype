import { reactive } from 'vue'
import { account, type Blocker } from '@/data/account'
import { plans, type BillingPeriod, type Plan } from '@/data/plans'
import { blockersFor } from '@/data/blockers'

/**
 * Shared state for the plan activation flows. Module-level singleton so the
 * resolution progress + billing period survive across components.
 */
interface ResolvableBlocker extends Blocker {
  disabled: boolean
}

export interface FlowState {
  period: BillingPeriod
  /** Boost card is showing the in-place resolution view (Iterations 1–2). */
  boostResolving: boolean
  /** Re-check passed — every blocker for `flowPlanId` is cleared. */
  boostPassed: boolean
  /** Plan the in-modal blocker flow (Iterations 3+) is running for. */
  flowPlanId: Plan['id'] | null
  /** Items switched off in-modal (integrations). */
  blockers: ResolvableBlocker[]
  /** Blockers only switchable in Settings (resume flow). */
  settingsBlockers: ResolvableBlocker[]
  /** User left for Settings mid-flow — the plan's card offers "Continue". */
  resumePending: boolean
  /** Effective user count; drops to a plan's ceiling once that blocker clears. */
  users: number
}

const fresh = (items: Blocker[]): ResolvableBlocker[] =>
  items.map((b) => ({ ...b, disabled: false }))

const state = reactive<FlowState>({
  period: 'monthly',
  boostResolving: false,
  boostPassed: false,
  flowPlanId: null,
  blockers: fresh(account.boostBlockers),
  settingsBlockers: fresh(account.settingsBlockers),
  resumePending: false,
  users: account.users,
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
      state.blockers = fresh(account.boostBlockers)
    },
    /** Start a fresh in-modal blocker flow for `plan` (all items active). */
    resetBlockers(plan: Plan) {
      const config = blockersFor(plan, account.users)
      state.flowPlanId = plan.id
      state.blockers = fresh(config?.inModal.items ?? [])
      state.settingsBlockers = fresh(config?.settings ?? [])
      state.users = account.users
      state.boostPassed = false
      state.resumePending = false
    },
    /**
     * Re-check re-queries entitlements. In production the backend reports what
     * is now clear; here we simulate the admin having switched everything off
     * in Settings (incl. removing users down to the plan's ceiling).
     */
    resolveAll() {
      state.blockers.forEach((b) => (b.disabled = true))
      state.settingsBlockers.forEach((b) => (b.disabled = true))
      const max = plans.find((p) => p.id === state.flowPlanId)?.maxUsers
      if (max !== undefined && state.users > max) state.users = max
      state.boostPassed = true
    },
  }
}
