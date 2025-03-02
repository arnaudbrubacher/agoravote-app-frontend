<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Modern Profile Card -->
    <Card class="w-full max-w-2xl mx-auto cursor-pointer hover:bg-accent/5 transition-colors" @click="navigateToProfile">
      <CardContent class="p-6">
        <div class="space-y-6">
          <!-- Profile Info Section -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="relative">
                <div v-if="!profilePicture" class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <img 
                  v-else
                  :src="profilePicture" 
                  alt="Profile Picture"
                  class="w-16 h-16 rounded-full object-cover border"
                />
              </div>
              <div>
                <h2 class="text-xl font-semibold">{{ userName || 'Your Profile' }}</h2>
                <p class="text-sm text-muted-foreground">{{ userEmail }}</p>
                <p class="text-xs text-blue-600 mt-1">Click to view your profile and posts</p>
              </div>
            </div>
          </div>
          
          <!-- Email verification status -->
          <div v-if="userData?.email_verified !== undefined" class="flex items-center pb-3">
            <div>
              <div class="flex items-center">
                <span v-if="userData.email_verified" class="text-green-600 flex items-center">
                  <CheckCircleIcon class="h-4 w-4 mr-1"/> Email Verified
                </span>
                <span v-else class="text-amber-600 flex items-center">
                  <AlertCircleIcon class="h-4 w-4 mr-1"/> Email Not Verified
                  <Button 
                    variant="link" 
                    class="text-xs pl-1 h-auto p-0"
                    @click.stop="resendVerificationEmail"
                  >
                    Resend Verification
                  </Button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Groups Card -->
    <UserGroupsTab
      class="w-full max-w-2xl mx-auto"
      :groups="groups"
      :isLoading="isLoadingGroups"
      @create-group="openNewGroupDialog"
      @view-group="viewGroup"
      @find-group="showFindGroupDialog = true"
    />

    <!-- Dialogs -->
    <NewGroupDialog
      v-if="showNewGroupDialog"
      @close="closeNewGroupDialog"
      @group-created="handleGroupCreated"
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
            <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search for groups..."
              class="w-full pl-10 pr-4 py-2 border rounded-md"
              @input="debounceSearch"
            />
          </div>

          <!-- Search results -->
          <div v-if="searchLoading" class="text-center py-4">
            <SpinnerIcon class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <span class="text-sm text-muted-foreground mt-2 block">Searching...</span>
          </div>

          <div v-else-if="searchResults.length" class="space-y-3 max-h-[400px] overflow-y-auto">
            <div 
              v-for="group in searchResults" 
              :key="group.id" 
              class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div class="flex items-center space-x-4">
                <div v-if="group.picture" class="w-12 h-12 rounded-full overflow-hidden">
                  <img :src="group.picture" :alt="group.name" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <UserGroupIcon class="h-6 w-6 text-muted-foreground" />
                </div>
                
                <div>
                  <h4 class="font-medium">{{ group.name }}</h4>
                  <p class="text-sm text-muted-foreground">{{ group.description }}</p>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <Button variant="outline" size="sm" @click.stop="viewGroup(group.id)">
                  View
                </Button>
                <Button 
                  v-if="!userInGroup(group.id)"
                  variant="default" 
                  size="sm"
                  @click.stop="joinGroup(group.id)"
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
              </div>
            </div>
          </div>

          <div v-else-if="searchQuery && !searchLoading" class="text-center py-4 text-muted-foreground">
            No groups found matching your search
          </div>

          <div v-else-if="!searchQuery" class="text-center py-4 text-muted-foreground">
            Type to search for public groups
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showFindGroupDialog = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { 
  SearchIcon, 
  Loader2 as SpinnerIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon
} from 'lucide-vue-next'
import { UserGroupIcon } from '@heroicons/vue/outline'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent 
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import NewGroupDialog from '@/components/NewGroupDialog.vue'
import UserGroupsTab from '@/components/dashboard/UserGroupsTab.vue'

const router = useRouter()

// User data refs
const userName = ref('')
const userEmail = ref('')
const profilePicture = ref(null)
const groups = ref([])
const isLoadingGroups = ref(false)
const userData = ref(null)

// New group dialog ref
const showNewGroupDialog = ref(false)

// Find group dialog ref
const showFindGroupDialog = ref(false)

// Navigate to profile page
const navigateToProfile = () => {
  router.push('/profile')
}

// Resend verification email
const resendVerificationEmail = async (event) => {
  // Stop event propagation to prevent navigation to profile
  if (event) {
    event.stopPropagation()
  }
  
  try {
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')
    
    if (!userId || !token) {
      throw new Error('Authentication required')
    }
    
    await axios.post(`/users/${userId}/resend-verification`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    alert('Verification email resent successfully')
  } catch (error) {
    console.error('Failed to resend verification email:', error)
    alert('Failed to resend verification email: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Fetch user info
const fetchUserInfo = async () => {
  try {
    // Get token and userId from localStorage
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    
    if (!token || !userId) {
      throw new Error('Authentication credentials not found')
    }

    // Make API call to get user profile
    const response = await axios.get(`/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    userData.value = response.data
    // Update user information from API response
    userName.value = response.data.name
    userEmail.value = response.data.email
    profilePicture.value = response.data.profile_picture

    console.log('User profile fetched:', response.data)
  } catch (error) {
    console.error('Failed to fetch user info:', error)
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      router.push('/auth')
    }
  }
}

// Fetch user groups
const fetchGroups = async () => {
  try {
    isLoadingGroups.value = true
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await axios.get('/user/groups', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    groups.value = response.data
    console.log('User groups fetched:', response.data)
  } catch (error) {
    console.error('Failed to fetch user groups:', error)
    if (error.response?.status === 401) {
      router.push('/auth')
    }
  } finally {
    isLoadingGroups.value = false
  }
}

// Navigate to group page
const viewGroup = (groupId) => {
  console.log('Navigating to group:', groupId)
  router.push(`/group/${groupId}`)
}

// Dialog handlers
const openNewGroupDialog = () => {
  showNewGroupDialog.value = true
}

const closeNewGroupDialog = () => {
  showNewGroupDialog.value = false
}

const handleGroupCreated = async (newGroup) => {
  await fetchGroups() // Refresh the entire list
  closeNewGroupDialog()
}

// For search functionality
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchTimeout = ref(null)

// Debounce search to prevent too many API calls
const debounceSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  searchTimeout.value = setTimeout(() => {
    searchGroups()
  }, 500)
}

// Search for public groups
const searchGroups = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  
  try {
    searchLoading.value = true
    // Adjust this endpoint and parameters to match your Golang API
    const response = await axios.get(`/api/groups/search`, {
      params: {
        query: searchQuery.value,
        public_only: true
      }
    })
    searchResults.value = response.data.groups || response.data || []
    console.log('Search results:', searchResults.value)
  } catch (error) {
    console.error('Failed to search groups:', error)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// Check if user is already in a group
const userInGroup = (groupId) => {
  return groups.value.some(group => group.id === groupId)
}

// Join a group
const joinGroup = async (groupId) => {
  try {
    // Make API call to join the group
    await axios.post(`/api/groups/${groupId}/join`)
    
    // Refresh user groups after joining
    await fetchGroups()
    
    // Show success message
    alert('Successfully joined the group!')
  } catch (error) {
    console.error('Failed to join group:', error)
    alert('Failed to join group: ' + (error.response?.data?.message || 'Unknown error'))
  }
}

onMounted(() => {
  fetchUserInfo()
  fetchGroups()
})
</script>

<style>
/* Your styles here */
</style>