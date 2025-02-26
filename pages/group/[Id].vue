<template>
  <div class="container mx-auto p-6">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      Loading group information...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ error }}
    </div>

    <!-- Group Content -->
    <div v-else-if="group" class="space-y-6">
      <!-- Group Header with Info -->
      <Card class="w-full">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-4">
              <Button variant="ghost" @click="router.push('/dashboard')" class="p-2 border">
                <ArrowLeftIcon class="h-4 w-4" />
                <span class="ml-2">Back</span>
              </Button>
              <div>
                <h1 class="text-3xl font-bold">{{ group.name }}</h1>
                <p class="text-muted-foreground">{{ group.description }}</p>
              </div>
            </div>
            
            <div class="flex space-x-2">
              <!-- Settings button only shown if user is admin -->
              <Button 
                v-if="isAdmin"
                variant="outline" 
                size="sm"
                @click="showSettingsDialog = true"
                class="flex items-center"
              >
                <SettingsIcon class="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <!-- Group Content Tabs -->
      <Tabs defaultValue="votes" class="w-full">
        <TabsList>
          <TabsTrigger value="votes">Votes</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <!-- Votes Tab -->
        <TabsContent value="votes">
          <Card>
            <CardHeader class="flex justify-between">
              <CardTitle>Votes</CardTitle>
              <Button v-if="group.isAdmin" @click="showNewVoteDialog = true">
                New Vote
              </Button>
            </CardHeader>
            <CardContent>
              <!-- Votes list -->
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Posts Tab -->
        <TabsContent value="posts">
          <Card>
            <CardHeader class="flex justify-between">
              <CardTitle>Posts</CardTitle>
              <Button @click="showNewPostDialog = true">New Post</Button>
            </CardHeader>
            <CardContent>
              <!-- Posts list -->
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Members Tab -->
        <TabsContent value="members">
          <Card>
            <CardHeader class="flex justify-between">
              <CardTitle>Members</CardTitle>
              <Button v-if="group.isAdmin" @click="showAddMemberDialog = true">
                Add Member
              </Button>
            </CardHeader>
            <CardContent>
              <div v-if="group.members?.length" class="space-y-4">
                <div v-for="member in group.members" :key="member.id"
                  class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center space-x-2">
                    <span class="font-medium">{{ member.name }}</span>
                    <span class="text-sm text-muted-foreground">{{ member.role }}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    
    <!-- Group Settings Dialog -->
    <GroupSettingsDialog 
      v-if="showSettingsDialog && group" 
      :group="group" 
      @close="showSettingsDialog = false"
      @submit="updateGroupSettings"
      @delete="confirmDeleteGroup"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { ArrowLeftIcon, LockIcon, UnlockIcon, SettingsIcon, TrashIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardHeader,
  CardTitle, 
  CardContent 
} from '@/components/ui/card'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs'
import GroupSettingsDialog from '@/components/GroupSettingsDialog.vue'

// Add this format date helper function
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'
  
  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    // Format options
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    
    return date.toLocaleDateString(undefined, options)
  } catch (err) {
    console.error('Error formatting date:', dateString, err)
    return 'Invalid date'
  }
}

const route = useRoute()
const router = useRouter()
const group = ref(null)
const loading = ref(true)
const error = ref(null)

// Add computed property to check if current user is admin
const userId = ref(localStorage.getItem('userId'))
const isAdmin = computed(() => {
  console.log('Admin check:', {
    userId: userId.value,
    groupAdminId: group.value?.admin_id,
    isMatch: group.value?.admin_id === userId.value
  })
  return group.value && group.value.admin_id === userId.value
})

// Add delete group function
const confirmDeleteGroup = async () => {
  if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
    return
  }
  
  try {
    loading.value = true
    const groupId = route.params.id
    const token = localStorage.getItem('token')
    
    console.log('Deleting group:', {
      groupId,
      hasToken: !!token
    })
    
    await axios({
      method: 'DELETE',
      url: `/groups/${groupId}`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    console.log('Group deleted successfully')
    router.push('/dashboard')
  } catch (err) {
    console.error('Delete failed:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    })
    error.value = err.response?.data?.error || 'Failed to delete group'
    loading.value = false
  }
}

// Add ref for dialog visibility
const showSettingsDialog = ref(false)

// Add settings update handler
const updateGroupSettings = async (data) => {
  try {
    const groupId = route.params.id
    
    await axios.put(`/groups/${groupId}`, {
      settings: data.settings,
      is_private: data.is_private
    })
    
    // Update local group data with new settings
    if (group.value) {
      group.value.settings = data.settings
      group.value.is_private = data.is_private
    }
    
    showSettingsDialog.value = false
  } catch (err) {
    console.error('Failed to update group settings:', err)
    // You could show an error toast here
  }
}

const fetchGroup = async () => {
    try {
        const groupId = route.params.id
        console.log('Fetching group with ID:', groupId) // Add debug log

        if (!groupId) {
            error.value = 'No group ID provided'
            loading.value = false
            return
        }

        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/auth')
            return
        }

        console.log('Making request to:', `/groups/${groupId}`) // Add debug log
        const response = await axios.get(`/groups/${groupId}`)
        
        if (!response.data) {
            throw new Error('No group data received')
        }

        group.value = response.data
        loading.value = false
        
    } catch (err) {
        console.error('Failed to load group:', {
            params: route.params,
            error: err,
            response: err.response?.data
        })
        error.value = err.response?.data?.error || 'Failed to load group'
        loading.value = false
    }
}

onMounted(() => {
    fetchGroup()
})
</script>