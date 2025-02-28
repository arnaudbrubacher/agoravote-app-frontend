<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Profile Card -->
    <Card class="w-full max-w-2xl mx-auto">
      <CardContent class="p-6">
        <div class="flex items-start space-x-6">
          <!-- Profile Picture -->
          <div class="flex-shrink-0">
            <div v-if="profilePicture" class="w-16 h-16 rounded-full overflow-hidden border">
              <img :src="profilePicture" alt="Profile" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
         
          </div>
          
          <!-- User Info -->
          <div class="flex-1 space-y-2 py-2">
            <h3 class="text-lg font-medium">{{ userName || 'Loading...' }}</h3>
            <p class="text-sm text-muted-foreground">{{ userEmail || 'Loading...' }}</p>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex items-center ml-auto space-x-2">
            <!-- Add Settings Button -->
            <Button 
              variant="outline" 
              @click="openSettings"
              class="flex items-center"
            >
              <SettingsIcon class="mr-2 h-4 w-4" />
              Settings
            </Button>
            
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
        <!-- Add this new section for the groups list -->
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
                <Button variant="outline" size="sm" @click="viewGroup(group.id)">
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

          <!-- Loading State -->
          <div v-if="searchLoading" class="text-center py-4">
            <SpinnerIcon class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <span class="text-sm text-muted-foreground mt-2 block">Searching...</span>
          </div>

          <!-- Results -->
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
                <Button variant="outline" size="sm" @click="viewGroup(group.id)">
                  View
                </Button>
                <Button 
                  v-if="!userInGroup(group.id)"
                  variant="default" 
                  size="sm"
                  @click="joinGroup(group.id)"
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

          <!-- No Results -->
          <div v-else-if="searchQuery && !searchLoading" class="text-center py-4 text-muted-foreground">
            No groups found matching your search
          </div>

          <!-- Initial State -->
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

    <!-- User Settings Dialog - Now using the component -->
    <UserSettingsDialog
      v-model:open="showSettingsDialog"
      :userData="userData"
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
  Loader2 as SpinnerIcon 
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
import NewGroupDialog from '@/components/NewGroupDialog.vue'
import UserSettingsDialog from '@/components/UserSettingsDialog.vue'

const router = useRouter()

// User data refs
const userName = ref('')
const userEmail = ref('')
const profilePicture = ref(null)
const fileInput = ref(null)
const groups = ref([])
const userData = ref(null) // This will hold all user data to pass to the dialog

// Settings dialog ref
const showSettingsDialog = ref(false)

// New group dialog ref
const showNewGroupDialog = ref(false)

// Open settings dialog
const openSettings = () => {
  showSettingsDialog.value = true
}

// Handle profile picture upload
// This is kept for direct updates to the profile picture from the dashboard
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
    profilePicture.value = response.data.url
    
    // Show success message
    console.log('Profile picture updated successfully')
  } catch (error) {
    console.error('Failed to upload profile picture:', error)
    alert('Failed to upload profile picture: ' + (error.response?.data?.error || 'Unknown error'))
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

// Keep the rest of your existing methods
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

const viewGroup = (groupId) => {
    console.log('Navigating to group:', groupId)
    // Fix: Only use path, not path + params
    router.push(`/group/${groupId}`)
}

onMounted(() => {
  fetchUserInfo()
  fetchGroups()
})

const logout = () => {
  // Clear user session or token
  localStorage.removeItem('token')
  router.push('/auth')
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
</script>

<style>
/* Your styles here */
</style>