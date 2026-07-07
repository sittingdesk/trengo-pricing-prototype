<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Icon from '@/components/Icon.vue'
import BillingToggle from '@/components/pricing/BillingToggle.vue'
import PlanCard from '@/components/pricing/PlanCard.vue'
import BoostResolutionCard from '@/components/pricing/BoostResolutionCard.vue'
import AddOnsModal from '@/components/pricing/AddOnsModal.vue'
import SalesDialog from '@/components/pricing/SalesDialog.vue'
import EnterpriseBand from '@/components/pricing/EnterpriseBand.vue'
import { plans, trial, type Plan } from '@/data/plans'
import { account } from '@/data/account'
import { usePricingFlow } from '@/composables/usePricingFlow'
import { useIteration } from '@/composables/useIteration'

const { state, enterResolution, closeResolution } = usePricingFlow()
const boostHasBlockers = computed(() => state.blockers.some((b) => !b.disabled))
const byId = (id: Plan['id']) => plans.find((p) => p.id === id)!
const boostPlan = computed(() => byId('boost'))

// Iteration 1 = current 3 columns (Boost/Pro/Enterprise).
// Iteration 2 = 4 plans: Start/Boost/Pro columns + Enterprise as a band.
const { current: iteration } = useIteration()
const isV2 = computed(() => iteration.value === 2)
const columnPlans = computed(() =>
  isV2.value
    ? [byId('start'), byId('boost'), byId('pro')]
    : [byId('boost'), byId('pro'), byId('enterprise')],
)
const bandPlan = computed(() => (isV2.value ? byId('enterprise') : null))

// Dialogs — Boost and Pro both use the Add-ons modal (with their own prices).
const addOnsOpen = ref(false)
const addOnsPlan = ref<Plan>(boostPlan.value)
const salesOpen = ref(false)

function openAddOns(plan: Plan) {
  addOnsPlan.value = plan
  addOnsOpen.value = true
}

function onChoose(plan: Plan) {
  if (!plan.activatable) {
    salesOpen.value = true // Enterprise → sales handoff, never Chargebee
    return
  }
  if (plan.id === 'boost') {
    // Blocked → resolution view; clear → straight to the Add-ons modal.
    if (boostHasBlockers.value) enterResolution()
    else openAddOns(plan)
    return
  }
  openAddOns(plan) // Pro → same modal, Pro prices
}
</script>

<template>
  <TooltipProvider :delay-duration="150">
    <div class="min-h-screen bg-background">
      <!-- Sticky frosted header (§7.2 pattern) -->
      <header class="sticky top-0 z-10 bg-background/80 backdrop-blur-[12px]">
        <div class="mx-auto flex max-w-[868px] items-center justify-between gap-3 px-6 py-6">
          <div class="flex min-w-0 items-center gap-3">
            <h1 class="text-ds-h3 text-grey-900">Choose a plan</h1>
            <Tooltip>
              <TooltipTrigger as-child>
                <span
                  class="inline-flex shrink-0 items-center gap-1 rounded-full bg-purple-200 px-2 py-1 text-purple-800"
                >
                  <Icon name="arrow-up-circle" :size="16" />
                  <span class="text-ds-xs font-semibold">
                    {{ trial.daysLeft }} day{{ trial.daysLeft === 1 ? '' : 's' }} left
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent>Free trial ends {{ trial.endsOn }}</TooltipContent>
            </Tooltip>
          </div>
          <BillingToggle v-model="state.period" />
        </div>
      </header>

      <div class="mx-auto flex max-w-[868px] flex-col gap-4 px-6 pb-12">
        <!-- Plan cards (Boost slot swaps to the resolution view) -->
        <div class="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
          <template v-for="plan in columnPlans" :key="plan.id">
            <Transition name="card-fade" mode="out-in">
              <BoostResolutionCard
                v-if="plan.id === 'boost' && state.boostResolving"
                @close="closeResolution"
                @choose="openAddOns(boostPlan)"
              />
              <PlanCard v-else :plan="plan" :period="state.period" @choose="onChoose" />
            </Transition>
          </template>
        </div>

        <!-- Iteration 2: Custom/Enterprise as a full-width band -->
        <EnterpriseBand v-if="bandPlan" :plan="bandPlan" @contact="salesOpen = true" />

        <!-- Inline banner -->
        <div class="flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
          <Icon name="info" :size="24" class="shrink-0 text-grey-700" />
          <p class="flex-1 text-ds-sm text-grey-800">
            Want a more detailed list of all the features and capabilities per plan?
          </p>
          <Button variant="outline">
            View all functionalities
            <Icon name="arrow-up-right" :size="20" />
          </Button>
        </div>
      </div>

      <!-- Floating help button -->
      <button
        type="button"
        aria-label="Help"
        class="fixed bottom-4 right-4 rounded-pill border border-grey-400 bg-card p-3 text-grey-700 shadow-100 transition-colors hover:bg-grey-200"
      >
        <Icon name="help-circle" :size="24" />
      </button>

      <AddOnsModal
        v-model:open="addOnsOpen"
        :plan="addOnsPlan"
        :period="state.period"
        :account="account"
      />
      <SalesDialog v-model:open="salesOpen" />
    </div>
  </TooltipProvider>
</template>

<style scoped>
/* Subtle cross-fade between the Boost front and resolution views (spec §4).
   Opacity-only, so it already respects prefers-reduced-motion. */
.card-fade-enter-active,
.card-fade-leave-active {
  transition: opacity 0.18s ease;
}
.card-fade-enter-from,
.card-fade-leave-to {
  opacity: 0;
}
</style>
