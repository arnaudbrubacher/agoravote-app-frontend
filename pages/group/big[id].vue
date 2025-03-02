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
                  <LucideIcon name="Users" size="8" class="h-8 w-8 text-gray-400" />
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
              <div v-if="isLoadingVotes" class="text-center py-8">
                Loading votes...
              </div>
              <div v-else-if="votes.length === 0" class="text-center text-muted-foreground py-8">
                No votes yet
              </div>
              <div v-else class="space-y-4">
                <div 
                  v-for="vote in votes" 
                  :key="vote.id" 
                  class="p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  @click="openVoteDetails(vote)"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <h3 class="font-semibold">{{ vote.title }}</h3>
                      <p class="text-muted-foreground">{{ vote.question }}</p>
                      <div class="mt-2 text-sm">
                        <span class="flex items-center">
                          <LucideIcon name="Calendar" size="4" class="h-4 w-4 mr-1" />
                          {{ formatDateShort(vote.start_time) }} - {{ formatDateShort(vote.end_time) }}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span v-if="isVoteActive(vote)" class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Active
                      </span>
                      <span v-else-if="isVoteUpcoming(vote)" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Upcoming
                      </span>
                      <span v-else class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        Ended
                      </span>
                    </div>
                  </div>
                </div>
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
            <CardHeader class="flex flex-col sm:flex-row justify-between gap-4">
              <div class="flex flex-col gap-2">
                <CardTitle>Members ({{ filteredMembers.length || 0 }})</CardTitle>
                
                <!-- Search bar -->
                <div class="relative w-full sm:max-w-xs">
                  <input
                    v-model="memberSearchQuery"
                    type="text"
                    placeholder="Search members..."
                    class="w-full pl-8 pr-4 py-2 border rounded-md"
                  />
                  <Icon 
                    name="heroicons:magnifying-glass" 
                    class="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                  />
                  <button 
                    v-if="memberSearchQuery" 
                    @click="memberSearchQuery = ''" 
                    class="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  >
                    <LucideIcon name="X" size="4" class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <!-- Import Members Button -->
                <div class="flex items-center">
                  <label class="mr-2 text-sm text-muted-foreground">Import member list:</label>
                  <Button 
                    size="sm"
                    variant="outline"
                    @click="triggerCsvFileInput()"
                    class="flex items-center"
                  >
                    <LucideIcon name="FileUp" size="4" class="h-4 w-4 mr-1" />
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      Add Member
                      <LucideIcon name="ChevronDown" size="4" class="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="showAddMemberDialog = true">
                      <LucideIcon name="Mail" size="4" class="h-4 w-4 mr-2" />
                      Add by Email
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="showUserSearchDialog = true">
                      <LucideIcon name="Search" size="4" class="h-4 w-4 mr-2" />
                      Search Users
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div v-if="isLoadingMembers" class="text-center py-8">
                <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin inline-block" />
                <span class="ml-2">Loading members...</span>
              </div>
              <div v-else-if="group.members?.length" class="space-y-4">
                <!-- No results message -->
                <div v-if="filteredMembers.length === 0 && memberSearchQuery" class="text-center py-8 text-muted-foreground">
                  No members matching "{{ memberSearchQuery }}"
                </div>
                
                <!-- Members list -->
                <div v-else v-for="(member, index) in filteredMembers" :key="member.id || index"
                  class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div class="flex items-center space-x-3">
                    <!-- Member Avatar -->
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span v-if="!member.avatar" class="font-medium text-primary">
                        {{ getMemberInitial(member) }}
                      </span>
                      <img 
                        v-else 
                        :src="member.avatar" 
                        class="w-10 h-10 rounded-full object-cover"
                        alt="Member avatar"
                      />
                    </div>
                    
                    <!-- Member Info -->
                    <div>
                      <div class="flex items-center">
                        <router-link 
                          :to="`/user/${member.id}`" 
                          class="font-medium hover:underline"
                        >
                          {{ member.name || 'Unknown Member' }}
                        </router-link>
                        <span v-if="isCurrentMember(member)" class="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          You
                        </span>
                      </div>
                      <span class="text-sm text-muted-foreground">{{ member.email || 'No email available' }}</span>
                    </div>
                  </div>
                  
                  <!-- Member Role and Actions -->
                  <div class="flex items-center space-x-2">
                    <span v-if="member.isAdmin" class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      Admin
                    </span>
                    <span v-else class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      Member
                    </span>
                    
                    <!-- Actions for admins -->
                    <div v-if="isCurrentUserAdmin" class="ml-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <LucideIcon name="MoreVertical" size="4" class="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem v-if="!member.isAdmin" @click="promoteMember(member)">
                            <LucideIcon name="UserPlus" size="4" class="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem v-if="member.isAdmin && !isCurrentMember(member)" @click="demoteMember(member)">
                            <LucideIcon name="UserMinus" size="4" class="h-4 w-4 mr-2" />
                            Remove Admin Role
                          </DropdownMenuItem>
                          <DropdownMenuItem v-if="!isCurrentMember(member)" @click="removeMember(member)">
                            <LucideIcon name="Trash" size="4" class="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
      @leave="leaveGroup"
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

    <!-- Vote Details Dialog -->
    <VoteDetailsDialog
      v-if="selectedVote"
      :vote="selectedVote"
      :current-user-id="currentUser?.id"
      @close="selectedVote = null"
      @submit-vote="handleVoteSubmit"
      @delete="deleteVote"
    />

    <!-- User Search Dialog -->
    <UserSearchDialog
      v-if="showUserSearchDialog"
      :groupId="groupId"
      @close="showUserSearchDialog = false"
      @user-added="handleUserAdded"
    />
  </div>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { Icon } from '@iconify/vue'
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

