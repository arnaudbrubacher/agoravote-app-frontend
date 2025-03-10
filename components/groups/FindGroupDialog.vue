<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/groups/FindGroupDialog.vue -->
<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Find a Public Group</DialogTitle>
        <DialogDescription>
          Search for public groups to join. Private groups are not shown in search results.
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-4 py-4">
        <!-- Search Input -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            type="text"
            placeholder="Search for public groups..."
            class="w-full pl-10 pr-4"
            @input="debounceSearch"
          />
        </div>

        <!-- Search results -->
        <div v-if="isSearching" class="text-center py-4">
          <Loader2 class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <span class="text-sm text-muted-foreground mt-2 block">Searching...</span>
        </div>

        <div v-else-if="searchResults.length > 0" class="space-y-3 max-h-[400px] overflow-y-auto">
          <div v-for="group in searchResults" :key="group.id">
            <GroupCard 
              :group="group" 
              :showActions="true"
              @click="$emit('view-group', group.id)"
            >
              <template #actions>
                <Button 
                  v-if="!isUserInGroup(group.id)"
                  variant="default" 
                  size="sm"
                  @click.stop="$emit('join-group', group.id)"
                >
                  Join
                </Button>

                <Button 
                  v-if="!isUserInGroup(group.id)"
                  variant="default" 
                  size="sm"
                  @click.stop="openAdmissionForm(group)"
                >
                  Join
                </Button>

                <Button 
                  v-else
                  variant="secondary" 
                  size="sm"
                  disabled
                >
                  Joined
                </Button>
              </template>
            </GroupCard>
          </div>
        </div>

        <div v-else-if="searchQuery && !isSearching" class="text-center py-4 text-muted-foreground">
          No groups found matching your search
        </div>

        <div v-else-if="!searchQuery" class="text-center py-4 text-muted-foreground">
          Type to search for public groups
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'
import { Search, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import GroupCard from '@/components/groups/GroupCard.vue'
import axios from '~/src/utils/axios'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

// Props
const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  userGroups: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:open', 'view-group', 'join-group'])

// Search state
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
let searchTimeout = null

// Debounce search function
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  if (searchQuery.value.trim() === '') {
    searchResults.value = []
    return
  }
  
  searchTimeout = setTimeout(() => {
    searchGroups()
  }, 500)
}

// Search for groups
const searchGroups = async () => {
  if (searchQuery.value.trim() === '') {
    searchResults.value = []
    return
  }
  
  try {
    isSearching.value = true
    
    // Add public_only=true parameter to only show public groups
    const response = await axios.get(`/groups/search?query=${encodeURIComponent(searchQuery.value)}&public_only=true`)
    
    // Handle the nested response format - the backend returns { groups: [...] }
    searchResults.value = response.data.groups || []
  } catch (error) {
    console.error('Failed to search groups:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// Check if user is in a group
const isUserInGroup = (groupId) => {
  return props.userGroups.some(g => g.id === groupId)
}

// Reset search when dialog is closed
const resetSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

// Watch for dialog open/close to reset search
watch(() => props.open, (newValue) => {
  if (!newValue) {
    resetSearch()
  }
})
</script> 