<!-- components/group/tabs/MembersTab.vue -->
<template>
  <div class="p-6">
    <!-- Non-admin notice -->
    <div v-if="!isCurrentUserAdmin" class="bg-muted p-4 rounded-lg mb-4 border border-border">
      <div class="flex items-center">
        <Info class="h-5 w-5 text-muted-foreground mr-2" />
        <p class="text-sm text-muted-foreground">You are viewing group members in read-only mode. Only group administrators can modify member settings.</p>
      </div>
    </div>
    
    <!-- Top Level Actions -->
    <div class="flex justify-end items-center mb-6 space-x-2">
       <!-- Add Members Dropdown -->
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button 
             size="sm"
             :class="{ 'opacity-50 cursor-not-allowed': !isCurrentUserAdmin }"
             :disabled="!isCurrentUserAdmin"
             :title="!isCurrentUserAdmin ? 'Only admins can add members' : ''"
           >
             Add Members
             <LucideIcon name="ChevronDown" size="4" class="ml-1 h-4 w-4" />
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
           <DropdownMenuItem @click="triggerCsvFileInput">
             <LucideIcon name="FileUp" size="4" class="h-4 w-4 mr-2" />
             Upload File
           </DropdownMenuItem>
           <DropdownMenuItem @click="showInviteDialog = true" :disabled="!isCurrentUserAdmin">
             <LucideIcon name="Mail" size="4" class="h-4 w-4 mr-2" />
             Email Invite
           </DropdownMenuItem>
           <DropdownMenuItem @click="$emit('show-user-search')">
             <LucideIcon name="Search" size="4" class="h-4 w-4 mr-2" />
             Search Users
           </DropdownMenuItem>
         </DropdownMenuContent>
       </DropdownMenu>
       
       <!-- Unified Refresh Button -->
       <Button 
         variant="outline" 
         size="sm" 
         @click.prevent="handleRefreshClick"
         :class="{ 'opacity-50 cursor-not-allowed': !isCurrentUserAdmin }"
         :disabled="!isCurrentUserAdmin || isLoadingPendingMembers || isLoadingInvitedMembers || isLoadingMembers" 
         :title="!isCurrentUserAdmin ? 'Only admins can refresh the lists' : 'Refresh All Lists'"
       >
         <LucideIcon name="RefreshCw" size="4" :class="{'animate-spin': isLoadingPendingMembers || isLoadingInvitedMembers || isLoadingMembers, 'mr-1': !(isLoadingPendingMembers || isLoadingInvitedMembers || isLoadingMembers)}" />
         <span v-if="!(isLoadingPendingMembers || isLoadingInvitedMembers || isLoadingMembers)">Refresh</span>
       </Button>
    </div>

    <!-- Pending Members Section -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">Pending Members ({{ pendingMembers.length || 0 }})</h3>
      </div>
      
      <PendingMembersList
        :group-id="group.id"
        :current-user="currentUser"
        :pending-members="pendingMembers"
        :loading="isLoadingPendingMembers"
        :is-current-user-admin="isCurrentUserAdmin"
        @refresh="handlePendingMembersRefresh"
      />
      
      <!-- Separator - ALWAYS show for consistent spacing -->
      <div class="my-6 border-t border-gray-200"></div>
    </div>
    
    <!-- Invited Members Section -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">Invited Members ({{ invitedMembers.length || 0 }})</h3>
      </div>

      <InvitedMembersList
        :group-id="group.id"
        :invited-members="invitedMembers"
        :loading="isLoadingInvitedMembers"
        :is-current-user-admin="isCurrentUserAdmin"
        @resend-invite="resendInvite"
        @cancel-invite="cancelInvite"
        @refresh-invited="handleInvitedMembersRefresh"
      />

      <!-- Separator -->
      <div class="my-6 border-t border-gray-200"></div>
    </div>
    
    <!-- Active Members Section - Added mb-6 for consistency -->
    <div class="mb-6">
      <!-- Use the shared MembersList component which handles lists of members -->
      <MembersList
        :group-id="group.id"
        :group="group"
        :fetch-group="fetchGroup"
        :members="activeMembers"
        :loading="isLoadingMembers"
        :current-user="currentUser"
        :is-current-user-admin="isCurrentUserAdmin"
        :show-add-button="false"
        :show-import-button="false"
        @promote="promoteMember"
        @demote="demoteMember"
        @remove="handleMemberRemove"
        @refresh-members="$emit('refresh-group')"
        @admin-status-update="handleAdminStatusUpdate"
        @review-documents="handleReviewDocuments"
      />
    </div>
    
    <input
      type="file"
      ref="csvFileInput"
      class="hidden"
      accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
      @change="handleFileChange"
    />
    
    <!-- Review Documents Dialog -->
    <ReviewDocumentsDialog
      v-if="showReviewDialog"
      :member="selectedPendingMember"
      :group-id="group.id"
      :is-pending="isPendingMember"
      @close="showReviewDialog = false"
      @accept="acceptPendingMember"
      @decline="declinePendingMember"
    />

    <!-- Invite Member Dialog -->
    <InviteMemberDialog
      v-if="showInviteDialog"
      @close="showInviteDialog = false"
      @submit="handleInviteSubmit"
    />

    <!-- Error Alert Dialog -->
    <AlertDialog :open="showErrorDialog" @update:open="showErrorDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Invitation Error</AlertDialogTitle>
          <AlertDialogDescription>
            {{ errorMessage }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction @click="showErrorDialog = false">
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import MembersList from '~/components/members/MembersList.vue'
import PendingMembersList from '~/components/members/PendingMembersList.vue'
import ReviewDocumentsDialog from '~/components/members/ReviewDocumentsDialog.vue'
import InviteMemberDialog from '~/components/members/InviteMemberDialog.vue'
import InvitedMembersList from '~/components/members/InvitedMembersList.vue'
import { useNuxtApp } from '#app'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu/index.js'
import { Button } from '@/components/ui/button'
import LucideIcon from '@/components/LucideIcon.vue'
import { Info } from 'lucide-vue-next'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useAlert } from '@/composables/useAlert'

