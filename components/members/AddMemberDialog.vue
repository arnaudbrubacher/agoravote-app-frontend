<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Member</DialogTitle>
        <DialogDescription>
          Invite someone to join this group
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Email Input -->
        <div>
          <Label for="email">Email Address</Label>
          <Input 
            id="email"
            v-model="formData.email"
            type="email" 
            placeholder="member@example.com" 
            required
          />
        </div>
        
        <!-- Member Role -->
        <div>
          <Label for="role">Role</Label>
          <Select id="role" v-model="formData.role">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" @click="$emit('close')">
            Cancel
          </Button>
          <Button type="submit">
            Add Member
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
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  email: '',
  role: 'member'
})

function handleSubmit() {
  emit('submit', { ...formData.value })
}
</script>