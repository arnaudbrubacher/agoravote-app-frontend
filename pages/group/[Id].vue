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
      :is-loading-votes="isLoadingVotes"
      @create-post="showNewPostDialog = true"
      @open-post="selectedPost = $event"
      @create-vote="showNewVoteDialog = true"
      @open-vote="handleOpenVote($event.id)"
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
      :show-vote-details="showVoteDetailsDialog"
      :selected-post="selectedPost"
      :selected-vote="selectedVote"
      :is-loading-vote-details="isLoadingDetails"
      :group="group"
      :current-user="currentUser"
      :is-current-user-admin="isCurrentUserAdmin"
      :user-tracker-hash="selectedVote?.user_tracker_hash"
      :encrypted-ballot-data="encryptedBallotData"
      :is-encrypting="isEncrypting"
      :is-submitting="isSubmittingVote"
      :spoiled-selection-details="spoiledSelectionDetails"
      @close-settings="showSettingsDialog = false"
      @close-new-post="showNewPostDialog = false"
      @close-new-vote="showNewVoteDialog = false"
      @close-add-member="showAddMemberDialog = false"
      @close-user-search="showUserSearchDialog = false"
      @close-post-details="selectedPost = null"
      @close-vote-details="closeVoteDetailsHandler"
      @group-updated="handleGroupUpdated"
      @group-deleted="handleGroupDeleted"
      @vote-created="handleVoteCreated"
      @post-created="handlePostCreated"
      @member-added="handleMemberAdded"
      @post-edited="handlePostEdited"
      @post-deleted="handlePostDeleted"
      @vote-deleted="handleVoteDeleted"
      @user-added="handleUserAdded"
      @encrypt-vote="handleEncryptVote"
      @cast-vote="handleCastVote"
      @spoil-vote="handleSpoilVote"
      @clear-spoiled-details="handleClearSpoiledDetails"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
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
const showVoteDetailsDialog = ref(false)
const selectedPost = ref(null)

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
  handleUserAdded: processUserAdded,
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
  selectedVote,
  isLoadingVotes, 
  isLoadingDetails, 
  fetchVotes, 
  openVoteDetails,
  createNewVote
} = useGroupVotes(groupId)

// --- NEW State for Multi-Step Voting --- 
const encryptedBallotData = ref(null); // Stores { tracker_hash: string, ... } after successful encryption
const isEncrypting = ref(false); // Loading state for encryption API call
const isSubmittingVote = ref(false); // Loading state for cast/spoil API call
const spoiledSelectionDetails = ref(null); // Stores plaintext of spoiled ballot { choiceId, writeIn }
// --- END NEW State --- 

// WATCHER FOR DEBUGGING
watch(selectedVote, (newValue, oldValue) => {
  console.log(`[pages/group/[id].vue] selectedVote ref changed:`, {
    oldValue,
    newValue,
    isTruthy: !!newValue
  });
});
// END WATCHER

// Initialize
onMounted(async () => {
  try {
    loading.value = true
    
    // Fetch all necessary data in parallel
    await Promise.all([
      fetchCurrentUser(),
      fetchGroup(),
      fetchPosts(),
      fetchVotes() // Use destructured function
    ])

    // Check if the user has pending status and redirect if needed
    if (group.value && (
      (group.value.membership && group.value.membership.status === 'pending') ||
      group.value.membership_status === 'pending' ||
      group.value.status === 'pending'
    )) {
      console.log('User has pending status for this group, redirecting to last active group')
      
      // Get the last visited group ID from localStorage
      const lastVisitedGroupId = localStorage.getItem('lastVisitedGroupId')
      
      if (lastVisitedGroupId && lastVisitedGroupId !== groupId) {
        // Redirect to the last visited group
        console.log('Redirecting to last visited group:', lastVisitedGroupId)
        router.push(`/group/${lastVisitedGroupId}`)
      } else {
        // If no last visited group, redirect to profile
        console.log('No last visited group found, redirecting to profile')
        alert('You cannot access this group until your membership is approved.')
        router.push('/profile')
      }
      return
    }

    // If we got here, the user has access to the group
    // Save this group as the last visited group
    localStorage.setItem('lastVisitedGroupId', groupId)
    
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
    
    // Check if this is a pending membership error with active groups
    if (err.response?.data?.pending_membership) {
      if (err.response?.data?.active_groups?.length > 0) {
        const activeGroups = err.response.data.active_groups
        console.log('User has active memberships in these groups:', activeGroups)
        
        // Redirect to the first active group
        const firstActiveGroup = activeGroups[0]
        console.log('Redirecting to active group:', firstActiveGroup.name, firstActiveGroup.id)
        
        // Save this as the last visited group
        localStorage.setItem('lastVisitedGroupId', firstActiveGroup.id)
        
        // Show a message and redirect
        alert(`You cannot access this group until your membership is approved. Redirecting you to ${firstActiveGroup.name}.`)
        router.push(`/group/${firstActiveGroup.id}`)
      } else {
        // No active groups available, redirect to profile
        console.log('No active groups available, redirecting to profile')
        alert('You cannot access this group until your membership is approved.')
        router.push('/profile')
      }
    }
  } finally {
    loading.value = false
  }
})

