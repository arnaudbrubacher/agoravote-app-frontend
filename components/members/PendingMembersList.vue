<!-- components/members/PendingMembersList.vue -->
<template>
  <div class="space-y-4">
    <!-- Header with title -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">Pending Members ({{ pendingMembers.length || 0 }})</h3>
      <Button v-if="pendingMembers.length > 0" variant="outline" size="sm" @click="fetchPendingMembers">
        <LucideIcon name="RefreshCw" size="4" class="h-4 w-4 mr-1" />
        Refresh
      </Button>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-6">
      <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin text-primary" />
      <span class="ml-2">Loading pending members...</span>
    </div>
    
    <!-- No pending members state -->
    <div v-else-if="!pendingMembers || pendingMembers.length === 0" class="text-center py-8 text-muted-foreground">
      <span>No pending members</span>
    </div>
    
    <!-- Pending members list -->
    <div v-else class="space-y-4">
      <MemberRow 
        v-for="(member, index) in pendingMembers" 
        :key="member.id || member.user_id || index" 
        :member="{
          ...member,
          name: member.name || (member.user && member.user.name),
          email: member.email || (member.user && member.user.email)
        }"
        :current-user="currentUser"
        :is-pending="true"
        :is-current-user-admin="true"
        :has-documents="member.hasDocuments"
        :invitation-accepted="member.invitation_accepted === true"
        @review-documents="reviewDocuments(member)"
        @accept="approveMember(member)"
        @decline="declineMember(member)"
      />
    </div>
    
    <!-- Document Review Dialog -->
    <Dialog :open="!!selectedMember" @update:open="selectedMember = null">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Documents</DialogTitle>
          <DialogDescription>
            Documents submitted by {{ selectedMember?.user?.name || 'the member' }}
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 max-h-[60vh] overflow-y-auto">
          <div v-if="!selectedMember?.documents_submitted || selectedMember?.documents_submitted.length === 0" 
               class="text-center py-4 text-muted-foreground">
            No documents submitted
          </div>
          
          <div v-else v-for="(doc, index) in parsedDocuments" :key="index" class="border rounded-md p-4">
            <h4 class="font-medium">{{ doc.name || `Document ${index + 1}` }}</h4>
            <p v-if="doc.description" class="text-sm text-muted-foreground">{{ doc.description }}</p>
            <div class="mt-2">
              <a v-if="doc.url" :href="doc.url" target="_blank" class="text-blue-600 hover:underline">
                View Document
              </a>
              <p v-else-if="doc.fileName" class="text-sm">
                File: {{ doc.fileName }}
                <span v-if="doc.fileType" class="text-muted-foreground">({{ doc.fileType }})</span>
              </p>
              <p v-else class="text-sm text-muted-foreground">Document data: {{ doc.data || 'No data' }}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" @click="selectedMember = null">Close</Button>
          <Button variant="default" @click="approveWithDocuments(selectedMember)">Approve Member</Button>
          <Button variant="destructive" @click="declineMember(selectedMember)">Decline Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '~/src/utils/axios'
import LucideIcon from '@/components/LucideIcon.vue'
import MemberRow from '~/components/members/MemberRow.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

