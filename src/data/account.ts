/**
 * Current account usage + the features that block subscribing to Boost.
 *
 * In production these blockers are BACKEND-PROVIDED (the backend returns the
 * active features that aren't in Boost, each with the Settings path where it's
 * switched off). The frontend only renders + re-queries them.
 *
 * Per spec: rows are breadcrumb LOCATORS, not tap targets. Security
 * entitlements (SSO/2FA) are intentionally excluded (spec §11.3).
 */

export interface Blocker {
  id: string
  /** Feature name, e.g. "HubSpot · Sales pipeline". */
  name: string
  /** Where to switch it off, e.g. "Settings › Apps & Integrations". */
  path: string
}

export interface Account {
  /** Current seat count on the account. */
  users: number
  /** Monthly cost of conversation overage, if any (0 = none in this demo). */
  conversationOverage: number
  /** Features that block Boost. Seeded large to exercise the scrolling list. */
  boostBlockers: Blocker[]
  /**
   * Blockers that CANNOT be switched off from the pricing modal — they live in
   * Settings. We show the breadcrumb locator only (no link); the admin toggles
   * them in Settings and returns (Iteration 3 resume flow).
   */
  settingsBlockers: Blocker[]
}

export const account: Account = {
  users: 25,
  conversationOverage: 0,
  boostBlockers: [
    { id: 'hubspot', name: 'HubSpot · Sales pipeline', path: 'Settings › Integrations' },
    { id: 'salesforce', name: 'Salesforce · Lead sync', path: 'Settings › Integrations' },
    { id: 'pipedrive', name: 'Pipedrive · Deals', path: 'Settings › Integrations' },
    { id: 'zendesk', name: 'Zendesk · Tickets', path: 'Settings › Integrations' },
    { id: 'booking-expert', name: 'Booking Expert · Reservations', path: 'Settings › Integrations' },
    { id: 'shopify', name: 'Shopify · Orders', path: 'Settings › Integrations' },
    { id: 'mailchimp', name: 'Mailchimp · Audiences', path: 'Settings › Integrations' },
  ],
  // Boost includes 1 voice channel; this account has 2 — the extra one can only
  // be removed in Settings, not from the modal.
  settingsBlockers: [
    { id: 'voice-channel', name: 'Voice channel', path: 'Settings › Channels › Voice' },
    { id: 'voice-31620342584', name: 'Voice (+31620342584)', path: 'Settings › Channels › Voice' },
  ],
}
