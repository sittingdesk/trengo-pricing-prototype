<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
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
import type { Account } from '@/data/account'
import type { BillingPeriod, Plan } from '@/data/plans'
import { addOns, addOnUnit, defaultQuantities } from '@/data/addons'

const props = defineProps<{ plan: Plan; period: BillingPeriod; account: Account }>()
const open = defineModel<boolean>('open', { required: true })

const qty = reactive<Record<string, number>>({})
const handingOff = ref(false)
const redirected = ref(false)

// Reset quantities + checkout state each time the modal opens.
watch(open, (isOpen) => {
  if (!isOpen) return
  Object.assign(qty, defaultQuantities(props.plan, props.account))
  handingOff.value = false
  redirected.value = false
})

const base = computed(() => props.plan.base[props.period] ?? 0)

const lines = computed(() =>
  addOns
    .map((a) => {
      const count = qty[a.id] ?? 0
      const unit = addOnUnit(a, props.period)
      return { id: a.id, name: a.name, count, unit, subtotal: count * unit }
    })
    .filter((l) => l.count > 0),
)

const total = computed(
  () => base.value + lines.value.reduce((sum, l) => sum + l.subtotal, 0),
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
    <DialogContent class="sm:max-w-lg">
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
        <DialogHeader>
          <DialogTitle class="text-ds-title">Add-ons</DialogTitle>
          <DialogDescription class="text-ds-sm text-grey-600">
            Boost includes 10 users & 500 conversations/mo. Add more as you need —
            change anytime.
          </DialogDescription>
        </DialogHeader>

        <!-- Add-on rows -->
        <ul class="flex flex-col gap-3">
          <li v-for="a in addOns" :key="a.id" class="flex items-center gap-3">
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <p class="text-ds-sm-emphasis text-grey-900">{{ a.name }}</p>
              <p class="text-ds-xs text-grey-600">
                €{{ addOnUnit(a, period) }}/mo {{ a.per }} · {{ a.note }}
              </p>
            </div>
            <Stepper v-model="qty[a.id]" :label="a.name.toLowerCase()" />
          </li>
        </ul>

        <Separator />

        <!-- Live price summary -->
        <div class="flex flex-col gap-2">
          <div class="flex items-baseline justify-between text-ds-sm text-grey-700">
            <span>Boost base</span>
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
          <Separator class="my-1" />
          <div class="flex items-baseline justify-between">
            <span class="text-ds-sm-emphasis text-grey-900">Total</span>
            <span class="text-ds-base text-grey-900">€{{ total }}/mo</span>
          </div>
        </div>

        <Button class="w-full" @click="continueToCheckout">Continue to checkout</Button>
      </template>
    </DialogContent>
  </Dialog>
</template>
