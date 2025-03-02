<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/dashboard/PostDetailsDialog.vue -->
<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <div class="flex items-center justify-between">
          <DialogTitle>{{ post.title }}</DialogTitle>
          <div v-if="isCurrentUsersPost" class="flex items-center space-x-2">
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
              <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="h-4 w-4 mr-2 animate-spin" />
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
          
          <!-- Post Actions -->
          <div class="flex items-center space-x-4 mt-4 pt-2 border-t">
            <Button variant="outline" size="sm" @click="toggleLike">
              <Icon 
                :name="isLiked ? 'heroicons:heart-solid' : 'heroicons:heart'" 
                class="h-4 w-4 mr-1" 
                :class="{ 'text-red-500': isLiked }"
              />
              {{ post.likes?.length || 0 }} Like{{ post.likes?.length !== 1 ? 's' : '' }}
            </Button>
          </div>
          
          <!-- Comments Section -->
          <div class="mt-6">
            <h4 class="font-medium mb-2">Comments</h4>
            <div v-if="post.comments && post.comments.length > 0" class="space-y-3">
              <div v-for="comment in post.comments" :key="comment.id" class="border rounded-md p-3">
                <div class="flex justify-between">
                  <div class="font-medium">{{ comment.user?.name || 'User' }}</div>
                  <div class="text-xs text-muted-foreground">{{ formatCommentDate(comment.created_at) }}</div>
                </div>
                <p class="text-sm mt-1">{{ comment.content }}</p>
              </div>
            </div>
            <div v-else class="text-center text-muted-foreground py-2">
              No comments yet
            </div>
            
            <!-- Add Comment -->
            <form @submit.prevent="addComment" class="mt-3">
              <div class="flex space-x-2">
                <Textarea
                  v-model="newComment"
                  placeholder="Add a comment..."
                  class="min-h-[60px]"
                  required
                />
                <Button type="submit" class="self-end" :disabled="!newComment.trim()">
                  Post
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
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
const newComment = ref('')
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

// Check if post is liked by current user
const isLiked = computed(() => {
  if (!props.post.likes || !props.currentUserId) return false
  return props.post.likes.some(like => 
    like.user_id === props.currentUserId || 
    like.userId === props.currentUserId ||
    like === props.currentUserId
  )
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

function formatCommentDate(dateStr) {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
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

async function toggleLike() {
  try {
    await axios.post(`/posts/${props.post.id}/like`)
    
    // We'll let the parent component handle the update by refetching
    // Or you can implement optimistic UI updates here
  } catch (error) {
    console.error('Failed to toggle like:', error)
  }
}

async function addComment() {
  if (!newComment.value.trim()) return
  
  try {
    await axios.post(`/posts/${props.post.id}/comments`, {
      content: newComment.value
    })
    
    // Clear the comment field
    newComment.value = ''
    
    // Reload post data (handled by parent)
    emit('refresh')
  } catch (error) {
    console.error('Failed to add comment:', error)
    alert('Failed to add comment')
  }
}

onMounted(() => {
  // Reset form when post changes
  editForm.value = {
    title: props.post.title,
    content: props.post.content,
    isPublic: props.post.isPublic
  }
})
</script>