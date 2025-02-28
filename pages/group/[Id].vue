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
              
              <!-- Group Picture -->
              <div class="flex-shrink-0">
                <div v-if="!group.picture" class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icon name="heroicons:user-group" class="h-8 w-8 text-gray-400" />
                </div>
                <img 
                  v-else
                  :src="group.picture" 
                  alt="Group Picture"
                  class="w-12 h-12 rounded-full object-cover border"
                />
              </div>
              
              <div>
                <h1 class="text-3xl font-bold">{{ group.name }}</h1>
                <p class="text-muted-foreground">{{ group.description }}</p>
              </div>
            </div>
            
            <div class="flex space-x-2">
              <!-- Settings button shown to everyone but disabled for non-admins -->
              <Button 
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
              <Button @click="showNewVoteDialog = true">
                New Vote
              </Button>
            </CardHeader>
            <CardContent>
              <!-- Votes list -->
              <div class="text-center text-muted-foreground py-8">
                No votes yet
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Posts Tab -->
        <TabsContent value="posts">
          <Card>
            <CardHeader class="flex justify-between">
              <CardTitle>Posts</CardTitle>
              <Button @click="showNewPostDialog = true">
                New Post
              </Button>
            </CardHeader>
            <CardContent>
              <!-- Posts list -->
              <div v-if="isLoadingPosts" class="text-center py-8">
                Loading posts...
              </div>
              <div v-else-if="posts.length === 0" class="text-center text-muted-foreground py-8">
                No posts yet
              </div>
              <div v-else class="space-y-4">
                <PostCard 
                  v-for="post in posts" 
                  :key="post.id" 
                  :post="post" 
                  @click="openPostDetails(post)"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Members Tab -->
        <TabsContent value="members">
          <Card>
            <CardHeader class="flex justify-between">
              <CardTitle>Members</CardTitle>
              <div class="flex space-x-2">
                <!-- Import Members Button -->
                <div class="flex items-center">
                  <label class="mr-2 text-sm text-muted-foreground">Import member list:</label>
                  <Button 
                    size="sm"
                    variant="outline"
                    @click="triggerCsvFileInput()"
                    class="flex items-center"
                  >
                    <Icon name="heroicons:document-arrow-up" class="h-4 w-4 mr-1" />
                    Upload .CSV
                  </Button>
                  <input
                    type="file"
                    ref="csvFileInput"
                    class="hidden"
                    accept=".csv"
                    @change="handleCsvImport"
                  />
                </div>
                
                <!-- Add Member Button -->
                <Button @click="showAddMemberDialog = true">
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div v-if="group.members?.length" class="space-y-4">
                <div v-for="member in group.members" :key="member.id"
                  class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center space-x-2">
                    <span class="font-medium">{{ member.name }}</span>
                    <span class="text-sm text-muted-foreground">{{ member.isAdmin ? 'Admin' : 'Member' }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-muted-foreground py-8">
                No members yet
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

    <!-- New Vote Dialog -->
    <NewVoteDialog
      v-if="showNewVoteDialog && group"
      :group="group"
      @close="showNewVoteDialog = false"
      @submit="createNewVote"
    />

    <!-- New Post Dialog -->
    <NewPostDialog
      v-if="showNewPostDialog && group"
      :group="group"
      @close="showNewPostDialog = false"
      @submit="createNewPost"
    />

    <!-- Add Member Dialog -->
    <AddMemberDialog
      v-if="showAddMemberDialog && group"
      :group="group"
      @close="showAddMemberDialog = false"
      @submit="addMember"
    />

    <!-- Post Details Dialog -->
    <PostDetailsDialog
      v-if="selectedPost"
      :post="selectedPost"
      :currentUserId="currentUser?.id"
      @close="selectedPost = null"
      @edit="editPost"
      @delete="deletePost"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { Icon } from '@iconify/vue'  // Make sure to import this
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
// Import dialog components
import NewVoteDialog from '@/components/NewVoteDialog.vue'
import NewPostDialog from '@/components/NewPostDialog.vue'
import AddMemberDialog from '@/components/AddMemberDialog.vue'
import PostCard from '@/components/PostCard.vue'
import PostDetailsDialog from '~/components/PostDetailsDialog.vue'

// Add dialog visibility refs
const showSettingsDialog = ref(false)
const showNewVoteDialog = ref(false)
const showNewPostDialog = ref(false)
const showAddMemberDialog = ref(false)
const csvFileInput = ref(null)
const showPostDialog = ref(false)
const posts = ref([])
const isLoading = ref(true)
const isLoadingPosts = ref(true)
const selectedPost = ref(null)
const currentUser = ref(null) // You'll need to set this from your auth system

// Format date helper function remains the same

const route = useRoute()
const router = useRouter()
const group = ref(null)
const loading = ref(true)
const error = ref(null)
const groupId = route.params.id

// Admin check computed property remains the same

// Delete group function remains the same

// Settings update handler remains the same

// Add CSV file import handlers
const triggerCsvFileInput = () => {
  csvFileInput.value.click()
}

const handleCsvImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    const formData = new FormData()
    formData.append('csv', file)
    
    const groupId = route.params.id
    const response = await axios.post(`/groups/${groupId}/members/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    // Refresh members list
    await fetchGroup()
    
    console.log('Members imported successfully:', response.data)
  } catch (err) {
    console.error('Failed to import members:', err)
    error.value = err.response?.data?.error || 'Failed to import members'
  }
  
  // Reset the file input
  event.target.value = ''
}

// Add new handlers for the dialogs
const createNewVote = async (data) => {
  try {
    const groupId = route.params.id
    const response = await axios.post(`/groups/${groupId}/votes`, data)
    
    console.log('Vote created successfully:', response.data)
    showNewVoteDialog.value = false
    
    // Refresh votes list
    await fetchGroup()
  } catch (err) {
    console.error('Failed to create vote:', err)
    // You could show an error toast here
  }
}

const createNewPost = async (data) => {
  try {
    console.log('Post created successfully:', data)
    showNewPostDialog.value = false
    
    // Refresh posts list
    await fetchPosts()
  } catch (err) {
    console.error('Failed to create post:', err)
    // You could show an error toast here
  }
}

const addMember = async (data) => {
  try {
    const groupId = route.params.id
    const response = await axios.post(`/groups/${groupId}/members`, data)
    
    console.log('Member added successfully:', response.data)
    showAddMemberDialog.value = false
    
    // Refresh members list
    await fetchGroup()
  } catch (err) {
    console.error('Failed to add member:', err)
    // You could show an error toast here
  }
}

// Fetch group function
const fetchGroup = async () => {
  try {
    loading.value = true
    error.value = null
    
    const groupId = route.params.id
    const response = await axios.get(`/groups/${groupId}`)
    
    group.value = response.data
  } catch (err) {
    console.error('Failed to fetch group:', err)
    error.value = err.response?.data?.error || 'Failed to fetch group information'
  } finally {
    loading.value = false
  }
}

const confirmDeleteGroup = async () => {
  try {
    loading.value = true
    const groupId = route.params.id
    const token = localStorage.getItem('token')
    
    console.log('Deleting group:', groupId)
    
    await axios.delete(`/groups/${groupId}`)
    
    console.log('Group deleted successfully')
    router.push('/dashboard')
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
    error.value = err.response?.data?.error || 'Failed to delete group'
    loading.value = false
  }
}

// Fetch posts when component mounts
onMounted(async () => {
  await fetchPosts()
})

// Fetch posts for this group
const fetchPosts = async () => {
  try {
    isLoadingPosts.value = true
    const response = await axios.get(`/groups/${groupId}/posts`)
    posts.value = response.data.posts || response.data // Adjust based on your API response
    console.log("Fetched posts:", posts.value)
  } catch (error) {
    console.error('Failed to fetch posts:', error)
  } finally {
    isLoadingPosts.value = false
  }
}

// Handle new post creation
const handlePostCreated = (newPost) => {
  // Add new post to the list
  posts.value.unshift(newPost)
}

// Add this function to open post details
const openPostDetails = (post) => {
  selectedPost.value = post
}

// Add these functions for post management
const editPost = (post) => {
  // Logic to edit post
  console.log('Editing post:', post)
  // You could set a state and open an edit dialog here
}

const deletePost = async (post) => {
  try {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    await axios.delete(`/posts/${post.id}`)
    
    // Remove post from list
    const index = posts.value.findIndex(p => p.id === post.id)
    if (index !== -1) {
      posts.value.splice(index, 1)
    }
    
    // Close dialog
    selectedPost.value = null
    
    // Show success message
    console.log('Post deleted successfully')
  } catch (err) {
    console.error('Failed to delete post:', err)
  }
}

// Fetch current user if not already set
const fetchCurrentUser = async () => {
  try {
    if (!currentUser.value) {
      const response = await axios.get('/users/me')
      currentUser.value = response.data
    }
  } catch (err) {
    console.error('Failed to fetch current user:', err)
  }
}

// Call these in your onMounted
onMounted(async () => {
  await fetchCurrentUser()
  await fetchPosts()
})

onMounted(() => {
    fetchGroup()
})
</script>