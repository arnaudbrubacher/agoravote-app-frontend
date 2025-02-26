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
        <div class="flex items-center justify-between mb-6">
          <div class="space-y-1">
            <h4 class="text-sm font-medium">Total Groups</h4>
            <p class="text-2xl font-bold">{{ groups.length }}</p>
          </div>
          <Button @click="openNewGroupDialog" class="flex items-center">
            <PlusIcon class="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>

        <!-- Add this new section for the groups list -->
        <div class="space-y-4">
          <div v-if="groups.length === 0" class="text-center py-6 text-muted-foreground">
            No groups yet. Create your first group!
          </div>
          
          <div 
            v-for="group in groups" 
            :key="group.id" 
            class="cursor-pointer"
            @click="viewGroup(group.id)"
          >
            <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div class="flex items-center space-x-4">
                <div v-if="group.picture" class="w-12 h-12 rounded-full overflow-hidden">
                  <img :src="group.picture" :alt="group.name" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <UserGroupIcon class="h-6 w-6 text-muted-foreground" />
                </div>
                
                <div>
                  <h4 class="font-medium">{{ group.name }}</h4>
                  <p class="text-sm text-muted-foreground">{{ group.description }}</p>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <Button variant="outline" size="sm" @click="viewGroup(group.id)">
                  View
                </Button>
                <Button 
                  v-if="group.isPrivate" 
                  variant="secondary" 
                  size="sm"
                >
                  Private
                </Button>
              </div>
            </div>
          </div>
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
import { UserGroupIcon } from '@heroicons/vue/outline'  // Keep only this import
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

const fetchGroups = async () => {
    try {
        const token = localStorage.getItem('token')
        if (!token) {
            throw new Error('No authentication token found')
        }

        const response = await axios.get('/user/groups', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        groups.value = response.data
        console.log('User groups fetched:', response.data)
    } catch (error) {
        console.error('Failed to fetch user groups:', error)
        if (error.response?.status === 401) {
            router.push('/auth')
        }
    }
}

const viewGroup = (groupId) => {
    console.log('Navigating to group:', groupId)
    // Fix: Only use path, not path + params
    router.push(`/group/${groupId}`)
}

onMounted(() => {
  fetchUserInfo()
  fetchGroups()
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

const handleGroupCreated = async (newGroup) => {
  await fetchGroups() // Refresh the entire list
  closeNewGroupDialog()
}
</script>

<style>
/* Your styles here */
</style>