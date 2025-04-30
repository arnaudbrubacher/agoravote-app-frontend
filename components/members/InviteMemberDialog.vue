<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Invite Member by Email</DialogTitle>
        <DialogDescription>
          Send an email invitation to join this group. They can create an account if they don't have one.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Email Input -->
        <div>
          <Label for="invite-email">Email Address</Label>
          <Input
            id="invite-email"
            v-model="email"
            type="email"
            placeholder="member@example.com"
            required
            :disabled="isSubmitting"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" @click="$emit('close')" :disabled="isSubmitting">
            Cancel
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Sending...' : 'Send Invitation' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

// Define props including the new errorMessage
const props = defineProps({
  // group: { // Keep commented out if not used
  //   type: Object,
  //   required: true
  // },
  errorMessage: { // <-- Add prop to receive error messages
    type: String,
    default: null
  },
  open: { // <-- Assume parent controls open state
     type: Boolean,
     required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const email = ref('')
const isSubmitting = ref(false)
const internalErrorMessage = ref(props.errorMessage) // <-- Internal state for error

// Watch for external changes to errorMessage prop
watch(() => props.errorMessage, (newValue) => {
  internalErrorMessage.value = newValue
})

// Watch for dialog opening to clear previous errors and email
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    email.value = '' // Clear email field
    internalErrorMessage.value = null // Clear any previous error message
    isSubmitting.value = false // Reset submitting state
  }
})

async function handleSubmit() {
  internalErrorMessage.value = null // Clear previous error on new submission attempt
  console.log("[InviteMemberDialog] handleSubmit called. Email:", email.value);
  if (!email.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    console.log("[InviteMemberDialog] Emitting submit event with email:", email.value);
    // Emit and let the parent handle the API call and potential errors
    await emit('submit', email.value)
    // Parent component will control closing or showing errors based on API result
  } catch (error) {
    // This catch block might not be necessary if all error handling is in parent
    console.error("Local submission error in dialog (should ideally be caught by parent):", error)
    internalErrorMessage.value = 'An unexpected error occurred.' // Fallback error
  } finally {
    isSubmitting.value = false
  }
}

// Function to handle closing the dialog
function handleClose() {
  emit('close');
}
</script> 