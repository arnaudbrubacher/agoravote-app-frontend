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
          @review-documents="reviewDocuments(member)"
          @accept="approveMember(member)"
          @decline="declineMember(member)"
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
    @accept="approveWithDocuments"
    @decline="declineMember"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '~/src/utils/axios'
import LucideIcon from '@/components/LucideIcon.vue'
import MemberRow from '~/components/members/MemberRow.vue'
import ReviewDocumentsDialog from '~/components/members/ReviewDocumentsDialog.vue'
import { Button } from '@/components/ui/button'

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

const pendingMembersLocal = ref([])
const loadingLocal = ref(false)
const selectedMember = ref(null)

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
    const response = await axios.get(`/groups/${props.groupId}/pending-members`)
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

// Approve a pending member
const approveMember = async (member) => {
  // Check if the invitation has been accepted or if this is a join request
  if (member.invitation_accepted !== true && !member.isJoinRequest) {
    console.log('Cannot approve member - invitation not accepted and not a join request:', member);
    alert(`Cannot approve ${member.user?.name || 'this member'} yet. They need to accept the invitation first.`);
    return;
  }

  try {
    // Get the member ID - prioritize user_id since that's the column name in the database
    const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
    
    if (!memberId) {
      console.error('Cannot approve member: Missing member ID', member);
      alert('Cannot approve member: Missing member ID');
      return;
    }
    
    console.log(`Approving member with ID: ${memberId}`);
    
    // Call API to approve the member
    await axios.post(`/groups/${props.groupId}/members/${memberId}/approve`);
    
    // Remove the member from the local list
    pendingMembersLocal.value = pendingMembersLocal.value.filter(m => {
      const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id;
      return mId !== memberId;
    });
    
    // Emit refresh event to update the members list
    emit('refresh', { 
      action: 'approve', 
      member: member,
      message: `${member.user?.name || member.name || 'Member'} has been approved`
    });
    
    // Show success message
    alert(`${member.user?.name || member.name || 'Member'} has been approved`);
  } catch (error) {
    console.error('Failed to approve member:', error);
    alert('Failed to approve member: ' + (error.response?.data?.error || error.message || 'Unknown error'));
  }
}

// Decline a pending member
const declineMember = async (member) => {
  // Confirm before declining
  if (!confirm(`Are you sure you want to decline ${member.user?.name || member.name || 'this member'}?`)) {
    return;
  }
  
  try {
    // Get the member ID - prioritize user_id since that's the column name in the database
    const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
    
    if (!memberId) {
      console.error('Cannot decline member: Missing member ID', member);
      alert('Cannot decline member: Missing member ID');
      return;
    }
    
    console.log(`Declining member with ID: ${memberId}`);
    
    // Call API to decline the member
    await axios.post(`/groups/${props.groupId}/members/${memberId}/decline`);
    
    // Remove the member from the local list
    pendingMembersLocal.value = pendingMembersLocal.value.filter(m => {
      const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id;
      return mId !== memberId;
    });
    
    // If the dialog is open for this member, close it
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
      member: member,
      message: `${member.user?.name || member.name || 'Member'} has been declined`
    });
    
    // Show success message
    alert(`${member.user?.name || member.name || 'Member'} has been declined`);
  } catch (error) {
    console.error('Failed to decline member:', error);
    alert('Failed to decline member: ' + (error.response?.data?.error || error.message || 'Unknown error'));
  }
}

// Approve a member with documents
const approveWithDocuments = async (member) => {
  // If no member is provided, use the selected member
  if (!member) {
    member = selectedMember.value
  }
  
  // Check if we have a valid member
  if (!member) {
    console.error('Cannot approve member with documents: No member provided')
    return
  }
  
  // Check if the invitation has been accepted or if this is a join request
  if (member.invitation_accepted !== true && !member.isJoinRequest) {
    console.log('Cannot approve member with documents - invitation not accepted and not a join request:', member);
    alert(`Cannot approve ${member.user?.name || 'this member'} yet. They need to accept the invitation first.`);
    selectedMember.value = null;
    return;
  }

  try {
    console.log(`Approving member with documents: ${member.name || member.user?.name || 'Unknown member'}`);
    
    // Get the member ID
    const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
    
    // Call API to approve the member with documents
    await axios.post(`/groups/${props.groupId}/members/${memberId}/approve-documents`);
    
    // Remove the member from the local list
    pendingMembersLocal.value = pendingMembersLocal.value.filter(m => {
      const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id;
      return mId !== memberId;
    });
    
    // Close the dialog
    selectedMember.value = null;
    
    // Emit refresh event to update the members list
    emit('refresh', { 
      action: 'approve', 
      member: member,
      message: `${member.user?.name || member.name || 'Member'} has been approved with documents`
    });
    
    // Show success message
    alert(`${member.user?.name || member.name || 'Member'} has been approved with documents`);
  } catch (error) {
    console.error('Failed to approve member with documents:', error);
    alert('Failed to approve member: ' + (error.response?.data?.error || error.message || 'Unknown error'));
  }
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