const props = defineProps({
  groupId: {
    type: String,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'refresh'
])

const pendingMembers = ref([])
const loading = ref(false)
const selectedMember = ref(null)

// Computed property to parse documents from the selected member
const parsedDocuments = computed(() => {
  if (!selectedMember.value || !selectedMember.value.documents_submitted) {
    return []
  }
  
  let documents = selectedMember.value.documents_submitted
  
  // If documents is a string, try to parse it as JSON
  if (typeof documents === 'string') {
    try {
      documents = JSON.parse(documents)
    } catch (e) {
      console.error('Error parsing documents:', e)
      return []
    }
  }
  
  // If documents is not an array, return empty array
  if (!Array.isArray(documents)) {
    return []
  }
  
  return documents
})

// Fetch pending members from the API
const fetchPendingMembers = async () => {
  // Check if groupId is valid (not undefined, null, or empty string)
  if (!props.groupId || props.groupId === 'undefined') {
    console.error('Cannot fetch pending members: Invalid group ID', props.groupId)
    return
  }
  
  loading.value = true
  
  try {
    const response = await axios.get(`/groups/${props.groupId}/pending-members`)
    console.log('Pending members response:', response.data)
    
    pendingMembers.value = response.data
    
    // Add hasDocuments property to each member and ensure user info is available
    pendingMembers.value.forEach(member => {
      console.log('Processing pending member:', member)
      console.log('Invitation accepted status:', member.invitation_accepted)
      
      // Ensure user info is available
      if (!member.name && member.user) {
        member.name = member.user.name
      }
      
      if (!member.email && member.user) {
        member.email = member.user.email
      }
      
      // Process documents
      let docs = member.documents_submitted
      
      // If docs is a string, try to parse it as JSON
      if (typeof docs === 'string') {
        try {
          docs = JSON.parse(docs)
        } catch (e) {
          docs = []
        }
      }
      
      // Set hasDocuments based on whether there are any documents
      member.hasDocuments = Array.isArray(docs) && docs.length > 0
      
      // If documents are submitted and invitation_accepted is true, mark as a join request
      if (member.hasDocuments && member.invitation_accepted === true) {
        member.isJoinRequest = true
        console.log('Identified as a join request with documents')
      }
    })
  } catch (error) {
    console.error('Failed to fetch pending members:', error)
  } finally {
    loading.value = false
  }
}

// Review documents for a member
const reviewDocuments = (member) => {
  selectedMember.value = member
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
    await axios.post(`/groups/${props.groupId}/members/${member.user_id}/approve`)
    
    // Remove the member from the list
    pendingMembers.value = pendingMembers.value.filter(m => m.user_id !== member.user_id)
    
    // Close the dialog if it's open
    if (selectedMember.value && selectedMember.value.user_id === member.user_id) {
      selectedMember.value = null
    }
    
    // Emit refresh event to update the members list
    // Include information about the approved member
    emit('refresh', { 
      action: 'approve', 
      member: member,
      message: `${member.user?.name || 'Member'} has been approved`
    })
    
    // Show success message
    alert(`${member.user?.name || 'Member'} has been approved`)
  } catch (error) {
    console.error('Failed to approve member:', error)
    alert('Failed to approve member: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Approve a member with documents
const approveWithDocuments = async (member) => {
  // Check if the invitation has been accepted or if this is a join request
  if (member.invitation_accepted !== true && !member.isJoinRequest) {
    console.log('Cannot approve member with documents - invitation not accepted and not a join request:', member);
    alert(`Cannot approve ${member.user?.name || 'this member'} yet. They need to accept the invitation first.`);
    selectedMember.value = null;
    return;
  }

  try {
    await axios.post(`/groups/${props.groupId}/members/${member.user_id}/approve-documents`)
    
    // Remove the member from the list
    pendingMembers.value = pendingMembers.value.filter(m => m.user_id !== member.user_id)
    
    // Close the dialog
    selectedMember.value = null
    
    // Emit refresh event to update the members list
    emit('refresh', { 
      action: 'approve', 
      member: member,
      message: `${member.user?.name || 'Member'} has been approved with documents`
    })
    
    // Show success message
    alert(`${member.user?.name || 'Member'} has been approved with documents`)
  } catch (error) {
    console.error('Failed to approve member with documents:', error)
    alert('Failed to approve member: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Decline a pending member
const declineMember = async (member) => {
  // Confirm before declining
  if (!confirm(`Are you sure you want to decline ${member.user?.name || 'this member'}?`)) {
    return
  }
  
  try {
    await axios.post(`/groups/${props.groupId}/members/${member.user_id}/decline`)
    
    // Remove the member from the list
    pendingMembers.value = pendingMembers.value.filter(m => m.user_id !== member.user_id)
    
    // Close the dialog if it's open
    if (selectedMember.value && selectedMember.value.user_id === member.user_id) {
      selectedMember.value = null
    }
    
    // Emit refresh event with information about the declined member
    emit('refresh', { 
      action: 'decline', 
      member: member,
      message: `${member.user?.name || 'Member'} has been declined`
    })
    
    // Show success message
    alert(`${member.user?.name || 'Member'} has been declined`)
  } catch (error) {
    console.error('Failed to decline member:', error)
    alert('Failed to decline member: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Fetch pending members when the component is mounted
onMounted(() => {
  fetchPendingMembers()
})
</script> 