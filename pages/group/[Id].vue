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
    <div class="w-full mx-auto flex flex-col sm:flex-row justify-between items-center mb-8 p-4 rounded-lg">
      <!-- Group info (centered) -->
      <div class="flex flex-col items-center sm:flex-row sm:items-center text-center sm:text-left mb-4 sm:mb-0">
        <div class="flex-shrink-0 mb-2 sm:mb-0 sm:mr-4">
          <div v-if="!group.picture" class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Users class="h-8 w-8 text-gray-600" />
          </div>
          <img 
            v-else
            :src="groupPictureUrl" 
            alt="Group Picture"
            class="w-16 h-16 rounded-full object-cover border"
          />
        </div>
        <div class="text-center sm:text-left">
          <h1 class="text-xl font-semibold">{{ group.name }}</h1>
          <p v-if="group.description" class="text-sm text-gray-600 mt-1">{{ group.description }}</p>
        </div>
      </div>
      
      <!-- Leave Button -->
      <div class="flex items-center space-x-2 mt-4 sm:mt-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="destructive"
                size="icon"
                @click="handleLeaveGroup"
                class="flex items-center justify-center"
              >
                <LogOut class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Leave Group</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Group content tabs -->
    <GroupTabs
      v-model:modelValue="activeTab"
      :group="group"
      :posts="posts"
      :votes="votes"
      :current-user="currentUser"
      :is-current-user-admin="isCurrentUserAdmin"
      :is-loading-votes="isLoadingVotes"
      :fetchGroup="fetchGroup"
      @create-post="showNewPostDialog = true"
      @open-post="selectedPost = $event"
      @create-vote="showNewVoteDialog = true"
      @open-vote="handleOpenVote($event.id)"
      @search-user="showUserSearchDialog = true"
      @invite-member-by-email="handleInviteMember"
      @csv-import="handleCsvImport"
      @member-promoted="handleMemberPromoted"
      @member-demoted="handleMemberDemoted"
      @refresh-group="refreshGroupData"
      @admin-status-update="handleAdminStatusUpdate"
      @group-updated="handleGroupUpdated"
      @group-deleted="handleGroupDeleted"
    />

    <!-- All dialogs -->
    <GroupDialogs
      :show-new-post-dialog="showNewPostDialog"
      :show-new-vote-dialog="showNewVoteDialog"
      :is-creating-vote="isCreatingVote"
      :show-user-search-dialog="showUserSearchDialog"
      :show-vote-details="showVoteDetailsDialog"
      :selected-post="selectedPost"
      :selected-vote="selectedVote"
      :is-loading-details="isLoadingDetails"
      :group="group"
      :current-user="currentUser"
      :is-current-user-admin="isCurrentUserAdmin"
      :user-tracker-hash="selectedVote?.user_tracker_hash"
      :encrypted-ballot-data="encryptedBallotData"
      :is-encrypting="isEncrypting"
      :is-submitting="isSubmittingVote"
      :spoiled-selection-details="spoiledSelectionDetails"
      :is-deleting-vote="isDeletingVote"
      @close-new-post="showNewPostDialog = false"
      @close-new-vote="showNewVoteDialog = false"
      @close-user-search="showUserSearchDialog = false"
      @close-post-details="selectedPost = null"
      @close-vote-details="closeVoteDetailsHandler"
      @vote-created="handleVoteCreated"
      @post-created="handlePostCreated"
      @post-edited="handlePostEdited"
      @post-deleted="handlePostDeleted"
      @vote-deleted="handleDeleteVote"
      @user-added="handleUserAdded"
      @encrypt-vote="handleEncryptVote"
      @cast-vote="handleCastVote"
      @spoil-vote="handleSpoilVote"
      @clear-spoiled-details="handleClearSpoiledDetails"
      @end-vote="handleEndVote"
      @tally-decrypt="handleTallyDecrypt"
    />
  </div>

  <!-- Alert Dialog for General Success/Error Messages -->
  <AlertDialog :open="isAlertOpen" @update:open="isAlertOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ alertTitle }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ alertMessage }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction @click="isAlertOpen = false">OK</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Confirmation Dialog -->
  <AlertDialog :open="isConfirmOpen" @update:open="isConfirmOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ confirmTitle }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ confirmMessage }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="isConfirmOpen = false">Cancel</AlertDialogCancel>
        <AlertDialogAction @click="executeConfirmAction">Confirm</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Users, Settings, LogOut } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import LoadingError from '@/components/group/core/LoadingError.vue'
