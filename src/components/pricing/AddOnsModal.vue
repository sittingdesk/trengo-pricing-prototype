<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Stepper from '@/components/pricing/Stepper.vue'
import { Switch } from '@/components/ui/switch'
import Icon from '@/components/Icon.vue'
import type { Account } from '@/data/account'
import type { BillingPeriod, Plan } from '@/data/plans'
import { addOns, addOnUnit, defaultQuantities, featureAddOns } from '@/data/addons'
import { useScrollShadows } from '@/composables/useScrollShadows'
import { usePricingFlow } from '@/composables/usePricingFlow'

const props = defineProps<{
  plan: Plan
  period: BillingPeriod
  account: Account
  /** Iteration 3: open in blocker-removal mode instead of add-ons config. */
  blockerMode?: boolean
}>()
const open = defineModel<boolean>('open', { required: true })
// Success → guided handoff: parent flips blockerMode off, modal stays open.
const emit = defineEmits<{ configure: [] }>()

// Edge-fade shadows for the scrollable body (same pattern as the Boost card).
const scrollBody = useTemplateRef<HTMLElement>('scrollBody')
const { atTop, atBottom, update } = useScrollShadows(scrollBody)

const qty = reactive<Record<string, number>>({})
const enabled = reactive<Record<string, boolean>>({})
const handingOff = ref(false)
const redirected = ref(false)

// Blocker mode (Iteration 3): disable premium integrations in place, in one action.
const { state, resolveAll, resetBlockers } = usePricingFlow()
const blockerStep = ref<'list' | 'success'>('list')
const disabling = ref(false)
const checking = ref(false)

const integrationsPending = computed(() => state.blockers.some((b) => !b.disabled))
const settingsPending = computed(() => state.settingsBlockers.some((b) => !b.disabled))

// Reset state each time the modal opens (incl. if it mounts already-open) or
// when it switches mode while open (success → add-ons handoff).
watch(
  [open, () => props.blockerMode],
  () => {
    if (!open.value) return
    if (props.blockerMode) {
      blockerStep.value = 'list'
      disabling.value = false
      checking.value = false
      if (state.resumePending) {
        // Returning from Settings: keep progress, auto-verify the Settings items.
        nextTick(() => {
          update()
          autoRecheck()
        })
        return
      }
      resetBlockers() // fresh all-active list each open
    } else {
      Object.assign(qty, defaultQuantities(props.plan, props.account))
      featureAddOns.forEach((f) => (enabled[f.id] = false))
      handingOff.value = false
      redirected.value = false
    }
    nextTick(update) // re-evaluate fades for the freshly-opened body
  },
  { immediate: true },
)

// Switch every premium integration off, ticking one-by-one (mirrors the Boost
// card's recheck). The Settings-only item remains → arm the resume banner.
function disableAll() {
  if (disabling.value) return
  disabling.value = true
  const pending = state.blockers.filter((b) => !b.disabled)
  pending.forEach((blocker, i) => {
    window.setTimeout(
      () => {
        blocker.disabled = true
        update()
        if (i === pending.length - 1) {
          disabling.value = false
          if (settingsPending.value) {
            state.resumePending = true // arm the resume banner; finish in Settings
          } else {
            resolveAll()
            blockerStep.value = 'success'
          }
        }
      },
      (i + 1) * 200,
    )
  })
}

// On return from Settings: verify the Settings-only items, ticking each off
// with visible feedback, then land on success.
function autoRecheck() {
  if (checking.value) return
  const pending = state.settingsBlockers.filter((b) => !b.disabled)
  if (pending.length === 0) {
    resolveAll()
    state.resumePending = false
    blockerStep.value = 'success'
    return
  }
  checking.value = true
  pending.forEach((blocker, i) => {
    window.setTimeout(
      () => {
        blocker.disabled = true
        update()
        if (i === pending.length - 1) {
          resolveAll()
          state.resumePending = false
          checking.value = false
          blockerStep.value = 'success'
        }
      },
      500 + i * 300,
    )
  })
}

const base = computed(() => props.plan.base[props.period] ?? 0)

// Conversation quota copy follows the billing period (yearly total on annual).
const conversationsNote = computed(() => {
  const n = props.plan.includedConversations ?? 0
  return props.period === 'annually'
    ? `${(n * 12).toLocaleString('en-US')} conversations/yr`
    : `${n.toLocaleString('en-US')} conversations/mo`
})

// The stepper shows the account's actual users; seats can't drop below that
// (your current users occupy them). Billing only counts seats above the
// plan's included ones.
const seatFloor = computed(() => props.account.users)
const atSeatFloor = computed(() => (qty['user-seat'] ?? 0) <= seatFloor.value)
const includedSeats = computed(() => props.plan.includedUsers ?? 0)
const billedSeats = computed(() =>
  Math.max(0, (qty['user-seat'] ?? 0) - includedSeats.value),
)

