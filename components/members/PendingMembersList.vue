<!-- components/members/PendingMembersList.vue -->
<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-2">
      <LucideIcon name="RefreshCw" size="4" class="h-4 w-4 animate-spin text-primary" />
      <span class="ml-2 text-sm">Loading pending members...</span>
    </div>
    
 
    
    <!-- Pending members list -->
    <div v-else class="space-y-3">
      <div v-for="(member, index) in pendingMembers" :key="member.id || member.user_id || index">
        <MemberRow 
          :member="member"
          :current-user="currentUser"
          :is-pending="true"
          :is-current-user-admin="isCurrentUserAdmin"
          :has-documents="hasDocuments(member)"
          :invitation-accepted="member.invitation_accepted === true"
          :hide-pending-badge="true"
          @review-documents="reviewDocuments(member)"
          @accept="confirmApprovalDialog(member)"
          @decline="confirmDeclineDialog(member)"
        />
      </div>
    </div>
  </div>
  
  <!-- Document Review Dialog - Use separate component -->
  <ReviewDocumentsDialog
    v-if="selectedMember"
    :member="{
      ...selectedMember,
      name: selectedMember.name || (selectedMember.user && selectedMember.user.name) || 'Unknown Member',
      email: selectedMember.email || (selectedMember.user && selectedMember.user.email) || 'No email available'
    }"
    :group-id="groupId"
    :is-pending="true"
    @close="selectedMember = null"
    @accept="confirmDocumentsApproval"
    @decline="confirmDeclineDialog"
  />

  <!-- Shadcn UI Alert Dialog for Approval Confirmation -->
  <AlertDialog :open="showApprovalDialog" @update:open="showApprovalDialog = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Approve Member</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to approve {{ memberToApprove ? (memberToApprove.user?.name || memberToApprove.name || 'this member') : '' }}?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showApprovalDialog = false">Cancel</AlertDialogCancel>
        <AlertDialogAction @click="processMemberApproval">
          Approve
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Shadcn UI Alert Dialog for Document Approval Confirmation -->
  <AlertDialog :open="showDocumentsApprovalDialog" @update:open="showDocumentsApprovalDialog = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Approve Member with Documents</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to approve {{ selectedMember ? (selectedMember.name || 'this member') : '' }} with their submitted documents?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showDocumentsApprovalDialog = false">Cancel</AlertDialogCancel>
        <AlertDialogAction @click="processDocumentsApproval">
          Approve
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Shadcn UI Alert Dialog for Decline Confirmation -->
  <AlertDialog :open="showDeclineDialog" @update:open="showDeclineDialog = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Decline Member</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to decline {{ memberToDecline ? (memberToDecline.user?.name || memberToDecline.name || 'this member') : '' }}? 
          This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showDeclineDialog = false">Cancel</AlertDialogCancel>
        <AlertDialogAction @click="processMemberDecline" class="bg-destructive hover:bg-destructive/90">
          Decline
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNuxtApp } from '#app'
import LucideIcon from '@/components/LucideIcon.vue'
import MemberRow from '~/components/members/MemberRow.vue'
import ReviewDocumentsDialog from '~/components/members/ReviewDocumentsDialog.vue'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

const props = defineProps({
  groupId: {
    type: String,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  },
  pendingMembers: {
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
  }
})

const emit = defineEmits([
  'refresh'
])

const { $axiosInstance } = useNuxtApp()

const pendingMembersLocal = ref([])
const loadingLocal = ref(false)
const selectedMember = ref(null)

// Variables for the alert dialogs
const showApprovalDialog = ref(false)
const memberToApprove = ref(null)
const showDocumentsApprovalDialog = ref(false)
const showDeclineDialog = ref(false)
const memberToDecline = ref(null)

// Event handlers for auto-refresh
const handleRefreshPendingMembers = (event) => {
  console.log('[PendingMembersList] Received refresh-pending-members event:', event.detail);
  if (event.detail?.groupId === props.groupId) {
    // Refresh pending members
    fetchPendingMembers();
  }
};

