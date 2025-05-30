<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Profile header with consistent styling -->
    <div class="w-full max-w-2xl mx-auto flex items-center justify-between mb-8">
      <div class="flex items-center">
        <div class="flex-shrink-0 mr-3">
          <div v-if="!profilePictureUrl" class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <User class="h-7 w-7 text-gray-600" />
          </div>
          <img 
            v-else
            :src="profilePictureUrl" 
            alt="User Profile Picture"
            class="w-12 h-12 rounded-full object-cover border"
          />
        </div>
        <h1 class="text-xl font-semibold">{{ userData?.name || 'User' }}</h1>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LucideIcon name="RefreshCw" size="8" class="h-8 w-8 animate-spin text-primary" />
      <span class="ml-2">Loading profile...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="max-w-md mx-auto bg-red-50 p-6 rounded-lg border border-red-200">
      <div class="flex items-center mb-4">
        <LucideIcon name="AlertCircle" size="6" class="h-6 w-6 text-red-500 mr-2" />
        <h2 class="text-lg font-semibold text-red-700">Error</h2>
      </div>
      <p class="text-red-600">{{ error }}</p>
      <Button 
        class="mt-4" 
        variant="outline" 
        @click="() => router.push('/auth')"
      >
        Return to Login
      </Button>
    </div>
    
    <!-- User Profile -->
    <template v-else>
      
    
      <!-- Personal Posts Card -->
      <div class="w-full max-w-2xl mx-auto mt-6 p-6">
        <Postslist
          :posts="posts"
          :loading="postsLoading"
          :is-current-user="true"
          :show-create-button="true"
          @create-post="showNewPostDialog = true"
          @open-post="selectedPost = $event"
        />
      </div>
    </template>

    <!-- Hidden file input for profile picture -->
    <input 
      type="file" 
      ref="fileInput" 
      class="hidden"
      accept="image/*" 
      @change="handleProfilePictureUpload" 
    />

    <!-- Dialogs -->
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
      @refresh="fetchPosts"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app-layout'
})

import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { User } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import LucideIcon from '@/components/LucideIcon.vue'
import NewPostDialog from '@/components/posts/NewPostDialog.vue'
import PostDetailsDialog from '@/components/posts/PostDetailsDialog.vue'
import Postslist from '@/components/posts/Postslist.vue'
import { useUserPosts } from '@/composables/useUserPosts'
import { useUserProfile } from '@/composables/useUserProfile'
import { useAlert } from '@/composables/useAlert'
import axios from 'axios'
import Session from 'supertokens-web-js/recipe/session'

const router = useRouter()
const { $axiosInstance } = useNuxtApp()
const fileInput = ref(null)
const showNewPostDialog = ref(false)
const selectedPost = ref(null)

// Debug: Check if axios instance is available
console.log('[Profile Page] $axiosInstance availability check:', !!$axiosInstance)
if (!$axiosInstance) {
  console.error('[Profile Page] $axiosInstance is undefined! This will cause errors in composables.')
}

// Use composables
const { 
  userData, 
  loading, 
  error, 
  fetchCurrentUserProfile, 
  updateProfilePicture,
  resendVerificationEmail,
  createUserProfile
} = useUserProfile()

const {
  posts,
  loading: postsLoading,
  fetchPosts,
  createNewPost,
  handlePostCreated: addNewPostToList,
  editPost,
  deletePost
} = useUserPosts()

const { alert, confirm } = useAlert()

// Trigger file input for profile picture
const triggerFileInput = () => {
  fileInput.value.click()
}

// Handle profile picture upload
const handleProfilePictureUpload = async (event) => {
  const file = event.target.files[0]
  try {
    await updateProfilePicture(file)
  } catch (error) {
    await alert('Failed to upload profile picture: ' + (error.response?.data?.error || 'Unknown error'), 'Error')
  }
}

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
    await fetchPosts() // Refresh posts
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

// Handle user data refresh
const handleUserDataRefresh = async () => {
  console.log('Refreshing user data...')
  await fetchCurrentUserProfile()
  console.log('User data refreshed:', userData.value)
  // Dispatch event to potentially update other parts of the app if needed
  window.dispatchEvent(new CustomEvent('user-data-updated'))
}

// Computed property for profile picture URL
const profilePictureUrl = computed(() => {
  if (!userData.value?.profile_picture) return null
  
  // If the profile picture is a full URL, return it as is
  if (userData.value.profile_picture.startsWith('http')) {
    return userData.value.profile_picture
  }
  
  // Otherwise, prepend the API base URL
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl || 'http://localhost:8088'
  return `${baseUrl}/${userData.value.profile_picture}`
})

// Initialize
onMounted(async () => {
  console.log('Profile page - checking session...')
  
  // Check and clear intentional group deletion flag
  const wasIntentionalDeletion = localStorage.getItem('intentionalGroupDeletion') === 'true'
  const deletedGroupId = localStorage.getItem('deletedGroupId')
  
  if (wasIntentionalDeletion) {
    console.log('Profile page loaded after intentional group deletion:', deletedGroupId)
    // Clear the flag immediately to prevent any issues with future operations
    localStorage.removeItem('intentionalGroupDeletion')
    localStorage.removeItem('deletedGroupId')
    // Dispatch an event to refresh the UI components
    window.dispatchEvent(new CustomEvent('group-deletion-complete'))
  }
  
  try {
    // Check if session exists
    const sessionExists = await Session.doesSessionExist()
    console.log('Profile page - Session check: ', sessionExists)
    
    if (!sessionExists) {
      console.warn('No session found on profile page load, redirecting to auth...')
      router.push('/auth')
      return
    }
    
    // If we get here, session exists - fetch data
    await Promise.all([
      fetchCurrentUserProfile(),
      fetchPosts()
    ])
  } catch (error) {
    console.error('Error initializing profile page:', error)
    if (error.message.includes('session') || error.response?.status === 401) {
      router.push('/auth')
    } else {
      error.value = 'Failed to load profile data'
    }
  }
})
</script> 