const lines = computed(() =>
  addOns
    .map((a) => {
      const count = qty[a.id] ?? 0
      const unit = addOnUnit(a, props.period, props.plan)
      if (a.id === 'user-seat') {
        // Only seats above the included ones are billed.
        return {
          id: a.id,
          name: `${a.name} (${includedSeats.value} incl.)`,
          count,
          unit,
          billed: billedSeats.value,
          subtotal: billedSeats.value * unit,
        }
      }
      return { id: a.id, name: a.name, count, unit, billed: count, subtotal: count * unit }
    })
    .filter((l) => l.billed > 0),
)

const featureLines = computed(() =>
  featureAddOns
    .filter((f) => enabled[f.id])
    .map((f) => ({ id: f.id, name: f.name, price: f.price[props.period] })),
)

const total = computed(
  () =>
    base.value +
    lines.value.reduce((sum, l) => sum + l.subtotal, 0) +
    featureLines.value.reduce((sum, l) => sum + l.price, 0),
)

function continueToCheckout() {
  handingOff.value = true
  // Hand off to Chargebee's hosted checkout (payment completes externally).
  window.setTimeout(() => {
    redirected.value = true
  }, 1500)
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="flex max-h-[85vh] flex-col gap-0 sm:max-w-lg">
      <!-- Iteration 3: disable premium integrations in one action -->
      <template v-if="blockerMode">
        <!-- Success -->
        <div
          v-if="blockerStep === 'success'"
          class="flex flex-col items-center gap-3 py-8 text-center"
        >
          <span
            class="grid size-12 place-items-center rounded-full bg-leaf-500 text-white"
          >
            <Icon name="check" :size="24" />
          </span>
          <p class="text-ds-base text-grey-900">You're set for Boost</p>
          <p class="text-ds-sm text-grey-600">
            Everything that isn't in Boost has been switched off. Next, tailor your
            seats and add-ons.
          </p>
          <Button class="mt-2" @click="emit('configure')">Continue to add-ons</Button>
          <Button variant="ghost" @click="open = false">Back to plans</Button>
        </div>

        <!-- List: disable everything not included in Boost -->
        <template v-else>
          <DialogHeader class="pb-4">
            <DialogTitle class="text-ds-title">Not included in Boost</DialogTitle>
            <DialogDescription class="text-ds-sm text-grey-600">
              These aren't part of Boost. Switch off the premium integrations here;
              some features must be switched off in Settings.
            </DialogDescription>
          </DialogHeader>

          <Separator class="-mx-6 self-stretch data-[orientation=horizontal]:w-auto" />

          <div class="relative -mx-6 flex min-h-0 flex-1 flex-col">
            <div
              ref="scrollBody"
              class="scroll-thin min-h-0 flex-1 overflow-y-auto px-4"
              @scroll="update"
            >
              <div class="flex flex-col gap-3 py-4">
                <!-- Premium integrations: one section — header (label + scoped
                     bulk action), subtle divider, then the rows -->
                <div class="flex flex-col gap-3 rounded-lg border border-grey-300 bg-grey-200 p-3">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-ds-xs font-semibold text-grey-600">
                      Premium integrations
                      <span class="font-normal">· {{ state.blockers.length }}</span>
                    </p>
                    <Button
                      v-if="integrationsPending"
                      size="sm"
                      :disabled="disabling"
                      @click="disableAll"
                    >
                      {{ disabling ? 'Disabling…' : 'Disable all' }}
                    </Button>
                    <span v-else class="flex items-center gap-1 text-ds-xs text-grey-600">
                      <span
                        class="grid size-4 place-items-center rounded-full bg-grey-400 text-white"
                      >
                        <Icon name="check" :size="16" class="size-3" />
                      </span>
                      Disabled
                    </span>
                  </div>
                  <Separator class="-mx-3 self-stretch bg-grey-300 data-[orientation=horizontal]:w-auto" />
                  <ul class="flex flex-col gap-3">
                    <li v-for="b in state.blockers" :key="b.id" class="flex items-center gap-2">
                      <!-- Check reveals on removal; width animates so the text slides right -->
                      <span
                        class="grid shrink-0 place-items-center overflow-hidden transition-all duration-300"
                        :class="b.disabled ? 'w-4' : '-mr-2 w-0'"
                      >
                        <Icon name="check" :size="16" class="size-4 shrink-0 text-grey-400" />
                      </span>
                      <span
                        class="min-w-0 flex-1 text-ds-sm-emphasis transition-colors duration-300"
                        :class="b.disabled ? 'text-grey-400 line-through' : 'text-grey-900'"
                      >
                        {{ b.name }}
                      </span>
                    </li>
                  </ul>
                </div>

                <!-- Settings-only blockers: same section treatment — header,
                     divider, breadcrumb locator rows (no action here) -->
                <div class="flex flex-col gap-3 rounded-lg border border-grey-300 bg-grey-200 p-3">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-ds-xs font-semibold text-grey-600">
                      Switch off in Settings
                      <span class="font-normal">· {{ state.settingsBlockers.length }}</span>
                    </p>
                    <Button v-if="settingsPending" size="sm" variant="outline" :disabled="checking">
                      Go to Settings
                      <Icon name="arrow-up-right" :size="16" />
                    </Button>
                    <span v-else class="flex items-center gap-1 text-ds-xs text-grey-600">
                      <span
                        class="grid size-4 place-items-center rounded-full bg-grey-400 text-white"
                      >
                        <Icon name="check" :size="16" class="size-3" />
                      </span>
                      Disabled
                    </span>
                  </div>
                  <Separator class="-mx-3 self-stretch bg-grey-300 data-[orientation=horizontal]:w-auto" />
                  <ul class="flex flex-col gap-3">
                    <li
                      v-for="b in state.settingsBlockers"
                      :key="b.id"
                      class="flex items-center gap-2"
                    >
                      <!-- Check reveals on removal; width animates so the text slides right -->
                      <span
                        class="grid shrink-0 place-items-center overflow-hidden transition-all duration-300"
                        :class="b.disabled ? 'w-4' : '-mr-2 w-0'"
                      >
                        <Icon name="check" :size="16" class="size-4 shrink-0 text-grey-400" />
                      </span>
                      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span
                          class="text-ds-sm-emphasis transition-colors duration-300"
                          :class="b.disabled ? 'text-grey-400 line-through' : 'text-grey-900'"
                        >
                          {{ b.name }}
                        </span>
                        <span
                          class="text-ds-xs transition-colors duration-300"
                          :class="b.disabled ? 'text-grey-400 line-through' : 'text-grey-600'"
                        >
                          {{ b.path }}
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-background to-transparent transition-opacity duration-150"
              :class="atTop ? 'opacity-0' : 'opacity-100'"
            />
            <div
              class="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background to-transparent transition-opacity duration-150"
              :class="atBottom ? 'opacity-0' : 'opacity-100'"
            />
          </div>

          <Separator class="-mx-6 self-stretch data-[orientation=horizontal]:w-auto" />

          <!-- -mx-2 matches the footer to the scroll area's tighter 16px gutter -->
          <div class="-mx-2 pt-4">
            <!-- Returning from Settings → auto-verifying -->
            <div
              v-if="checking"
              class="flex items-center justify-center gap-2 py-1 text-ds-sm text-grey-700"
            >
              <span
                class="size-4 animate-spin rounded-full border-2 border-grey-300 border-t-grey-900"
              />
              Verifying your settings…
            </div>

            <!-- The Settings step + close (integrations are handled inline above) -->
            <div v-else-if="settingsPending" class="flex flex-col gap-3">
              <div class="flex items-center gap-2 rounded-lg bg-sky-200 p-3">
                <Icon name="info" :size="20" class="shrink-0 text-sky-700" />
                <p class="text-ds-xs text-sky-800">
                  Some features can't be switched off from this page. Once they're
                  switched off, continue from the Boost plan.
                </p>
              </div>
              <Button variant="outline" class="w-full" @click="open = false">Got it</Button>
            </div>
          </div>
        </template>
      </template>

      <!-- Add-ons config (Iterations 1 & 2, all plans) -->
      <template v-else>
      <!-- Chargebee handoff -->
      <template v-if="handingOff">
        <div class="flex flex-col items-center gap-3 py-8 text-center">
          <span
            v-if="!redirected"
            class="size-8 animate-spin rounded-full border-2 border-grey-300 border-t-grey-900"
          />
          <p v-if="!redirected" class="text-ds-sm text-grey-700">
            Loading Chargebee's hosted checkout…
          </p>
          <template v-else>
            <p class="text-ds-base text-grey-900">Redirected to Chargebee</p>
            <p class="text-ds-sm text-grey-600">
              Payment completes in Chargebee's hosted checkout.
            </p>
            <Button class="mt-2" variant="outline" @click="open = false">Done</Button>
          </template>
        </div>
      </template>

      <!-- Configure add-ons -->
      <template v-else>
        <DialogHeader class="pb-4">
          <DialogTitle class="text-ds-title">Add-ons</DialogTitle>
          <DialogDescription class="text-ds-sm text-grey-600">
            {{ plan.name }} includes {{ plan.includedUsers }} users &
            {{ conversationsNote }}. Add more as you need — change anytime.
          </DialogDescription>
        </DialogHeader>

        <Separator class="-mx-6 self-stretch data-[orientation=horizontal]:w-auto" />

        <!-- Body scrolls between the dividers; header + Total/CTA stay pinned -->
        <div class="relative -mx-6 flex min-h-0 flex-1 flex-col">
          <div
            ref="scrollBody"
            class="scroll-thin min-h-0 flex-1 overflow-y-auto px-6"
            @scroll="update"
          >
            <div class="flex flex-col gap-4 py-4">
        <!-- Seats & usage (quantity add-ons) -->
        <div class="flex flex-col gap-2">
          <p class="text-ds-xs font-semibold text-grey-600">Seats & usage</p>
          <ul class="flex flex-col gap-3">
            <template v-for="a in addOns" :key="a.id">
              <li class="flex items-center gap-3">
                <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p class="text-ds-sm-emphasis text-grey-900">{{ a.name }}</p>
                  <p class="text-ds-xs text-grey-600">
                    €{{ addOnUnit(a, period, plan) }}/mo {{ a.per }} · {{ a.note }}
                  </p>
                </div>
                <Stepper
                  v-model="qty[a.id]"
                  :label="a.name.toLowerCase()"
                  :min="a.id === 'user-seat' ? seatFloor : 0"
                />
              </li>
              <!-- Seat floor: explained right beneath the User Seat row -->
              <li v-if="a.id === 'user-seat' && atSeatFloor">
                <div class="flex items-center gap-2 rounded-lg bg-grey-200 p-3">
                  <Icon name="info" :size="20" class="shrink-0 text-grey-700" />
                  <p class="min-w-0 flex-1 text-ds-xs text-grey-700">
                    You have {{ account.users }} users, and {{ plan.name }} includes
                    {{ plan.includedUsers }} seats — you're billed for the
                    {{ billedSeats }} above that. Remove users to lower this.
                  </p>
                  <button
                    type="button"
                    class="flex shrink-0 items-center gap-0.5 text-ds-xs font-semibold text-grey-900 underline underline-offset-2 hover:text-grey-700"
                  >
                    Manage users
                    <Icon name="arrow-up-right" :size="16" />
                  </button>
                </div>
              </li>
            </template>
          </ul>
        </div>

        <!-- Additional features (on/off capability add-ons) -->
        <div class="flex flex-col gap-2">
          <p class="text-ds-xs font-semibold text-grey-600">Additional features</p>
          <ul class="flex flex-col gap-3">
            <li v-for="f in featureAddOns" :key="f.id" class="flex items-center gap-3">
              <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                <p class="text-ds-sm-emphasis text-grey-900">{{ f.name }}</p>
                <p class="text-ds-xs text-grey-600">
                  +€{{ f.price[period] }}/mo · {{ f.note }}
                </p>
              </div>
              <Switch v-model="enabled[f.id]" :aria-label="f.name" />
            </li>
          </ul>
        </div>
            </div>
          </div>
          <!-- Edge fades dissolve content under each divider on scroll -->
          <div
            class="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-background to-transparent transition-opacity duration-150"
            :class="atTop ? 'opacity-0' : 'opacity-100'"
          />
          <div
            class="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background to-transparent transition-opacity duration-150"
            :class="atBottom ? 'opacity-0' : 'opacity-100'"
          />
        </div>

        <Separator class="-mx-6 self-stretch data-[orientation=horizontal]:w-auto" />

        <!-- Pinned footer: live price summary + CTA -->
        <div class="flex flex-col gap-4 pt-4">
          <!-- Live price summary -->
          <div class="flex flex-col gap-2">
            <div class="flex items-baseline justify-between text-ds-sm text-grey-700">
              <span>{{ plan.name }} base</span>
            <span>€{{ base }}/mo</span>
          </div>
          <div
            v-for="l in lines"
            :key="l.id"
            class="flex items-baseline justify-between text-ds-sm text-grey-700"
          >
            <span>{{ l.count }} × {{ l.name }} (€{{ l.unit }})</span>
            <span>€{{ l.subtotal }}/mo</span>
          </div>
          <div
            v-for="l in featureLines"
            :key="l.id"
            class="flex items-baseline justify-between text-ds-sm text-grey-700"
          >
            <span>{{ l.name }}</span>
            <span>€{{ l.price }}/mo</span>
          </div>
          <Separator class="my-1" />
          <div class="flex items-baseline justify-between">
            <span class="text-ds-sm-emphasis text-grey-900">Total</span>
            <span class="text-ds-base text-grey-900">€{{ total }}/mo</span>
          </div>
          </div>

          <Button class="w-full" @click="continueToCheckout">Continue to checkout</Button>
        </div>
      </template>
      </template>
    </DialogContent>
  </Dialog>
</template>
