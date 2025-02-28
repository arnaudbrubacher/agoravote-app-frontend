<template>
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm">
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 sm:rounded-lg">
      <div class="flex flex-col h-[90vh]">
        <header class="flex justify-between items-center p-6 border-b">
          <h2 class="text-lg font-semibold">{{ post.title }}</h2>
          <Button variant="ghost" size="icon" @click="$emit('close')">
            <XIcon class="h-4 w-4" />
          </Button>
        </header>

        <div class="flex-1 overflow-y-auto p-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <!-- User info -->
                <div class="flex items-center space-x-2">
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
              </div>
              <div class="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  @click="$emit('edit', post)" 
                  class="border"
                  v-if="canEdit"
                >
                  <PencilIcon class="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  @click="$emit('delete', post)" 
                  class="border"
                  v-if="canDelete"
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

        <footer class="p-6 border-t">
          <div class="flex justify-end">
            <Button @click="$emit('close')">Close</Button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { XIcon, PencilIcon, TrashIcon, DocumentIcon } from '@heroicons/vue/outline'

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

// Determine if current user can edit/delete the post
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