import GroupTabs from '@/components/group/core/GroupTabs.vue'
import GroupDialogs from '@/components/group/core/GroupDialogs.vue'
import axios from '~/src/utils/axios'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

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

// Reactive ref for controlling the active tab in GroupTabs.vue
// Assuming 'posts' or similar is your default. Adjust if needed.
const activeTab = ref('posts') 

// Check for both uppercase and lowercase param options
// This makes the code more robust against routing config differences
const groupIdRef = ref(route.params.Id || route.params.id) // Use ref for reactivity

// Add debug to see what's happening
console.log('Route params:', route.params) 
console.log('Group ID ref:', groupIdRef.value)

// If groupId is still undefined, try to get it from another source
if (!groupIdRef.value) {
  // Try to get from the path
  const pathMatch = route.path.match(/\/group\/([^\/]+)/)
  if (pathMatch && pathMatch[1]) {
    groupIdRef.value = pathMatch[1]
    console.log('Extracted group ID from path:', groupIdRef)
  }
}

// Common state
const loading = ref(true)
const error = ref(null)

// Dialog states
const showNewPostDialog = ref(false)
const showNewVoteDialog = ref(false)
const showUserSearchDialog = ref(false)
const showVoteDetailsDialog = ref(false)
const selectedPost = ref(null)

// State for General AlertDialog
const isAlertOpen = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')

// State for Confirmation AlertDialog
const isConfirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref(null) // Function to execute on confirmation

// Vote state
const isCreatingVote = ref(false) // Add loading state for vote creation
const isEncrypting = ref(false)
const isSubmittingVote = ref(false)
const encryptedBallotData = ref(null) // Stores { encrypted_ballot: string, tracker_hash: string }

// Use group data and functionality
const { 
  group, 
  fetchGroup, 
  updateGroupSettings,
  confirmDeleteGroup,
  leaveGroup,
  isCurrentUserAdmin
} = useGroupData(groupIdRef.value)

// Use group members functionality
const { 
  currentUser,
  fetchCurrentUser,
  addMember, 
  inviteMemberByEmail,
  handleUserAdded: processUserAdded,
  handleCsvImport: importCsvMembers,
  promoteMember,
  demoteMember,
  handleMemberRemove
} = useGroupMembers(groupIdRef.value, group, fetchGroup)

// Use group posts functionality
const { 
  posts, 
  fetchPosts,
  createNewPost: createNewPostApi,
  editPost, 
  deletePost: deletePostApi
} = useGroupPosts(groupIdRef.value)

// Use group votes functionality
const { 
  votes, 
  selectedVote,
  isLoadingVotes, 
  isLoadingDetails, 
  fetchVotes, 
  openVoteDetails,
  createNewVote,
  endVoteEarly,
  deleteVote,
  tallyAndDecrypt
} = useGroupVotes(groupIdRef.value)

// --- NEW State for Multi-Step Voting --- 
const spoiledSelectionDetails = ref(null); // Stores plaintext of spoiled ballot { choiceId, writeIn }
// --- END NEW State --- 

const isTallying = ref(false); // Add loading state for tally

// Loading state for vote deletion
const isDeletingVote = ref(false)

// Helper to show AlertDialog
function showAlert(title, message) {
  alertTitle.value = title
  alertMessage.value = message
  isAlertOpen.value = true
}

// Helper to show Confirmation Dialog
function showConfirm(title, message, action) {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmAction.value = action // Store the action to call on confirm
  isConfirmOpen.value = true
}

