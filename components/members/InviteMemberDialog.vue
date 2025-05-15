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
            :class="{'border-red-500 focus:ring-red-500': !!validationError}"
            @blur="validateEmail"
          />
          <!-- Validation Error Message -->
          <p v-if="validationError" class="text-sm text-red-500 mt-1">
            {{ validationError }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" @click="$emit('close')" :disabled="isSubmitting">
            Cancel
          </Button>
          <Button type="submit" :disabled="isSubmitting || !!validationError">
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
     default: true
  }
})

const emit = defineEmits(['close', 'submit'])

const email = ref('')
const isSubmitting = ref(false)
const validationError = ref('') // New ref for validation errors

// Email validation function
const validateEmail = () => {
  // Reset validation error
  validationError.value = ''
  
  // Validate email if it's not empty
  if (email.value) {
    // Simple regex for basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.value)) {
      validationError.value = 'Please enter a valid email address'
    }
  } else {
    validationError.value = 'Email is required'
  }
}

// Watch for email changes to clear validation errors when user is typing
watch(email, () => {
  if (validationError.value) {
    // Clear validation error only if they've started typing
    // But keep it if the field is completely empty
    if (email.value) {
      validationError.value = ''
    }
  }
})

async function handleSubmit() {
  console.log("[InviteMemberDialog] handleSubmit called. Email:", email.value);
  
  // Validate the email before submission
  validateEmail()
  
  // Prevent submission if validation fails
  if (validationError.value || isSubmitting.value) return
  
  isSubmitting.value = true
  try {
    console.log("[InviteMemberDialog] Emitting submit event with email:", email.value);
    // Emit and let the parent handle the API call and potential errors
    emit('submit', email.value)
    // Parent component will control closing or showing errors based on API result
  } catch (error) {
    // This catch block might not be necessary if all error handling is in parent
    console.error("Local submission error in dialog (should ideally be caught by parent):", error)
  } finally {
    isSubmitting.value = false
  }
}

// Function to handle closing the dialog
function handleClose() {
  emit('close');
}
</script> 