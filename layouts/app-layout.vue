<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container flex h-16 items-center px-4">
        <div class="flex w-full items-center justify-between">
          <h1 class="text-xl font-bold">Agora Vote</h1>
          
          <!-- User Card - Only show when authenticated -->
          <div 
            v-if="isAuthenticated" 
            class="flex items-center cursor-pointer"
            @click="navigateToProfile"
          >
            <div class="flex-shrink-0 mr-2">
              <div v-if="!userData?.profile_picture" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User class="h-5 w-5 text-gray-400" />
              </div>
              <img 
                v-else
                :src="userData.profile_picture" 
                alt="User Profile Picture"
                class="w-8 h-8 rounded-full object-cover border"
              />
            </div>
            <span class="text-sm font-medium mr-2">{{ userData?.name || 'User' }}</span>
          </div>
        </div>
      </div>
    </header>
    <main class="container mx-auto py-6 px-4">
      <slot />
    </main>
    <footer class="border-t">
      <div class="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Agora Vote. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import axios from '~/src/utils/axios'

const router = useRouter()
const route = useRoute()
const userData = ref(null)
const loading = ref(false)

// Check if user is authenticated
const isAuthenticated = computed(() => {
  return !!localStorage.getItem('token')
})

// Navigate to user profile
const navigateToProfile = () => {
  const userId = localStorage.getItem('userId')
  if (userId) {
    router.push(`/profile`)
  }
}

// Fetch user data if authenticated
const fetchUserData = async () => {
  if (isAuthenticated.value) {
    try {
      loading.value = true
      // Use axios instance with proper configuration
      const response = await axios.get('/users/me')
      userData.value = response.data
      console.log('User data fetched for layout:', userData.value)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      if (error.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        router.push('/auth')
      }
    } finally {
      loading.value = false
    }
  }
}

onMounted(() => {
  fetchUserData()
})
</script>