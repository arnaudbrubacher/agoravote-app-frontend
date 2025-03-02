<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/dashboard/UserPostCard.vue -->
<template>
  <div 
    class="border rounded-md p-4 cursor-pointer hover:bg-accent/50 transition-colors"
    @click="$emit('click')"
  >
    <!-- Post Header -->
    <div class="flex justify-between items-start mb-3">
      <div>
        <h3 class="font-medium">{{ post.title }}</h3>
        <div class="flex items-center text-sm text-muted-foreground">
          <span>{{ formattedDate }}</span>
        </div>
      </div>
    </div>
    
    <!-- Post Content Preview -->
    <p class="text-sm line-clamp-2">{{ post.content }}</p>
    
    <!-- Post Footer -->
    <div class="flex items-center justify-between mt-3 pt-2 border-t text-sm">
      <div class="flex items-center space-x-2">
        <div class="flex items-center">
          <LucideIcon name="MessageSquare" size="4" class="h-4 w-4 mr-1" />
          <span>{{ post.comments?.length || 0 }}</span>
        </div>
        <div class="flex items-center">
          <LucideIcon name="QuestionMark" size="4" class="h-4 w-4 mr-1" />
          <span>{{ post.likes?.length || 0 }}</span>
        </div>
      </div>
      <span v-if="post.isPublic" class="text-xs px-2 py-1 bg-muted/70 rounded-full">Public</span>
    </div>
  </div>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

// Format the date for display
const formattedDate = computed(() => {
  if (!props.post.created_at) return ''
  
  const date = new Date(props.post.created_at)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
})
</script>