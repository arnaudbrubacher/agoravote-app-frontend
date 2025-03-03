<template>
  <div class="space-y-4">
    <!-- Header with title and optional create button -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">Posts</h3>
      <Button 
        v-if="showCreateButton"
        variant="outline" 
        size="sm"
        @click="$emit('create-post')"
      >
        <PlusIcon class="h-4 w-4 mr-1" />
        New Post
      </Button>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-6">
      <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin text-primary" />
      <span class="ml-2">Loading posts...</span>
    </div>
    
    <!-- No posts state -->
    <div v-else-if="!posts || posts.length === 0" class="text-center py-8 text-muted-foreground">
      {{ isCurrentUser ? "You haven't posted anything yet." : "This user hasn't posted anything yet." }}
    </div>
    
    <!-- Posts list -->
    <div v-else class="space-y-4">
      <div 
        v-for="post in posts" 
        :key="post.id"
        class="border rounded-md p-4 hover:bg-accent/50 transition-colors cursor-pointer"
        @click="$emit('open-post', post)"
      >
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-medium">{{ post.title }}</h4>
          <span class="text-xs text-muted-foreground">
            {{ formatPostDate(post.created_at) }}
          </span>
        </div>
        <p class="text-sm line-clamp-2">{{ post.content }}</p>
        
        <!-- Post footer with stats -->
        <div class="flex items-center space-x-4 mt-3 pt-2 border-t text-sm text-muted-foreground">
          <div class="flex items-center">
            <LucideIcon name="MessageSquare" size="4" class="h-4 w-4 mr-1" />
            <span>{{ post.comment_count || 0 }}</span>
          </div>
          <div class="flex items-center">
            <LucideIcon name="QuestionMark" size="4" class="h-4 w-4 mr-1" />
            <span>{{ post.like_count || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Plus as PlusIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import LucideIcon from '@/components/LucideIcon.vue'

const props = defineProps({
  posts: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  isCurrentUser: {
    type: Boolean,
    default: false
  },
  showCreateButton: {
    type: Boolean,
    default: false
  }
})

defineEmits(['create-post', 'open-post'])

// Format date for posts
const formatPostDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
}
</script>