<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Modern Profile Card -->
    <Card class="w-full max-w-2xl mx-auto">
      <CardHeader class="flex flex-row items-center justify-between pb-2">
        <!-- Left side: Profile Picture and User Info -->
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
            <Button
              type="button"
              variant="secondary"
              size="icon"
              class="absolute -bottom-1 -right-1 h-6 w-6 rounded-full shadow-sm"
              @click="triggerFileInput"
            >
              <EditIcon class="h-3 w-3" />
            </Button>
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden"
              accept="image/*" 
              @change="handleProfilePictureUpload" 
            />
          </div>
          <div>
            <CardTitle>{{ userName || 'Your Profile' }}</CardTitle>
            <p class="text-sm text-muted-foreground">{{ userEmail }}</p>
          </div>
        </div>
        
        <!-- Settings Button -->
        <Button 
          variant="outline" 
          size="sm"
          @click="openUserSettings"
          class="flex items-center"
        >
          <SettingsIcon class="h-4 w-4 mr-1" />
          Settings
        </Button>
      </CardHeader>

      <CardContent class="p-6 pt-4">
        <!-- Profile card content can be simplified since details are now in the settings dialog -->
        <div class="space-y-4">
          <!-- You can keep minimal information here -->
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
                    @click="resendVerificationEmail"
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
    <Card class="w-full max-w-2xl mx-auto">
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Your Groups</CardTitle>
          <CardDescription>Groups you've created or joined</CardDescription>
        </div>
        <Button @click="openNewGroupDialog" class="flex items-center ml-auto">
          <PlusIcon class="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </CardHeader>
      <CardContent class="p-6">
        <!-- Groups list -->
        <div class="space-y-4">
          <div v-if="groups.length === 0" class="text-center py-6 text-muted-foreground">
            No groups yet. Create your first group!
          </div>
          
          <div 
            v-for="group in groups" 
            :key="group.id" 
            class="cursor-pointer"
            @click="viewGroup(group.id)"
          >
            <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
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
                  v-if="group.isPrivate" 
                  variant="secondary" 
                  size="sm"
                >
                  Private
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Find a Group Card -->
    <Card class="w-full max-w-2xl mx-auto">
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Find a Group</CardTitle>
          <CardDescription>Search for public groups to join</CardDescription>
        </div>
      </CardHeader>
      <CardContent class="p-6">
        <div class="space-y-4">
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

          <div v-else-if="searchResults.length" class="space-y-3">
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
      </CardContent>
    </Card>

    <!-- New Group Dialog -->
    <NewGroupDialog
      v-if="showNewGroupDialog"
      @close="closeNewGroupDialog"
      @group-created="handleGroupCreated"
    />

    <!-- User Settings Dialog -->
    <UserSettingsDialog
      :open="showUserSettings"
      :userData="userData"
      @update:open="showUserSettings = $event"
      @refresh-user-data="fetchUserInfo"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { 
  LogOutIcon, 
  TrashIcon, 
  PlusIcon, 
  SearchIcon, 
  Settings as SettingsIcon, 
  Loader2 as SpinnerIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon
} from 'lucide-vue-next'
import { UserGroupIcon } from '@heroicons/vue/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
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
import UserSettingsDialog from '@/components/UserSettingsDialog.vue'

const router = useRouter()

// User data refs
const userName = ref('')
const userEmail = ref('')
const profilePicture = ref(null)
const fileInput = ref(null)
const groups = ref([])
const userData = ref(null)
const showUserSettings = ref(false)

// New group dialog ref
const showNewGroupDialog = ref(false)

// Format date helper function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
}

// Trigger file input for profile picture
const triggerFileInput = () => {
  fileInput.value.click()
}

// Handle profile picture upload
const handleProfilePictureUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    // Create form data
    const formData = new FormData()
    formData.append('profile_picture', file)
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')
    
    if (!userId || !token) {
      throw new Error('Authentication required')
    }
    
    // Upload the file
    const response = await axios.post(`/users/${userId}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    })
    
    // Update the profile picture
    profilePicture.value = response.data.url || response.data.profile_picture
    
    // Show success message
    console.log('Profile picture updated successfully')
  } catch (error) {
    console.error('Failed to upload profile picture:', error)
    alert('Failed to upload profile picture: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Resend verification email
const resendVerificationEmail = async () => {
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
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    // Update user information from API response
    userData.value = response.data
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

// Open user settings dialog
const openUserSettings = () => {
  showUserSettings.value = true
}

// Fetch user groups
const fetchGroups = async () => {
  try {
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