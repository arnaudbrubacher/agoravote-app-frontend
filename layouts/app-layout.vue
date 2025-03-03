<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container mx-auto flex h-16 items-center px-4">
        <div class="flex w-full items-center justify-between">
          <!-- Dashboard Button (always shown when authenticated) -->
          <div 
            v-if="isAuthenticated" 
            class="flex items-center cursor-pointer"
            @click="navigateToDashboard"
          >
            <div class="flex-shrink-0 mr-2">
              <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <LayoutDashboard class="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <span class="text-sm font-medium">Groups</span>
          </div>
          
          
          <!-- App Title (center) -->
          <h1 class="text-xl font-bold absolute left-1/2 transform -translate-x-1/2">Agora Vote</h1>
          
          <!-- User Card (right) - Only show when authenticated -->
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
            <span class="text-sm font-medium">{{ userData?.name || 'User' }}</span>
          </div>
          <div v-else class="w-[120px]"></div> <!-- Spacer when user card is not shown -->
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
import { User, LayoutDashboard } from 'lucide-vue-next'
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

// Check if currently on dashboard page
const isOnDashboard = computed(() => {
  return route.path === '/dashboard'
})

// Navigate to user profile
const navigateToProfile = () => {
  const userId = localStorage.getItem('userId')
  if (userId) {
    router.push(`/profile`)
  }
}

// Navigate to dashboard
const navigateToDashboard = () => {
  // Only navigate if not already on dashboard
  if (!isOnDashboard.value) {
    router.push('/dashboard')
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