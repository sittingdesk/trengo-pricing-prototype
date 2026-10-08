import { account, type Blocker } from '@/data/account'
import type { Plan } from '@/data/plans'

/**
 * Per-plan downgrade blockers for the in-modal resolution flow (Iterations 3+).
 * `inModal` items can be switched off in one action from the modal; `settings`
 * items are breadcrumb locators the admin resolves in Settings.
 */
export interface PlanBlockers {
  inModal: { label: string; items: Blocker[] }
  settings: Blocker[]
}

export function blockersFor(plan: Plan, users: number): PlanBlockers | null {
  if (plan.id === 'boost') {
    return {
      inModal: { label: 'Premium integrations', items: account.boostBlockers },
      settings: account.settingsBlockers,
    }
  }
  if (plan.id === 'base') {
    const settings = [...account.baseSettingsBlockers]
    if (plan.maxUsers !== undefined && users > plan.maxUsers) {
      settings.push({
        id: 'users-ceiling',
        name: `${users} users · ${plan.name} allows up to ${plan.maxUsers}`,
        path: 'Settings › Users',
      })
    }
    // No integrations at all on Base — the same connected integrations block it.
    return {
      inModal: { label: 'Integrations', items: account.boostBlockers },
      settings,
    }
  }
  return null
}
