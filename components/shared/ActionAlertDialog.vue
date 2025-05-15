<template>
  <AlertDialog :open="isOpen" @update:open="updateOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ message }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel v-if="showCancel" @click="handleCancel">{{ cancelText }}</AlertDialogCancel>
        <AlertDialogAction @click="handleAction">{{ actionText }}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import { computed } from 'vue'
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

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Alert'
  },
  message: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: 'OK'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  showCancel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'action', 'cancel'])

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const updateOpen = (value) => {
  emit('update:open', value)
}

const handleAction = () => {
  emit('action')
  emit('update:open', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:open', false)
}
</script> 