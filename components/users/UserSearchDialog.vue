<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/components/users/UserSearchDialog.vue -->
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
              :class="[
                'flex items-center justify-between p-3 border rounded-md cursor-pointer',
                user.status ? 'opacity-60 bg-muted' : 'hover:bg-muted/50'
              ]"
              @click="selectUser(user)">
              <div class="flex items-center space-x-3">
                <!-- User Avatar -->
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span v-if="!getAvatarUrl(user)" class="font-medium text-primary">
                    {{ getUserInitial(user) }}
                  </span>
                  <img 
                    v-else 
                    :src="getAvatarUrl(user)" 
                    class="w-10 h-10 rounded-full object-cover"
                    alt="User avatar"
                  />
                </div>
                
                <!-- User Info -->
                <div>
                  <div class="font-medium">{{ user.name || user.email.split('@')[0] }}</div>
                  <div class="text-sm text-muted-foreground">{{ user.email }}</div>
                  <div v-if="user.status" class="text-xs text-muted-foreground mt-1">
                    Status: {{ formatStatus(user.status) }}
                  </div>
                </div>
              </div>
              
              <!-- Add Button -->
              <Button 
                variant="outline" 
                size="sm"
                :disabled="!!user.status"
                @click="addUser(user)"
              >
                <LucideIcon v-if="!user.status" name="Plus" size="4" class="h-4 w-4 mr-1" />
                <LucideIcon v-else name="Check" size="4" class="h-4 w-4 mr-1" />
                {{ user.status ? 'Added' : 'Add' }}
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

  <!-- Alert Dialog for Success/Error Messages -->
  <AlertDialog :open="isAlertOpen" @update:open="isAlertOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ alertTitle }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ alertMessage }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <!-- Close the main dialog as well when clicking OK -->
        <AlertDialogAction @click="isAlertOpen = false; $emit('close')">OK</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, watch } from 'vue'
import { useNuxtApp } from '#app'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Props
const props = defineProps({
  groupId: {
    type: String,
    required: true
  }
})

// Emit events
const emit = defineEmits(['close', 'user-added'])

// ADD THIS
const { $axiosInstance } = useNuxtApp()

// State
const searchQuery = ref('')
const searchResults = ref([])
const isLoading = ref(false)
const timeout = ref(null)

// State for AlertDialog
const isAlertOpen = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')

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
    const response = await $axiosInstance.get(`/api/users/search`, {
      params: { 
        q: searchQuery.value.trim(),
        groupId: props.groupId
      }
    })
    
    // Format results
    searchResults.value = response.data.map(user => ({
      id: user.id,
      name: user.name || user.username || '',
      email: user.email,
      avatar: user.avatar || user.profile_picture,
      status: user.status || null // Include membership status if available
    }))
  } catch (err) {
    console.error('Error searching users:', err)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

// Format status for display
const formatStatus = (status) => {
  const statusMap = {
    'pending': 'Invitation Pending',
    'active': 'Active Member',
    'invited': 'Invited',
    'admin': 'Admin'
  }
  return statusMap[status] || status
}

// Helper to show AlertDialog
function showAlert(title, message) {
  alertTitle.value = title
  alertMessage.value = message
  isAlertOpen.value = true
  console.log(`[UserSearchDialog] showAlert called. isAlertOpen set to: ${isAlertOpen.value}`);
}

// Watch for changes in isAlertOpen
watch(isAlertOpen, (newValue) => {
  console.log(`[UserSearchDialog] isAlertOpen watcher triggered. New value: ${newValue}`);
});

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

// Helper function to construct full avatar URL
const getAvatarUrl = (user) => {
  const avatarPath = user.avatar // This now holds the value from profile_picture if available
  if (!avatarPath) return null
  
  // If it's already a full URL, return it
  if (avatarPath.startsWith('http')) {
    return avatarPath
  }
  
  // Otherwise, prepend the API base URL
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl || 'http://localhost:8088'
  return `${baseUrl}/${avatarPath}`
}

// Select user
const selectUser = (user) => {
  if (user.status) {
    showAlert('User Status', `This user is already: ${formatStatus(user.status)}.`);
    return;
  }
  addUser(user);
}

// Add user to group
const addUser = async (user) => {
  if (user.status) {
    console.log('User already has a status in the group, not re-adding.');
    return;
  }

  try {
    await $axiosInstance.post(`/api/groups/${props.groupId}/members`, { user_id: user.id })
    showAlert('Success', `User ${user.name || user.email} has been invited to the group.`)
    emit('user-added', user)
    
    // Update user status locally to reflect they've been added/invited
    const foundUser = searchResults.value.find(u => u.id === user.id);
    if (foundUser) {
      foundUser.status = 'invited'; // Or whatever status the backend sets initially
    }
    
    // Add a small delay to allow the backend to process the invitation before refreshing
    setTimeout(() => {
      // Dispatch event to trigger the same refresh as the refresh button
      console.log(`[UserSearchDialog] Dispatching members-refresh-button event for group: ${props.groupId}`);
      window.dispatchEvent(new CustomEvent('members-refresh-button', {
        detail: {
          groupId: props.groupId,
          action: 'member-invited',
          invitedUserEmail: user.email,
          invitedUserName: user.name || user.email
        }
      }));
    }, 500); // 500ms delay to allow backend processing
    
  } catch (err) {
    console.error('Error adding user to group:', err)
    showAlert('Error', `Failed to add user: ${err.response?.data?.error || 'Please try again.'}`)
  }
}
</script>