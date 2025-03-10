<!-- components/group/tabs/MembersTab.vue -->
<template>
  <Card class="mt-6">
    <CardContent class="p-6">
      <!-- Tabs for Active and Pending Members -->
      <Tabs defaultValue="active" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Members</TabsTrigger>
          <TabsTrigger value="pending">Pending Members</TabsTrigger>
        </TabsList>
        
        <!-- Active Members Tab -->
        <TabsContent value="active">
          <!-- Use the shared MembersList component which handles lists of members -->
          <MembersList
            :members="activeMembers"
            :loading="isLoadingMembers"
            :current-user="currentUser"
            :is-current-user-admin="isCurrentUserAdmin"
            :show-add-button="true"
            :show-import-button="true"
            @add-member="$emit('show-add-member')"
            @search-user="$emit('show-user-search')"
            @import-csv="triggerCsvFileInput"
            @promote="promoteMember"
            @demote="demoteMember"
            @remove="handleMemberRemove"
            @refresh-members="$emit('refresh-group')"
            @admin-status-update="handleAdminStatusUpdate"
          />
        </TabsContent>
        
        <!-- Pending Members Tab -->
        <TabsContent value="pending">
          <PendingMembersList
            :group-id="group.id"
            :current-user="currentUser"
            @refresh="fetchPendingMembers"
          />
        </TabsContent>
      </Tabs>
      
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
        @close="showReviewDialog = false"
        @accept="acceptPendingMember"
        @decline="declinePendingMember"
      />
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import MembersList from '~/components/members/MembersList.vue'
import PendingMembersList from '~/components/members/PendingMembersList.vue'
import ReviewDocumentsDialog from '~/components/members/ReviewDocumentsDialog.vue'
import axios from '~/src/utils/axios'

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
  return filtered;
});

// Debug admin status
onMounted(() => {
  console.log('MembersTab - isCurrentUserAdmin:', props.isCurrentUserAdmin)
  console.log('MembersTab - group:', props.group)
  
  // Add additional debugging to check if members have status field
  if (props.group && props.group.members) {
    console.log('MembersTab - Checking member status fields:');
    props.group.members.forEach(member => {
      console.log(`Member ${member.name || member.user?.name || 'Unknown'}: has status field = ${member.status !== undefined}, status = ${member.status}`);
    });
  }
  
  // Fetch pending members when component mounts
  fetchPendingMembers()
})

// Watch for changes in the isCurrentUserAdmin prop
watch(() => props.isCurrentUserAdmin, (newValue) => {
  console.log('MembersTab - isCurrentUserAdmin changed to:', newValue)
})

const emit = defineEmits([
  'show-add-member', 
  'show-user-search', 
  'csv-import',
  'member-promoted',
  'member-demoted',
  'member-removed',
  'refresh-group',
  'admin-status-update'
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
  if (!props.isCurrentUserAdmin) return
  
  // Check if group ID is valid
  if (!props.group || !props.group.id) {
    console.error('Cannot fetch pending members: Invalid group ID')
    return
  }
  
  isLoadingPendingMembers.value = true
  try {
    // Call API to get pending members
    const response = await axios.get(`/groups/${props.group.id}/pending-members`)
    pendingMembers.value = response.data
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
</script>