<!-- pages/group/[Id].vue -->
<template>
  <!-- Loading and error states -->
  <LoadingError
    :loading="loading"
    :error="error"
  />

  <!-- Main content when loaded -->
  <div v-if="!loading && !error && group" class="container mx-auto max-w-2xl p-6 space-y-6">
    <!-- Group header with consistent styling -->
    <div class="w-full max-w-2xl mx-auto flex justify-between items-center mb-8">
      <!-- Group info (left-aligned) -->
      <div class="flex items-center">
        <div class="flex-shrink-0 mr-2">
          <div v-if="!group.picture" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Users class="h-5 w-5 text-gray-600" />
          </div>
          <img 
            v-else
            :src="groupPictureUrl" 
            alt="Group Picture"
            class="w-8 h-8 rounded-full object-cover border"
          />
        </div>
        <h1 class="text-xl font-semibold">{{ group.name }}</h1>
      </div>
      
      <!-- Settings button (right-aligned) -->
      <div class="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          @click="handleLeaveGroup"
          class="flex items-center gap-1"
        >
          <LogOut class="h-4 w-4" />
          <span>Leave</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          @click="showSettingsDialog = true"
          class="flex items-center gap-1"
        >
          <Settings class="h-4 w-4" />
          <span>Settings</span>
        </Button>
      </div>
    </div>

    <!-- Group content tabs -->
    <GroupTabs
      :group="group"
      :posts="posts"
      :votes="votes"
      :current-user="currentUser"
      :is-current-user-admin="isCurrentUserAdmin"
      @create-post="showNewPostDialog = true"
      @open-post="selectedPost = $event"
      @create-vote="showNewVoteDialog = true"
      @open-vote="selectedVote = $event"
      @add-member="showAddMemberDialog = true"
      @search-user="showUserSearchDialog = true"
      @csv-import="handleCsvImport"
      @member-promoted="handleMemberPromoted"
      @member-demoted="handleMemberDemoted"
      @member-removed="handleMemberRemoveEvent"
      @refresh-group="refreshGroupData"
      @admin-status-update="handleAdminStatusUpdate"
    />

    <!-- All dialogs -->
    <GroupDialogs
      :show-settings-dialog="showSettingsDialog"
      :show-new-post-dialog="showNewPostDialog"
      :show-new-vote-dialog="showNewVoteDialog"
      :show-add-member-dialog="showAddMemberDialog"
      :show-user-search-dialog="showUserSearchDialog"
      :selected-post="selectedPost"
      :selected-vote="selectedVote"
      :group="group"
      :current-user="currentUser"
      :is-current-user-admin="isCurrentUserAdmin"
      @close-settings="showSettingsDialog = false"
      @close-new-post="showNewPostDialog = false"
      @close-new-vote="showNewVoteDialog = false"
      @close-add-member="showAddMemberDialog = false"
      @close-user-search="showUserSearchDialog = false"
      @close-post-details="selectedPost = null"
      @close-vote-details="selectedVote = null"
      @group-updated="handleGroupUpdated"
      @group-deleted="handleGroupDeleted"
      @vote-created="handleVoteCreated"
      @post-created="handlePostCreated"
      @member-added="handleMemberAdded"
      @post-edited="handlePostEdited"
      @post-deleted="handlePostDeleted"
      @vote-submitted="handleVoteSubmitted"
      @vote-deleted="handleVoteDeleted"
      @user-added="handleUserAdded"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Users, Settings, LogOut } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import LoadingError from '@/components/group/core/LoadingError.vue'
import GroupTabs from '@/components/group/core/GroupTabs.vue'
import GroupDialogs from '@/components/group/core/GroupDialogs.vue'
import axios from '~/src/utils/axios'

// Define page layout
definePageMeta({
  layout: 'app-layout'
})

// Import composables
import { useGroupData } from '@/composables/useGroupData'
import { useGroupMembers } from '@/composables/useGroupMembers'
import { useGroupPosts } from '@/composables/useGroupPosts'
import { useGroupVotes } from '@/composables/useGroupVotes'

// Get group id from route
const route = useRoute()
const router = useRouter()

// Check for both uppercase and lowercase param options
// This makes the code more robust against routing config differences
const groupId = route.params.Id || route.params.id

// Add debug to see what's happening
console.log('Route params:', route.params) 
console.log('Group ID:', groupId)

