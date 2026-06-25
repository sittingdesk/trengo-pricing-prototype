import type { BillingPeriod, Plan } from '@/data/plans'
import type { Account } from '@/data/account'

/**
 * Add-ons configurable in the Boost Add-ons modal (spec §6).
 *
 * ⚠️ PRICES ARE PLACEHOLDERS — only User Seat (€30/mo) is verified. Observer
 * Seat, Additional Conversations and Carrier Credits prices AND their billing
 * cadence are unconfirmed (spec §6/§11). Carrier Credits especially may be a
 * one-time top-up rather than /mo.
 */
export interface AddOn {
  id: string
  name: string
  /** Per-period unit price in EUR. */
  unit: { monthly: number; annually: number }
  /** Short note under the name. */
  note: string
  /** Unit label shown after the price, e.g. "each" or "per 100". */
  per: string
  /** Whether the price is a confirmed value (false = placeholder). */
  confirmed: boolean
}

export const addOns: AddOn[] = [
  {
    id: 'user-seat',
    name: 'User Seat',
    unit: { monthly: 30, annually: 25 }, // verified
    note: 'full agent seat',
    per: 'each',
    confirmed: true,
  },
  {
    id: 'observer-seat',
    name: 'Observer Seat',
    unit: { monthly: 15, annually: 15 }, // PLACEHOLDER
    note: 'view-only access',
    per: 'each',
    confirmed: false,
  },
  {
    id: 'conversations',
    name: '100 Additional Conversations',
    unit: { monthly: 18, annually: 18 }, // PLACEHOLDER
    note: 'conversation bundle',
    per: 'per 100',
    confirmed: false,
  },
  {
    id: 'carrier-credits',
    name: 'Carrier Credits',
    unit: { monthly: 25, annually: 25 }, // PLACEHOLDER — cadence unconfirmed (one-time?)
    note: 'usage top-up',
    per: 'each',
    confirmed: false,
  },
]

/** Default quantities: User Seat pre-filled to cover current users (spec §6). */
export function defaultQuantities(plan: Plan, account: Account): Record<string, number> {
  const includedUsers = plan.includedUsers ?? 0
  return {
    'user-seat': Math.max(0, account.users - includedUsers),
    'observer-seat': 0,
    conversations: 0,
    'carrier-credits': 0,
  }
}

export function addOnUnit(addOn: AddOn, period: BillingPeriod): number {
  return addOn.unit[period]
}
