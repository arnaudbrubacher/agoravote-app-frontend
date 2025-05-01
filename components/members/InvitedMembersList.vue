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
        v-for="(invitation, index) in invitedMembers"
        :key="invitation.id || index"
        :member="mapInvitationToMember(invitation)"
        :is-invited="true"
        :is-current-user-admin="isCurrentUserAdmin"
        @resend-invite="$emit('resend-invite', invitation)"
        @cancel-invite="$emit('cancel-invite', invitation)"
      />
    </div>
  </div>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue';
import MemberRow from '~/components/members/MemberRow.vue';

defineProps({
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

defineEmits(['resend-invite', 'cancel-invite']);

// Helper function to map invitation structure to member structure expected by MemberRow
const mapInvitationToMember = (invitation) => {
  return {
    id: invitation.id, // Use invitation id
    name: invitation.email, // Display email as name for invited members
    email: invitation.email,
    profile_picture: null, // No avatar for invitations
    avatar: null,
    isAdmin: false, // Invitations are not admins
    status: 'invited', // Custom status
    created_at: invitation.created_at, // Pass through relevant dates if needed by MemberRow logic (e.g., for display)
    expires_at: invitation.expires_at,
    // Add any other fields MemberRow might implicitly expect, setting defaults
    user: { id: invitation.id, email: invitation.email, name: invitation.email }, // Mock user object if needed
    user_id: invitation.id
  };
};
</script> 