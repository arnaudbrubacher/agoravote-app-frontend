<!-- components/members/MembersList.vue -->
<template>
  <div class="space-y-4">
    <!-- Header with title -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">Members ({{ members.length || 0 }})</h3>
    </div>
    
    <!-- Search bar -->
    <div class="relative w-full sm:max-w-xs">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search members..."
        class="w-full pl-8 pr-4 py-2 border rounded-md"
      />
      <LucideIcon 
        name="Search" 
        size="4"
        class="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
      />
      <button 
        v-if="searchQuery" 
        @click="searchQuery = ''" 
        class="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
      >
        <LucideIcon name="X" size="4" class="h-4 w-4" />
      </button>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-6">
      <LucideIcon name="RefreshCw" size="6" class="h-6 w-6 animate-spin text-primary" />
      <span class="ml-2">Loading members...</span>
    </div>
    
    <!-- No members state -->
    <div v-else-if="!filteredMembers || filteredMembers.length === 0" class="text-center py-8 text-muted-foreground">
      <span v-if="searchQuery">No members matching "{{ searchQuery }}"</span>
      <span v-else>No members yet</span>
    </div>
    
    <!-- Members list -->
    <div v-else class="space-y-4">
      <MemberRow 
        v-for="(member, index) in filteredMembers" 
        :key="member.id || index" 
        :member="member" 
        :current-user="currentUser"
        :is-current-user-admin="isCurrentUserAdmin"
        :has-documents="hasDocuments(member)"
        @promote="$emit('promote', member)"
        @demote="$emit('demote', member)"
        @remove="handleMemberRemove(member)"
        @review-documents="$emit('review-documents', member)"
      />
    </div>
    
    <!-- Review Documents Dialog -->
    <Dialog :open="!!selectedMember" @update:open="selectedMember = null">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Documents</DialogTitle>
          <DialogDescription>
            Documents submitted by {{ selectedMember?.name || selectedMember?.user?.name || 'the member' }}
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4 max-h-[60vh] overflow-y-auto">
          <div v-if="!parsedDocuments || parsedDocuments.length === 0" 
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Button } from '@/components/ui/button'
import MemberRow from '~/components/members/MemberRow.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { useGroupMembers } from '@/composables/useGroupMembers'

const props = defineProps({
  groupId: {
    type: String,
    required: true
  },
  members: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentUser: {
    type: Object,
    default: null
  },
  isCurrentUserAdmin: {
    type: Boolean,
    default: false
  },
  group: {
    type: Object,
    default: null
  },
  fetchGroup: {
    type: Function,
    default: () => {}
  }
})

const emit = defineEmits([
  'add-member',
  'search-user',
  'import-csv',
  'promote',
  'demote',
  'remove',
  'refresh-members',
  'admin-status-update',
  'review-documents'
])

const { handleMemberRemove: removeMemberApi } = useGroupMembers(
  props.groupId, 
  computed(() => props.group),
  props.fetchGroup
)

const searchQuery = ref('')
const selectedMember = ref(null)

// Check if the current user is an admin based on members data
const isCurrentUserAdminInMembers = computed(() => {
  if (!props.currentUser || !props.members || props.members.length === 0) {
    console.log('Missing data for admin check:', {
      currentUser: !!props.currentUser,
      members: props.members?.length || 0
    });
    return false;
  }
  
  // Get current user ID from various sources
  const currentUserId = props.currentUser.id || 
                        props.currentUser.userId || 
                        props.currentUser.user_id || 
                        localStorage.getItem('userId');
  
  console.log('Current user ID for member check:', currentUserId);
  console.log('Members:', props.members);
  
  // Find the current user in the members list
  const currentUserMember = props.members.find(member => {
    const memberId = member.id || member.userId || member.user_id;
    const memberUserId = member.user?.id || member.userId || member.user_id;
    
    console.log('Comparing member:', {
      memberId,
      memberUserId,
      currentUserId,
      isMatch: memberId === currentUserId || memberUserId === currentUserId
    });
    
    return memberId === currentUserId || memberUserId === currentUserId;
  });
  
  console.log('Current user member found:', currentUserMember);
  
  // Check if the current user is an admin
  return currentUserMember?.isAdmin === true;
})

