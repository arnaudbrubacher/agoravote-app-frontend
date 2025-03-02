<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/pages/user/[id].vue -->
<template>
  <div class="container mx-auto py-8 px-4">
    <!-- Navigation Button -->
    <div class="w-full max-w-2xl mx-auto">
      <Button 
        variant="outline" 
        size="sm" 
        @click="router.push('/dashboard')" 
        class="flex items-center mb-4"
      >
        <ArrowLeftIcon class="h-4 w-4 mr-1" />
        Back to Dashboard
      </Button>
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
        @click="() => router.push('/dashboard')"
      >
        Return to Dashboard
      </Button>
    </div>
    
    <!-- User profile -->
    <template v-else-if="userData">
      <div class="max-w-2xl mx-auto">
        <!-- User Profile Card -->
        <UserProfileCard
          :user="userData"
          :is-current-user="false"
          :common-groups="commonGroups"
          @navigate-group="navigateToGroup"
        />
        
        <!-- User's posts -->
        <Card class="mt-6">
          <CardContent class="p-6">
            <UserPostsList
              :posts="posts"
              :loading="postsLoading"
              :is-current-user="false"
              :show-create-button="false"
              @open-post="openPostDetails"
            />
          </CardContent>
        </Card>
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import LucideIcon from '@/components/LucideIcon.vue'
import PostDetailsDialog from '@/components/shared/posts/PostDetailsDialog.vue'
import UserProfileCard from '@/components/shared/users/UserCard.vue'
import UserPostsList from '@/components/shared/posts/PostCard.vue'
import { useUserPosts } from '@/composables/useUserPosts'
import { useUserProfile } from '@/composables/useUserProfile'

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

// Navigate to group page
const navigateToGroup = (groupId) => {
  router.push(`/group/${groupId}`)
}

// Open post details
const openPostDetails = (post) => {
  selectedPost.value = post
}

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