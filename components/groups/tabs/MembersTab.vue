<!-- components/group/tabs/MembersTab.vue -->
<template>
  <Card class="mt-6">
    <CardContent class="p-6">
      <!-- Pending Members Section with Add Members dropdown -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">Pending Members ({{ pendingMembers.length || 0 }})</h3>
          <div class="flex items-center space-x-2">
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
                <DropdownMenuItem @click="$emit('show-add-member')">
                  <LucideIcon name="Mail" size="4" class="h-4 w-4 mr-2" />
                  Email Invite
                </DropdownMenuItem>
                <DropdownMenuItem @click="$emit('show-user-search')">
                  <LucideIcon name="Search" size="4" class="h-4 w-4 mr-2" />
                  Search Users
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <!-- Refresh Button - Always visible but only usable by admins -->
            <Button 
              variant="outline" 
              size="sm" 
              @click="isCurrentUserAdmin ? fetchPendingMembers() : null"
              :class="{ 'opacity-50 cursor-not-allowed': !isCurrentUserAdmin }"
              :disabled="!isCurrentUserAdmin"
              :title="!isCurrentUserAdmin ? 'Only admins can refresh the pending members list' : ''"
            >
              <LucideIcon name="RefreshCw" size="4" class="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
        
        <PendingMembersList
          :group-id="group.id"
          :current-user="currentUser"
          :pending-members="pendingMembers"
          :loading="isLoadingPendingMembers"
          :is-current-user-admin="isCurrentUserAdmin"
          @refresh="handlePendingMembersRefresh"
        />
        
        <!-- Separator - only show when there are pending members -->
        <div v-if="pendingMembers.length > 0" class="my-6 border-t border-gray-200"></div>
      </div>
      
      <!-- Active Members Section -->
      <div>
        <!-- Use the shared MembersList component which handles lists of members -->
        <MembersList
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
        accept=".csv"
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
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import MembersList from '~/components/members/MembersList.vue'
import PendingMembersList from '~/components/members/PendingMembersList.vue'
import ReviewDocumentsDialog from '~/components/members/ReviewDocumentsDialog.vue'
import axios from '~/src/utils/axios'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu/index.js'
import { Button } from '@/components/ui/button'
import LucideIcon from '@/components/LucideIcon.vue'

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
  }
})

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
  
  // Add event listener for refresh-pending-members event
  window.addEventListener('refresh-pending-members', handleRefreshPendingMembers)
})

onBeforeUnmount(() => {
  // Remove event listener when component is unmounted
  window.removeEventListener('refresh-pending-members', handleRefreshPendingMembers)
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
  'user-invited'
])

const csvFileInput = ref(null)
const isLoadingMembers = ref(false)
const isLoadingPendingMembers = ref(false)
const pendingMembers = ref([])
const showReviewDialog = ref(false)
const selectedPendingMember = ref(null)

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
    
    // Debug: Log the token being used
    const token = localStorage.getItem('token');
    console.log('Token being used (first 20 chars):', token ? token.substring(0, 20) + '...' : 'No token found');
    
    // Debug: Make a direct fetch call to see the raw response
    const response = await fetch(`http://localhost:8080/groups/${props.group.id}/members/${memberId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role: "admin" })
    });
    
    console.log('Raw response status:', response.status);
    const responseData = await response.json();
    console.log('Raw response data:', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to promote member');
    }
    
    // Show success message
    alert(`${member.name} is now an admin`);
    
    // Refresh group data to update members list
    emit('refresh-group');
    
    // Update the member object locally to reflect the change immediately
    member.isAdmin = true;
  } catch (error) {
    console.error('Failed to promote member:', error);
    alert('Failed to promote member: ' + (error.response?.data?.error || error.message));
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
    
    // Debug: Log the token being used
    const token = localStorage.getItem('token');
    console.log('Token being used (first 20 chars):', token ? token.substring(0, 20) + '...' : 'No token found');
    
    // Debug: Make a direct fetch call to see the raw response
    const response = await fetch(`http://localhost:8080/groups/${props.group.id}/members/${memberId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role: "member" })
    });
    
    console.log('Raw response status:', response.status);
    const responseData = await response.json();
    console.log('Raw response data:', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to demote member');
    }
    
    // Show success message
    alert(`${member.name} is no longer an admin`);
    
    // Refresh group data to update members list
    emit('refresh-group');
    
    // Update the member object locally to reflect the change immediately
    member.isAdmin = false;
  } catch (error) {
    console.error('Failed to demote member:', error);
    alert('Failed to demote member: ' + (error.response?.data?.error || error.message));
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
    const response = await axios.get(`/groups/${props.group.id}/pending-members`)
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
    await axios.post(`/groups/${props.group.id}/members/${memberId}/approve`)
    
    // Remove the member from the pending list
    pendingMembers.value = pendingMembers.value.filter(m => {
      const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id
      return mId !== memberId
    })
    
    // Refresh the group data to update the members list
    emit('refresh-group')
    
    // Show success message
    const memberName = member.name || member.user?.name || 'Member'
    alert(`${memberName} has been accepted to the group`)
  } catch (error) {
    console.error('Failed to accept pending member:', error)
    alert('Failed to accept member: ' + (error.response?.data?.error || error.message))
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
    await axios.post(`/groups/${props.group.id}/members/${memberId}/decline`)
    
    // Remove the member from the pending list
    pendingMembers.value = pendingMembers.value.filter(m => {
      const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id
      return mId !== memberId
    })
    
    // Show success message
    const memberName = member.name || member.user?.name || 'Member'
    alert(`${memberName}'s request to join has been declined`)
  } catch (error) {
    console.error('Failed to decline pending member:', error)
    alert('Failed to decline member: ' + (error.response?.data?.error || error.message))
  }
}

const handlePendingMembersRefresh = (data) => {
  console.log('Handling refresh from PendingMembersList', data);
  
  // Refresh pending members
  fetchPendingMembers();
  
  // Also refresh the entire group data to update active members
  emit('refresh-group');
  
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
        const mId = m.user_id || m.userId || (m.user && m.user.id) || m.id
        return mId === memberId
      })
      
      // Use different API endpoints based on whether the member is pending or active
      let endpoint = ''
      if (isPending) {
        endpoint = `/groups/${props.group.id}/pending-members/${memberId}/documents`
      } else {
        endpoint = `/groups/${props.group.id}/members/${memberId}/documents`
      }
      
      console.log(`MembersTab - Fetching documents from endpoint: ${endpoint}`)
      
      // Fetch documents from the API
      const response = await axios.get(endpoint)
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
      const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
      
      // Skip if no valid member ID
      if (!memberId) {
        console.log(`Member ${member.name || member.user?.name || 'Unknown'} has no valid ID, skipping document check`);
        continue;
      }
      
      console.log(`Checking documents for member ${member.name || member.user?.name || 'Unknown'} with ID ${memberId}`);
      
      // Use the API endpoint for active members
      const endpoint = `/groups/${props.group.id}/members/${memberId}/documents`;
      
      // Fetch documents from the API
      const response = await axios.get(endpoint);
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
  }
}
</script>