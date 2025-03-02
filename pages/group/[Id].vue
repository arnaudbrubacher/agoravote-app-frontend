<!-- pages/group/[Id].vue -->
<template>
  <!-- Loading and error states -->
  <LoadingError
    :loading="loading"
    :error="error"
  />

  <!-- Main content when loaded -->
  <div v-if="!loading && !error && group" class="container mx-auto p-4 space-y-6">
    <!-- Group header -->
    <GroupHeader
      :group="group"
      :is-current-user-admin="isCurrentUserAdmin"
      @back-to-dashboard="navigateToDashboard"
      @open-settings="showSettingsDialog = true"
    />

    <!-- Group content tabs -->
    <GroupTabs
      :group="group"
      :posts="posts"
      :votes="votes"
      :is-current-user-admin="isCurrentUserAdmin"
      @create-post="showNewPostDialog = true"
      @open-post="selectedPost = $event"
      @create-vote="showNewVoteDialog = true"
      @open-vote="selectedVote = $event"
      @add-member="showAddMemberDialog = true"
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
      @close-settings="showSettingsDialog = false"
      @close-new-post="showNewPostDialog = false"
      @close-new-vote="showNewVoteDialog = false"
      @close-add-member="showAddMemberDialog = false"
      @close-user-search="showUserSearchDialog = false"
      @close-post-details="selectedPost = null"
      @close-vote-details="selectedVote = null"
      @group-updated="handleGroupUpdated"
      @group-deleted="handleGroupDeleted"
      @group-left="handleGroupLeft"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LoadingError from '@/components/group/LoadingError.vue'
import GroupHeader from '@/components/group/GroupHeader.vue'
import GroupTabs from '@/components/group/GroupTabs.vue'
import GroupDialogs from '@/components/group/GroupDialogs.vue'

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
  handleUserAdded
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
  } catch (err) {
    console.error('Error initializing page:', err)
    error.value = err.response?.data?.error || 'Failed to initialize page'
  } finally {
    loading.value = false
  }
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

const handleGroupLeft = async () => {
  try {
    await leaveGroup()
    // Navigation is handled in the leaveGroup function
  } catch (err) {
    console.error('Failed to leave group:', err)
    alert('Failed to leave group: ' + (err.response?.data?.error || err.message))
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

// Keep this function but use the renamed imported function inside
const handlePostCreated = async (postData) => {
  try {
    const newPost = await createNewPost(postData)
    addNewPostToList(newPost) // 👈 Use the renamed function
    showNewPostDialog.value = false
  } catch (err) {
    console.error('Failed to create post:', err)
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
    await deletePost(post)
  } catch (err) {
    console.error('Failed to delete post:', err)
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
</script>