const { $axiosInstance } = useNuxtApp()
const { alert, confirm } = useAlert()

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  },
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  },
  fetchGroup: {
    type: Function,
    required: true
  }
})

// Variables for error alert dialog
const showErrorDialog = ref(false)
const errorMessage = ref('')

// Compute active members - filter out pending members
const activeMembers = computed(() => {
  if (!props.group || !props.group.members) return [];
  
  console.log('Filtering active members from:', props.group.members);
  
  // Log all members with their status before filtering
  console.log('All members with status before filtering:');
  props.group.members.forEach(member => {
    console.log(`Member ${member.name || member.user?.name || 'Unknown'}: status=${member.status}, isPending=${member.status === 'pending'}`);
  });
  
  const filtered = props.group.members.filter(member => {
    // Debug log each member's status
    console.log('Member status check:', {
      name: member.name || member.user?.name || 'Unknown',
      status: member.status,
      isPending: member.status === 'pending'
    });
    
    // Check if the member has a status property and it's 'pending'
    if (member.status === 'pending') {
      console.log(`Filtering out pending member: ${member.name || member.user?.name || 'Unknown'}`);
      return false; // Filter out pending members
    }
    
    return true; // Keep all other members
  });
  
  console.log('Filtered active members:', filtered);
  
  // Process documents for each member
  filtered.forEach(member => {
    // Log all document-related fields for debugging
    console.log(`Member ${member.name || member.user?.name || 'Unknown'} document fields:`, {
      document_file_url: member.document_file_url,
      document_file_name: member.document_file_name,
      document_file_type: member.document_file_type,
      document_file_size: member.document_file_size,
      document_uploaded_at: member.document_uploaded_at,
      // Log all keys to see what's available
      keys: Object.keys(member)
    });
    
    // Check if the member has direct document fields
    if (member.document_file_url || 
        member.document_file_name || 
        member.document_file_type || 
        member.document_file_size || 
        member.document_uploaded_at) {
      console.log(`Member ${member.name || member.user?.name || 'Unknown'} has direct document fields:`, {
        url: member.document_file_url,
        name: member.document_file_name,
        type: member.document_file_type,
        size: member.document_file_size,
        uploaded_at: member.document_uploaded_at
      });
      member.hasDocuments = true;
    } else {
      member.hasDocuments = false;
    }
    
    // Log members with documents for debugging
    if (member.hasDocuments) {
      console.log(`Member ${member.name || member.user?.name || 'Unknown'} has documents`);
    }
  });
  
  return filtered;
});

