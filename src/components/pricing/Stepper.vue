<script setup lang="ts">
import { Button } from '@/components/ui/button'
import Icon from '@/components/Icon.vue'

const props = withDefaults(
  defineProps<{ label: string; min?: number; max?: number }>(),
  { min: 0, max: 999 },
)
const qty = defineModel<number>({ required: true })

function dec() {
  if (qty.value > props.min) qty.value--
}
function inc() {
  if (qty.value < props.max) qty.value++
}
</script>

<template>
  <div class="flex items-center gap-2">
    <Button
      variant="outline"
      size="icon-sm"
      :aria-label="`Remove ${label}`"
      :disabled="qty <= min"
      @click="dec"
    >
      <Icon name="minus" :size="16" />
    </Button>
    <span class="w-6 text-center text-ds-sm-emphasis text-grey-900 nums-tabular" aria-live="polite">
      {{ qty }}
    </span>
    <Button
      variant="outline"
      size="icon-sm"
      :aria-label="`Add ${label}`"
      :disabled="qty >= max"
      @click="inc"
    >
      <Icon name="plus" :size="16" />
    </Button>
  </div>
</template>
