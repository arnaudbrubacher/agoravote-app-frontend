<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Group Settings</DialogTitle>
        <DialogDescription>
          Manage your group settings or delete the group
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Group Name -->
        <div>
          <Label for="name">Group Name</Label>
          <Input 
            id="name"
            v-model="formData.name"
            placeholder="Group name" 
            required
            :disabled="!isCurrentUserAdmin"
          />
        </div>
        
        <!-- Group Description -->
        <div>
          <Label for="description">Description</Label>
          <Textarea 
            id="description"
            v-model="formData.description"
            placeholder="Group description"
            :disabled="!isCurrentUserAdmin"
          />
        </div>
        
        <!-- Group Privacy -->
        <div>
          <Label>Privacy Setting</Label>
          <Select 
            v-model="formData.isPublic"
            :disabled="!isCurrentUserAdmin"
          >
            <option :value="true">Public - Anyone can find this group</option>
            <option :value="false">Private - Only invited members can join</option>
          </Select>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-between pt-4">
          <div class="space-x-2">
            <Button 
              type="button" 
              variant="destructive" 
              @click="handleDelete"
              v-if="isCurrentUserAdmin"
            >
              <LucideIcon name="Trash" size="4" class="h-4 w-4 mr-2" />
              Delete Group
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              @click="handleLeave"
              v-if="!isCurrentUserAdmin"
            >
              <LucideIcon name="LogOut" size="4" class="h-4 w-4 mr-2" />
              Leave Group
            </Button>
          </div>
          
          <div class="space-x-2">
            <Button type="button" variant="outline" @click="$emit('close')">
              Cancel
            </Button>
            
            <Button type="submit" :disabled="!isCurrentUserAdmin">
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit', 'delete', 'leave'])

const formData = ref({
  name: '',
  description: '',
  isPublic: true
})

// Check if current user is admin
const isCurrentUserAdmin = computed(() => {
  return !!props.group?.currentUserIsAdmin
})

// Initialize form data
onMounted(() => {
  formData.value = {
    name: props.group.name || '',
    description: props.group.description || '',
    isPublic: props.group.isPublic ?? true
  }
})

const handleSubmit = () => {
  emit('submit', { ...formData.value })
}

const handleDelete = () => {
  emit('delete')
}

const handleLeave = () => {
  emit('leave')
}
</script>