const handleGroupDataUpdated = () => {
  console.log('[PendingMembersList] Received group-data-updated event');
  // Refresh pending members
  fetchPendingMembers();
};

// Setup event listeners
onMounted(() => {
  console.log('[PendingMembersList] Setting up event listeners');
  window.addEventListener('refresh-pending-members', handleRefreshPendingMembers);
  window.addEventListener('group-data-updated', handleGroupDataUpdated);
  
  // Initial fetch
  fetchPendingMembers();
});

// Cleanup event listeners
onUnmounted(() => {
  console.log('[PendingMembersList] Cleaning up event listeners');
  window.removeEventListener('refresh-pending-members', handleRefreshPendingMembers);
  window.removeEventListener('group-data-updated', handleGroupDataUpdated);
});

// Use either provided props or local state
const pendingMembers = computed(() => {
  return props.pendingMembers && props.pendingMembers.length > 0 
    ? props.pendingMembers 
    : pendingMembersLocal.value
})

const loading = computed(() => {
  return props.loading !== undefined ? props.loading : loadingLocal.value
})

// Fetch pending members from the API
const fetchPendingMembers = async () => {
  console.log('[PendingMembersList] fetchPendingMembers CALLED'); // Log function entry
  console.log('[PendingMembersList] Received groupId prop:', props.groupId, typeof props.groupId);

  // If we're using props for data, just emit a refresh event
  if (props.pendingMembers && props.pendingMembers.length > 0) {
    console.log('[PendingMembersList] Using props for data, emitting refresh.');
    emit('refresh')
    return
  }
  
  // Check if groupId is valid (not undefined, null, or empty string)
  if (!props.groupId || props.groupId === 'undefined') {
    console.error('[PendingMembersList] CANNOT fetch pending members: Invalid group ID', props.groupId);
    return
  }
  
  console.log('[PendingMembersList] Group ID seems valid, proceeding to fetch...');
  loadingLocal.value = true
  
  try {
    const { $axiosInstance } = useNuxtApp()
    const response = await $axiosInstance.get(`/api/groups/${props.groupId}/pending-members`)
    console.log('[PendingMembersList] Raw API response for pending members:', JSON.stringify(response.data, null, 2)); // Log raw data
    
    // Create a new array with normalized members
    const normalizedMembers = response.data.map(member => {
      const user = member.user || {}; // Handle cases where user object might be missing
      const normalizedMember = {
        ...member, // Spread original fields first
        name: member.name || user.name || 'Unknown Name',
        email: member.email || user.email || 'No Email',
        profile_picture: member.avatar || member.profilePicture || member.profile_picture || user.avatar || user.profilePicture || user.profile_picture || null,
        // Ensure other necessary fields are present
        id: member.id || user.id,
        user_id: member.user_id || user.id,
        status: member.status || 'pending',
        invitation_accepted: member.invitation_accepted === true,
        documents_submitted: member.documents_submitted,
        document_file_url: member.document_file_url,
        document_file_name: member.document_file_name,
        document_file_type: member.document_file_type,
        isJoinRequest: false, // Default, will be set below if conditions met
        hasDocuments: false, // Default, will be set below if conditions met
        user: user // Keep the original user object if needed elsewhere
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

    pendingMembersLocal.value = normalizedMembers;

    // Log the state *after* normalization
    console.log('[PendingMembersList] Local pending members state AFTER normalization:', JSON.stringify(pendingMembersLocal.value, null, 2));

  } catch (error) {
    console.error('Failed to fetch pending members:', error)
  } finally {
    loadingLocal.value = false
  }
}

// Review documents for a member
const reviewDocuments = (member) => {
  console.log('PendingMembersList - reviewDocuments called for member:', member.name || 'Unknown')
  
  // Ensure member has name and email properties
  const preparedMember = {
    ...member,
    name: member.name || (member.user && member.user.name) || 'Unknown Member',
    email: member.email || (member.user && member.user.email) || 'No email available'
  }
  
  // Check if the member has direct document fields
  if (preparedMember.document_file_url) {
    console.log('PendingMembersList - Member has direct document fields:', {
      url: preparedMember.document_file_url,
      name: preparedMember.document_file_name,
      type: preparedMember.document_file_type
    })
  } else {
    console.log('PendingMembersList - Member has no documents')
  }
  
  selectedMember.value = preparedMember
}

// Show the approval confirmation dialog
const confirmApprovalDialog = (member) => {
  // Check if the invitation has been accepted or if this is a join request
  if (member.invitation_accepted !== true && !member.isJoinRequest) {
    console.log('Cannot approve member - invitation not accepted and not a join request:', member);
    alert(`Cannot approve ${member.user?.name || 'this member'} yet. They need to accept the invitation first.`);
    return;
  }
  
  // Set the member to approve and show the dialog
  memberToApprove.value = member;
  showApprovalDialog.value = true;
}

// Process the actual member approval after confirmation
const processMemberApproval = async () => {
  // Close the dialog
  showApprovalDialog.value = false;
  
  if (!memberToApprove.value) return;
  
  try {
    // Get the member ID - prioritize user_id since that's the column name in the database
    const memberId = memberToApprove.value.user_id || 
                     memberToApprove.value.userId || 
                     (memberToApprove.value.user && memberToApprove.value.user.id) || 
                     memberToApprove.value.id;
    
    if (!memberId) {
      console.error('Cannot approve member: Missing member ID', memberToApprove.value);
      return;
    }
    
    console.log(`Approving member with ID: ${memberId}`);
    
    // Call API to approve the member
    const { $axiosInstance } = useNuxtApp()
    await $axiosInstance.post(`/api/groups/${props.groupId}/members/${memberId}/approve`);
    
    // Remove the member from the local list
    pendingMembersLocal.value = pendingMembersLocal.value.filter(m => {
      const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id;
      return mId !== memberId;
    });
    
    // Emit refresh event to update the members list
    emit('refresh', { 
      action: 'approve', 
      member: memberToApprove.value,
      message: `${memberToApprove.value.user?.name || memberToApprove.value.name || 'Member'} has been approved`,
      preventRedirect: true // Add this flag to prevent redirection
    });
    
    // Clear the member to approve
    memberToApprove.value = null;
  } catch (error) {
    console.error('Failed to approve member:', error);
    alert('Failed to approve member: ' + (error.response?.data?.error || error.message || 'Unknown error'));
  }
}

// Legacy approve member function - now handled by confirmApprovalDialog and processMemberApproval
const approveMember = async (member) => {
  confirmApprovalDialog(member);
}

// Show decline confirmation dialog
const confirmDeclineDialog = (member) => {
  // If member is not provided but we have a selected member (from documents dialog)
  if (!member && selectedMember.value) {
    member = selectedMember.value;
  }
  
  if (!member) {
    console.error('Cannot decline member: No member provided');
    return;
  }
  
  // Set the member to decline and show the dialog
  memberToDecline.value = member;
  showDeclineDialog.value = true;
}

// Process the actual member decline after confirmation
const processMemberDecline = async () => {
  // Close the dialog
  showDeclineDialog.value = false;
  
  if (!memberToDecline.value) return;
  
  try {
    // Get the member ID - prioritize user_id since that's the column name in the database
    const memberId = memberToDecline.value.user_id || 
                     memberToDecline.value.userId || 
                     (memberToDecline.value.user && memberToDecline.value.user.id) || 
                     memberToDecline.value.id;
    
    if (!memberId) {
      console.error('Cannot decline member: Missing member ID', memberToDecline.value);
      return;
    }
    
    console.log(`Declining member with ID: ${memberId}`);
    
    // Call API to decline the member
    const { $axiosInstance } = useNuxtApp()
    await $axiosInstance.delete(`/api/groups/${props.groupId}/members/${memberId}`);
    
    // Remove the member from the local list
    pendingMembersLocal.value = pendingMembersLocal.value.filter(m => {
      const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id;
      return mId !== memberId;
    });
    
    // If the document review dialog is open for this member, close it
    if (selectedMember.value && (
      selectedMember.value.user_id === memberId || 
      selectedMember.value.userId === memberId || 
      (selectedMember.value.user && selectedMember.value.user.id === memberId) || 
      selectedMember.value.id === memberId
    )) {
      selectedMember.value = null;
    }
    
    // Emit refresh event to update the members list
    emit('refresh', { 
      action: 'decline', 
      member: memberToDecline.value,
      message: `${memberToDecline.value.user?.name || memberToDecline.value.name || 'Member'} has been declined`
    });
    
    // Clear the member to decline
    memberToDecline.value = null;
  } catch (error) {
    console.error('Failed to decline member:', error);
    alert('Failed to decline member: ' + (error.response?.data?.error || error.message || 'Unknown error'));
  }
}

// Legacy decline function - now handled by confirmDeclineDialog and processMemberDecline
const declineMember = async (member) => {
  confirmDeclineDialog(member);
}

// Show document approval confirmation dialog
const confirmDocumentsApproval = (member) => {
  if (!member) {
    member = selectedMember.value;
  }
  
  if (!member) {
    console.error('Cannot approve member with documents: No member provided');
    return;
  }
  
  // Check if the invitation has been accepted or if this is a join request
  if (member.invitation_accepted !== true && !member.isJoinRequest) {
    console.log('Cannot approve member with documents - invitation not accepted and not a join request:', member);
    alert(`Cannot approve ${member.user?.name || 'this member'} yet. They need to accept the invitation first.`);
    selectedMember.value = null;
    return;
  }
  
  // Show the dialog (selectedMember.value is already set by reviewDocuments)
  showDocumentsApprovalDialog.value = true;
}

// Process document approval after confirmation
const processDocumentsApproval = async () => {
  // Close the dialog
  showDocumentsApprovalDialog.value = false;
  
  if (!selectedMember.value) return;
  
  try {
    console.log(`Approving member with documents: ${selectedMember.value.name || selectedMember.value.user?.name || 'Unknown member'}`);
    
    // Get the member ID
    const memberId = selectedMember.value.user_id || 
                     selectedMember.value.userId || 
                     (selectedMember.value.user && selectedMember.value.user.id) || 
                     selectedMember.value.id;
    
    // Call API to approve the member with documents
    const { $axiosInstance } = useNuxtApp()
    await $axiosInstance.post(`/api/groups/${props.groupId}/members/${memberId}/approve`, { documents_approved: true });
    
    // Remove the member from the local list
    pendingMembersLocal.value = pendingMembersLocal.value.filter(m => {
      const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id;
      return mId !== memberId;
    });
    
    // Get member for the refresh event
    const member = selectedMember.value;
    
    // Close the dialog
    selectedMember.value = null;
    
    // Emit refresh event to update the members list
    emit('refresh', { 
      action: 'approve', 
      member: member,
      message: `${member.user?.name || member.name || 'Member'} has been approved with documents`
    });
  } catch (error) {
    console.error('Failed to approve member with documents:', error);
    alert('Failed to approve member: ' + (error.response?.data?.error || error.message || 'Unknown error'));
  }
}

// Legacy function for approving with documents
const approveWithDocuments = async (member) => {
  confirmDocumentsApproval(member);
}

// Check if a member has documents
const hasDocuments = (member) => {
  console.log(`PendingMembersList - Checking if member ${member.name || 'Unknown'} has documents`)
  
  // Check if the member has direct document fields
  if (member.document_file_url) {
    console.log(`PendingMembersList - Member ${member.name || 'Unknown'} has document:`, {
      url: member.document_file_url,
      name: member.document_file_name,
      type: member.document_file_type
    })
    return true
  }
  
  console.log(`PendingMembersList - Member ${member.name || 'Unknown'} has no documents`)
  return false
}
</script>