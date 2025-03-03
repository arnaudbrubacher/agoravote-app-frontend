<template>
    <div 
      class="border rounded-md p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      @click="$emit('click')"
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
  </template>
  
  <script setup>
  import LucideIcon from '@/components/LucideIcon.vue'
  
  const props = defineProps({
    post: {
      type: Object,
      required: true
    }
  })
  
  defineEmits(['click'])
  
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