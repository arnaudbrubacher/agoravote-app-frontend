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
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

// Props might not be needed if group context is handled by the parent
// defineProps({
//   group: {
//     type: Object,
//     required: true
//   }
// })

const emit = defineEmits(['close', 'submit'])

const email = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  console.log("[InviteMemberDialog] handleSubmit called. Email:", email.value);
  if (!email.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    // Emit the email value for the parent/composable to handle
    console.log("[InviteMemberDialog] Emitting submit event with email:", email.value);
    await emit('submit', email.value)
    // Optionally close dialog on success from parent
  } catch (error) {
    // Error should be handled in the parent/composable where the API call is made
    console.error("Submission error in dialog, should be caught by parent:", error)
    // Optionally show a generic error here, but specific errors are better handled upstream
  } finally {
    isSubmitting.value = false
  }
}
</script> 