// If groupId is still undefined, try to get it from another source
if (!groupId) {
  // Try to get from the path
  const pathMatch = route.path.match(/\/group\/([^\/]+)/)
  if (pathMatch && pathMatch[1]) {
    groupId.value = pathMatch[1]
    console.log('Extracted group ID from path:', groupId)
  }
}

// Common state
const loading = ref(true)
const error = ref(null)

// Dialog states
const showSettingsDialog = ref(false)
const showNewPostDialog = ref(false)
const showNewVoteDialog = ref(false)
const showAddMemberDialog = ref(false)
const showUserSearchDialog = ref(false)
const selectedPost = ref(null)
const selectedVote = ref(null)

// Use group data and functionality
const { 
  group, 
  fetchGroup, 
  updateGroupSettings,
  confirmDeleteGroup,
  leaveGroup,
  isCurrentUserAdmin
} = useGroupData(groupId)

// Use group members functionality
const { 
  currentUser,
  fetchCurrentUser,
  addMember, 
  handleUserAdded,
  handleCsvImport: importCsvMembers,
  promoteMember,
  demoteMember,
  handleMemberRemove
} = useGroupMembers(groupId, group, fetchGroup)

// Use group posts functionality
const { 
  posts, 
  fetchPosts,
  createNewPost,
  // Rename this to avoid the conflict
  handlePostCreated: addNewPostToList, // 👈 Rename when destructuring
  editPost, 
  deletePost 
} = useGroupPosts(groupId)

// Use group votes functionality
const { 
  votes, 
  fetchVotes, 
  createNewVote, 
  handleVoteSubmit, 
  deleteVote 
} = useGroupVotes(groupId)

// Initialize
onMounted(async () => {
  try {
    loading.value = true
    
    // Fetch all necessary data in parallel
    await Promise.all([
      fetchCurrentUser(),
      fetchGroup(),
      fetchPosts(),
      fetchVotes()
    ])

    // Debug admin status
    console.log('Group page - isCurrentUserAdmin:', isCurrentUserAdmin.value)
    console.log('Group data:', group.value)
    
    // Check if admin status is missing and try to determine it
    if (group.value && group.value.currentUserIsAdmin === undefined) {
      console.log('Admin status is undefined, attempting to determine it')
      
      // Get current user ID
      const currentUserId = localStorage.getItem('userId')
      
      // Check if user is admin based on members list
      if (group.value.members && currentUserId) {
        const isAdmin = group.value.members.some(member => {
          const memberId = member.id || member.userId || member.user_id
          const memberUserId = member.user?.id || member.userId || member.user_id
          const isCurrentUser = memberId === currentUserId || memberUserId === currentUserId
          
          console.log('Member check:', {
            memberId,
            memberUserId,
            currentUserId,
            isCurrentUser,
            isAdmin: member.isAdmin
          })
          
          return isCurrentUser && member.isAdmin
        })
        
        if (isAdmin) {
          console.log('Setting currentUserIsAdmin to true based on members list')
          group.value.currentUserIsAdmin = true
        }
      }
    }
    
    // Add event listener for group data updates
    window.addEventListener('group-data-updated', refreshGroupData)
  } catch (err) {
    console.error('Error initializing page:', err)
    error.value = err.response?.data?.error || 'Failed to initialize page'
  } finally {
    loading.value = false
  }
})

// Clean up event listeners when component is unmounted
onBeforeUnmount(() => {
  window.removeEventListener('group-data-updated', refreshGroupData)
})

// Navigation helpers
const navigateToDashboard = () => {
  router.push('/dashboard')
}

// Action handlers
const handleGroupUpdated = async (updatedGroup) => {
  try {
    await updateGroupSettings(updatedGroup)
    showSettingsDialog.value = false
  } catch (err) {
    console.error('Failed to update group:', err)
    alert('Failed to update group: ' + (err.response?.data?.error || err.message))
  }
}

const handleGroupDeleted = async () => {
  try {
    await confirmDeleteGroup()
    // Navigation is handled in the confirmDeleteGroup function
  } catch (err) {
    console.error('Failed to delete group:', err)
    alert('Failed to delete group: ' + (err.response?.data?.error || err.message))
  }
}

