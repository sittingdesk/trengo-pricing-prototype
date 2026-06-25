/**
 * Pricing page content — "Choose a plan" (Figma 15972:30707 / 15999:31297).
 * Data is isolated here (never inlined in components).
 *
 * Pricing is V2 per the iteration-3 build spec §9. NOTE: the spec corrects a
 * copy bug — seat add-ons are €30 (Boost) / €50 (Pro); €18 is the *conversation*
 * add-on (see additionalConversation), not the seat price.
 */

export type BillingPeriod = 'monthly' | 'annually'

export interface PlanFeature {
  label: string
  /** First "Everything in X +" line is emphasised (grey-800 semibold). */
  emphasized?: boolean
}

export interface PeriodPrice {
  monthly: number
  annually: number
}

export interface Plan {
  id: 'boost' | 'pro' | 'enterprise'
  name: string
  /** Base price per month; null on each period for custom (Enterprise). */
  base: { monthly: number | null; annually: number | null }
  customLabel?: string
  /** Seats included in the base; null for custom. */
  includedUsers: number | null
  /** Conversations included per month; null for custom. */
  includedConversations: number | null
  /** Per-extra-seat price; null for custom. */
  additionalSeat: PeriodPrice | null
  /** Italic seat line under the price. */
  seatNote: string
  /** Suffix after the price (e.g. "/month"). Empty for custom plans. */
  priceSuffix: string
  /** Static detail line for custom plans; computed for the rest. */
  detail?: string
  features: PlanFeature[]
  cta: { label: string; variant: 'default' | 'outline' }
  /** Highlighted ("recommended") plan — elevated with shadow-500. */
  featured?: boolean
  /** False = not in Chargebee (Enterprise → sales handoff). */
  activatable: boolean
}

export const ANNUAL_SAVINGS_LABEL = '(save 20%)'

export const billingOptions: { value: BillingPeriod; label: string; note?: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annually', label: 'Annually', note: ANNUAL_SAVINGS_LABEL },
]

export const plans: Plan[] = [
  {
    id: 'boost',
    name: 'Boost',
    base: { monthly: 349, annually: 299 },
    includedUsers: 10,
    includedConversations: 500,
    additionalSeat: { monthly: 30, annually: 25 },
    seatNote: 'Incl. 10 users seats',
    priceSuffix: '/month',
    features: [
      { label: '500 conversations /month' },
      { label: 'Unified inbox' },
      { label: 'AI Agents' },
      { label: 'Role-based permissions' },
      { label: 'Website widget' },
      { label: 'Messaging support' },
    ],
    cta: { label: 'Choose Boost', variant: 'outline' },
    activatable: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    base: { monthly: 599, annually: 499 },
    includedUsers: 20,
    includedConversations: 1500,
    additionalSeat: { monthly: 50, annually: 40 },
    seatNote: 'Incl. 20 users seats',
    priceSuffix: '/month',
    features: [
      { label: 'Everything in Boost +', emphasized: true },
      { label: '1500 conversations /month' },
      { label: 'Custom integrations' },
      { label: 'External AI Actions' },
      { label: 'SSO & Mandatory 2FA' },
      { label: 'Messaging & Phone support' },
    ],
    cta: { label: 'Choose pro', variant: 'default' },
    featured: true,
    activatable: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    base: { monthly: null, annually: null },
    customLabel: 'Custom',
    includedUsers: null,
    includedConversations: null,
    additionalSeat: null,
    seatNote: 'Per user/month',
    priceSuffix: '',
    detail: 'Custom pricing for plan, seats & conversations',
    features: [
      { label: 'Everything in Pro +', emphasized: true },
      { label: 'Dedicated Success manager' },
      { label: 'Personalised onboarding' },
      { label: 'Voice calling add-on included' },
    ],
    cta: { label: 'Contact us', variant: 'outline' },
    activatable: false,
  },
]

export const trial = {
  title: 'You are on a free trial',
  description: 'Pick a plan to continue using Trengo after December 14, 2026',
  daysLeft: 1,
}
