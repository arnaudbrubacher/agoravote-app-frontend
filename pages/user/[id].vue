<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/pages/user/[id].vue -->
<template>
  <div class="container mx-auto py-8 px-4">
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
    <div v-else-if="user" class="max-w-2xl mx-auto">
      <Card class="mb-6">
        <CardHeader class="flex flex-row items-center justify-between">
          <div class="flex items-center space-x-4">
            <Button variant="outline" size="sm" @click="router.push('/dashboard')" class="flex items-center">
              <ArrowLeftIcon class="h-4 w-4 mr-1" />
              <span>Back to Dashboard</span>
            </Button>
            
            <!-- User avatar and name in header -->
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mr-3">
                <div v-if="!user.profilePicture" class="text-lg font-bold text-primary/70">
                  {{ getUserInitial(user) }}
                </div>
                <img 
                  v-else 
                  :src="user.profilePicture" 
                  :alt="`${user.name}'s profile picture`"
                  class="w-full h-full object-cover"
                />
              </div>
              <CardTitle>{{ user.name }}</CardTitle>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <!-- Groups in common -->
          <div v-if="commonGroups && commonGroups.length > 0" class="mb-6">
            <h3 class="text-md font-medium mb-2">Groups in common:</h3>
            <div class="flex flex-wrap gap-2">
              <Badge 
                v-for="group in commonGroups" 
                :key="group.id"
                class="cursor-pointer"
                @click="navigateToGroup(group.id)"
              >
                {{ group.name }}
              </Badge>
            </div>
          </div>
          
          <!-- User's posts -->
          <div class="mt-6">
            <h3 class="text-lg font-medium mb-4">Posts</h3>
            
            <!-- Loading posts state -->
            <div v-if="loadingPosts" class="flex justify-center items-center py-6">
              <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin text-primary" />
              <span class="ml-2">Loading posts...</span>
            </div>
            
            <!-- No posts state -->
            <div v-else-if="!userPosts || userPosts.length === 0" class="text-center py-8 text-muted-foreground">
              This user hasn't posted anything yet.
            </div>
            
            <!-- Posts list -->
            <div v-else class="space-y-4">
              <div 
                v-for="post in userPosts" 
                :key="post.id"
                class="border rounded-md p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                @click="openPostDetails(post)"
              >
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-medium">{{ post.title }}</h4>
                  <span class="text-xs text-muted-foreground">
                    {{ formatPostDate(post.created_at) }}
                  </span>
                </div>
                <p class="text-sm line-clamp-2">{{ post.content }}</p>
                
                <!-- Post footer with stats -->
                <div class="flex items-center space-x-4 mt-3 pt-2 border-t text-sm text-muted-foreground">
                  <div class="flex items-center">
                    <LucideIcon name="MessageSquare" size="4" class="h-4 w-4 mr-1" />
                    <span>{{ post.comment_count || 0 }}</span>
                  </div>
                  <div class="flex items-center">
                    <LucideIcon name="QuestionMark" size="4" class="h-4 w-4 mr-1" />
                    <span>{{ post.like_count || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <!-- Post details dialog -->
      <PostDetailsDialog
        v-if="selectedPost"
        :post="selectedPost"
        :current-user-id="currentUserId"
        @close="selectedPost = null"
      />
    </div>
  </div>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { Icon } from '@iconify/vue'
import { ArrowLeftIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PostDetailsDialog from '@/components/group/dialogs/PostDetailsDialog.vue'

const route = useRoute()
const router = useRouter()
const user = ref(null)
const loading = ref(true)
const error = ref(null)
const commonGroups = ref([])
const userPosts = ref([])
const loadingPosts = ref(false)
const selectedPost = ref(null)
const currentUserId = ref('') // You'll need to set this from your auth store

// Fetch user profile data
const fetchUserProfile = async () => {
  try {
    loading.value = true
    error.value = null
    
    const userId = route.params.id
    const response = await axios.get(`/user/profile/${userId}`)
    
    // Set user data
    user.value = response.data
    
    // Check if common groups data is available
    if (response.data.commonGroups) {
      commonGroups.value = response.data.commonGroups
    }
    
    document.title = `${user.value.name} - AgoraVote`
    
    // After loading the profile, fetch the user's posts
    await fetchUserPosts(userId)
  } catch (err) {
    console.error('Failed to fetch user profile:', err)
    error.value = err.response?.data?.error || 'Failed to load user profile'
  } finally {
    loading.value = false
  }
}

// Fetch user's posts
const fetchUserPosts = async (userId) => {
  try {
    loadingPosts.value = true
    
    // Use the correct endpoint without the /api prefix
    const response = await axios.get(`/users/${userId}/posts`)
    
    userPosts.value = response.data.posts || response.data || []
    console.log('Fetched user posts:', userPosts.value)
  } catch (err) {
    console.error('Failed to fetch user posts:', err)
    // Add more detailed error logging
    console.error('Error details:', err.response?.status, err.response?.data)
    userPosts.value = [] // Set to empty array on error
  } finally {
    loadingPosts.value = false
  }
}

// Get user initial for avatar placeholder
const getUserInitial = (user) => {
  if (!user || !user.name) return '?'
  return user.name.charAt(0).toUpperCase()
}

// Format date for posts
const formatPostDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
}

// Navigate to group page
const navigateToGroup = (groupId) => {
  router.push(`/group/${groupId}`)
}

// Open post details
const openPostDetails = (post) => {
  selectedPost.value = post
}

onMounted(fetchUserProfile)
</script>