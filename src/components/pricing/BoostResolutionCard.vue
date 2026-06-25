<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Icon from '@/components/Icon.vue'
import { usePricingFlow } from '@/composables/usePricingFlow'

const emit = defineEmits<{ close: []; choose: [] }>()
const { state } = usePricingFlow()

// State machine: checking (initial spinner) → blocked (list) → ready.
const checking = ref(true)
const rechecking = ref(false)
// Ids briefly showing a ✓ before they slide out of the list.
const clearing = ref<Set<string>>(new Set())

// The list only ever shows what's STILL blocking (a real re-query returns
// current blockers). Cleared items leave the list.
const activeBlockers = computed(() => state.blockers.filter((b) => !b.disabled))
const allCleared = computed(() => activeBlockers.value.length === 0)

// Choose Boost runs an eligibility check first.
onMounted(() => {
  window.setTimeout(() => {
    checking.value = false
    nextTick(updateShadows)
  }, 800)
})

// Re-check re-queries, then the now-resolved subset ticks ✓ and slides out,
// leaving only what the user still needs to switch off.
function recheck() {
  if (rechecking.value || checking.value) return
  const active = activeBlockers.value
  if (active.length === 0) return
  rechecking.value = true
  window.setTimeout(() => {
    const subset = active.slice(0, Math.max(1, Math.ceil(active.length / 2)))
    subset.forEach((b) => clearing.value.add(b.id)) // show ✓ in place
    nextTick(updateShadows)
    window.setTimeout(() => {
      subset.forEach((b) => {
        b.disabled = true // drop from the list (animates out)
        clearing.value.delete(b.id)
      })
      rechecking.value = false
      nextTick(updateShadows)
    }, 600)
  }, 800)
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
</script>

<template>
  <!-- Fixed height keeps the card stable across check → list → ready. -->
  <div class="flex h-[548px] flex-col rounded-lg border border-grey-400 bg-grey-200">
    <!-- Header: close always; heading/body once the check has run -->
    <div class="flex flex-col gap-2 px-4 py-5">
      <div class="flex items-center justify-between gap-2">
        <p v-if="!checking" class="text-ds-base text-grey-900">
          {{ allCleared ? "You're set for Boost" : 'Not in Boost' }}
        </p>
        <span v-else />
        <button
          type="button"
          aria-label="Close"
          class="flex size-8 shrink-0 items-center justify-center rounded-pill border border-grey-400 bg-card text-grey-700 transition-colors hover:bg-grey-200"
          @click="emit('close')"
        >
          <Icon name="x" :size="20" />
        </button>
      </div>
      <p v-if="!checking" class="text-ds-sm text-grey-700">
        {{
          allCleared
            ? "Everything that wasn't in Boost is switched off. Add any extras next."
            : 'Switch these off where shown to subscribe to Boost.'
        }}
      </p>
    </div>

    <Separator class="bg-grey-400" />

    <!-- Checking: eligibility spinner -->
    <div
      v-if="checking"
      class="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center"
    >
      <span
        class="size-8 animate-spin rounded-full border-2 border-grey-300 border-t-grey-900"
      />
      <p class="text-ds-sm text-grey-600">Checking eligibility…</p>
    </div>

    <!-- Blocked: only the still-active blockers, scrolling as one region -->
    <div v-else-if="!allCleared" class="relative min-h-0 flex-1">
      <div
        ref="scrollEl"
        class="scroll-thin h-full overflow-y-auto px-4"
        @scroll="updateShadows"
      >
        <div class="flex flex-col gap-3 py-5">
          <div class="flex items-center justify-between">
            <p class="text-ds-xs font-semibold text-grey-600">Disable to continue</p>
            <p class="text-ds-xs text-grey-600">{{ activeBlockers.length }} items</p>
          </div>
          <TransitionGroup tag="ul" name="row" class="flex flex-col gap-3">
            <li
              v-for="b in activeBlockers"
              :key="b.id"
              class="flex items-center gap-2"
              :aria-label="`${b.name}, found in ${b.path}`"
            >
              <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="text-ds-sm-emphasis text-grey-900">{{ b.name }}</span>
                <span class="text-ds-xs text-grey-600" aria-hidden="true">{{ b.path }}</span>
              </div>
              <span
                v-if="clearing.has(b.id)"
                class="grid size-5 shrink-0 place-items-center rounded-full bg-leaf-500 text-white"
              >
                <Icon name="check" :size="16" class="size-3.5" />
              </span>
            </li>
          </TransitionGroup>
        </div>
      </div>
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-grey-200 to-transparent transition-opacity duration-150"
        :class="atTop ? 'opacity-0' : 'opacity-100'"
      />
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-grey-200 to-transparent transition-opacity duration-150"
        :class="atBottom ? 'opacity-0' : 'opacity-100'"
      />
    </div>

    <!-- Ready: nothing left to disable -->
    <div v-else class="flex-1" />

    <template v-if="!checking">
      <Separator class="bg-grey-400" />
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
    </template>
  </div>
</template>

<style scoped>
/* Cleared rows fade/slide out; remaining rows ease up to close the gap. */
.row-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.row-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
.row-move {
  transition: transform 0.25s ease;
}
@media (prefers-reduced-motion: reduce) {
  .row-leave-active,
  .row-move {
    transition: opacity 0.2s ease;
  }
  .row-leave-to {
    transform: none;
  }
}
</style>
