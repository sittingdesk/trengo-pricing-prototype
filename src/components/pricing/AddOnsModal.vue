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

const props = defineProps<{ plan: Plan; period: BillingPeriod; account: Account }>()
const open = defineModel<boolean>('open', { required: true })

// Edge-fade shadows for the scrollable body (same pattern as the Boost card).
const scrollBody = useTemplateRef<HTMLElement>('scrollBody')
const { atTop, atBottom, update } = useScrollShadows(scrollBody)

const qty = reactive<Record<string, number>>({})
const enabled = reactive<Record<string, boolean>>({})
const handingOff = ref(false)
const redirected = ref(false)

// Reset quantities + feature toggles + checkout state each time the modal opens
// (incl. if it mounts already-open).
watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    Object.assign(qty, defaultQuantities(props.plan, props.account))
    featureAddOns.forEach((f) => (enabled[f.id] = false))
    handingOff.value = false
    redirected.value = false
    nextTick(update) // re-evaluate fades for the freshly-opened body
  },
  { immediate: true },
)

const base = computed(() => props.plan.base[props.period] ?? 0)

// You can't drop User Seats below the seats your current users already occupy.
const seatFloor = computed(() =>
  Math.max(0, props.account.users - (props.plan.includedUsers ?? 0)),
)
const atSeatFloor = computed(
  () => seatFloor.value > 0 && (qty['user-seat'] ?? 0) <= seatFloor.value,
)

const lines = computed(() =>
  addOns
    .map((a) => {
      const count = qty[a.id] ?? 0
      const unit = addOnUnit(a, props.period, props.plan)
      return { id: a.id, name: a.name, count, unit, subtotal: count * unit }
    })
    .filter((l) => l.count > 0),
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
            {{ plan.includedConversations }} conversations/mo. Add more as you need —
            change anytime.
          </DialogDescription>
        </DialogHeader>

        <Separator class="-mx-6" />

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
            <li v-for="a in addOns" :key="a.id" class="flex items-center gap-3">
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

        <!-- Seat floor: can't go below seats already in use -->
        <div
          v-if="atSeatFloor"
          class="flex items-center gap-2 rounded-lg bg-grey-200 p-3"
        >
          <Icon name="info" :size="20" class="shrink-0 text-grey-700" />
          <p class="text-ds-xs text-grey-700">
            You have {{ account.users }} users. {{ plan.name }} includes
            {{ plan.includedUsers }} — keep at least {{ seatFloor }} add-on seats, or
            remove users to go lower.
          </p>
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

        <Separator class="-mx-6" />

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
    </DialogContent>
  </Dialog>
</template>
