<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Profile Card -->
    <Card class="w-full max-w-2xl mx-auto">
      <CardContent class="p-6">
        <div class="flex items-start space-x-6">
          <div class="flex-1 space-y-2 py-2">
            <h3 class="text-lg font-medium">{{ userName || 'Loading...' }}</h3>
            <p class="text-sm text-muted-foreground">{{ userEmail || 'Loading...' }}</p>
          </div>
          <div class="flex items-center ml-auto space-x-2">
            <Button 
              variant="outline" 
              @click="logout"
              class="flex items-center"
            >
              <LogOutIcon class="mr-2 h-4 w-4" />
              Log Out
            </Button>
            <Button 
              variant="destructive" 
              @click="deleteAccount"
              class="flex items-center"
            >
              <TrashIcon class="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Groups Card -->
    <Card class="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Groups</CardTitle>
        <CardDescription>Groups you've created or joined</CardDescription>
      </CardHeader>
      <CardContent class="p-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <h4 class="text-sm font-medium">Total Groups</h4>
            <p class="text-2xl font-bold">{{ groups.length }}</p>
          </div>
          <Button @click="openNewGroupDialog" class="flex items-center">
            <PlusIcon class="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- New Group Dialog -->
    <NewGroupDialog
      v-if="showNewGroupDialog"
      @close="closeNewGroupDialog"
      @group-created="handleGroupCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { LogOutIcon, TrashIcon, PlusIcon } from 'lucide-vue-next'
// Import shadcn components
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card'
import NewGroupDialog from '@/components/NewGroupDialog'

const router = useRouter()

const userName = ref('')
const userEmail = ref('')
const profilePicture = ref(null)
const showNewGroupDialog = ref(false)
const groups = ref([])

const fetchUserInfo = async () => {
  try {
    // Get token and userId from localStorage
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    
    if (!token || !userId) {
      throw new Error('Authentication credentials not found')
    }

    // Make API call to get user profile
    const response = await axios.get(`/user/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    // Update user information from API response
    userName.value = response.data.name
    userEmail.value = response.data.email
    profilePicture.value = response.data.profilePicture || null

    console.log('User profile fetched:', response.data) // Debug log
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

// Dialog handlers
const openNewGroupDialog = () => {
  showNewGroupDialog.value = true
}

const closeNewGroupDialog = () => {
  showNewGroupDialog.value = false
}

const handleGroupCreated = (newGroup) => {
  groups.value.push(newGroup)
  closeNewGroupDialog()
}
</script>

<style>
/* Your styles here */
</style>