<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container mx-auto flex h-16 items-center px-4">
        <div class="flex w-full items-center justify-between">
          <!-- Last Used Group Card (replaces Dashboard button) -->
          <div 
            v-if="isAuthenticated" 
            class="flex items-center cursor-pointer"
            @click="openDashboardSidebar"
          >
            <div class="flex-shrink-0 mr-2">
              <div v-if="!lastUsedGroup?.picture" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Users class="h-5 w-5 text-gray-600" />
              </div>
              <img 
                v-else
                :src="lastUsedGroup.picture" 
                alt="Group Picture"
                class="w-8 h-8 rounded-full object-cover"
              />
            </div>
            <div>
              <span class="text-sm font-medium truncate max-w-[120px]">{{ lastUsedGroup?.name || 'Groups' }}</span>
            </div>
          </div>
          
          
          <!-- App Title (center) -->
          <h1 class="text-xl font-bold absolute left-1/2 transform -translate-x-1/2">Agora Vote</h1>
          
          <!-- User Card (right) - Only show when authenticated -->
          <div 
            v-if="isAuthenticated" 
            class="flex items-center cursor-pointer"
            @click="openUserSettings"
          >
            <div class="flex-shrink-0 mr-2">
              <div v-if="!profilePictureUrl" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User class="h-5 w-5 text-gray-400" />
              </div>
              <img 
                v-else
                :src="profilePictureUrl" 
                alt="User Profile Picture"
                class="w-8 h-8 rounded-full object-cover border"
              />
            </div>
            <span class="text-sm font-medium">{{ userData?.name || 'User' }}</span>
          </div>
          <div v-else class="w-[120px]"></div> <!-- Spacer when user card is not shown -->
        </div>
      </div>
    </header>
    <main class="container mx-auto py-6 px-4">
      <slot />
    </main>
    <footer class="border-t">
      <div class="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Agora Vote. All rights reserved.</p>
      </div>
    </footer>

    <!-- User Settings Sheet Component -->
    <UserSettingsSheet 
      v-model:open="isUserSettingsOpen" 
      :userData="userData"
      @refresh-user-data="fetchUserData"
    />
    
    <!-- Dashboard Sidebar Component -->
    <DashboardSidebar
      v-model:open="isDashboardSidebarOpen"
      :groups="userGroups"
      :isLoading="isLoadingGroups"
      @find-group="showFindGroupDialog = true"
      @create-group="showCreateGroupDialog = true"
      @view-group="navigateToGroup"
    />
    
    <!-- Find Group Dialog -->
    <Dialog :open="showFindGroupDialog" @update:open="showFindGroupDialog = $event">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Find a Group</DialogTitle>
          <DialogDescription>
            Search for public groups to join
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <!-- Search Input -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="groupSearchQuery"
              type="text"
              placeholder="Search for groups..."
              class="w-full pl-10 pr-4"
            />
          </div>

          <!-- Search results would go here -->
          <div class="text-center py-4 text-muted-foreground">
            Type to search for public groups
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showFindGroupDialog = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <!-- Create Group Dialog -->
    <Dialog :open="showCreateGroupDialog" @update:open="showCreateGroupDialog = $event">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
          <DialogDescription>
            Fill in the details to create your new group
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <!-- Group Name -->
          <div class="space-y-2">
            <Label for="group-name">Group Name</Label>
            <Input id="group-name" v-model="newGroupName" placeholder="Enter group name" />
          </div>
          
          <!-- Group Description -->
          <div class="space-y-2">
            <Label for="group-description">Description</Label>
            <Textarea 
              id="group-description" 
              v-model="newGroupDescription" 
              placeholder="Describe your group"
              rows="3"
            />
          </div>
          
          <!-- Group Privacy -->
          <div class="space-y-2">
            <Label>Privacy</Label>
            <div class="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="is-public" 
                v-model="newGroupIsPublic"
                class="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label for="is-public" class="text-sm">Make this group public</label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showCreateGroupDialog = false">Cancel</Button>
          <Button type="submit" @click="createGroup">Create Group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Users, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import axios from '~/src/utils/axios'
import UserSettingsSheet from '@/components/users/UserSettingsSheet.vue'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const router = useRouter()
const route = useRoute()
const userData = ref(null)
const loading = ref(false)
const isUserSettingsOpen = ref(false)
const isDashboardSidebarOpen = ref(false)

// Groups data
const userGroups = ref([])
const isLoadingGroups = ref(false)
const lastUsedGroupId = ref(localStorage.getItem('lastUsedGroupId') || null)

// Computed property for the last used group
const lastUsedGroup = computed(() => {
  if (!lastUsedGroupId.value || userGroups.value.length === 0) {
    return userGroups.value[0] || null // Return first group or null if no groups
  }
  
  // Find the group with the matching ID
  const group = userGroups.value.find(g => g.id === lastUsedGroupId.value)
  
  // Return the found group or the first group as fallback
  return group || userGroups.value[0] || null
})

// Dialog states
const showFindGroupDialog = ref(false)
const showCreateGroupDialog = ref(false)