// Clean up event listeners when component is unmounted
onBeforeUnmount(() => {
  window.removeEventListener('group-data-updated', refreshGroupData)
})

// Navigation helpers
const navigateToProfile = () => {
  router.push('/profile')
}

// Action handlers
const handleGroupUpdated = async (updatedGroupData) => {
  try {
    await updateGroupSettings(updatedGroupData)
    showSettingsDialog.value = false
  } catch (err) {
    console.error('Failed to update group:', err)
    alert('Failed to update group: ' + (err.response?.data?.error || err.message))
  }
}

const handleGroupDeleted = async () => {
  try {
    await confirmDeleteGroup()
    router.push('/')
  } catch (err) {
    console.error('Failed to delete group:', err)
    alert('Failed to delete group: ' + (err.response?.data?.error || err.message))
  }
}

const handleVoteCreated = async (voteData) => {
  console.log("[pages/group/[id].vue] handleVoteCreated called with data:", voteData);
  try {
    await createNewVote(voteData); // Call the composable function
    showNewVoteDialog.value = false;
    await fetchVotes(); // Refresh list after successful creation
    // Optional: Show success message
    // alert("Vote created successfully!"); 
  } catch (err) {
    console.error("[pages/group/[id].vue] Failed to create vote:", err);
    // Error alert is likely handled within createNewVote, but could add one here too
  }
};

const handlePostCreated = async () => {
  showNewPostDialog.value = false
  await fetchPosts()
}

const handleMemberAdded = async () => {
  showAddMemberDialog.value = false
  await fetchGroup()
}

const handlePostEdited = (editedPost) => {
  const index = posts.value.findIndex(p => p.id === editedPost.id)
  if (index !== -1) {
    posts.value[index] = editedPost
  }
  selectedPost.value = null
}

const handlePostDeleted = async (postId) => {
  posts.value = posts.value.filter(p => p.id !== postId)
  selectedPost.value = null
}

// --- NEW Multi-Step Vote Handlers ---

// Step 1: Handle the 'encrypt-vote' event from BallotForm (via VoteDetailsDialog)
const handleEncryptVote = async (payload) => {
  console.log(`[pages/group/[id].vue] handleEncryptVote function CALLED with payload:`, payload);
  if (!currentUser.value?.id || !payload.voteId || !payload.selectedEgChoiceId) {
    console.error("Missing data for vote encryption:", { payload, userId: currentUser.value?.id });
    alert("Cannot encrypt vote. Missing necessary information.");
    return;
  }

  console.log(`[pages/group/[id].vue] handleEncryptVote called for vote ${payload.voteId}`);
  isEncrypting.value = true;
  encryptedBallotData.value = null; // Clear any previous attempts

  try {
    const encryptPayload = {
        voter_id: currentUser.value.id,
        selections: {
            [String(payload.voteId)]: payload.selectedEgChoiceId
        },
        // Include write-in if applicable (adjust key based on backend expectation)
        ...(payload.writeIn !== undefined && { write_in: payload.writeIn })
    };

    console.log("Sending encryption payload:", encryptPayload);
    // TODO: Verify backend endpoint and payload structure
    const response = await axios.post(`/votes/${payload.voteId}/encrypt`, encryptPayload);
    
    console.log("Encryption successful. Response:", response.data);
    if (!response.data?.tracker_hash) {
      throw new Error("Encryption response did not include a tracker hash.");
    }

    // Store the necessary data for the next step (casting/spoiling)
    // Backend might return more than just the hash, store what's needed.
    encryptedBallotData.value = { 
        tracker_hash: response.data.tracker_hash, 
        // Include other relevant data from response if needed by submit endpoint 
        // encrypted_ballot_id: response.data.encrypted_ballot_id
    }; 
    console.log("Stored encryptedBallotData:", encryptedBallotData.value);

  } catch (err) {
    console.error("[pages/group/[id].vue] Vote encryption failed:", err);
    alert(`Vote encryption failed: ${err.response?.data?.error || err.message}`);
    encryptedBallotData.value = null; // Clear data on error
  } finally {
    isEncrypting.value = false;
  }
};