// Debug admin status
onMounted(async () => {
  console.log('MembersTab - isCurrentUserAdmin:', props.isCurrentUserAdmin)
  console.log('MembersTab - group:', props.group)
  
  // Add additional debugging to check if members have status field
  if (props.group && props.group.members) {
    console.log('MembersTab - Checking member status fields:');
    props.group.members.forEach(member => {
      console.log(`Member ${member.name || member.user?.name || 'Unknown'}: has status field = ${member.status !== undefined}, status = ${member.status}`);
    });
    
    // Fetch document information for all active members
    await fetchDocumentsForActiveMembers();
  }
  
  // Fetch pending members when component mounts
  fetchPendingMembers()
  fetchInvitedMembers()
  
  // Add event listener for refresh-pending-members event
  window.addEventListener('refresh-pending-members', handleRefreshPendingMembers)
  
  // Add event listener for members-refresh-button event (same as manual refresh button)
  window.addEventListener('members-refresh-button', handleMembersRefreshButton)
})

onBeforeUnmount(() => {
  // Remove event listener when component is unmounted
  window.removeEventListener('refresh-pending-members', handleRefreshPendingMembers)
  window.removeEventListener('members-refresh-button', handleMembersRefreshButton)
})

// Watch for changes in the isCurrentUserAdmin prop
watch(() => props.isCurrentUserAdmin, (newValue) => {
  console.log('MembersTab - isCurrentUserAdmin changed to:', newValue)
})

// Watch for changes in the group prop to refresh document information
watch(() => props.group, async (newGroup) => {
  console.log('MembersTab - group prop changed')
  if (newGroup && newGroup.members) {
    // Fetch document information for all active members
    await fetchDocumentsForActiveMembers()
  }
}, { deep: true })

const emit = defineEmits([
  'show-add-member', 
  'show-user-search', 
  'csv-import',
  'member-promoted',
  'member-demoted',
  'member-removed',
  'refresh-group',
  'admin-status-update',
  'user-invited',
  'invite-member-by-email',
  'invite-member'
])

const csvFileInput = ref(null)
const isLoadingMembers = ref(false)
const isLoadingPendingMembers = ref(false)
const pendingMembers = ref([])
const showReviewDialog = ref(false)
const selectedPendingMember = ref(null)
const showInviteDialog = ref(false)

// State for invited members
const invitedMembers = ref([])
const isLoadingInvitedMembers = ref(false)

const triggerCsvFileInput = () => {
  csvFileInput.value.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    emit('csv-import', file)
  }
  // Reset input
  event.target.value = ''
}

const promoteMember = async (member) => {
  try {
    // Get the correct member ID for the backend
    const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
    
    console.log('MembersTab - Promoting member with details:', {
      member,
      memberId,
      groupId: props.group.id
    });
    
    // Use the configured axios instance with SuperTokens interceptors
    const response = await $axiosInstance.put(`/api/groups/${props.group.id}/members/${memberId}/role`, {
      role: "admin"
    });
    
    console.log('Promote response:', response.status, response.data);
    
    // Refresh group data to update members list
    emit('refresh-group');
    
    // Update the member object locally to reflect the change immediately
    member.isAdmin = true;
  } catch (error) {
    console.error('Failed to promote member:', error);
    errorMessage.value = 'Failed to promote member: ' + (error.response?.data?.error || error.message);
    showErrorDialog.value = true;
  }
}

const demoteMember = async (member) => {
  try {
    // Get the correct member ID for the backend
    const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
    
    console.log('MembersTab - Demoting member with details:', {
      member,
      memberId,
      groupId: props.group.id
    });
    
    // Use the configured axios instance with SuperTokens interceptors
    const response = await $axiosInstance.put(`/api/groups/${props.group.id}/members/${memberId}/role`, {
      role: "member"
    });
    
    console.log('Demote response:', response.status, response.data);
    
    // Refresh group data to update members list
    emit('refresh-group');
    
    // Update the member object locally to reflect the change immediately
    member.isAdmin = false;
  } catch (error) {
    console.error('Failed to demote member:', error);
    errorMessage.value = 'Failed to demote member: ' + (error.response?.data?.error || error.message);
    showErrorDialog.value = true;
  }
}

const handleMemberRemove = (member) => {
  console.log('MembersTab - Member removal event received for:', member.name, {
    id: member.id,
    userId: member.userId,
    user_id: member.user_id,
    user: member.user && member.user.id
  });
  emit('member-removed', member);
}

const handleAdminStatusUpdate = (isAdmin) => {
  console.log('MembersTab received admin status update:', isAdmin)
  emit('admin-status-update', isAdmin)
}

