<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Icon from '@/components/Icon.vue'
import { usePricingFlow } from '@/composables/usePricingFlow'

const emit = defineEmits<{ close: []; choose: [] }>()
const { state } = usePricingFlow()

const blockers = computed(() => state.blockers)
const total = computed(() => state.blockers.length)
const allCleared = computed(() => state.blockers.every((b) => b.disabled))
const rechecking = ref(false)

// Re-check re-queries the backend and ticks items off one by one (the admin
// has switched them off in Settings); when all clear, we reach the Ready state.
function recheck() {
  if (rechecking.value || allCleared.value) return
  rechecking.value = true
  const pending = state.blockers.filter((b) => !b.disabled)
  pending.forEach((blocker, i) => {
    window.setTimeout(
      () => {
        blocker.disabled = true
        updateShadows()
        if (i === pending.length - 1) rechecking.value = false
      },
      (i + 1) * 200,
    )
  })
}

// Scroll shadows hint that there's more content above/below the fold.
const scrollEl = ref<HTMLElement | null>(null)
const atTop = ref(true)
const atBottom = ref(false)
function updateShadows() {
  const el = scrollEl.value
  if (!el) return
  atTop.value = el.scrollTop <= 1
  atBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
}
onMounted(() => {
  nextTick(updateShadows)
  window.setTimeout(updateShadows, 150)
})
</script>

<template>
  <!-- Fixed-size card; height tuned so the 5th row is split (reveals "more"). -->
  <div class="flex max-h-[548px] flex-col rounded-lg border border-grey-400 bg-grey-200">
    <!-- Header -->
    <div class="flex flex-col gap-2 px-4 py-5">
      <div class="flex items-center justify-between gap-2">
        <p class="text-ds-base text-grey-900">
          {{ allCleared ? "You're set for Boost" : 'Not in Boost' }}
        </p>
        <button
          type="button"
          aria-label="Close"
          class="flex size-8 shrink-0 items-center justify-center rounded-pill border border-grey-400 bg-card text-grey-700 transition-colors hover:bg-grey-200"
          @click="emit('close')"
        >
          <Icon name="x" :size="20" />
        </button>
      </div>
      <p class="text-ds-sm text-grey-700">
        {{
          allCleared
            ? "Everything that wasn't in Boost is switched off. Add any extras next."
            : 'Switch these off where shown to subscribe to Boost.'
        }}
      </p>
    </div>

    <Separator class="bg-grey-400" />

    <!-- Entire list area scrolls as one region between the dividers; the
         label scrolls with the rows and content fades out under each divider. -->
    <div class="relative min-h-0 flex-1">
      <div
        ref="scrollEl"
        class="scroll-thin h-full overflow-y-auto px-4"
        @scroll="updateShadows"
      >
        <div class="flex flex-col gap-3 py-5">
          <div class="flex items-center justify-between">
            <p class="text-ds-xs font-semibold text-grey-600">Disable to continue</p>
            <p class="text-ds-xs text-grey-600">{{ total }} items</p>
          </div>
          <ul class="flex flex-col gap-3">
            <li
              v-for="b in blockers"
              :key="b.id"
              class="flex items-center gap-2"
              :aria-label="`${b.name}, found in ${b.path}`"
            >
              <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="text-ds-sm-emphasis text-grey-900">{{ b.name }}</span>
                <span class="text-ds-xs text-grey-600" aria-hidden="true">{{ b.path }}</span>
              </div>
              <span
                v-if="b.disabled"
                class="grid size-5 shrink-0 place-items-center rounded-full bg-leaf-500 text-white"
              >
                <Icon name="check" :size="16" class="size-3.5" />
              </span>
            </li>
          </ul>
        </div>
      </div>
      <!-- Edge fades sit flush at the dividers; content dissolves into the bg -->
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-grey-200 to-transparent transition-opacity duration-150"
        :class="atTop ? 'opacity-0' : 'opacity-100'"
      />
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-grey-200 to-transparent transition-opacity duration-150"
        :class="atBottom ? 'opacity-0' : 'opacity-100'"
      />
    </div>

    <Separator class="bg-grey-400" />

    <!-- Footer -->
    <div class="p-5">
      <Button v-if="allCleared" class="w-full" @click="emit('choose')">Choose Boost</Button>
      <Button
        v-else
        variant="outline"
        class="w-full"
        :disabled="rechecking"
        @click="recheck"
      >
        {{ rechecking ? 'Re-checking…' : 'Re-check eligibility' }}
      </Button>
    </div>
  </div>
</template>
