<!-- pages/group/[Id].vue -->
<template>
  <div class="container mx-auto p-6">
    <!-- Loading and error states -->
    <LoadingError 
      :loading="loading" 
      :error="error" 
    />
    
    <!-- Group content when loaded -->
    <template v-if="group && !loading && !error">
      <GroupHeader 
        :group="group"
        :is-current-user-admin="isCurrentUserAdmin"
        @show-settings="showSettingsDialog = true"
        @back-to-dashboard="router.push('/dashboard')"
      />

      <GroupTabs 
        :group="group"
        :current-user="currentUser"
        :is-current-user-admin="isCurrentUserAdmin"
        @show-new-vote-dialog="showNewVoteDialog = true"
        @show-new-post-dialog="showNewPostDialog = true"
        @show-add-member-dialog="showAddMemberDialog = true"
        @show-user-search-dialog="showUserSearchDialog = true"
        @csv-import="handleCsvImport"
        @refresh-group="fetchGroup"
      />
    </template>
    
    <!-- All dialogs -->
    <GroupDialogs
      v-if="group"
      :show-settings-dialog="showSettingsDialog"
      :show-new-vote-dialog="showNewVoteDialog"
      :show-new-post-dialog="showNewPostDialog"
      :show-add-member-dialog="showAddMemberDialog"
      :show-user-search-dialog="showUserSearchDialog"
      :selected-post="selectedPost"
      :selected-vote="selectedVote"
      :group="group"
      :current-user="currentUser"
      @close-settings="showSettingsDialog = false"
      @close-new-vote="showNewVoteDialog = false"
      @close-new-post="showNewPostDialog = false"
      @close-add-member="showAddMemberDialog = false"
      @close-user-search="showUserSearchDialog = false"
      @close-post-details="selectedPost = null"
      @close-vote-details="selectedVote = null"
      @group-updated="updateGroupSettings"
      @group-deleted="confirmDeleteGroup"
      @group-left="leaveGroup"
      @vote-created="createNewVote"
      @post-created="handlePostCreated"
      @member-added="addMember"
      @vote-submitted="handleVoteSubmit"
      @vote-deleted="deleteVote"
      @post-edited="editPost"
      @post-deleted="deletePost"
      @user-added="handleUserAdded"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '~/src/utils/axios'

// Import components
import LoadingError from '@/components/group/LoadingError.vue'
import GroupHeader from '@/components/group/GroupHeader.vue'
import GroupTabs from '@/components/group/GroupTabs.vue'
import GroupDialogs from '@/components/group/GroupDialogs.vue'

// Import composables
import { useGroupData } from '@/composables/useGroupData'
import { useGroupMembers } from '@/composables/useGroupMembers'
import { useGroupPosts } from '@/composables/useGroupPosts'
import { useGroupVotes } from '@/composables/useGroupVotes'

// Route and router
const route = useRoute()
const router = useRouter()
const groupId = route.params.id

// State
const loading = ref(true)
const error = ref(null)

// UI state for dialogs
const showSettingsDialog = ref(false)
const showNewVoteDialog = ref(false)
const showNewPostDialog = ref(false)
const showAddMemberDialog = ref(false)
const showUserSearchDialog = ref(false)
const selectedPost = ref(null)
const selectedVote = ref(null)

// Composables
const { 
  group, 
  fetchGroup, 
  updateGroupSettings, 
  confirmDeleteGroup, 
  leaveGroup,
  isCurrentUserAdmin 
} = useGroupData(groupId)

const { 
  currentUser, 
  fetchCurrentUser,
  addMember, 
  handleUserAdded, 
  handleCsvImport
} = useGroupMembers(groupId, group, fetchGroup)

const { 
  posts, 
  fetchPosts, 
  handlePostCreated, 
  editPost, 
  deletePost 
} = useGroupPosts(groupId)

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
</script>