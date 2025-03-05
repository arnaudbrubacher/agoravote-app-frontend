<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/dashboard/PostDetailsDialog.vue -->
<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <div class="flex items-center justify-between">
          <DialogTitle>{{ post.title }}</DialogTitle>
          <div class="flex items-center space-x-2">
            <Button variant="outline" size="sm" @click="editMode = !editMode">
              <LucideIcon name="Pencil" size="4" class="h-4 w-4 mr-1" />
              {{ editMode ? 'Cancel' : 'Edit' }}
            </Button>
            <Button variant="destructive" size="sm" @click="confirmDelete">
              <LucideIcon name="Trash" size="4" class="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
        <DialogDescription>
          Posted {{ formattedDate }}
          <span v-if="post.isPublic" class="ml-2 text-xs px-2 py-1 bg-muted/70 rounded-full">Public</span>
        </DialogDescription>
      </DialogHeader>
      
      <div class="py-4">
        <!-- Edit Mode -->
        <form v-if="editMode" @submit.prevent="handleUpdate" class="space-y-4">
          <div>
            <Label for="edit-title">Title</Label>
            <Input id="edit-title" v-model="editForm.title" required />
          </div>
          
          <div>
            <Label for="edit-content">Content</Label>
            <Textarea 
              id="edit-content" 
              v-model="editForm.content" 
              class="min-h-[120px]" 
              required 
            />
          </div>
          
          <div class="flex items-center space-x-2">
            <Checkbox id="edit-isPublic" v-model:checked="editForm.isPublic" />
            <Label for="edit-isPublic">Make this post public</Label>
          </div>
          
          <div class="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" @click="editMode = false">
              Cancel
            </Button>
            <Button type="submit" :disabled="isSubmitting">
              <LucideIcon v-if="isSubmitting" name="RefreshCw" size="4" class="h-4 w-4 mr-2 animate-spin" />
              Save Changes
            </Button>
          </div>
        </form>
        
        <!-- View Mode -->
        <div v-else>
          <!-- Post Content -->
          <div class="prose max-w-none">
            <p>{{ post.content }}</p>
          </div>
          
          <!-- Post Attachment -->
          <div v-if="post.attachment" class="mt-4">
            <div class="border rounded p-2 inline-flex items-center">
              <LucideIcon name="File" size="5" class="h-5 w-5 mr-2 text-blue-500" />
              <a :href="post.attachment" target="_blank" class="text-blue-500 hover:underline text-sm">
                {{ getAttachmentName(post.attachment) }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import axios from '~/src/utils/axios'

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'edit', 'delete'])

// State management
const editMode = ref(false)
const isSubmitting = ref(false)
const editForm = ref({
  title: props.post.title,
  content: props.post.content,
  isPublic: props.post.isPublic
})

// Check if this post belongs to the current user
const isCurrentUsersPost = computed(() => {
  return props.post.user_id === props.currentUserId || 
         props.post.userId === props.currentUserId ||
         props.post.user?.id === props.currentUserId
})

// Formatted date for display
const formattedDate = computed(() => {
  if (!props.post.created_at) return ''
  
  const date = new Date(props.post.created_at)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
})

// Methods
function getAttachmentName(url) {
  if (!url) return 'Attachment'
  const parts = url.split('/')
  return parts[parts.length - 1]
}

async function handleUpdate() {
  isSubmitting.value = true
  
  try {
    const updatedData = {
      title: editForm.value.title,
      content: editForm.value.content,
      isPublic: editForm.value.isPublic
    }
    
    emit('edit', { ...props.post, ...updatedData })
    editMode.value = false
  } catch (error) {
    console.error('Failed to update post:', error)
    alert('Failed to update post')
  } finally {
    isSubmitting.value = false
  }
}

function confirmDelete() {
  if (confirm('Are you sure you want to delete this post?')) {
    emit('delete', props.post)
  }
}

onMounted(() => {
  // Reset form when post changes
  editForm.value = {
    title: props.post.title,
    content: props.post.content,
    isPublic: props.post.isPublic
  }

  console.log('Current User ID:', props.currentUserId);
  console.log('Post User ID:', props.post.user_id);
})
</script>