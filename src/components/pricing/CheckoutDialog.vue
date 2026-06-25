<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Icon from '@/components/Icon.vue'
import type { Account } from '@/data/account'
import type { BillingPeriod, Plan } from '@/data/plans'
import { priceBreakdown } from '@/lib/pricing'

const props = defineProps<{ plan: Plan | null; period: BillingPeriod; account: Account }>()
const open = defineModel<boolean>('open', { required: true })

const processing = ref(false)
const done = ref(false)

// Reset the checkout state each time the dialog (re)opens.
watch(open, (isOpen) => {
  if (isOpen) {
    processing.value = false
    done.value = false
  }
})

const breakdown = computed(() =>
  props.plan ? priceBreakdown(props.plan, props.period, props.account) : null,
)
const periodLabel = computed(() => (props.period === 'annually' ? 'annually' : 'monthly'))

function subscribe() {
  processing.value = true
  // Simulates the Chargebee round-trip.
  window.setTimeout(() => {
    processing.value = false
    done.value = true
  }, 1500)
}

// Closing on backdrop / Esc is blocked only while processing (spec §6).
function guardClose(event: Event) {
  if (processing.value) event.preventDefault()
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="!processing && !done"
      class="sm:max-w-md"
      @interact-outside="guardClose"
      @escape-key-down="guardClose"
    >
      <!-- Success -->
      <template v-if="done">
        <div class="flex flex-col items-center gap-3 py-4 text-center">
          <span class="grid size-12 place-items-center rounded-full bg-leaf-100 text-leaf-500">
            <Icon name="check" :size="32" />
          </span>
          <DialogHeader class="items-center">
            <DialogTitle class="text-ds-title">You're on {{ plan?.name }}</DialogTitle>
            <DialogDescription class="text-ds-sm text-grey-600">
              Your subscription is active. A receipt is on its way.
            </DialogDescription>
          </DialogHeader>
          <Button class="mt-2 w-full" @click="open = false">Done</Button>
        </div>
      </template>

      <!-- Checkout breakdown -->
      <template v-else-if="breakdown">
        <DialogHeader>
          <DialogTitle class="text-ds-title">Subscribe to {{ plan?.name }}</DialogTitle>
          <DialogDescription class="text-ds-sm text-grey-600">
            Billed {{ periodLabel }} via Chargebee. Here's your total.
          </DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-2">
          <div class="flex items-baseline justify-between text-ds-sm text-grey-700">
            <span>{{ plan?.name }} plan</span>
            <span>€{{ breakdown.base }}/mo</span>
          </div>
          <div
            v-if="breakdown.extraSeats > 0"
            class="flex items-baseline justify-between text-ds-sm text-grey-700"
          >
            <span>{{ breakdown.extraSeats }} add-on seats (€{{ breakdown.seatUnit }}/mo each)</span>
            <span>€{{ breakdown.seatCost }}/mo</span>
          </div>
          <div
            v-if="breakdown.conversationOverage > 0"
            class="flex items-baseline justify-between text-ds-sm text-grey-700"
          >
            <span>Conversation overage</span>
            <span>€{{ breakdown.conversationOverage }}/mo</span>
          </div>
          <Separator class="my-1" />
          <div class="flex items-baseline justify-between">
            <span class="text-ds-sm-emphasis text-grey-900">Total</span>
            <span class="text-ds-base text-grey-900">€{{ breakdown.total }}/mo</span>
          </div>
        </div>

        <Button class="w-full" :disabled="processing" @click="subscribe">
          <span
            v-if="processing"
            class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {{ processing ? 'Processing…' : `Subscribe · €${breakdown.total}/mo` }}
        </Button>
      </template>
    </DialogContent>
  </Dialog>
</template>