// Step 2a: Handle the 'cast-vote' event
const handleCastVote = async (encryptedData) => {
  // Cast uses the original payload structure (just encrypted data)
  await submitBallotAction('cast', encryptedData);
};

// Step 2b: Handle the 'spoil-vote' event
const handleSpoilVote = async (payload) => {
  // Spoil now expects a payload: { encryptedData: {...}, plaintextSelection: {...} }
  if (!payload || !payload.encryptedData || !payload.plaintextSelection) {
      console.error("Invalid payload received for spoil-vote:", payload);
      alert("Cannot spoil ballot: internal error preparing data.");
      return;
  }
  await submitBallotAction('spoil', payload.encryptedData, payload.plaintextSelection);
};

// Common function for casting or spoiling
const submitBallotAction = async (action, encryptedData, plaintextSelection = null) => {
  if (!encryptedData?.tracker_hash) {
      console.error("Missing tracker hash for submitting ballot action:", action, encryptedData);
      alert(`Cannot ${action} ballot. Missing tracker hash.`);
      return;
  }

  console.log(`[pages/group/[id].vue] handle${action.charAt(0).toUpperCase() + action.slice(1)}Vote called with tracker ${encryptedData.tracker_hash}`);
  isSubmittingVote.value = true;

  try {
    const submitPayload = {
        tracker_hash: encryptedData.tracker_hash,
        action: action // 'cast' or 'spoil'
    };
    console.log(`Submitting ballot with payload:`, submitPayload);
    const submitResponse = await axios.post(`/ballots/submit`, submitPayload);
    console.log(`Ballot ${action} successful:`, submitResponse.data);

    // --- Success --- 
    alert(`Ballot successfully ${action}ed! ${action === 'spoil' ? 'It will not be counted.' : 'Your tracker hash is: ' + encryptedData.tracker_hash}`);
    
    // Clear the temporary encrypted data state
    encryptedBallotData.value = null;

    if (action === 'cast') {
      // If CAST succeeds, update the user's tracker hash in the selectedVote object
      if (selectedVote.value) {
          selectedVote.value.user_tracker_hash = encryptedData.tracker_hash;
          console.log("[pages/group/[id].vue] Updated selectedVote.user_tracker_hash after cast.");
      }
    } else if (action === 'spoil') {
      // If SPOIL succeeds, store the plaintext details to display confirmation
      spoiledSelectionDetails.value = plaintextSelection;
      console.log("[pages/group/[id].vue] Ballot spoiled. Storing plaintext for confirmation:", plaintextSelection);
    }

  } catch (err) {
    console.error(`[pages/group/[id].vue] Ballot ${action} failed:`, err);
    alert(`Ballot ${action} failed: ${err.response?.data?.error || err.message}`);
    // Keep dialog open and encrypted data available for retry?
    // encryptedBallotData.value = null; // Optional: Clear data even on failure?
  } finally {
    isSubmittingVote.value = false;
  }
};

// Handler to clear the spoiled confirmation state
const handleClearSpoiledDetails = () => {
    console.log("[pages/group/[id].vue] Clearing spoiled selection details.");
    spoiledSelectionDetails.value = null;
}

// --- END NEW Multi-Step Vote Handlers ---

