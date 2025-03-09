<template>
  <Sheet v-model:open="isOpen" side="left">
    <SheetContent class="w-full sm:max-w-md overflow-y-auto" side="left">
      <SheetHeader class="pb-4">
        <SheetTitle>Dashboard</SheetTitle>
      </SheetHeader>
      
      <!-- Groups Section -->
      <div class="space-y-6 p-4">
        <!-- Group Actions -->
        <div class="space-y-2">
          <Button 
            variant="outline" 
            class="w-full justify-start"
            @click="$emit('find-group')"
          >
            <Search class="h-4 w-4 mr-2" />
            Find a Group
          </Button>
          
          <Button 
            variant="default" 
            class="w-full justify-start"
            @click="$emit('create-group')"
          >
            <Plus class="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>
      
      <!-- Your Groups Section -->
      <SheetHeader class="pb-4">
        <SheetTitle>Your Groups</SheetTitle>
      </SheetHeader>
      
      <div class="p-4 pt-0 space-y-4">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <Loader2 class="h-6 w-6 animate-spin inline-block" />
          <span class="ml-2 text-sm text-muted-foreground">Loading groups...</span>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="groups.length === 0" class="text-center py-6 text-sm text-muted-foreground">
          No groups yet. Create your first group!
        </div>
        
        <!-- Groups List -->
        <div v-else class="space-y-3">
          <div 
            v-for="group in groups" 
            :key="group.id" 
            class="flex items-center p-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
            @click="$emit('view-group', group.id)"
          >
            <!-- Group Avatar -->
            <div class="flex-shrink-0 mr-3">
              <div v-if="!getGroupPictureUrl(group)" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Users class="h-5 w-5 text-gray-600" />
              </div>
              <img 
                v-else
                :src="getGroupPictureUrl(group)" 
                alt="Group Picture"
                class="w-10 h-10 rounded-full object-cover"
              />
            </div>
            
            <!-- Group Info -->
            <div class="flex-grow min-w-0">
              <div class="font-medium truncate">{{ group.name }}</div>
              <div class="text-xs text-muted-foreground truncate">{{ group.description || 'No description' }}</div>
            </div>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup>
import { computed } from 'vue'
import { 
  Search, 
  Plus, 
  Users,
  Loader2
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// Props
const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  groups: {
    type: Array,
    required: true,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:open', 'find-group', 'create-group', 'view-group'])

// Computed property for two-way binding of open state
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Helper function to properly format group picture URLs
const getGroupPictureUrl = (group) => {
  if (!group.picture) return null
  
  // If the picture is a full URL, return it as is
  if (group.picture.startsWith('http')) {
    return group.picture
  }
  
  // Otherwise, prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${baseUrl}/${group.picture}`
}
</script> 