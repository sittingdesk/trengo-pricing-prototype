<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { BillingPeriod, Plan } from '@/data/plans'

const props = defineProps<{ plan: Plan; period: BillingPeriod }>()
const emit = defineEmits<{ choose: [plan: Plan] }>()

const price = computed(() => {
  const base = props.plan.base[props.period]
  return base === null ? props.plan.customLabel : `€${base}`
})

// Detail line: computed seat add-on for paid plans (fixes the €18 copy bug),
// static copy for custom plans.
const detail = computed(() =>
  props.plan.additionalSeat
    ? `Additional seats will be charged €${props.plan.additionalSeat[props.period]}/month`
    : props.plan.detail,
)
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col rounded-lg border border-border bg-card',
        plan.featured && 'shadow-500',
      )
    "
  >
    <!-- Header: name, price, seat note, detail -->
    <div class="flex flex-col gap-4 p-5">
      <div class="flex flex-col gap-2">
        <p class="text-ds-base text-grey-800">{{ plan.name }}</p>
        <p class="text-grey-800">
          <span class="text-ds-h1">{{ price }}</span>
          <span v-if="plan.priceSuffix" class="text-ds-title text-grey-600">{{
            plan.priceSuffix
          }}</span>
        </p>
        <p class="text-ds-sm italic text-grey-600">{{ plan.seatNote }}</p>
      </div>
      <p class="min-h-10 text-ds-sm text-grey-700">{{ detail }}</p>
    </div>

    <Separator />

    <!-- Feature list (grows so CTAs align across cards) -->
    <ul class="flex flex-1 flex-col gap-2 p-5">
      <li
        v-for="feature in plan.features"
        :key="feature.label"
        :class="feature.emphasized ? 'text-ds-sm-emphasis text-grey-800' : 'text-ds-sm text-grey-600'"
      >
        {{ feature.label }}
      </li>
    </ul>

    <Separator />

    <!-- CTA -->
    <div class="p-5">
      <Button :variant="plan.cta.variant" class="w-full" @click="emit('choose', plan)">
        {{ plan.cta.label }}
      </Button>
    </div>
  </div>
</template>