// Fetch pending members from the API
const fetchPendingMembers = async () => {
  // Check if group ID is valid
  if (!props.group || !props.group.id) {
    console.error('Cannot fetch pending members: Invalid group ID')
    return
  }
  
  isLoadingPendingMembers.value = true
  try {
    // Call API to get pending members
    const response = await $axiosInstance.get(`/api/groups/${props.group.id}/pending-members`)
    console.log('[MembersTab] Raw API response for pending members:', JSON.stringify(response.data, null, 2)); // Log raw data
    
    // --- NORMALIZATION START ---
    const normalizedMembers = response.data.map(member => {
      const user = member.user || {}; // Handle cases where user object might be missing
      const normalizedMember = {
        ...member, // Spread original fields first
        name: member.name || user.name || 'Unknown Name',
        email: member.email || user.email || 'No Email',
        // IMPORTANT: Set profile_picture from various possible sources
        profile_picture: member.avatar || member.profilePicture || member.profile_picture || user.avatar || user.profilePicture || user.profile_picture || null,
        // Ensure other necessary fields are present for PendingMembersList/MemberRow
        id: member.id || user.id,
        user_id: member.user_id || user.id,
        status: member.status || 'pending',
        invitation_accepted: member.invitation_accepted === true,
        documents_submitted: member.documents_submitted,
        document_file_url: member.document_file_url,
        document_file_name: member.document_file_name,
        document_file_type: member.document_file_type,
        isJoinRequest: false, // Default
        hasDocuments: false, // Default
        user: user // Keep the original user object
      };

      // Clear potentially conflicting fields from the new object
      delete normalizedMember.avatar;
      delete normalizedMember.profilePicture;

      // Determine hasDocuments
      normalizedMember.hasDocuments = !!normalizedMember.document_file_url;

      // Determine isJoinRequest
      if (normalizedMember.hasDocuments && normalizedMember.invitation_accepted === true) {
        normalizedMember.isJoinRequest = true;
      }

      return normalizedMember;
    });
    // --- NORMALIZATION END ---
    
    pendingMembers.value = normalizedMembers // Assign normalized data
    console.log('[MembersTab] Pending members state AFTER normalization:', JSON.stringify(pendingMembers.value, null, 2));
    
  } catch (error) {
    console.error('Failed to fetch pending members:', error)
    // Mock data for development
    pendingMembers.value = []
  } finally {
    isLoadingPendingMembers.value = false
  }
}

// Fetch invited members from the API
const fetchInvitedMembers = async () => {
  if (!props.group || !props.group.id) {
    console.error('Cannot fetch invited members: Invalid group ID')
    return
  }
  isLoadingInvitedMembers.value = true
  try {
    // Assumes backend endpoint GET /groups/{groupId}/invitations exists
    const response = await $axiosInstance.get(`/api/groups/${props.group.id}/invitations`)
    console.log('[MembersTab] Raw API response for invited members:', response.data);
    // Filter for invitations that are active (not used, cancelled, expired, or declined)
    invitedMembers.value = (response.data || []).filter(invite => {
      // Check various fields that might indicate the invitation is no longer active
      const isUsed = invite.used === true;
      const isCancelled = invite.cancelled === true || invite.status === 'cancelled';
      const isDeclined = invite.declined === true || invite.status === 'declined';
      const isExpired = invite.expires_at && new Date(invite.expires_at) <= new Date();
      
      // Log the invitation status for debugging
      console.log(`Invitation ${invite.email}: used=${isUsed}, cancelled=${isCancelled}, declined=${isDeclined}, expired=${isExpired}, status=${invite.status}`);
      
      // Keep only invitations that are not used, cancelled, declined, or expired
      return !isUsed && !isCancelled && !isDeclined && !isExpired;
    }).map(invite => ({
       ...invite,
       email: invite.email || 'No Email Provided',
    }));
    console.log('[MembersTab] Invited members state AFTER fetch:', JSON.stringify(invitedMembers.value, null, 2));
  } catch (error) {
    console.error('Failed to fetch invited members:', error)
    invitedMembers.value = []
    // Optionally show an alert or notification
    // alert('Failed to load invited members: ' + (error.response?.data?.error || error.message));
  } finally {
    isLoadingInvitedMembers.value = false
  }
}