// Helper to execute the stored confirm action
function executeConfirmAction() {
  if (typeof confirmAction.value === 'function') {
    confirmAction.value() // Execute the stored function
  }
  isConfirmOpen.value = false // Close the dialog
}

// WATCHER FOR DEBUGGING
watch(selectedVote, (newValue, oldValue) => {
  console.log(`[pages/group/[id].vue] selectedVote ref changed:`, {
    oldValue,
    newValue,
    isTruthy: !!newValue
  });
});
// END WATCHER

// Helper to process Stripe redirect query parameters
const processStripeRedirectParams = () => {
  const query = route.query;
  if (query.redirect_status) {
    if (query.redirect_status === 'succeeded') {
      showAlert('Payment Successful!', 'Your subscription has been processed and your settings tab may reflect the update shortly.');
      activeTab.value = 'settings'; // Switch to settings tab
    } else {
      showAlert('Payment Issue', `There was an issue with your payment: ${query.redirect_status}. Please check your payment details or try again.`);
      activeTab.value = 'settings'; // Switch to settings tab to show any billing component errors
    }
    // Clean the URL by removing Stripe-specific query parameters
    const { payment_intent, payment_intent_client_secret, redirect_status, ...restQuery } = query;
    router.replace({ query: restQuery });
  }
};

// ----- NEW EVENT LISTENER LOGIC -----
const handleGlobalGroupUpdate = (event) => {
  console.log('[Group Page] Received group-data-updated event:', event.detail);
  // Check if the update is for the current group
  if (event.detail && event.detail.groupId === groupIdRef.value) {
    console.log('[Group Page] Event matches current group ID. Refreshing group data...');
    fetchGroup(); // Call the fetch function from the composable
  } else {
    console.log('[Group Page] Event is for a different group or has no groupId. Ignoring.');
  }
};

onMounted(async () => {
  console.log('[Group Page] Component mounted. Group ID:', groupIdRef.value);
  if (!groupIdRef.value) {
    console.error('[Group Page] Group ID is missing on mount!');
    error.value = 'Group ID is missing. Cannot load group page.';
    loading.value = false;
    return;
  }
  
  // Fetch initial data
  loading.value = true;
  try {
    await fetchCurrentUser(); // Fetch current user first
    await fetchGroup(); // Fetch group data
    await fetchPosts(); // Fetch posts
    await fetchVotes(); // Fetch votes
  } catch (err) {
    console.error('[Group Page] Error fetching initial data:', err);
    error.value = 'Failed to load group data.';
  } finally {
    loading.value = false;
  }
  
  // Process Stripe redirect parameters on initial load
  processStripeRedirectParams();

  // Add the global event listener
  window.addEventListener('group-data-updated', handleGlobalGroupUpdate);
})

onBeforeUnmount(() => {
  console.log('[Group Page] Component unmounting. Removing event listener.');
  // Remove the global event listener
  window.removeEventListener('group-data-updated', handleGlobalGroupUpdate);
})

// Watch for query parameter changes (e.g., if user navigates with browser back/forward after redirect)
watch(() => route.query, (newQuery, oldQuery) => {
  // Check if relevant Stripe params are present to avoid processing unrelated query changes
  if (newQuery.redirect_status && 
      (newQuery.redirect_status !== oldQuery.redirect_status || 
       newQuery.payment_intent !== oldQuery.payment_intent)) {
    processStripeRedirectParams();
  }
}, { deep: true });
// END WATCHER

// Navigation helpers
const navigateToProfile = () => {
  router.push('/profile')
}

// Action handlers
const handleGroupUpdated = async (updatedGroupData) => {
  try {
    await updateGroupSettings(updatedGroupData)
    showAlert('Success', 'Group settings updated successfully.')
  } catch (err) {
    console.error('Failed to update group:', err)
    showAlert('Error Updating Group', err.response?.data?.error || err.message || 'Could not update group settings.')
  }
}

