<script setup lang="ts">
import { Button } from '@/components/ui/button'
import Icon from '@/components/Icon.vue'
import type { Plan } from '@/data/plans'

// Custom/Enterprise as a full-width dark banner (Figma 16017:62618).
defineProps<{ plan: Plan }>()
const emit = defineEmits<{ contact: [] }>()
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg bg-grey-900 px-4 py-3">
    <div class="flex shrink-0 items-center justify-center rounded-base bg-purple-100 p-1.5">
      <Icon name="trengo-logo" :size="24" />
    </div>
    <div class="flex min-w-0 flex-1 flex-col">
      <p class="text-ds-sm-emphasis text-white">{{ plan.name }}</p>
      <p class="text-ds-xs text-grey-400">{{ plan.detail }}</p>
    </div>
    <Button variant="outline" class="shrink-0" @click="emit('contact')">
      Contact Sales
      <Icon name="arrow-up-right" :size="20" />
    </Button>
  </div>
</template>
