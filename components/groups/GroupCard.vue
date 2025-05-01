<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/groups/GroupCard.vue -->
<template>
  <div 
    class="relative flex items-center p-4 border rounded-lg hover:bg-accent/5 transition-colors"
    :class="{ 'cursor-pointer': clickable }"
    @click="clickable ? $emit('click') : null"
  >
    <!-- Group Avatar -->
    <div class="flex-shrink-0 mr-4">
      <div v-if="!group.picture" class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <Users class="h-6 w-6 text-gray-400" />
      </div>
      <img 
        v-else
        :src="groupPictureUrl" 
        alt="Group Picture"
        class="w-12 h-12 rounded-full object-cover border"
      />
    </div>
    
    <!-- Group Info -->
    <div class="flex-grow min-w-0 pr-4">
      <div class="flex items-center space-x-2">
        <h3 class="font-medium">{{ group.name }}</h3>
        <!-- Private Badge (Inline) -->
        <span 
          v-if="showPrivateBadge && group.is_private" 
          class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded"
        >
          Private
        </span>
      </div>
      <p class="text-sm text-muted-foreground truncate">{{ group.description || 'No description' }}</p>
    </div>
    
    <!-- Top Right Actions Slot -->
    <div class="absolute top-2 right-2 flex items-center space-x-2">
      <slot name="top-right-actions"></slot>
    </div>
    
    <!-- Original Action Buttons (Now likely used for other actions) -->
    <div v-if="showActions" class="flex-shrink-0 ml-2 flex items-center space-x-2">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: false
  },
  showPrivateBadge: {
    type: Boolean,
    default: true
  },
  clickable: {
    type: Boolean,
    default: true
  }
})

defineEmits(['click'])

// Compute the proper URL for the group picture
const groupPictureUrl = computed(() => {
  if (!props.group.picture) return null
  
  // Check if it's already a full URL
  if (props.group.picture.startsWith('http://') || props.group.picture.startsWith('https://')) {
    return props.group.picture
  }
  
  // Otherwise, prepend the API base URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${apiBaseUrl}${props.group.picture}`
})
</script> 