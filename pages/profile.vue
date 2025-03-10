<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Profile header with consistent styling -->
    <div class="w-full max-w-2xl mx-auto flex justify-between items-center mb-8">
      <!-- User info (left-aligned) -->
      <div class="flex items-center">
        <div class="flex-shrink-0 mr-2">
          <div v-if="!profilePictureUrl" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User class="h-5 w-5 text-gray-600" />
          </div>
          <img 
            v-else
            :src="profilePictureUrl" 
            alt="User Profile Picture"
            class="w-8 h-8 rounded-full object-cover border"
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
        @click="() => router.push('/dashboard')"
      >
        Return to Dashboard
      </Button>
    </div>
    
    <!-- User Profile -->
    <template v-else>
      
    
      <!-- Personal Posts Card -->
      <Card class="w-full max-w-2xl mx-auto mt-6">
        <CardContent class="p-6">
          <Postslist
            :posts="posts"
            :loading="postsLoading"
            :is-current-user="true"
            :show-create-button="true"
            @create-post="showNewPostDialog = true"
            @open-post="selectedPost = $event"
          />
        </CardContent>
      </Card>
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
import { Card, CardContent } from '@/components/ui/card'
import LucideIcon from '@/components/LucideIcon.vue'
import NewPostDialog from '@/components/posts/NewPostDialog.vue'
import PostDetailsDialog from '@/components/posts/PostDetailsDialog.vue'
import UserProfileCard from '@/components/users/UserCard.vue'
import Postslist from '@/components/posts/Postslist.vue'
import { useUserPosts } from '@/composables/useUserPosts'
import { useUserProfile } from '@/composables/useUserProfile'

const router = useRouter()
const fileInput = ref(null)
const showNewPostDialog = ref(false)
const selectedPost = ref(null)

// Use composables
const { 
  userData, 
  loading, 
  error, 
  fetchCurrentUserProfile, 
  updateProfilePicture,
  resendVerificationEmail
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
    alert('Failed to upload profile picture: ' + (error.response?.data?.error || 'Unknown error'))
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

onMounted(() => {
  fetchCurrentUserProfile()
  fetchPosts()
  document.title = 'My Profile - AgoraVote'
})
</script> 