// Add this to your imports
import VoteDetailsDialog from '~/components/VoteDetailsDialog.vue'

// Add this to your imports
import UserSearchDialog from '@/components/UserSearchDialog.vue'

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
const currentUser = ref(null)
const selectedVote = ref(null)
const statusMessage = ref('') // For displaying status messages

// Add this ref
const showUserSearchDialog = ref(false)

// Route and router
const route = useRoute()
const router = useRouter()
const group = ref(null)
const loading = ref(true)
const error = ref(null)
const groupId = route.params.id

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
    alert('Members imported successfully') // Simple feedback
  } catch (err) {
    console.error('Failed to import members:', err)
    error.value = err.response?.data?.error || 'Failed to import members'
    alert('Failed to import members: ' + error.value) // Simple feedback
  }
  
  // Reset the file input
  event.target.value = ''
}

// Add new handlers for the dialogs
const checkAuthToken = () => {
  const token = localStorage.getItem('token');
  console.log("Auth token exists:", !!token);
  if (token) {
    console.log("Token prefix:", token.substring(0, 15) + "...");
  }
};

const createNewVote = async (data) => {
  try {
    // Debug information
    console.log("Creating vote with data:", data);
    checkAuthToken();
    
    // Display loading state
    statusMessage.value = 'Creating vote...'
    
    // Format the data for the API, ensuring proper ISO format for dates
    const formattedData = {
      title: data.title,
      question: data.question,
      choices: data.choices.map(choice => ({ text: choice.text })),
      allowWriteIn: data.allowWriteIn,
      isSecret: data.isSecret,
      minChoices: parseInt(data.minChoices),
      maxChoices: parseInt(data.maxChoices),
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString()
    };
    
    console.log("Formatted data:", formattedData);
    
    const groupId = route.params.id;
    const response = await axios.post(`/groups/${groupId}/votes`, formattedData);
    
    // Show simple success message
    alert('Vote created successfully')
    
    showNewVoteDialog.value = false;
    
    // Refresh votes list
    await fetchVotes();
  } catch (err) {
    console.error('Failed to create vote:', err);
    console.error('Error details:', err.response?.data);
    
    // Show simple error message
    alert('Failed to create vote: ' + (err.response?.data?.error || err.message))
  } finally {
    statusMessage.value = '' // Clear status
  }
};

// Add a fetchVotes function
const votes = ref([])
const isLoadingVotes = ref(true)

const fetchVotes = async () => {
  try {
    isLoadingVotes.value = true;
    const response = await axios.get(`/groups/${groupId}/votes`);
    votes.value = response.data.votes || [];
    console.log("Fetched votes:", votes.value);
  } catch (error) {
    console.error('Failed to fetch votes:', error);
    alert('Failed to fetch votes')
  } finally {
    isLoadingVotes.value = false;
  }
};

// Helper functions for vote status
const isVoteActive = (vote) => {
  const now = new Date()
  return new Date(vote.start_time) <= now && new Date(vote.end_time) >= now
}

const isVoteUpcoming = (vote) => {
  const now = new Date()
  return new Date(vote.start_time) > now
}

