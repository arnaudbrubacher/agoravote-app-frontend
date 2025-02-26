<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col">
        <header class="flex justify-between items-center p-6 border-b">
          <h2 class="text-lg font-semibold">Add Member</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <Icon name="heroicons:x-mark" class="h-4 w-4" />
          </Button>
        </header>

        <div class="p-6">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Email Input -->
            <div class="space-y-2">
              <Label for="email">Email Address</Label>
              <div>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  class="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter member's email"
                  required
                />
              </div>
            </div>

            <!-- Role Selection -->
            <div class="space-y-2">
              <Label for="role">Role</Label>
              <div>
                <select
                  id="role"
                  v-model="role"
                  class="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" @click="$emit('close')">Cancel</Button>
              <Button type="submit" :disabled="!isValidEmail">Add Member</Button>
            </div>
          </form>
        </div>

        <div class="p-6 border-t">
          <h3 class="text-sm font-medium mb-2">Add Multiple Members</h3>
          <p class="text-sm text-muted-foreground mb-4">
            To add multiple members at once, use the "Upload CSV" button on the members tab.
            The CSV file should have columns for email and role.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Icon } from '@iconify/vue'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const email = ref('')
const role = ref('member')

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

const handleSubmit = () => {
  if (!isValidEmail.value) return
  
  emit('submit', {
    email: email.value,
    role: role.value
  })
  
  // Reset form
  email.value = ''
  role.value = 'member'
}

const emit = defineEmits(['close', 'submit'])
</script>