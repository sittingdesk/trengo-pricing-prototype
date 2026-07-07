<script setup lang="ts">
import { computed } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Icon from '@/components/Icon.vue'
import { iterations } from '@/data/iterations'
import { useIteration } from '@/composables/useIteration'

// Prototype-only version switcher (bottom-left).
const { current: currentId } = useIteration()
const currentLabel = computed(
  () => iterations.find((i) => i.id === currentId.value)?.label ?? '',
)
</script>

<template>
  <div class="fixed bottom-4 left-4 z-20">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="flex items-center gap-2 rounded-pill border border-grey-400 bg-card px-3 py-2 text-ds-sm text-grey-700 shadow-100 transition-colors hover:bg-grey-200"
        >
          <Icon name="layers" :size="16" class="text-grey-600" />
          {{ currentLabel }}
          <Icon name="chevron-down" :size="16" class="text-grey-600" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" class="w-52">
        <DropdownMenuLabel class="text-ds-xs text-grey-600">
          Prototype iteration
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          v-for="it in iterations"
          :key="it.id"
          class="justify-between"
          @select="currentId = it.id"
        >
          {{ it.label }}
          <Icon
            v-if="currentId === it.id"
            name="check"
            :size="16"
            class="text-leaf-500"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
