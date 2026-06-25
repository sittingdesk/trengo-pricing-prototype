<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="text-ds-title">Talk to sales</DialogTitle>
        <DialogDescription class="text-ds-sm text-grey-600">
          Enterprise plans are tailored to your team — custom pricing for seats,
          conversations and channels. Our team will reach out to set you up.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button class="w-full" @click="open = false">Request a call</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