// Format date for display
const formatDateShort = (dateStr) => {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
}

// Fetch group function with better member handling
const fetchGroup = async () => {
  try {
    loading.value = true
    isLoadingMembers.value = true // Set loading state for members
    error.value = null
    
    const groupId = route.params.id
    
    console.log('Fetching group data for ID:', groupId)
    
    const response = await axios.get(`/groups/${groupId}`)
    
    console.log('Raw group API response:', response.data)
    
    group.value = response.data
    
    // Check if members are included in the response
    if (!group.value.members || !Array.isArray(group.value.members) || group.value.members.length === 0) {
      console.log('No members array in group response, fetching members separately')
      await fetchMembers()
    } else {
      console.log('Members found in group response:', group.value.members)
      // Normalize the member data that came with the group
      group.value.members = normalizeMembers(group.value.members)
    }
    
    console.log('Processed group data:', group.value)
  } catch (err) {
    console.error('Failed to fetch group:', err)
    error.value = err.response?.data?.error || 'Failed to fetch group information'
    alert('Failed to load group: ' + error.value)
  } finally {
    loading.value = false
    isLoadingMembers.value = false // Clear loading state
  }
}

// Add a separate function to fetch members
const fetchMembers = async () => {
  try {
    console.log('Fetching members separately...')
    
    const response = await axios.get(`/groups/${groupId}/members`)
    
    console.log('Raw members API response:', response.data)
    
    // Handle different response formats
    let rawMembers = []
    if (Array.isArray(response.data)) {
      rawMembers = response.data
    } else if (response.data.members && Array.isArray(response.data.members)) {
      rawMembers = response.data.members
    } else if (typeof response.data === 'object') {
      // Try to extract members from response object
      Object.keys(response.data).forEach(key => {
        if (Array.isArray(response.data[key])) {
          rawMembers = response.data[key]
        }
      })
    }
    
    console.log('Raw members extracted:', rawMembers)
    
    // Normalize the member data
    group.value.members = normalizeMembers(rawMembers)
  } catch (err) {
    console.error('Failed to fetch members:', err)
    console.error('Error response:', err.response?.data)
    // Initialize empty array if fetch fails
    group.value.members = []
  }
}

// Add a function to normalize member data
const normalizeMembers = (members) => {
  console.log('Normalizing members data:', members)
  
  return members.map((member, index) => {
    // Log each member for debugging
    console.log(`Processing member ${index}:`, member)
    
    // Extract data from nested objects
    const userData = member.user || {}
    
    // Determine the member ID
    const id = member.id || member.userId || member.user_id || userData.id
    
    // Determine the member name - check all possible properties
    let name = 'Unknown Member'
    if (member.name) name = member.name
    else if (member.username) name = member.username
    else if (userData.name) name = userData.name
    else if (userData.username) name = userData.username
    else if (member.firstName) {
      name = member.firstName
      if (member.lastName) name += ' ' + member.lastName
    }
    
    // Determine email
    const email = member.email || userData.email || ''
    
    // Determine avatar/profile picture
    const avatar = member.avatar || member.profile_picture || 
                   member.profilePicture || userData.avatar || 
                   userData.profile_picture || userData.profilePicture
    
    // Determine admin status
    const isAdmin = member.isAdmin || member.is_admin || 
                    member.role === 'admin' || userData.role === 'admin'
    
    // Log the normalized member
    const normalizedMember = {
      id,
      name,
      email,
      avatar,
      isAdmin
    }
    
    console.log(`Normalized member ${index}:`, normalizedMember)
    
    return normalizedMember
  })
}

// Update the computed property for checking if current user is admin
const isCurrentUserAdmin = computed(() => {
  if (!group.value?.members || !currentUser.value) return false
  
  console.log('Checking if current user is admin. User ID:', currentUser.value.id)
  console.log('Group members:', group.value.members)
  
  const currentMember = group.value.members.find(m => {
    const match = m.id === currentUser.value.id || 
                  m.userId === currentUser.value.id ||
                  m.user_id === currentUser.value.id
    if (match) console.log('Found current user in members:', m)
    return match
  })
  
  console.log('Current member object:', currentMember)
  
  return !!currentMember?.isAdmin
})

