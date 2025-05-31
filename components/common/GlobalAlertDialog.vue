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
import { inject, computed, watch } from 'vue'

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

console.log('[GlobalAlertDialog] Component mounted, alertDialog:', alertDialog)

const { state } = alertDialog

// Watch for state changes
watch(() => state.isOpen, (newValue, oldValue) => {
  console.log('[GlobalAlertDialog] isOpen changed from', oldValue, 'to', newValue)
  console.log('[GlobalAlertDialog] Current state:', { ...state })
}, { immediate: true })

// Process the message to handle basic formatting
const formattedMessage = computed(() => {
  let message = state.options.message
  
  // Replace markdown-style bold **text** with HTML <strong>text</strong>
  message = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // Convert line breaks to HTML
  message = message.replace(/\n/g, '<br>')
  
  return message
})

const handleAction = () => {
  console.log('[GlobalAlertDialog] handleAction called')
  if (state.options.onAction) {
    state.options.onAction()
  }
  state.isOpen = false
}

const handleCancel = () => {
  console.log('[GlobalAlertDialog] handleCancel called')
  if (state.options.onCancel) {
    state.options.onCancel()
  }
  state.isOpen = false
}
</script>

<template>
  <AlertDialog :open="state.isOpen" @update:open="state.isOpen = $event" class="alert-dialog-z-override">
    <AlertDialogContent class="z-[100] max-w-lg">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ state.options.title }}</AlertDialogTitle>
        <AlertDialogDescription class="max-h-96 overflow-y-auto">
          <div 
            v-html="formattedMessage" 
            class="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
          />
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

/* Styling for formatted content */
:deep(.formatted-message) {
  line-height: 1.6;
}

:deep(.formatted-message strong) {
  font-weight: 600;
  color: var(--foreground);
}

:deep(.formatted-message ul) {
  margin: 0.5rem 0;
  padding-left: 1rem;
}

:deep(.formatted-message li) {
  margin: 0.25rem 0;
}
</style> 