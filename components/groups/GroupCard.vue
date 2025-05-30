<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/groups/GroupCard.vue -->
<template>
  <div 
    class="relative flex items-center p-4 border rounded-lg transition-all duration-200"
    :class="{ 
      'cursor-pointer': clickable,
      'hover:bg-gray-50': !isActive, 
      'hover:bg-gray-100': isActive,
      'bg-gray-50': isActive
    }"
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
        class="w-12 h-12 rounded-full object-cover border transition-all"
        :class="{ 'ring-1 ring-gray-400 ring-offset-1': isActive }"
      />
    </div>
    
    <!-- Group Info -->
    <div class="flex-grow min-w-0" :class="hasActions ? 'pr-20' : 'pr-4'">
      <div class="flex items-center space-x-2">
        <h3 class="font-medium" :class="{ 'text-gray-800 font-semibold': isActive }">{{ group.name }}</h3>
      </div>
      <p class="text-sm text-muted-foreground multi-line-truncate">{{ group.description || 'No description' }}</p>
    </div>
    
    <!-- Private Badge - Top Right Corner -->
    <Badge 
      v-if="showPrivateBadge && group.is_private" 
      variant="secondary"
      class="absolute top-2 right-2 text-xs bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded-full border border-gray-300"
    >
      Private
    </Badge>
    
    <!-- Center Right Actions Slot - Modified to center vertically -->
    <div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10">
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
  },
  isActive: {
    type: Boolean,
    default: false
  },
  hasActions: {
    type: Boolean,
    default: false
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
  const config = useRuntimeConfig()
  const apiBaseUrl = config.public.apiBaseUrl || 'http://localhost:8088'
  return `${apiBaseUrl}${props.group.picture}`
})
</script> 

<style scoped>
/* Smooth transition for all changes */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Multi-line text truncation with ellipsis */
.multi-line-truncate {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  max-height: calc(1.3em * 1); /* 1 line * line-height */
}
</style> 