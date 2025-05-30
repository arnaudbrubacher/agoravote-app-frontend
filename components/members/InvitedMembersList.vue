<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-4">
      <LucideIcon name="RefreshCw" size="4" class="h-4 w-4 animate-spin text-primary" />
      <span class="ml-2 text-sm text-muted-foreground">Loading invitations...</span>
    </div>


    <!-- Pending members list -->
    <div v-else class="space-y-3">
       <MemberRow
        v-for="(invitation, index) in processedInvitations"
        :key="invitation.id || index"
        :member="invitation"
        :is-invited="true"
        :is-current-user-admin="isCurrentUserAdmin"
        :hide-invited-badge="true"
        @resend-invite="$emit('resend-invite', invitation.originalInvitation)"
        @cancel-invite="$emit('cancel-invite', invitation.originalInvitation)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import MemberRow from '~/components/members/MemberRow.vue';
import { useUserService } from '~/composables/user-service';
import { useNuxtApp } from '#app';

const { $axiosInstance } = useNuxtApp();

const userService = useUserService($axiosInstance);
const processedInvitations = ref([]);
const userDataLoading = ref(false);

const props = defineProps({
  invitedMembers: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  },
  groupId: { // Included groupId prop in case actions need it
    type: String,
    required: true
  }
});

const emit = defineEmits(['resend-invite', 'cancel-invite', 'refresh-invited']);

// Event handlers for auto-refresh
const handleRefreshInvitedMembers = (event) => {
  console.log('[InvitedMembersList] Received refresh-invited-members event:', event.detail);
  if (event.detail?.groupId === props.groupId) {
    // Emit refresh request to parent component
    emit('refresh-invited');
  }
};

const handleGroupDataUpdated = () => {
  console.log('[InvitedMembersList] Received group-data-updated event');
  // Emit refresh request to parent component
  emit('refresh-invited');
};

// Setup event listeners
onMounted(() => {
  window.addEventListener('refresh-invited-members', handleRefreshInvitedMembers);
  window.addEventListener('group-data-updated', handleGroupDataUpdated);
});

// Cleanup event listeners
onUnmounted(() => {
  window.removeEventListener('refresh-invited-members', handleRefreshInvitedMembers);
  window.removeEventListener('group-data-updated', handleGroupDataUpdated);
});

// Watch for changes in invitedMembers and process them
watch(() => props.invitedMembers, async (newInvitations) => {
  if (newInvitations && newInvitations.length > 0) {
    await processInvitations(newInvitations);
  }
}, { immediate: true });

// Process invitations and fetch user data if possible
async function processInvitations(invitations) {
  userDataLoading.value = true;
  const processed = [];
  
  for (const invitation of invitations) {
    // Start with the basic mapped member
    const basicMember = mapInvitationToMember(invitation);
    
    try {
      // Try to fetch user data by email
      const userData = await userService.findUserByEmail(invitation.email);
      
      if (userData) {
        // Override basic data with actual user data
        processed.push({
          ...basicMember,
          id: userData.id || basicMember.id,
          name: userData.name || basicMember.name,
          profile_picture: userData.profile_picture || basicMember.profile_picture,
          avatar: userData.avatar || basicMember.avatar,
          originalInvitation: invitation // Keep the original invitation for events
        });
      } else {
        // If no user data found, use the basic mapped data
        processed.push({
          ...basicMember,
          originalInvitation: invitation
        });
      }
    } catch (error) {
      console.error(`Error fetching user data for ${invitation.email}:`, error);
      // On error, use the basic mapped data
      processed.push({
        ...basicMember,
        originalInvitation: invitation
      });
    }
  }
  
  processedInvitations.value = processed;
  userDataLoading.value = false;
}

// Helper function to extract a user-friendly name from an email address
const extractNameFromEmail = (email) => {
  if (!email) return 'Unknown';
  
  // Get the part before @ symbol
  const username = email.split('@')[0];
  
  // Replace underscores and dots with spaces
  const formatted = username.replace(/[._]/g, ' ');
  
  // Capitalize each word
  return formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to map invitation structure to member structure expected by MemberRow
const mapInvitationToMember = (invitation) => {
  // Extract a better display name from the email
  const displayName = invitation.name || extractNameFromEmail(invitation.email);
  
  return {
    id: invitation.id, // Use invitation id
    name: displayName, // Use better formatted name
    email: invitation.email,
    profile_picture: invitation.profile_picture || null,
    avatar: invitation.avatar || null,
    isAdmin: invitation.isAdmin || false,
    status: 'invited', // Custom status
    created_at: invitation.created_at,
    expires_at: invitation.expires_at,
    // Add any other fields MemberRow might implicitly expect, setting defaults
    user: { 
      id: invitation.id, 
      email: invitation.email, 
      name: displayName
    },
    user_id: invitation.id
  };
};
</script> 