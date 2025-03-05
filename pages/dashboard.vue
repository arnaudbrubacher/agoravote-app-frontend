<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Groups Title with right-aligned header -->
    <div class="w-full max-w-2xl mx-auto flex justify-between items-center mb-8">
      <!-- Icon and title (left-aligned) -->
      <div class="flex items-center">
        <div class="flex-shrink-0 mr-2">
          <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <LayoutDashboard class="h-5 w-5 text-gray-600" />
          </div>
        </div>
        <h1 class="text-xl font-semibold">Groups</h1>
      </div>
      
      <!-- Right side - can be used for actions later if needed -->
      <div>
        <!-- Placeholder for future actions -->
      </div>
    </div>
    
    <!-- Groups Card -->
    <UserGroupsTab
      class="w-full max-w-2xl mx-auto"
      :groups="groups"
      :isLoading="isLoadingGroups"
      @create-group="openNewGroupDialog"
      @view-group="viewGroup"
      @find-group="showFindGroupDialog = true"
      @refresh-groups="fetchGroups"
    />

    <!-- Following Card -->
    <Card class="w-full max-w-2xl mx-auto mt-8">
      <CardHeader class="flex flex-row items-center justify-between">
        <CardTitle>Following</CardTitle>
        <Button variant="outline" size="sm" @click="showFindUsersDialog = true" class="flex items-center">
          <SearchIcon class="h-4 w-4 mr-2" />
          Find Users
        </Button>
      </CardHeader>
      <CardContent>
        <!-- Loading state -->
        <div v-if="isLoadingFollowing" class="text-center py-8">
          <SpinnerIcon class="h-6 w-6 animate-spin inline-block text-muted-foreground" />
          <span class="ml-2">Loading users...</span>
        </div>
        
        <!-- Empty state -->
        <div v-else-if="following.length === 0" class="text-center text-muted-foreground py-8">
          You're not following anyone yet. Find users to follow!
        </div>
        
        <!-- Users list -->
        <div v-else class="space-y-4">
          <UserCard 
            v-for="user in following" 
            :key="user.id" 
            :user="user" 
            @click="navigateToUserProfile(user.id)"
          />
        </div>
      </CardContent>
    </Card>

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
    
    <!-- Find Users Dialog -->
    <Dialog :open="showFindUsersDialog" @update:open="showFindUsersDialog = $event">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Find Users</DialogTitle>
          <DialogDescription>
            Search for users to follow
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 py-4">
          <!-- Search Input -->
          <div class="relative">
            <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              v-model="userSearchQuery"
              type="text"
              placeholder="Search for users..."
              class="w-full pl-10 pr-4 py-2 border rounded-md"
              @input="debounceUserSearch"
            />
          </div>

          <!-- Search results -->
          <div v-if="userSearchLoading" class="text-center py-4">
            <SpinnerIcon class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <span class="text-sm text-muted-foreground mt-2 block">Searching...</span>
          </div>

          <div v-else-if="userSearchResults.length" class="space-y-3 max-h-[400px] overflow-y-auto">
            <div 
              v-for="user in userSearchResults" 
              :key="user.id" 
              class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div class="flex items-center space-x-4">
                <div v-if="user.profile_picture" class="w-12 h-12 rounded-full overflow-hidden">
                  <img :src="user.profile_picture" :alt="user.name" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <User class="h-6 w-6 text-muted-foreground" />
                </div>
                
                <div>
                  <h4 class="font-medium">{{ user.name }}</h4>
                  <p class="text-sm text-muted-foreground">{{ user.email }}</p>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <Button variant="outline" size="sm" @click.stop="navigateToUserProfile(user.id)">
                  View
                </Button>
                <Button 
                  v-if="!isFollowing(user.id)"
                  variant="default" 
                  size="sm"
                  @click.stop="followUser(user.id)"
                >
                  Follow
                </Button>
                <Button 
                  v-else
                  variant="secondary" 
                  size="sm"
                  @click.stop="unfollowUser(user.id)"
                >
                  Unfollow
                </Button>
              </div>
            </div>
          </div>

          <div v-else-if="userSearchQuery && !userSearchLoading" class="text-center py-4 text-muted-foreground">
            No users found matching your search
          </div>

          <div v-else-if="!userSearchQuery" class="text-center py-4 text-muted-foreground">
            Type to search for users
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="showFindUsersDialog = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app-layout'
})

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { 
  SearchIcon, 
  Loader2 as SpinnerIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  Users as UserGroupIcon,
  User,
  LayoutDashboard
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle 
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import NewGroupDialog from '~/components/groups/NewGroupDialog.vue'
import UserGroupsTab from '~/components/groups/UserGroupsTab.vue'
import UserCard from '~/components/users/UserCard.vue'

const router = useRouter()

// User data refs
const userName = ref('')
const userEmail = ref('')
const profilePicture = ref(null)
const groups = ref([])
const isLoadingGroups = ref(false)
const userData = ref(null)

// Following users refs
const following = ref([])
const isLoadingFollowing = ref(false)
const showFindUsersDialog = ref(false)

// New group dialog ref
const showNewGroupDialog = ref(false)

// Find group dialog ref
const showFindGroupDialog = ref(false)

// User search refs
const userSearchQuery = ref('')
const userSearchResults = ref([])
const userSearchLoading = ref(false)
const userSearchTimeout = ref(null)

// Handle logout
const handleLogout = async () => {
  try {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to log out?')) {
      return
    }
    
    // Clear local storage
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    
    // Redirect to login page
    router.push('/auth')
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

// Navigate to user profile page
const navigateToUserProfile = (userId) => {
  router.push(`/user/${userId}`)
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

// Fetch following users
const fetchFollowing = async () => {
  try {
    isLoadingFollowing.value = true
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await axios.get('/user/following', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    following.value = response.data
    console.log('Following users fetched:', response.data)
  } catch (error) {
    console.error('Failed to fetch following users:', error)
    if (error.response?.status === 401) {
      router.push('/auth')
    }
  } finally {
    isLoadingFollowing.value = false
  }
}

// Check if user is already being followed
const isFollowing = (userId) => {
  return following.value.some(user => user.id === userId)
}

// Follow a user
const followUser = async (userId) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    await axios.post(`/user/follow/${userId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    // Refresh following list
    await fetchFollowing()
    
    // Show success message
    alert('Successfully followed user!')
  } catch (error) {
    console.error('Failed to follow user:', error)
    alert('Failed to follow user: ' + (error.response?.data?.message || 'Unknown error'))
  }
}

// Unfollow a user
const unfollowUser = async (userId) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    await axios.delete(`/user/follow/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    // Refresh following list
    await fetchFollowing()
    
    // Show success message
    alert('Successfully unfollowed user!')
  } catch (error) {
    console.error('Failed to unfollow user:', error)
    alert('Failed to unfollow user: ' + (error.response?.data?.message || 'Unknown error'))
  }
}

// Debounce user search
const debounceUserSearch = () => {
  if (userSearchTimeout.value) {
    clearTimeout(userSearchTimeout.value)
  }
  
  userSearchTimeout.value = setTimeout(() => {
    searchUsers()
  }, 500)
}

// Search for users
const searchUsers = async () => {
  if (!userSearchQuery.value.trim()) {
    userSearchResults.value = []
    return
  }
  
  try {
    userSearchLoading.value = true
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await axios.get(`/users/search`, {
      params: {
        query: userSearchQuery.value
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    userSearchResults.value = response.data || []
    console.log('User search results:', userSearchResults.value)
  } catch (error) {
    console.error('Failed to search users:', error)
    userSearchResults.value = []
  } finally {
    userSearchLoading.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
  fetchGroups()
  fetchFollowing()
})
</script>

<style>
/* Your styles here */
</style>