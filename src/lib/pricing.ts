import type { BillingPeriod, Plan } from '@/data/plans'
import type { Account } from '@/data/account'

export interface PriceBreakdown {
  base: number
  /** Seats beyond the plan's included allowance. */
  extraSeats: number
  seatUnit: number
  seatCost: number
  conversationOverage: number
  total: number
}

/**
 * True monthly cost for a plan given account usage — base + seat overage
 * (+ conversation overage). Drives the resolution total and the checkout
 * breakdown. Custom (Enterprise) plans return null.
 */
export function priceBreakdown(
  plan: Plan,
  period: BillingPeriod,
  account: Account,
): PriceBreakdown | null {
  const base = plan.base[period]
  if (base === null || plan.includedUsers === null || plan.additionalSeat === null) {
    return null
  }
  const extraSeats = Math.max(0, account.users - plan.includedUsers)
  const seatUnit = plan.additionalSeat[period]
  const seatCost = extraSeats * seatUnit
  const conversationOverage = account.conversationOverage
  return {
    base,
    extraSeats,
    seatUnit,
    seatCost,
    conversationOverage,
    total: base + seatCost + conversationOverage,
  }
}
