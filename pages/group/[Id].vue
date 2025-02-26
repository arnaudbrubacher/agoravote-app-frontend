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
      <!-- Group Header -->
      <div class="flex items-center justify-between">
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
      </div>

      <!-- Group Info Card -->
      <Card class="w-full">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Group Information</h3>
            <div class="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                @click="showSettingsDialog = true"
                class="flex items-center"
              >
                <SettingsIcon class="h-4 w-4 mr-2" />
                Settings
              </Button>
              <!-- Add Delete Button - only show for admin -->
              <Button 
                v-if="isAdmin"
                variant="destructive" 
                size="sm"
                @click="confirmDeleteGroup"
                class="flex items-center"
              >
                <TrashIcon class="h-4 w-4 mr-2" />
                Delete Group
              </Button>
            </div>
          </div>
          <div class="mt-4 space-y-4">
            <div class="flex items-center space-x-2">
              <LockIcon v-if="group.isPrivate" class="h-4 w-4" />
              <UnlockIcon v-else class="h-4 w-4" />
              <span>{{ group.isPrivate ? 'Private Group' : 'Public Group' }}</span>
            </div>
            <div class="text-sm text-muted-foreground">
              Created {{ new Date(group.createdAt).toLocaleDateString() }}
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