// Resend invitation
const resendInvite = async (invitation) => {
    if (!props.isCurrentUserAdmin) {
        errorMessage.value = 'Only admins can resend invitations.';
        showErrorDialog.value = true;
        return;
    }
    console.log('Resending invite:', invitation);
    try {
        // Assumes backend endpoint POST /groups/{groupId}/invitations/{invitationId}/resend exists
        await $axiosInstance.post(`/api/groups/${props.group.id}/invitations/${invitation.id}/resend`);
        
        // No success dialog needed - the confirmation was enough feedback
        
        // Dispatch events to trigger auto-refresh in all member list components
        window.dispatchEvent(new CustomEvent('refresh-invited-members', { 
            detail: { groupId: props.group.id, resendedEmail: invitation.email } 
        }));
        window.dispatchEvent(new CustomEvent('refresh-pending-members', { 
            detail: { groupId: props.group.id } 
        }));
        window.dispatchEvent(new CustomEvent('refresh-members-list', { 
            detail: { groupId: props.group.id } 
        }));
        
        // Refetch invited members to ensure consistency (as backup)
        await fetchInvitedMembers();
        
        console.log(`[MembersTab] Invitation resended successfully for ${invitation.email}. Refresh events dispatched.`);
    } catch (error) {
        console.error('Failed to resend invite:', error);
        errorMessage.value = 'Failed to resend invite: ' + (error.response?.data?.error || error.message);
        showErrorDialog.value = true;
    }
}

// Cancel invitation
const cancelInvite = async (invitation) => {
    if (!props.isCurrentUserAdmin) {
        errorMessage.value = 'Only admins can cancel invitations.';
        showErrorDialog.value = true;
        return;
    }
    
    // Show confirmation dialog before cancelling
    const confirmed = await confirm(
        `Are you sure you want to cancel the invitation for ${invitation.email}? This action cannot be undone.`,
        'Cancel Invitation',
        { actionText: 'Yes, Cancel Invitation', cancelText: 'No, Keep Invitation', variant: 'destructive' }
    );
    
    if (!confirmed) {
        return; // User chose not to cancel
    }
    
    console.log('Canceling invite:', invitation);
    try {
        // Assumes backend endpoint DELETE /groups/{groupId}/invitations/{invitationId} exists
        await $axiosInstance.delete(`/api/groups/${props.group.id}/invitations/${invitation.id}`);
        
        // Immediately remove the cancelled invitation from the local state
        invitedMembers.value = invitedMembers.value.filter(invite => invite.id !== invitation.id);
        
        // No success dialog needed - the confirmation was enough feedback
        
        // Dispatch events to trigger auto-refresh in all member list components
        window.dispatchEvent(new CustomEvent('refresh-invited-members', { 
            detail: { groupId: props.group.id, cancelledEmail: invitation.email } 
        }));
        window.dispatchEvent(new CustomEvent('refresh-pending-members', { 
            detail: { groupId: props.group.id } 
        }));
        window.dispatchEvent(new CustomEvent('refresh-members-list', { 
            detail: { groupId: props.group.id } 
        }));
        
        // Refetch invited members to ensure consistency (as backup)
        await fetchInvitedMembers();
        
        console.log(`[MembersTab] Invitation cancelled successfully for ${invitation.email}. Refresh events dispatched.`);
    } catch (error) {
        console.error('Failed to cancel invite:', error);
        errorMessage.value = 'Failed to cancel invite: ' + (error.response?.data?.error || error.message);
        showErrorDialog.value = true;
    }
}

// Show the review documents dialog
const showReviewDocumentsDialog = (member) => {
  selectedPendingMember.value = member
  showReviewDialog.value = true
}

// Accept a pending member
const acceptPendingMember = async (member) => {
  try {
    // Close the dialog if it's open
    showReviewDialog.value = false
    
    // Get the member ID - prioritize user_id since that's the column name in the database
    const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id
    
    // Check if we have valid IDs
    if (!memberId || !props.group || !props.group.id) {
      console.error('Cannot accept member: Missing member ID or group ID', { memberId, groupId: props.group?.id })
      return
    }
    
    // Call API to accept the pending member
    await $axiosInstance.post(`/api/groups/${props.group.id}/pending-members/${memberId}/approve`)
    
    // Remove the member from the pending list
    pendingMembers.value = pendingMembers.value.filter(m => {
      const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id
      return mId !== memberId
    })
    
    // DO NOT emit refresh-group here as it can cause 404 redirect issues due to temporary DB connection problems
    // Instead, dispatch events to refresh specific member lists
    window.dispatchEvent(new CustomEvent('refresh-members-list', {
      detail: { groupId: props.group.id, action: 'member-approved' }
    }))
    
    window.dispatchEvent(new CustomEvent('refresh-pending-members', {
      detail: { groupId: props.group.id, action: 'member-approved' }
    }))
    
    // Show success message using the alert dialog
    const memberName = member.name || member.user?.name || 'Member'
    successMessage.value = `${memberName} has been accepted to the group`
    showSuccessDialog.value = true
  } catch (error) {
    console.error('Failed to accept pending member:', error)
    errorMessage.value = 'Failed to accept member: ' + (error.response?.data?.error || error.message);
    showErrorDialog.value = true;
  }
}