// Computed property to determine if the user can edit
const canEdit = computed(() => {
  // Log the admin status for debugging
  console.log('MembersList - Admin status check:', {
    propIsAdmin: props.isCurrentUserAdmin,
    memberCheck: isCurrentUserAdminInMembers.value
  });
  
  // Use either the prop passed from parent or our own check
  const isAdmin = props.isCurrentUserAdmin === true || isCurrentUserAdminInMembers.value === true;
  
  console.log('MembersList - Final admin status:', isAdmin);
  
  // If we determined admin status but it's not reflected in props, emit an event
  if (isCurrentUserAdminInMembers.value === true && props.isCurrentUserAdmin !== true) {
    console.log('Emitting admin status update event');
    emit('admin-status-update', true);
  }
  
  return isAdmin;
})

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

// Debug admin status
onMounted(() => {
  console.log('MembersList - props.isCurrentUserAdmin:', props.isCurrentUserAdmin)
  console.log('MembersList - isCurrentUserAdminInMembers:', isCurrentUserAdminInMembers.value)
  console.log('MembersList - canEdit:', canEdit.value)
  console.log('MembersList - currentUser:', props.currentUser)
  console.log('MembersList - members:', props.members)
  
  // Listen for user data updates
  window.addEventListener('user-data-updated', handleDataUpdated)
  // Listen for group data updates
  window.addEventListener('group-data-updated', handleDataUpdated)
})

// Clean up event listener
onBeforeUnmount(() => {
  window.removeEventListener('user-data-updated', handleDataUpdated)
  window.removeEventListener('group-data-updated', handleDataUpdated)
})

// Handle data updates (from both user and group updates)
const handleDataUpdated = () => {
  console.log('MembersList received data update event')
  emit('refresh-members')
}

// Check if a member has documents
const hasDocuments = (member) => {
  console.log(`MembersList - Checking if member ${member.name || 'Unknown'} has documents:`, {
    document_file_url: member.document_file_url,
    document_file_name: member.document_file_name,
    document_file_type: member.document_file_type,
    document_file_size: member.document_file_size,
    document_uploaded_at: member.document_uploaded_at,
    // Check if hasDocuments flag is already set
    hasDocumentsFlag: member.hasDocuments,
    // Log all keys to see what's available
    keys: Object.keys(member),
    // Log the member object for debugging
    member: member
  })
  
  // If hasDocuments flag is already set, respect it
  if (member.hasDocuments === true) {
    console.log(`MembersList - Member ${member.name || 'Unknown'} has hasDocuments flag set to true`)
    return true
  }
  
  // Check if the member has any direct document fields
  if (member.document_file_url || 
      member.document_file_name || 
      member.document_file_type || 
      member.document_file_size || 
      member.document_uploaded_at) {
    console.log(`MembersList - Member ${member.name || 'Unknown'} has document fields`)
    return true
  }
  
  console.log(`MembersList - Member ${member.name || 'Unknown'} has no documents`)
  return false
}

// Handle review documents
const reviewDocuments = (member) => {
  selectedMember.value = member
}

// Watch for changes in the members or currentUser
watch(() => props.members, (newMembers) => {
  console.log('MembersList - members changed:', newMembers?.length || 0)
}, { deep: true })

watch(() => props.currentUser, (newUser) => {
  console.log('MembersList - currentUser changed:', newUser?.id || 'none')
}, { deep: true })

// Computed property for filtered members
const filteredMembers = computed(() => {
  if (!props.members) return []
  
  // If no search query, return all members
  if (!searchQuery.value) return props.members
  
  // Filter members by name or email
  return props.members.filter(member => {
    const name = member.name || member.user?.name || ''
    const email = member.email || member.user?.email || ''
    
    // Case-insensitive search
    const query = searchQuery.value.toLowerCase()
    
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query)
  })
})

// Handle member remove - Now calls the composable
const handleMemberRemove = async (member) => {
  // Call the composable function to handle API call, confirmation, and refresh
  await removeMemberApi(member)
  
  // Optional: Emit 'remove' if parent component still needs to react immediately
  // emit('remove', member) 
  
  // Optional: Emit 'refresh-members' if composable doesn't handle refresh or parent needs it
  // emit('refresh-members')
}
</script> 