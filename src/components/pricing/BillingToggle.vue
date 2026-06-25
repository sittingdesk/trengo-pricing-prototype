<script setup lang="ts">
import { cn } from '@/lib/utils'
import { billingOptions, type BillingPeriod } from '@/data/plans'

const model = defineModel<BillingPeriod>({ required: true })
</script>

<template>
  <!-- Segmented control — Figma node 15972:30859 -->
  <div class="flex items-center gap-0.5 rounded-lg bg-grey-200 p-0.5">
    <button
      v-for="opt in billingOptions"
      :key="opt.value"
      type="button"
      :class="
        cn(
          'flex h-8 items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-ds-sm-emphasis transition-all',
          model === opt.value
            ? 'bg-card text-grey-800 shadow-100'
            : 'text-grey-600 hover:text-grey-800',
        )
      "
      :aria-pressed="model === opt.value"
      @click="model = opt.value"
    >
      {{ opt.label }}
      <span v-if="opt.note" class="text-ds-xs text-grey-500">{{ opt.note }}</span>
    </button>
  </div>
</template>
