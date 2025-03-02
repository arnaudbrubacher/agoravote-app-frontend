<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Navigation Button -->
    <div class="w-full max-w-2xl mx-auto">
      <Button 
        variant="outline" 
        size="sm" 
        @click="router.push('/dashboard')"
        class="flex items-center mb-4"
      >
        <ArrowLeftIcon class="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
    </div>
    
    <!-- User Profile Card -->
    <Card class="w-full max-w-2xl mx-auto">
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
                <h2 class="text-xl font-semibold">{{ userName || 'Your Profile' }}</h2>
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

    <!-- Personal Posts Card -->
    <UserPostsTab
      class="w-full max-w-2xl mx-auto"
      @show-new-post="showNewPostDialog = true"
      @open-post="selectedPost = $event"
    />

    <!-- Dialogs -->
    <UserSettingsDialog
      :open="showUserSettings"
      :userData="userData"
      @update:open="showUserSettings = $event"
      @refresh-user-data="fetchUserInfo"
    />

    <NewPostDialog
      v-if="showNewPostDialog"
      @close="showNewPostDialog = false"
      @submit="handlePostCreated"
    />

    <PostDetailsDialog
      v-if="selectedPost"
      :post="selectedPost"
      :current-user-id="userData?.id"
      @close="selectedPost = null"
      @edit="handlePostEdited"
      @delete="handlePostDeleted"
      @refresh="refreshUserPosts"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { 
  Settings as SettingsIcon, 
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  ArrowLeft as ArrowLeftIcon
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent 
} from '@/components/ui/card'
import UserSettingsDialog from '@/components/UserSettingsDialog.vue'
import UserPostsTab from '@/components/dashboard/posts/UserPostsTab.vue'
import NewPostDialog from '@/components/shared/NewPostDialog.vue'
import PostDetailsDialog from '@/components/shared/PostDetailsDialog.vue'
import { useUserPosts } from '@/composables/useUserPosts'

const router = useRouter()

// User data refs
const userName = ref('')
const userEmail = ref('')
const profilePicture = ref(null)
const fileInput = ref(null)
const userData = ref(null)
const showUserSettings = ref(false)

// New post dialog ref
const showNewPostDialog = ref(false)
const selectedPost = ref(null)

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

// Open user settings dialog
const openUserSettings = () => {
  showUserSettings.value = true
}

const {
  fetchPosts: fetchUserPosts,
  createNewPost,
  handlePostCreated: addNewPostToList,
  editPost,
  deletePost
} = useUserPosts()

const handlePostCreated = async (postData) => {
  try {
    const newPost = await createNewPost(postData)
    addNewPostToList(newPost)
    showNewPostDialog.value = false
  } catch (error) {
    console.error('Failed to create post:', error)
  }
}

const handlePostEdited = async (post) => {
  try {
    await editPost(post)
    selectedPost.value = null
    await fetchUserPosts() // Refresh posts
  } catch (error) {
    console.error('Failed to edit post:', error)
  }
}

const handlePostDeleted = async (post) => {
  try {
    await deletePost(post)
    selectedPost.value = null
  } catch (error) {
    console.error('Failed to delete post:', error)
  }
}

const refreshUserPosts = () => {
  fetchUserPosts()
}

onMounted(() => {
  fetchUserInfo()
  fetchUserPosts()
})
</script> 