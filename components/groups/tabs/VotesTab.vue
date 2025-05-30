<!-- components/group/tabs/VotesTab.vue -->
<template>
  <div class="mt-6 p-6">
    <!-- Message for temporarily disabled voting functionality -->
    <!-- <div class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
      <p class="text-amber-800">
        Voting functionality is currently under development and will be available soon.
      </p>
    </div> -->
    
    <!-- Use the shared VotesList component which handles lists of votes -->
    <VotesList
      :votes="votes"
      :loading="loading"
      :show-create-button="true"
      :create-button-disabled="!canCreateVotes"
      :disabled-tooltip-message="voteCreationTooltip"
      @create-vote="$emit('create-vote')"
      @open-vote="$emit('open-vote', $event)"
    />
  </div>
  
  <!-- Dialogs are now handled by the parent component -->
  <!-- New Vote Dialog removed -->
  <!-- Vote Details Dialog removed -->
</template>

<script setup>
import { computed } from 'vue'
import VotesList from '~/components/votes/Voteslist.vue'
import { getUserIdFromToken } from '~/src/utils/auth'

// Receive props from parent
const props = defineProps({
  votes: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  },
  group: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: () => ({})
  },
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  }
})

// Define emits
const emit = defineEmits(['create-vote', 'open-vote'])

// Get current user ID from token or from props
const currentUserId = computed(() => {
  if (props.currentUser?.id) {
    return props.currentUser.id
  }
  
  if (process.client) {
    return getUserIdFromToken() || ''
  }
  return ''
})

// Use the isCurrentUserAdmin prop instead of computing it locally
// const isCurrentUserAdmin = computed(() => {
//   if (!props.group?.members || !currentUserId.value) return false
//   
//   const currentMember = props.group.members.find(member => 
//     member.user_id === currentUserId.value || member.id === currentUserId.value
//   )
//   
//   return currentMember?.role === 'admin'
// })

// Check if user can create votes based on permissions
const canCreateVotes = computed(() => {
  // If user is admin, they can always create votes
  if (props.isCurrentUserAdmin) {
    return true
  }
  
  // If user is not admin, check group permissions
  const permissions = props.group?.permissions
  if (!permissions) {
    // Default to false if no permissions are set
    return false
  }
  
  // Allow non-admin vote creation if permission is enabled
  return permissions.allowNonAdminCreateVotes === true
})

// Tooltip message for disabled vote creation button
const voteCreationTooltip = computed(() => {
  if (canCreateVotes.value) return ''
  
  if (props.isCurrentUserAdmin) {
    return 'Vote creation is currently disabled'
  }
  
  const permissions = props.group?.permissions
  if (permissions?.allowNonAdminCreateVotes === false) {
    return 'Group administrators have disabled vote creation for non-admin members'
  }
  
  return 'Only group administrators can create votes in this group'
})

// All local state, composable usage, and handlers related to 
// selectedVote, dialogs, submitting, deleting are removed.
// onMounted is removed as fetchVotes is handled by parent.

</script>