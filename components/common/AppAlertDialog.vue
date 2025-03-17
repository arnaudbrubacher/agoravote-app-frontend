<script setup lang="ts">
import { ref, watch } from 'vue'
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

interface Props {
  title?: string
  message: string
  open?: boolean
  showCancel?: boolean
  actionText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Alert',
  open: false,
  showCancel: false,
  actionText: 'OK',
  cancelText: 'Cancel'
})

const emit = defineEmits(['close', 'action', 'cancel'])

const isOpen = ref(props.open)

// Watch for changes to the open prop
watch(() => props.open, (newValue) => {
  isOpen.value = newValue
})

const handleClose = () => {
  isOpen.value = false
  emit('close')
}

const handleAction = () => {
  isOpen.value = false
  emit('action')
  emit('close')
}

const handleCancel = () => {
  isOpen.value = false
  emit('cancel')
  emit('close')
}

// Method to open the dialog programmatically
const openDialog = () => {
  isOpen.value = true
}

// Expose methods to parent components
defineExpose({
  openDialog
})
</script>

<template>
  <AlertDialog :open="isOpen" @update:open="isOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ message }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel v-if="showCancel" @click="handleCancel">
          {{ cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction @click="handleAction">
          {{ actionText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template> 