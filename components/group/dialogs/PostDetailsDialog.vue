<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-lg max-h-[90vh] flex flex-col">
      <DialogHeader class="flex justify-between items-center">
        <DialogTitle>{{ post.title }}</DialogTitle>
        <DialogClose />
      </DialogHeader>
      
      <div class="flex-1 overflow-y-auto py-4">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <!-- User info -->
              <div class="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
                <img v-if="post.user?.avatar" :src="post.user.avatar" alt="User avatar" class="w-full h-full object-cover">
                <div v-else class="flex items-center justify-center w-full h-full text-lg font-semibold text-white bg-primary">
                  {{ post.user?.name?.charAt(0) || '?' }}
                </div>
              </div>
              <div>
                <span class="font-medium">{{ post.user?.name || 'Unknown User' }}</span>
                <span class="text-xs text-muted-foreground ml-2">
                  {{ formatDate(post.created_at) }}
                </span>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                @click="$emit('edit', post)" 
              >
                <PencilIcon class="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                @click="$emit('delete', post)" 
              >
                <TrashIcon class="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          
          <p class="whitespace-pre-wrap">{{ post.content }}</p>
          
          <!-- Display attachment if exists -->
          <div v-if="post.file_url" class="mb-3">
            <a :href="post.file_url" target="_blank" class="flex items-center space-x-2 text-blue-600 hover:underline">
              <DocumentIcon class="h-4 w-4" />
              <span>{{ post.file_name }}</span>
            </a>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button @click="$emit('close')">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Pencil, Trash, File as DocumentIcon } from 'lucide-vue-next'

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

// Define emits
defineEmits(['close', 'edit', 'delete'])

// These computed properties are no longer needed if you want buttons always visible
// But we'll keep them in case you want to use them later
const canEdit = computed(() => {
  return props.post.user_id === props.currentUserId
})

const canDelete = computed(() => {
  return props.post.user_id === props.currentUserId
})

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>