// Decline a pending member
const declinePendingMember = async (member) => {
  try {
    // Close the dialog if it's open
    showReviewDialog.value = false
    
    // Get the member ID - prioritize user_id since that's the column name in the database
    const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id
    
    // Check if we have valid IDs
    if (!memberId || !props.group || !props.group.id) {
      console.error('Cannot decline member: Missing member ID or group ID', { memberId, groupId: props.group?.id })
      return
    }
    
    // Call API to decline the pending member
    await $axiosInstance.post(`/api/groups/${props.group.id}/pending-members/${memberId}/decline`)
    
    // Remove the member from the pending list
    pendingMembers.value = pendingMembers.value.filter(m => {
      const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id
      return mId !== memberId
    })
    
    // Show success message
    const memberName = member.name || member.user?.name || 'Member'
    successMessage.value = `${memberName}'s request to join has been declined`
    showSuccessDialog.value = true
  } catch (error) {
    console.error('Failed to decline pending member:', error)
    errorMessage.value = 'Failed to decline member: ' + (error.response?.data?.error || error.message);
    showErrorDialog.value = true;
  }
}

const handlePendingMembersRefresh = (data) => {
  console.log('Handling refresh from PendingMembersList', data);
  
  // Refresh pending members and invited members lists only
  fetchPendingMembers();
  fetchInvitedMembers();
  
  // DO NOT emit refresh-group here as it can cause 404 redirect issues due to temporary DB connection problems
  // The member list components handle their own refreshes via events
  
  // If we have data about an approved member, log it
  if (data && data.action === 'approve') {
    console.log(`Member approved: ${data.member.user?.name || 'Unknown member'}`);
  }
}

// Handle user invitation from UserSearchDialog
const handleUserInvited = (userData) => {
  console.log('User invited to group:', userData);
  
  // Refresh pending members list
  fetchPendingMembers();
  fetchInvitedMembers();
  
  // Emit event to parent component
  emit('user-invited', userData);
}

// Handle review documents for active members
const handleReviewDocuments = async (member) => {
  console.log('MembersTab - handleReviewDocuments called with member:', member)
  
  // Check if the member has direct document fields
  if (member.document_file_url || 
      member.document_file_name || 
      member.document_file_type || 
      member.document_file_size || 
      member.document_uploaded_at) {
    console.log('MembersTab - Member has direct document fields:', {
      url: member.document_file_url,
      name: member.document_file_name,
      type: member.document_file_type,
      size: member.document_file_size,
      uploaded_at: member.document_uploaded_at
    })
  } else {
    console.log('MembersTab - Member has no direct document fields, attempting to fetch from API')
    
    try {
      // Get the member ID - prioritize user_id since that's the column name in the database
      const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id
      
      // Check if we have valid IDs
      if (!memberId || !props.group || !props.group.id) {
        console.error('Cannot fetch documents: Missing member ID or group ID', { memberId, groupId: props.group?.id })
        return
      }
      
      // Determine if this is a pending member
      const isPending = pendingMembers.value.some(m => {
        const mId = m.user_id || m.UserId || (m.user && m.user.id) || m.id
        return mId === memberId
      })
      
      // Use different API endpoints based on whether the member is pending or active
      let endpoint = ''
      if (isPending) {
              endpoint = `/api/groups/${props.group.id}/pending-members/${memberId}/documents`
    } else {
      endpoint = `/api/groups/${props.group.id}/members/${memberId}/documents`
      }
      
      console.log(`MembersTab - Fetching documents from endpoint: ${endpoint}`)
      
      // Fetch documents from the API
      const response = await $axiosInstance.get(endpoint)
      console.log('MembersTab - API response:', response.data)
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Update the member object with document fields from the first document
        const doc = response.data[0]
        member.document_file_url = doc.document_file_url || doc.url
        member.document_file_name = doc.document_file_name || doc.name
        member.document_file_type = doc.document_file_type || doc.type
        member.document_file_size = doc.document_file_size || doc.size
        member.document_uploaded_at = doc.document_uploaded_at || doc.uploaded_at
        
        // Set hasDocuments flag
        member.hasDocuments = true
        
        console.log('MembersTab - Updated member with document fields from API:', {
          url: member.document_file_url,
          name: member.document_file_name,
          type: member.document_file_type,
          size: member.document_file_size,
          uploaded_at: member.document_uploaded_at
        })
      }
    } catch (error) {
      console.error('MembersTab - Error fetching documents:', error)
    }
  }
  
  // Make sure we have the complete member data
  selectedPendingMember.value = { 
    ...member,
    name: member.name || (member.user && member.user.name) || 'Unknown Member',
    email: member.email || (member.user && member.user.email) || 'No email available'
  }
  
  // Set the dialog to visible
  showReviewDialog.value = true
}