const handleVoteDeleted = async (voteId) => {
  // Call the backend API to delete the vote
  try { 
    console.log(`[pages/group/[id].vue] Sending delete request for vote ID: ${voteId}`);
    const response = await axios.delete(`/votes/${voteId}`)
    console.log(`[pages/group/[id].vue] Vote deleted successfully on backend:`, response.data);
    
    // Remove from frontend list only after successful backend deletion
    votes.value = votes.value.filter(v => v.id !== voteId) 
    selectedVote.value = null 
    showVoteDetailsDialog.value = false 

    alert("Vote deleted successfully."); // Optional success message

  } catch (err) { 
    console.error(`[pages/group/[id].vue] Failed to delete vote ID ${voteId}:`, err);
    alert(`Failed to delete vote: ${err.response?.data?.error || err.message}`);
    // Optionally, you might not want to close the dialog if deletion fails
    // selectedVote.value = null 
    // showVoteDetailsDialog.value = false 
  }
}

const handleUserAdded = async () => {
  showUserSearchDialog.value = false
  await fetchGroup()
}

// Wrapper for the group member add action
const handleAddMemberWrapper = async (email) => {
  await addMember(email)
  await fetchGroup()
}

// Wrapper for promoting member
const handleMemberPromoted = async (memberId) => {
  await promoteMember(memberId)
  await fetchGroup()
}

// Wrapper for demoting member
const handleMemberDemoted = async (memberId) => {
  await demoteMember(memberId)
  await fetchGroup()
}

// Wrapper for removing member
const handleMemberRemoveEvent = async (memberId) => {
  await handleMemberRemove(memberId)
  await fetchGroup()
}

// Handle CSV Import
const handleCsvImport = async (file) => {
  await importCsvMembers(file)
  await fetchGroup()
}

const refreshGroupData = async () => {
  await fetchGroup()
}

const handleAdminStatusUpdate = (newAdminStatus) => {
  if (group.value) {
    group.value.isCurrentUserAdmin = newAdminStatus
  }
}

// Function to trigger opening the vote dialog and fetching details
const handleOpenVote = async (voteId) => {
  // Clear previous encryption state when opening a new vote dialog
  encryptedBallotData.value = null;
  isEncrypting.value = false;
  isSubmittingVote.value = false;
  
  console.log(`[pages/group/[id].vue] handleOpenVote triggered with ID: ${voteId}`);
  if (!voteId) {
    console.error("[pages/group/[id].vue] handleOpenVote received undefined voteId!");
    return;
  }
  await openVoteDetails(voteId); // Use destructured function
  if (selectedVote.value) { // Check destructured ref
      console.log("[pages/group/[id].vue] Vote data before showing dialog:", JSON.parse(JSON.stringify(selectedVote.value))); 
      console.log(`[pages/group/[id].vue] Vote status: ${selectedVote.value?.status}, Choices length: ${selectedVote.value?.choices?.length}`);
      console.log("[pages/group/[id].vue] Vote details loaded, setting showVoteDetailsDialog to true.");
      showVoteDetailsDialog.value = true;
  } else {
      console.error("[pages/group/[id].vue] Failed to load vote details, dialog will not open.");
  }
};

// New handler for closing the vote details dialog
const closeVoteDetailsHandler = () => {
    console.log("[pages/group/[id].vue] Closing vote details dialog.");
    showVoteDetailsDialog.value = false;
    selectedVote.value = null; // Clear the destructured ref
    // Clear encryption state as well when closing
    encryptedBallotData.value = null;
    isEncrypting.value = false;
    isSubmittingVote.value = false;
};

// Handle leaving the group
const handleLeaveGroup = async () => {
  if (confirm('Are you sure you want to leave this group?')) {
    await leaveGroup()
    router.push('/')
  }
}

// Group picture URL
const groupPictureUrl = computed(() => {
  const picturePath = group.value?.picture;
  if (!picturePath) return null;

  // If it's already an absolute URL (e.g., from S3), use it directly
  if (picturePath.startsWith('http')) {
    return picturePath;
  } 

  // If it's a relative path (likely starting with '/uploads/...' from backend),
  // just prepend the base URL.
  // Ensure no double slashes if picturePath starts with '/'.
  const baseUrl = 'http://localhost:8080'; // Consider making this configurable
  if (picturePath.startsWith('/')) {
      return `${baseUrl}${picturePath}`;
  } else {
      // Handle cases where it might just be a filename (less likely based on error)
      return `${baseUrl}/uploads/groups/${picturePath}`; 
  }
});
</script>