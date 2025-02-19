<template>
  <div class="space-y-6">
    <!-- Profile Info Card -->
    <Card>
      <CardContent class="p-6">
        <div class="flex items-start space-x-6">
          <div class="relative">
            <div v-if="profilePicture" class="w-24 h-24">
              <img 
                :src="profilePicture" 
                alt="Profile picture"
                class="w-full h-full rounded-full object-cover"
              />
            </div>
            <div v-else class="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <UserCircleIcon class="w-16 h-16 text-muted-foreground" />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              class="absolute -bottom-2 -right-2"
              @click="triggerFileInput"
            >
              <PencilIcon class="h-4 w-4" />
            </Button>
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden" 
              accept="image/*"
              @change="updateProfilePicture" 
            />
          </div>
          <div class="flex-1 space-y-2 py-2">
            <h3 class="text-lg font-medium">{{ userName }}</h3>
            <p class="text-sm text-muted-foreground">{{ userEmail }}</p>
          </div>
          <div class="flex items-center ml-auto space-x-2">
            <Button 
              variant="outline" 
              @click="logout"
            >
              Log Out
            </Button>
            <Button 
              variant="outline" 
              @click="deleteAccount"
              class="text-red-600"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios' // Use the Axios instance with the interceptor
import { decode } from 'jwt-decode' // Use named import

const router = useRouter()

const userName = ref('')
const userEmail = ref('')
const profilePicture = ref(null)

const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Token not found')
    }

    const decoded = decode(token)
    userName.value = decoded.name
    userEmail.value = decoded.email

    // Optionally, fetch additional user details from the server
    const userId = decoded.user_id
    const response = await axios.get(`/user/profile/${userId}`)
    profilePicture.value = response.data.profilePicture
  } catch (error) {
    console.error('Failed to fetch user info:', error)
  }
}

onMounted(() => {
  fetchUserInfo()
})

const triggerFileInput = () => {
  fileInput.value.click()
}

const updateProfilePicture = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      profilePicture.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const logout = () => {
  // Clear user session or token
  localStorage.removeItem('token')
  router.push('/auth')
}

const deleteAccount = async () => {
  try {
    const userId = localStorage.getItem('userId') // Assuming userId is stored in localStorage
    await axios.delete(`/user/${userId}`)
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    router.push('/auth')
  } catch (error) {
    console.error('Failed to delete account:', error)
  }
}
</script>

<style>
/* Your styles here */
</style>