const confirmDeleteGroup = async () => {
  if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
    return
  }
  
  try {
    loading.value = true
    const groupId = route.params.id
    const token = localStorage.getItem('token')
    
    console.log('Deleting group:', groupId)
    
    await axios.delete(`/groups/${groupId}`)
    
    console.log('Group deleted successfully')
    alert('Group deleted successfully')
    router.push('/dashboard')
  } catch (err) {
    console.error('Delete failed:', err.response?.data || err.message)
    error.value = err.response?.data?.error || 'Failed to delete group'
    alert('Failed to delete group: ' + error.value)
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
    alert('Failed to fetch posts')
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

// Add this function to delete posts
const deletePost = async (post) => {
  try {
    // Confirm before deleting
    if (!confirm('Are you sure you want to delete this post?')) return
    
    statusMessage.value = 'Deleting post...'
    
    // Call API to delete the post
    await axios.delete(`/posts/${post.id}`)
    
    // Remove post from list
    const index = posts.value.findIndex(p => p.id === post.id)
    if (index !== -1) {
      posts.value.splice(index, 1)
    }
    
    // Close dialog
    selectedPost.value = null
    
    // Show success message
    alert('Post deleted successfully')
  } catch (err) {
    console.error('Failed to delete post:', err)
    
    // Show error message
    alert('Failed to delete post: ' + (err.response?.data?.error || err.message))
  } finally {
    statusMessage.value = ''
  }
}

// Fetch current user if not already set
const fetchCurrentUser = async () => {
  try {
    const response = await axios.get('/users/me')
    currentUser.value = response.data
    console.log("Current user:", currentUser.value)
  } catch (err) {
    console.error('Failed to fetch current user:', err)
    // Handle error, maybe redirect to login
    if (err.response?.status === 401) {
      // Redirect to login if unauthorized
      router.push('/login')
    }
  }
}

// Replace all onMounted calls with a single consolidated one
onMounted(async () => {
  try {
    // Show loading state
    loading.value = true;
    
    // Fetch all necessary data in parallel
    await Promise.all([
      fetchCurrentUser(),
      fetchGroup(),
      fetchPosts(),
      fetchVotes()
    ]);
  } catch (error) {
    console.error('Error initializing page:', error);
    alert('Failed to initialize page')
  } finally {
    loading.value = false;
  }
});

// Add this function with your other handler functions
const openVoteDetails = (vote) => {
  // Add status to the vote object
  const now = new Date();
  const startTime = new Date(vote.start_time);
  const endTime = new Date(vote.end_time);
  
  let status = 'Upcoming';
  if (now >= startTime && now <= endTime) {
    status = 'Open';
  } else if (now > endTime) {
    status = 'Closed';
  }
  
  // Create a new object with the status field added
  selectedVote.value = {
    ...vote,
    status
  };
}

// Add this function with your other handler functions
const handleVoteSubmit = async (voteData) => {
  try {
    statusMessage.value = 'Submitting vote...'
    
    // Call API to submit the vote
    await axios.post(`/votes/${selectedVote.value.id}/cast`, voteData);
    
    // Show success message
    alert('Vote submitted successfully')
    
    // Close dialog
    selectedVote.value = null;
    
    // Refresh votes
    await fetchVotes();
  } catch (err) {
    console.error('Failed to submit vote:', err);
    
    // Show error message
    alert('Failed to submit vote: ' + (err.response?.data?.error || err.message))
  } finally {
    statusMessage.value = ''
  }
};

// Add this function with your other handler functions
const deleteVote = async (voteId) => {
  try {
    if (!confirm('Are you sure you want to delete this vote?')) {
      return
    }
    
    statusMessage.value = 'Deleting vote...'
    
    // Call API to delete the vote
    await axios.delete(`/votes/${voteId}`);
    
    // Close the dialog
    selectedVote.value = null;
    
    // Show success message
    alert('Vote deleted successfully')
    
    // Refresh votes list
    await fetchVotes();
  } catch (err) {
    console.error('Failed to delete vote:', err);
    
    // Show error toast
    alert('Failed to delete vote: ' + (err.response?.data?.error || err.message))
  } finally {
    statusMessage.value = ''
  }
}

// Add these imports
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu/index.js'

// Add this state variable
const isLoadingMembers = ref(false)

// Member management functions
const promoteMember = async (member) => {
  try {
    statusMessage.value = 'Updating member...'
    
    // Call API to promote member
    await axios.put(`/groups/${groupId}/members/${member.id}`, { 
      isAdmin: true 
    })
    
    // Show success message
    alert(`${member.name} is now an admin`)
    
    // Refresh group data to update members list
    await fetchGroup()
  } catch (err) {
    console.error('Failed to promote member:', err)
    
    // Show error message
    alert('Failed to promote member: ' + (err.response?.data?.error || err.message))
  } finally {
    statusMessage.value = ''
  }
}

const demoteMember = async (member) => {
  try {
    statusMessage.value = 'Updating member...'
    
    // Call API to demote member
    await axios.put(`/groups/${groupId}/members/${member.id}`, { 
      isAdmin: false 
    })
    
    // Show success message
    alert(`${member.name} is no longer an admin`)
    
    // Refresh group data to update members list
    await fetchGroup()
  } catch (err) {
    console.error('Failed to demote member:', err)
    
    // Show error message
    alert('Failed to demote member: ' + (err.response?.data?.error || err.message))
  } finally {
    statusMessage.value = ''
  }
}

const removeMember = async (member) => {
  try {
    // Confirm removal
    if (!confirm(`Are you sure you want to remove ${member.name} from this group?`)) {
      return
    }
    
    statusMessage.value = 'Removing member...'
    
    // Call API to remove member
    await axios.delete(`/groups/${groupId}/members/${member.id}`)
    
    // Show success message
    alert(`${member.name} has been removed from the group`)
    
    // Refresh group data to update members list
    await fetchGroup()
  } catch (err) {
    console.error('Failed to remove member:', err)
    
    // Show error message
    alert('Failed to remove member: ' + (err.response?.data?.error || err.message))
  } finally {
    statusMessage.value = ''
  }
}

// Add these helper functions
const getMemberInitial = (member) => {
  if (!member || !member.name || member.name === 'Unknown Member') return 'U'
  return member.name.charAt(0).toUpperCase()
}

const isCurrentMember = (member) => {
  if (!currentUser.value || !member) return false
  
  return member.id === currentUser.value.id || 
         member.userId === currentUser.value.id || 
         member.user_id === currentUser.value.id
}

// Add this function to handle leaving the group
const leaveGroup = async () => {
  try {
    statusMessage.value = 'Leaving group...'
    
    // Get the current user ID
    const userId = currentUser.value?.id
    if (!userId) {
      alert('You must be logged in to leave a group')
      return
    }
    
    const groupId = route.params.id
    
    console.log(`User ${userId} is leaving group ${groupId}`)
    
    // Call API to remove the current user from the group
    await axios.delete(`/groups/${groupId}/members/${userId}`)
    
    // Show success message
    alert('You have left the group')
    
    // Redirect to dashboard
    router.push('/dashboard')
  } catch (err) {
    console.error('Failed to leave group:', err)
    
    // Show error message
    alert('Failed to leave group: ' + (err.response?.data?.error || err.message))
    
    statusMessage.value = ''
  }
}

// Add this function to your [Id].vue component
const addMember = async (memberData) => {
  try {
    statusMessage.value = 'Adding member...'
    
    console.log('Adding member:', memberData)
    
    // Format the request data
    const requestData = {
      email: memberData.email,
      isAdmin: memberData.role === 'admin'
    }
    
    // Call API to add member
    const response = await axios.post(`/groups/${groupId}/members`, requestData)
    
    // Show success message
    alert(`Member ${memberData.email} added successfully`)
    
    // Close dialog
    showAddMemberDialog.value = false
    
    // Refresh members list
    await fetchGroup()
  } catch (err) {
    console.error('Failed to add member:', err)
    
    // Show error message
    alert('Failed to add member: ' + (err.response?.data?.error || err.message))
  } finally {
    statusMessage.value = ''
  }
}

// Add this state variable
const memberSearchQuery = ref('')

// Add this computed property
const filteredMembers = computed(() => {
  if (!group.value?.members) return []
  
  const query = memberSearchQuery.value.trim().toLowerCase()
  if (!query) return group.value.members
  
  return group.value.members.filter(member => {
    // Search in name
    if (member.name && member.name.toLowerCase().includes(query)) return true
    
    // Search in email
    if (member.email && member.email.toLowerCase().includes(query)) return true
    
    // Search in role
    if (member.isAdmin && 'admin'.includes(query)) return true
    if (!member.isAdmin && 'member'.includes(query)) return true
    
    return false
  })
})

// Add this handler function for when a user is added via search
const handleUserAdded = async (user) => {
  console.log('User added via search:', user)
  
  // Refresh the group data to update the members list
  await fetchGroup()
}
</script>