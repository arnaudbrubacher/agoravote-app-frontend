<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { inject } from 'vue'

const alertDialog = inject('alertDialog') as {
  state: {
    isOpen: boolean
    options: {
      title: string
      message: string
      showCancel: boolean
      actionText: string
      cancelText: string
      onAction: (() => void) | null
      onCancel: (() => void) | null
    }
  }
}

const { state } = alertDialog

const handleAction = () => {
  if (state.options.onAction) {
    state.options.onAction()
  }
  state.isOpen = false
}

const handleCancel = () => {
  if (state.options.onCancel) {
    state.options.onCancel()
  }
  state.isOpen = false
}
</script>

<template>
  <AlertDialog :open="state.isOpen" @update:open="state.isOpen = $event" class="alert-dialog-z-override">
    <AlertDialogContent class="z-[100]">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ state.options.title }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ state.options.message }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel v-if="state.options.showCancel" @click="handleCancel">
          {{ state.options.cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction @click="handleAction">
          {{ state.options.actionText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped>
/* Override z-index for alert dialog to ensure it's above all other components */
:deep(.alert-dialog-z-override [data-state="open"]) {
  z-index: 100 !important;
}

:deep(.alert-dialog-z-override [data-portal]) {
  z-index: 100 !important;
}
</style> 