const handleVoteCreated = async (voteData) => {
  try {
    await createNewVote(voteData)
    showNewVoteDialog.value = false
  } catch (err) {
    console.error('Failed to create vote:', err)
  }
}

const handlePostCreated = async (postData) => {
  try {
    console.log('Creating post with data:', postData);
    const newPost = await createNewPost(postData);
    console.log('Post created successfully:', newPost);
    addNewPostToList(newPost); //  Use the renamed function
    showNewPostDialog.value = false;
  } catch (err) {
    console.error('Failed to create post:', err);
    console.error('Error response:', err.response?.data);
    alert('Failed to create post: ' + (err.response?.data?.error || err.message));
  }
}

const handleMemberAdded = async (memberData) => {
  try {
    await addMember(memberData)
    showAddMemberDialog.value = false
  } catch (err) {
    console.error('Failed to add member:', err)
  }
}

const handlePostEdited = async (post) => {
  try {
    await editPost(post)
    selectedPost.value = null
  } catch (err) {
    console.error('Failed to edit post:', err)
  }
}

const handlePostDeleted = async (post) => {
  try {
    console.log('Deleting post with ID:', post.id);
    await deletePost(post);
    console.log('Post deleted successfully');
    // Optionally refresh the posts list
    // await fetchPosts();
  } catch (err) {
    console.error('Failed to delete post:', err);
    console.error('Error response:', err.response?.data);
    alert('Failed to delete post: ' + (err.response?.data?.error || err.message));
  }
}

const handleVoteSubmitted = async (voteData) => {
  try {
    await handleVoteSubmit(voteData)
  } catch (err) {
    console.error('Failed to submit vote:', err)
  }
}

const handleVoteDeleted = async (voteId) => {
  try {
    await deleteVote(voteId)
  } catch (err) {
    console.error('Failed to delete vote:', err)
  }
}

// Use the existing functions from the useGroupMembers composable
const handleCsvImport = async (file) => {
  try {
    await importCsvMembers({ target: { files: [file] } })
  } catch (err) {
    console.error('Failed to import members:', err)
  }
}

const handleMemberPromoted = async (member) => {
  try {
    await promoteMember(member)
  } catch (err) {
    console.error('Failed to promote member:', err)
  }
}

const handleMemberDemoted = async (member) => {
  try {
    await demoteMember(member)
  } catch (err) {
    console.error('Failed to demote member:', err)
  }
}

const handleMemberRemoveEvent = async (member) => {
  console.log('Group page - Member removal event received for:', member.name, {
    id: member.id,
    userId: member.userId,
    user_id: member.user_id,
    user: member.user && member.user.id
  });
  
  try {
    await handleMemberRemove(member);
    console.log('Group page - Member removed successfully');
  } catch (err) {
    console.error('Group page - Failed to remove member:', err);
    alert('Failed to remove member: ' + (err.response?.data?.error || err.message));
  }
}

const refreshGroupData = async () => {
  try {
    await fetchGroup()
    await fetchPosts()
    await fetchVotes()
  } catch (err) {
    console.error('Failed to refresh group data:', err)
  }
}

// Computed property for group picture URL
const groupPictureUrl = computed(() => {
  if (!group.value?.picture) return null
  
  // Check if it's already a full URL
  if (group.value.picture.startsWith('http://') || group.value.picture.startsWith('https://')) {
    return group.value.picture
  }
  
  // Otherwise, prepend the API base URL
  const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'
  return `${apiBaseUrl}${group.value.picture}`
})

// Add a handler for admin status updates
const handleAdminStatusUpdate = (isAdmin) => {
  console.log('Group page received admin status update:', isAdmin)
  if (group.value) {
    console.log('Updating group.currentUserIsAdmin from', group.value.currentUserIsAdmin, 'to', isAdmin)
    group.value.currentUserIsAdmin = isAdmin
    
    // Dispatch an event to notify components that group data has been updated
    window.dispatchEvent(new CustomEvent('group-data-updated'))
  }
}

// New function to handle leaving the group
const handleLeaveGroup = async () => {
  if (confirm('Are you sure you want to leave this group?')) {
    try {
      await leaveGroup()
      // Navigation is handled in the leaveGroup function
    } catch (err) {
      console.error('Failed to leave group:', err)
      alert('Failed to leave group: ' + (err.response?.data?.error || err.message))
    }
  }
}
</script>