// Form data
const groupSearchQuery = ref('')
const newGroupName = ref('')
const newGroupDescription = ref('')
const newGroupIsPublic = ref(true)

// Check if user is authenticated
const isAuthenticated = computed(() => {
  return !!localStorage.getItem('token')
})

// Check if currently on dashboard page
const isOnDashboard = computed(() => {
  return route.path === '/dashboard'
})

// Open user settings sheet
const openUserSettings = () => {
  isUserSettingsOpen.value = true
}

// Open dashboard sidebar
const openDashboardSidebar = () => {
  // Fetch groups if not already loaded
  if (userGroups.value.length === 0 && !isLoadingGroups.value) {
    fetchUserGroups()
  }
  // Toggle the sidebar
  isDashboardSidebarOpen.value = !isDashboardSidebarOpen.value
}

// Navigate to dashboard
const navigateToDashboard = () => {
  // Only navigate if not already on dashboard
  if (!isOnDashboard.value) {
    router.push('/dashboard')
  }
}

// Navigate to group page
const navigateToGroup = (groupId) => {
  // Store the last used group ID
  lastUsedGroupId.value = groupId
  localStorage.setItem('lastUsedGroupId', groupId)
  
  // Close the sidebar and navigate
  isDashboardSidebarOpen.value = false
  router.push(`/group/${groupId}`)
}

// Create a new group
const createGroup = async () => {
  if (!newGroupName.value.trim()) {
    alert('Please enter a group name')
    return
  }
  
  try {
    const response = await axios.post('/groups', {
      name: newGroupName.value,
      description: newGroupDescription.value,
      is_public: newGroupIsPublic.value
    })
    
    // Reset form
    newGroupName.value = ''
    newGroupDescription.value = ''
    newGroupIsPublic.value = true
    
    // Close dialog
    showCreateGroupDialog.value = false
    
    // Refresh groups
    await fetchUserGroups()
    
    // Navigate to the new group and set as last used
    if (response.data && response.data.id) {
      lastUsedGroupId.value = response.data.id
      localStorage.setItem('lastUsedGroupId', response.data.id)
      router.push(`/group/${response.data.id}`)
    }
  } catch (error) {
    console.error('Failed to create group:', error)
    alert('Failed to create group: ' + (error.response?.data?.message || 'Unknown error'))
  }
}

// Fetch user groups
const fetchUserGroups = async () => {
  if (!isAuthenticated.value) return
  
  try {
    isLoadingGroups.value = true
    const response = await axios.get('/user/groups')
    userGroups.value = response.data
    
    // After fetching groups, check if we need to update the last used group
    if (userGroups.value.length > 0) {
      // If there's no last used group but we have groups, set the first one as last used
      if (!lastUsedGroupId.value) {
        lastUsedGroupId.value = userGroups.value[0].id
        localStorage.setItem('lastUsedGroupId', userGroups.value[0].id)
      } 
      // If the last used group doesn't exist in the current groups, update it
      else if (!userGroups.value.some(g => g.id === lastUsedGroupId.value)) {
        lastUsedGroupId.value = userGroups.value[0].id
        localStorage.setItem('lastUsedGroupId', userGroups.value[0].id)
      }
    }
  } catch (error) {
    console.error('Failed to fetch user groups:', error)
  } finally {
    isLoadingGroups.value = false
  }
}

// Computed property for profile picture URL
const profilePictureUrl = computed(() => {
  if (!userData.value?.profile_picture) return null
  
  // If the profile picture is a full URL, return it as is
  if (userData.value.profile_picture.startsWith('http')) {
    return userData.value.profile_picture
  }
  
  // Otherwise, prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${baseUrl}/${userData.value.profile_picture}`
})

// Fetch user data if authenticated
const fetchUserData = async () => {
  if (isAuthenticated.value) {
    try {
      loading.value = true
      // Use axios instance with proper configuration
      const response = await axios.get('/users/me')
      userData.value = response.data
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      if (error.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        router.push('/auth')
      }
    } finally {
      loading.value = false
    }
  }
}

// Provide user data to child components
provide('appUserData', userData)
provide('refreshAppUserData', fetchUserData)

// Watch for route changes to refresh user data
watch(
  () => route.path,
  () => {
    if (isAuthenticated.value) {
      fetchUserData()
    }
  }
)

// Watch for route changes to update last used group
watch(
  () => route.path,
  (newPath) => {
    // Check if the current route is a group page
    const groupMatch = newPath.match(/\/group\/([^/]+)/)
    if (groupMatch && groupMatch[1]) {
      // Update last used group ID
      lastUsedGroupId.value = groupMatch[1]
      localStorage.setItem('lastUsedGroupId', groupMatch[1])
    }
  }
)

onMounted(() => {
  fetchUserData()
  fetchUserGroups()
  
  // Listen for the global user-data-updated event
  window.addEventListener('user-data-updated', fetchUserData)
  
  // Listen for the global group-data-updated event
  window.addEventListener('group-data-updated', fetchUserGroups)
})

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('user-data-updated', fetchUserData)
  window.removeEventListener('group-data-updated', fetchUserGroups)
})
</script>