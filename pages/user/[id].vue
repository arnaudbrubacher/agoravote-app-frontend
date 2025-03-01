<!-- filepath: /Users/arnaudbrubacher/Desktop/-AGORA/CODE/agoravote-app-frontend/pages/user/[id].vue -->
<template>
  <div class="container mx-auto py-8 px-4">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Icon name="heroicons:arrow-path" class="h-8 w-8 animate-spin text-primary" />
      <span class="ml-2">Loading user profile...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="max-w-md mx-auto bg-red-50 p-6 rounded-lg border border-red-200">
      <div class="flex items-center mb-4">
        <Icon name="heroicons:exclamation-circle" class="h-6 w-6 text-red-500 mr-2" />
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
            <Button variant="ghost" @click="router.push('/dashboard')" class="p-2 border">
              <ArrowLeftIcon class="h-4 w-4" />
              <span class="ml-2">Back</span>
            </Button>
            <CardTitle>User Profile</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent>
          <div class="flex flex-col items-center sm:flex-row sm:items-start sm:space-x-6">
            <!-- User avatar -->
            <div class="w-32 h-32 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mb-4 sm:mb-0">
              <div v-if="!user.profilePicture" class="text-4xl font-bold text-primary/70">
                {{ getUserInitial(user) }}
              </div>
              <img 
                v-else 
                :src="user.profilePicture" 
                :alt="`${user.name}'s profile picture`"
                class="w-full h-full object-cover"
              />
            </div>
            
            <!-- User details -->
            <div class="flex-1 text-center sm:text-left">
              <h2 class="text-2xl font-bold">{{ user.name }}</h2>
              <p class="text-muted-foreground mt-1">
                {{ user.userTagline || 'No bio available' }}
              </p>
              
              <div class="mt-6 space-y-4">
                <!-- Member since -->
                <div class="flex flex-col sm:flex-row sm:items-center text-sm">
                  <span class="font-medium mr-2">Member since:</span>
                  <span class="text-muted-foreground">{{ formatDate(user.createdAt) }}</span>
                </div>
                
                <!-- Groups in common -->
                <div v-if="commonGroups && commonGroups.length > 0" class="mt-4">
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
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

const route = useRoute()
const router = useRouter()
const user = ref(null)
const loading = ref(true)
const error = ref(null)
const commonGroups = ref([])

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
    
    document.title = `${user.value.name} - AgoraVote Profile`
  } catch (err) {
    console.error('Failed to fetch user profile:', err)
    error.value = err.response?.data?.error || 'Failed to load user profile'
  } finally {
    loading.value = false
  }
}

// Get user initial for avatar placeholder
const getUserInitial = (user) => {
  if (!user || !user.name) return '?'
  return user.name.charAt(0).toUpperCase()
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// Navigate to group page
const navigateToGroup = (groupId) => {
  router.push(`/group/${groupId}`)
}

onMounted(fetchUserProfile)
</script>