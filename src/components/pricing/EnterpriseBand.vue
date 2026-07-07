<script setup lang="ts">
import { Button } from '@/components/ui/button'
import type { Plan } from '@/data/plans'

// Custom/Enterprise as a full-width band (sales-led, not a priced column).
defineProps<{ plan: Plan }>()
const emit = defineEmits<{ contact: [] }>()
</script>

<template>
  <div class="flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4">
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <p class="text-ds-title text-grey-900">{{ plan.name }}</p>
      <p class="text-ds-sm text-grey-600">{{ plan.detail }}</p>
    </div>
    <Button variant="outline" class="shrink-0" @click="emit('contact')">
      {{ plan.cta.label }}
    </Button>
  </div>
</template>