const handleGroupDeleted = async () => {
  showConfirm(
    'Confirm Deletion',
    'Are you sure you want to delete this group? This action cannot be undone.',
    async () => { // The action to perform on confirm
      try {
        await confirmDeleteGroup(); // Call the original composable function
        router.push('/');
        showAlert('Success', 'Group deleted successfully.'); // Use showAlert for success
      } catch (err) {
        console.error('Failed to delete group:', err);
        // Use showAlert for error
        showAlert('Error Deleting Group', err.response?.data?.error || err.message || 'Could not delete the group.');
      }
    }
  );
};

const handleVoteCreated = async (voteData) => {
  console.log("Handling vote creation with data:", voteData);
  isCreatingVote.value = true;
  error.value = null;
  try {
    await createNewVote(voteData); 
    showAlert('Success', 'Vote created successfully');
    showNewVoteDialog.value = false;
  } catch (err) {
    console.error("Error creating vote:", err);
    error.value = `Failed to create vote: ${err.response?.data?.error || err.message}`;
    showAlert('Error', error.value);
  } finally {
    isCreatingVote.value = false;
  }
};

const handlePostCreated = async (postData) => {
  try {
    await createNewPostApi(postData); // Call the renamed post creation function
    showNewPostDialog.value = false;
    await fetchPosts(); // Refresh posts list
     toast({
      title: 'Post Created',
      description: 'The new post has been successfully created.',
    })
  } catch (err) {
     toast({
      variant: 'destructive',
      title: 'Error Creating Post',
      description: err.message || 'Could not create the post.',
    })
  }
};

const handlePostEdited = (editedPost) => {
  const index = posts.value.findIndex(p => p.id === editedPost.id)
  if (index !== -1) {
    posts.value[index] = editedPost
  }
  selectedPost.value = null
}

const handlePostDeleted = async (postId) => {
  showConfirm(
    'Confirm Delete Post',
    'Are you sure you want to delete this post? This action cannot be undone.',
    async () => { // Action on confirm
      try {
        await deletePostApi(postId); // Call the composable function
        await fetchPosts(); // Refresh list
        // Use showAlert instead of toast for consistency
        showAlert('Post Deleted', 'The post has been successfully deleted.');
        // toast({ 
        //   title: 'Post Deleted',
        //   description: 'The post has been successfully deleted.',
        // })
      } catch (error) { 
        // Use showAlert instead of toast for consistency
        showAlert('Error Deleting Post', error.message || 'Could not delete the post.');
        // toast({
        //   variant: 'destructive',
        //   title: 'Error Deleting Post',
        //   description: error.message || 'Could not delete the post.',
        // })
      }
    }
  );
};

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
  // Add try-catch to handle potential errors from submitBallotAction
  try {
    await submitBallotAction('cast', encryptedData);
    // Success alert is handled within submitBallotAction now
  } catch (err) {
     showAlert('Error Casting Vote', err.message || 'An error occurred while casting the vote.');
  }
};

