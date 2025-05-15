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
      
      <!-- Content row with attachment indicator -->
      <div class="flex justify-between items-start">
        <p class="text-sm line-clamp-2 flex-1">{{ post.content }}</p>
        
        <!-- Attachment indicator -->
        <div v-if="hasAttachment" class="flex items-center ml-2 text-xs text-muted-foreground flex-shrink-0">
          <LucideIcon :name="getFileIcon" class="h-4 w-4 mr-1" />
          <span>Attachment</span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import LucideIcon from '@/components/LucideIcon.vue'
  import { computed } from 'vue'
  
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
  
  // Check if post has an attachment
  const hasAttachment = computed(() => {
    return props.post.file_url || props.post.fileURL || props.post.attachment
  })
  
  // Get appropriate icon based on file type
  const getFileIcon = computed(() => {
    if (!hasAttachment.value) return 'File'
    
    const url = props.post.file_url || props.post.fileURL || props.post.attachment || ''
    const filename = url.split('/').pop()?.toLowerCase() || ''
    
    if (filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'Image'
    if (filename.match(/\.(pdf)$/i)) return 'FileText'
    if (filename.match(/\.(doc|docx)$/i)) return 'FileText'
    if (filename.match(/\.(xls|xlsx)$/i)) return 'FileSpreadsheet'
    if (filename.match(/\.(ppt|pptx)$/i)) return 'FilePresentation'
    if (filename.match(/\.(mp4|mov|avi)$/i)) return 'FileVideo'
    if (filename.match(/\.(mp3|wav)$/i)) return 'FileAudio'
    if (filename.match(/\.(zip|rar)$/i)) return 'FileArchive'
    
    return 'Paperclip'
  })
  </script>