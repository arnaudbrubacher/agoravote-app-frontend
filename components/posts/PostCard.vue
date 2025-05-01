<template>
    <div 
      class="border rounded-md p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      @click="$emit('click')"
    >
      <div class="flex justify-between items-start mb-2">
        <h4 class="font-medium">{{ post.title }}</h4>
        <span class="text-xs text-muted-foreground">
          <span v-if="post.user">{{ post.user.name || post.user.username }} · </span>
          {{ formatPostDate(post.created_at) }}
        </span>
      </div>
      <p class="text-sm line-clamp-2">{{ post.content }}</p>
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