// Step 2b: Handle the 'spoil-vote' event
const handleSpoilVote = async (payload) => {
  // Spoil now expects a payload: { encryptedData: {...}, plaintextSelection: {...} }
  if (!payload || !payload.encryptedData || !payload.plaintextSelection) {
      console.error("Invalid payload received for spoil-vote:", payload);
      alert("Cannot spoil ballot: internal error preparing data.");
      return;
  }
  // Add try-catch to handle potential errors from submitBallotAction
  try {
    await submitBallotAction('spoil', payload.encryptedData, payload.plaintextSelection);
     // Success alert is handled within submitBallotAction now
  } catch (err) {
     showAlert('Error Spoiling Vote', err.message || 'An error occurred while spoiling the ballot.');
  }
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
    // Construct a user-friendly message
    let successMessage = `Ballot successfully ${action}ed!`;
    if (action === 'cast') {
      successMessage += ` Your tracker hash is: ${encryptedData.tracker_hash}`;
    } else if (action === 'spoil') {
      successMessage += ' It will not be counted.';
    }

    // showAlert( // REMOVED this alert
    //   `Ballot ${action.charAt(0).toUpperCase() + action.slice(1)}ed`,
    //   successMessage // Use the constructed message
    // );
    
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
    // Rethrow error to be caught by handleCastVote/handleSpoilVote
    throw new Error(`Ballot ${action} failed: ${err.response?.data?.error || err.message}`);
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

// Updated handleVoteDeleted to use confirmation dialog
const handleDeleteVote = async (voteId) => {
  showConfirm(
    'Confirm Delete Vote',
    'Are you sure you want to delete this vote? This action cannot be undone.',
    async () => { // Action to perform on confirmation
      try {
        isDeletingVote.value = true; // Start loading
        console.log(`[pages/group/[id].vue] Sending delete request for vote ID: ${voteId}`);
        await deleteVote(voteId); // Call the composable function (no alerts inside anymore)
        console.log(`[pages/group/[id].vue] Vote deleted successfully via composable for vote ID: ${voteId}`);
        
        // UI updates that were previously in the composable might need to happen here or rely on fetchVotes() called within deleteVote()
        // votes.value = votes.value.filter(v => v.id !== voteId) 
        // selectedVote.value = null 
        // showVoteDetailsDialog.value = false 

        showAlert('Success', 'Vote deleted successfully.'); // Show success alert here

        // Ensure the list is refreshed if not already handled by deleteVote composable
        // await fetchVotes(); // Might be redundant if deleteVote calls it

      } catch (err) {
        console.error(`[pages/group/[id].vue] Failed to delete vote ID ${voteId}:`, err);
        showAlert('Error Deleting Vote', `Failed to delete vote: ${err.response?.data?.error || err.message}`);
      } finally {
        isDeletingVote.value = false; // Stop loading regardless of outcome
      }
    }
  );
};

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
  const member = group.value?.members?.find(m => m.id === memberId);
  const memberName = member?.name || member?.user?.name || 'this member';
  try {
    await promoteMember(memberId);
    await fetchGroup(); // Refresh group data
    showAlert('Member Promoted', `${memberName} is now an admin.`);
  } catch (err) {
    console.error('Failed to promote member:', err);
    showAlert('Error Promoting Member', err.response?.data?.error || err.message || 'Could not promote member.');
  }
};

// Wrapper for demoting member
const handleMemberDemoted = async (memberId) => {
  const member = group.value?.members?.find(m => m.id === memberId);
  const memberName = member?.name || member?.user?.name || 'this member';
  try {
    await demoteMember(memberId);
    await fetchGroup(); // Refresh group data
    showAlert('Member Demoted', `${memberName} is no longer an admin.`);
  } catch (err) {
    console.error('Failed to demote member:', err);
    showAlert('Error Demoting Member', err.response?.data?.error || err.message || 'Could not demote member.');
  }
};

// Handle CSV Import
const handleCsvImport = async (file) => {
  await importCsvMembers(file)
  await fetchGroup()
}