// Computed property to determine if the selected member is pending
const isPendingMember = computed(() => {
  if (!selectedPendingMember.value) return false;
  
  // Check if the member is in the pendingMembers array
  const memberId = selectedPendingMember.value.user_id || 
                   selectedPendingMember.value.userId || 
                   (selectedPendingMember.value.user && selectedPendingMember.value.user.id) || 
                   selectedPendingMember.value.id;
  
  const isPending = pendingMembers.value.some(m => {
    const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id;
    return mId === memberId;
  });
  
  console.log(`Member ${selectedPendingMember.value.name || 'Unknown'} is pending: ${isPending}`);
  
  return isPending;
});

// New function to fetch document information for all active members
const fetchDocumentsForActiveMembers = async () => {
  console.log('MembersTab - Fetching document information for all active members');
  
  // Get active members
  const active = props.group.members.filter(member => member.status !== 'pending');
  
  // For each active member, check if they have documents
  for (const member of active) {
    try {
      // Skip if member already has document fields
      if (member.document_file_url || 
          member.document_file_name || 
          member.document_file_type || 
          member.document_file_size || 
          member.document_uploaded_at) {
        console.log(`Member ${member.name || member.user?.name || 'Unknown'} already has document fields`);
        member.hasDocuments = true;
        continue;
      }
      
      // Get the member ID
      const memberId = member.user_id || member.UserId || (member.user && member.user.id) || member.id;
      
      // Skip if no valid member ID
      if (!memberId) {
        console.log(`Member ${member.name || member.user?.name || 'Unknown'} has no valid ID, skipping document check`);
        continue;
      }
      
      console.log(`Checking documents for member ${member.name || member.user?.name || 'Unknown'} with ID ${memberId}`);
      
      // Use the API endpoint for active members
      const endpoint = `/api/groups/${props.group.id}/members/${memberId}/documents`;
      
      // Fetch documents from the API
      const response = await $axiosInstance.get(endpoint);
      console.log(`Document API response for ${member.name || member.user?.name || 'Unknown'}:`, response.data);
      
      // If documents are found, update the member object
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const doc = response.data[0];
        member.document_file_url = doc.document_file_url || doc.url;
        member.document_file_name = doc.document_file_name || doc.name;
        member.document_file_type = doc.document_file_type || doc.type;
        member.document_file_size = doc.document_file_size || doc.size;
        member.document_uploaded_at = doc.document_uploaded_at || doc.uploaded_at;
        
        // Set hasDocuments flag
        member.hasDocuments = true;
        
        console.log(`Found documents for member ${member.name || member.user?.name || 'Unknown'}:`, {
          url: member.document_file_url,
          name: member.document_file_name,
          type: member.document_file_type
        });
      } else {
        console.log(`No documents found for member ${member.name || member.user?.name || 'Unknown'}`);
        member.hasDocuments = false;
      }
    } catch (error) {
      console.error(`Error fetching documents for member ${member.name || member.user?.name || 'Unknown'}:`, error);
    }
  }
  
  console.log('MembersTab - Finished fetching document information for all active members');
}

// Handler for refresh-pending-members event
const handleRefreshPendingMembers = (event) => {
  console.log('MembersTab - Received refresh-pending-members event:', event.detail)
  
  // Check if the event is for this group
  if (event.detail && event.detail.groupId === props.group.id) {
    console.log('MembersTab - Refreshing pending members for group:', props.group.id)
    fetchPendingMembers()
    fetchInvitedMembers()
  }
}

// Handler for members-refresh-button event (same as manual refresh button)
const handleMembersRefreshButton = (event) => {
  console.log('MembersTab - Received members-refresh-button event:', event.detail)
  
  // Check if the event is for this group
  if (event.detail && event.detail.groupId === props.group.id) {
    console.log('MembersTab - Triggering same refresh as manual refresh button for group:', props.group.id)
    refreshPendingAndInvited()
  }
}

