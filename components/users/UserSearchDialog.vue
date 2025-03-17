<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/UserSearchDialog.vue -->
<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Find Users</DialogTitle>
        <DialogDescription>
          Search for users by name or email to add to your group
        </DialogDescription>
      </DialogHeader>
      
      <div class="py-4">
        <!-- Search Input -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="w-full pl-10 pr-4 py-2 border rounded-md"
            @input="debouncedSearch"
          />
          <LucideIcon 
            name="Search" 
            size="5"
            class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" 
          />
          <div v-if="searchQuery && !isLoading" 
            class="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
            @click="clearSearch">
            <LucideIcon name="X" size="5" class="h-5 w-5 text-muted-foreground" />
          </div>
          <div v-if="isLoading" class="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LucideIcon name="RefreshCw" size="5" class="h-5 w-5 animate-spin" />
          </div>
        </div>
        
        <!-- Search Results -->
        <div class="mt-4">
          <div v-if="searchResults.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
            <div v-for="user in searchResults" :key="user.id"
              class="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
              @click="selectUser(user)">
              <div class="flex items-center space-x-3">
                <!-- User Avatar -->
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span v-if="!user.avatar" class="font-medium text-primary">
                    {{ getUserInitial(user) }}
                  </span>
                  <img 
                    v-else 
                    :src="user.avatar" 
                    class="w-10 h-10 rounded-full object-cover"
                    alt="User avatar"
                  />
                </div>
                
                <!-- User Info -->
                <div>
                  <div class="font-medium">{{ user.name || user.email.split('@')[0] }}</div>
                  <div class="text-sm text-muted-foreground">{{ user.email }}</div>
                </div>
              </div>
              
              <!-- Add Button -->
              <Button 
                variant="outline" 
                size="sm"
                @click.stop="addUser(user)"
              >
                <LucideIcon name="Plus" size="4" class="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
          
          <div v-else-if="searchQuery.length > 0 && !isLoading" class="text-center py-8 text-muted-foreground">
            No users found matching "{{ searchQuery }}"
          </div>
          
          <div v-else-if="!searchQuery" class="text-center py-8 text-muted-foreground">
            Start typing to search for users
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button @click="$emit('close')" variant="outline">Cancel</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref } from 'vue'
import axios from '~/src/utils/axios'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Props
const props = defineProps({
  groupId: {
    type: String,
    required: true
  }
})

// Emit events
const emit = defineEmits(['close', 'user-added'])

// State
const searchQuery = ref('')
const searchResults = ref([])
const isLoading = ref(false)
const timeout = ref(null)

// Debounce search to avoid too many API calls
const debouncedSearch = () => {
  clearTimeout(timeout.value)
  if (searchQuery.value.trim() === '') {
    searchResults.value = []
    isLoading.value = false
    return
  }
  
  isLoading.value = true
  timeout.value = setTimeout(() => {
    searchUsers()
  }, 300) // 300ms debounce
}

// Search users API call
const searchUsers = async () => {
  if (searchQuery.value.trim() === '') {
    searchResults.value = []
    isLoading.value = false
    return
  }
  
  try {
    const response = await axios.get(`/users/search`, {
      params: { 
        q: searchQuery.value.trim(),
        excludeGroupId: props.groupId // Exclude users already in this group
      }
    })
    
    // Format results
    searchResults.value = response.data.map(user => ({
      id: user.id,
      name: user.name || user.username || '',
      email: user.email,
      avatar: user.avatar || user.profile_picture
    }))
  } catch (err) {
    console.error('Error searching users:', err)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

// Get user initial for avatar
const getUserInitial = (user) => {
  if (user.name) return user.name.charAt(0).toUpperCase()
  if (user.email) return user.email.charAt(0).toUpperCase()
  return 'U'
}

// Select user
const selectUser = (user) => {
  console.log('Selected user:', user)
  // You can add additional functionality here if needed
}

// Add user to group
const addUser = async (user) => {
  try {
    isLoading.value = true
    
    // Send invitation request to create a pending membership
    const response = await axios.post(`/groups/${props.groupId}/invite`, {
      email: user.email
    })
    
    // Emit success event with user data
    emit('user-added', {
      ...user,
      status: 'pending', // Mark as pending
      ...response.data // Merge with any additional data returned from API
    })
    
    // Remove added user from results
    searchResults.value = searchResults.value.filter(u => u.id !== user.id)
  } catch (err) {
    console.error('Failed to invite user to group:', err)
    alert('Failed to send invitation: ' + (err.response?.data?.error || err.message))
  } finally {
    isLoading.value = false
  }
}
</script>