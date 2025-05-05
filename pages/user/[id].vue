<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/pages/user/[id].vue -->
<template>
  <div class="container mx-auto py-8 px-4">
    <!-- User header with left-aligned name and right-aligned space -->
    <div class="w-full max-w-2xl mx-auto flex flex-col items-center mb-8">
      <!-- User info (centered) -->
      <div class="flex flex-col items-center text-center">
        <div class="flex-shrink-0 mb-2">
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
      <span class="ml-2">Loading user profile...</span>
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
        @click="() => router.push('/profile')"
      >
        Return to Profile
      </Button>
    </div>
    
    <!-- User profile -->
    <template v-else-if="userData">
      <div class="max-w-2xl mx-auto">
        <!-- User's posts -->
        <div class="mt-6 p-6">
          <PostCard
            :posts="posts"
            :loading="postsLoading"
            :is-current-user="false"
            :show-create-button="false"
            @open-post="openPostDetails"
          />
        </div>
      </div>
      
      <!-- Post details dialog -->
      <PostDetailsDialog
        v-if="selectedPost"
        :post="selectedPost"
        :current-user-id="currentUserId"
        @close="selectedPost = null"
      />
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'app-layout'
})

import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, Settings as SettingsIcon, User } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import LucideIcon from '@/components/LucideIcon.vue'
import PostDetailsDialog from '~/components/posts/PostDetailsDialog.vue'
import UserProfileCard from '~/components/users/UserCard.vue'
import PostCard from '~/components/posts/Postslist.vue'
import { useUserPosts } from '@/composables/useUserPosts'
import { useUserProfile } from '@/composables/useUserProfile'
import { useAlert } from '@/composables/useAlert'

const route = useRoute()
const router = useRouter()
const selectedPost = ref(null)
const currentUserId = ref(localStorage.getItem('userId') || '')

// Use composables
const { 
  userData, 
  loading, 
  error, 
  commonGroups,
  fetchUserProfile
} = useUserProfile()

const {
  posts,
  loading: postsLoading,
  fetchPosts
} = useUserPosts()

const { alert, confirm } = useAlert()

// Navigate to group page
const navigateToGroup = (groupId) => {
  router.push(`/group/${groupId}`)
}

// Open post details
const openPostDetails = (post) => {
  selectedPost.value = post
}

// Open settings
const openSettings = async () => {
  // You can implement settings functionality here
  // For now, use the confirm dialog
  const result = await confirm(
    'Settings functionality will be implemented soon. Would you like to be notified when it\'s ready?',
    'Coming Soon',
    { actionText: 'Yes, notify me', cancelText: 'No thanks' }
  )
  
  if (result) {
    await alert('You will be notified when the settings feature is available.', 'Notification Set')
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

onMounted(async () => {
  const userId = route.params.id
  
  // Fetch user profile
  await fetchUserProfile(userId)
  
  // Set page title
  if (userData.value) {
    document.title = `${userData.value.name} - AgoraVote`
  }
  
  // Fetch user's posts
  await fetchPosts(userId)
})
</script>