// Handler for the invite dialog submission
const handleInviteSubmit = async (email) => {
  console.log("[MembersTab] handleInviteSubmit called with email:", email);
  console.log("[MembersTab] Emitting invite-member-by-email event.");
  
  try {
    // Use try/catch to handle errors from parent components
    await new Promise((resolve, reject) => {
      // Listen for a custom event that will be triggered by the parent on error
      const handleError = (event) => {
        window.removeEventListener('invite-member-error', handleError);
        reject(event.detail); // Pass the detail object directly
      };
      
      window.addEventListener('invite-member-error', handleError, { once: true });
      
      // Listen for a success event
      const handleSuccess = () => {
        window.removeEventListener('invite-member-success', handleSuccess);
        resolve();
      };
      
      window.addEventListener('invite-member-success', handleSuccess, { once: true });
      
      // Emit the event to start the invitation process
      emit('invite-member-by-email', email);
      
      // Set a timeout to fail if no response
      setTimeout(() => {
        window.removeEventListener('invite-member-error', handleError);
        window.removeEventListener('invite-member-success', handleSuccess);
        resolve(); // Resolve anyway after timeout
      }, 5000);
    });
    
    fetchInvitedMembers();
    showInviteDialog.value = false;
  } catch (error) {
    console.error("[MembersTab] Error inviting member:", error);
    
    // Extract error message, preferring the detail field if available
    if (error) {
      if (typeof error === 'string') {
        errorMessage.value = error;
      } else if (error.detail) {
        errorMessage.value = error.detail;
      } else if (error.message) {
        errorMessage.value = error.message;
      } else {
        errorMessage.value = "Failed to invite member. Please try again later.";
      }
    } else {
      errorMessage.value = "An unknown error occurred.";
    }
    
    // Show error dialog
    showErrorDialog.value = true;
  }
}

// Add a new method to directly handle invitation errors for components that don't use the event system
const handleInviteError = (error) => {
  console.error("[MembersTab] Direct invite error:", error);
  
  // Extract appropriate error message
  if (typeof error === 'string') {
    errorMessage.value = error;
  } else if (error && error.response && error.response.data) {
    // API error response
    if (typeof error.response.data === 'string') {
      errorMessage.value = error.response.data;
    } else if (error.response.data.error) {
      errorMessage.value = error.response.data.error;
    } else if (error.response.data.detail) {
      errorMessage.value = error.response.data.detail;
    } else if (error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = "Failed to invite member.";
    }
  } else if (error && typeof error === 'object') {
    // Direct error object
    if (error.detail) {
      errorMessage.value = error.detail;
    } else if (error.message) {
      errorMessage.value = error.message;
    } else {
      // Try to parse if it's a JSON string
      try {
        const parsedError = JSON.parse(error.toString());
        errorMessage.value = parsedError.detail || parsedError.message || "Failed to invite member.";
      } catch {
        errorMessage.value = "An error occurred while inviting the member.";
      }
    }
  } else {
    errorMessage.value = "An error occurred while inviting the member.";
  }
  
  // Show error dialog
  showErrorDialog.value = true;
}

// Export methods for parent components to use
defineExpose({
  handleInviteError
});

// New function to handle refresh click with preventDefault
const handleRefreshClick = (event) => {
  if (event) {
    event.preventDefault();
  }
  if (props.isCurrentUserAdmin) {
    // Only refresh pending and invited members, not the entire group
    refreshPendingAndInvited();
  }
}

// New function to refresh only pending and invited members without triggering group refresh
const refreshPendingAndInvited = async () => {
  console.log('MembersTab - Refreshing pending and invited members only...');
  try {
    await Promise.all([
      fetchPendingMembers(),
      fetchInvitedMembers()
    ]);
    // Don't emit refresh-group event which causes the redirect
  } catch (error) {
    console.error('Error refreshing members lists:', error);
  }
}

// New function to refresh all lists
const refreshAllLists = () => {
  console.log('MembersTab - Refreshing all lists...');
  fetchPendingMembers();
  fetchInvitedMembers();
  // Only refresh the group if explicitly requested, with caution
  const shouldRefreshGroup = false; // Set to true only when really needed
  if (shouldRefreshGroup) {
    emit('refresh-group'); // Only emit this when absolutely necessary
  }
}

// New function to handle refresh-invited event from InvitedMembersList
const handleInvitedMembersRefresh = () => {
  console.log('MembersTab - Received refresh-invited event');
  fetchInvitedMembers();
}
</script>