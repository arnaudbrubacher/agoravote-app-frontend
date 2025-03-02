<template>
  <div 
    class="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
    @click="$emit('click', post)"
  >
    <div class="flex items-center space-x-2 mb-2">
      <div class="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
        <img v-if="post.user?.avatar" :src="post.user.avatar" alt="User avatar" class="w-full h-full object-cover">
        <div v-else class="flex items-center justify-center w-full h-full text-lg font-semibold text-white bg-primary">
          {{ post.user?.name?.charAt(0) || '?' }}
        </div>
      </div>
      <div>
        <div class="font-medium">{{ post.user?.name || 'Unknown User' }}</div>
        <div class="text-xs text-muted-foreground">
          {{ formatDate(post.created_at) }}
        </div>
      </div>
    </div>
    
    <h3 class="text-lg font-semibold mb-1">{{ post.title }}</h3>
    <p class="text-muted-foreground mb-3">{{ post.content }}</p>
    
    <!-- Display attachment if exists -->
    <div v-if="post.file_url" class="mb-3">
      <a :href="post.file_url" target="_blank" class="flex items-center space-x-2 text-blue-600 hover:underline">
        <Icon name="heroicons:document" class="h-4 w-4" />
        <span>{{ post.file_name }}</span>
      </a>
    </div>
    
    <!-- Post actions -->
    <div class="flex items-center space-x-4 text-sm text-muted-foreground">
      <button class="flex items-center space-x-1 hover:text-primary">
        <Icon name="heroicons:hand-thumb-up" class="h-4 w-4" />
        <span>{{ post.like_count || 0 }}</span>
      </button>
      <button class="flex items-center space-x-1 hover:text-primary">
        <Icon name="heroicons:chat-bubble-left-ellipsis" class="h-4 w-4" />
        <span>{{ post.comment_count || 0 }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue' // Make sure you add the missing import

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

// Define the click emit
defineEmits(['click'])

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