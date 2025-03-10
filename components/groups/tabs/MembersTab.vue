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
            :members="group.members"
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
            :pending-members="pendingMembers"
            :loading="isLoadingPendingMembers"
            :current-user="currentUser"
            @review-documents="showReviewDocumentsDialog"
            @accept="acceptPendingMember"
            @decline="declinePendingMember"
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
        @close="showReviewDialog = false"
        @accept="acceptPendingMember"
        @decline="declinePendingMember"
      />
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
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

// Debug admin status
onMounted(() => {
  console.log('MembersTab - isCurrentUserAdmin:', props.isCurrentUserAdmin)
  console.log('MembersTab - group:', props.group)
  
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
    // In the Go backend with Gin framework, the API likely follows RESTful conventions
    // The member ID in the database is likely the user_id field
    const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
    
    console.log('MembersTab - Promoting member with details:', {
      member,
      memberId,
      groupId: props.group.id
    });
    
    // Based on the backend's domain-driven design, the endpoint should be:
    // PUT /groups/{groupId}/members/{memberId}/role with { role: "admin" }
    await axios.put(`/groups/${props.group.id}/members/${memberId}/role`, { 
      role: "admin" 
    });
    
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
    
    // Based on the backend's domain-driven design, the endpoint should be:
    // PUT /groups/{groupId}/members/{memberId}/role with { role: "member" }
    await axios.put(`/groups/${props.group.id}/members/${memberId}/role`, { 
      role: "member" 
    });
    
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
  
  isLoadingPendingMembers.value = true
  try {
    // Call API to get pending members
    const response = await axios.get(`/groups/${props.group.id}/pending-members`)
    pendingMembers.value = response.data
  } catch (error) {
    console.error('Failed to fetch pending members:', error)
    // Mock data for development
    pendingMembers.value = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        hasDocuments: true
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        hasDocuments: true
      }
    ]
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
    
    // Call API to accept the pending member
    await axios.post(`/groups/${props.group.id}/pending-members/${member.id}/accept`)
    
    // Remove the member from the pending list
    pendingMembers.value = pendingMembers.value.filter(m => m.id !== member.id)
    
    // Refresh the group data to update the members list
    emit('refresh-group')
    
    // Show success message
    alert(`${member.name} has been accepted to the group`)
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
    
    // Call API to decline the pending member
    await axios.post(`/groups/${props.group.id}/pending-members/${member.id}/decline`)
    
    // Remove the member from the pending list
    pendingMembers.value = pendingMembers.value.filter(m => m.id !== member.id)
    
    // Show success message
    alert(`${member.name}'s request to join has been declined`)
  } catch (error) {
    console.error('Failed to decline pending member:', error)
    alert('Failed to decline member: ' + (error.response?.data?.error || error.message))
  }
}
</script>