const refreshGroupData = async () => {
  try {
    await fetchGroup()
  } catch (error) {
    console.warn('Error refreshing group data:', error)
    // Check if this is a 404 error (group no longer exists)
    if (error.response && error.response.status === 404) {
      console.log('Group no longer exists, redirecting to profile page')
      router.push('/profile')
    }
    // Don't rethrow the error - we've handled it
  }
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
  
  // Set the dialog to show immediately, allowing it to catch the loading state
  showVoteDetailsDialog.value = true;
  
  try {
    await openVoteDetails(voteId); // Use destructured function
  } catch (err) {
     // Error alert was removed from fetchVoteDetails, so handle it here
     console.error(`[pages/group/[id].vue] Error opening vote details for ${voteId}:`, err);
     showAlert('Error Loading Vote', `Failed to load vote details: ${err.response?.data?.error || err.message}`);
     showVoteDetailsDialog.value = false; // Close the dialog on error
     selectedVote.value = null; // Clear selected vote on error
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
  showConfirm(
    'Confirm Leave Group',
    'Are you sure you want to leave this group?',
    async () => { // Action to perform on confirmation
      try {
        await leaveGroup(); // Call the original composable function
        router.push('/');
        showAlert('Success', 'You have left the group.'); // Optional success message
      } catch (err) {
        console.error('Failed to leave group:', err);
        showAlert('Error Leaving Group', err.message || 'Could not leave the group.');
      }
    }
  );
};

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

const { toast } = useToast()

const handleEndVote = async (voteId) => {
  const voteTitle = selectedVote.value?.title || `Vote ID ${voteId}`; // Get title for message
  showConfirm(
    'Confirm End Vote Early',
    `Are you sure you want to end this vote early: "${voteTitle}"? This will close the vote immediately.`,
    async () => { // Action to perform on confirmation
      console.log(`[pages/group/[id].vue] Confirmed ending vote early for vote ID: ${voteId}`);
      try {
        const result = await endVoteEarly(voteId); // Call the API function
        // toast({ // Replaced toast
        //   title: 'Vote Ended',
        //   description: `Vote "${selectedVote.value?.title || voteId}" has been closed successfully.`,
        // })
        showAlert('Vote Ended', `Vote "${voteTitle}" has been closed successfully.`);

        // Update UI
        closeVoteDetailsHandler(); // Close dialog
        await fetchVotes(); // Refresh the votes list

      } catch (error) {
        console.error('Failed to end vote:', error);
        // toast({ // Replaced toast
        //   variant: 'destructive',
        //   title: 'Error Ending Vote',
        //   description: error.message || 'Could not end the vote.',
        // })
        showAlert('Error Ending Vote', error.message || 'Could not end the vote.');
      }
    }
  );
};

const handleTallyDecrypt = async (voteId) => {
  const voteTitle = selectedVote.value?.title || `Vote ID ${voteId}`; // Get title for message
  showConfirm(
    'Confirm Tally & Decrypt',
    `Are you sure you want to tally and decrypt the results for "${voteTitle}"? This uses the ElectionGuard process and may take a moment.`,
    async () => { // Action to perform on confirmation
      console.log(`[pages/group/[id].vue] Confirmed tally-decrypt event for vote ID: ${voteId}`);
      isTallying.value = true;
      try {
        const result = await tallyAndDecrypt(voteId); // Call the API function
        // toast({ // Replaced toast
        //   title: 'Tally Completed',
        //   description: `Vote "${selectedVote.value?.title || voteId}" results decrypted successfully.`,
        // })
        showAlert('Tally Completed', `Vote "${voteTitle}" results decrypted successfully.`);

        // Update UI - Refetch votes to get updated status and results string
        await fetchVotes(); 
        // Optionally, re-fetch details for the *currently open* dialog to update its view
        if (selectedVote.value && selectedVote.value.id === voteId) {
          await openVoteDetails(voteId);
        }
        // Keep dialog open to show decrypted status/results placeholder

      } catch (error) {
        console.error('Failed to tally/decrypt vote:', error);
        // toast({ // Replaced toast
        //   variant: 'destructive',
        //   title: 'Error Tallying Vote',
        //   description: error.message || 'Could not tally and decrypt the vote results.',
        // })
        showAlert('Error Tallying Vote', error.message || 'Could not tally and decrypt the vote results.');
      } finally {
        isTallying.value = false;
      }
    }
  );
};

// Handler for the email invite event from MembersTab
const handleInviteMember = async (email) => {
  console.log(`[pages/group/[Id].vue] handleInviteMember called with email:`, email);
  if (!email) {
    showAlert('Error', 'No email address provided for invitation.');
    return;
  }
  try {
    // Call the composable function to handle the API call
    console.log(`[pages/group/[Id].vue] Calling inviteMemberByEmail composable...`);
    await inviteMemberByEmail(email);
    console.log(`[pages/group/[Id].vue] inviteMemberByEmail composable finished.`);
    // ... rest of try block ...
  } catch (error) {
    // ... catch block ...
  }
};
</script>