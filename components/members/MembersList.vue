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
        @review-documents="handleReviewDocuments(member)"
      />
    </div>
    
    <!-- Member Document Manager (for current user) -->
    <MemberDocumentManager
      v-if="showMemberDocumentManager && selectedMemberForDocs"
      :group="group"
      :member="selectedMemberForDocs"
      :requiresDocuments="group?.requires_documents"
      @close="closeDocumentManager"
      @document-updated="handleDocumentUpdated"
    />

    <!-- Review Documents Dialog (for other users, by admin) -->
    <ReviewDocumentsDialog
      v-if="showReviewDialog && selectedMemberForReview"
      :member="selectedMemberForReview"
      :group-id="groupId"
      :is-pending="false"
      @close="closeReviewDialog"
      @accept="handleAcceptFromReview"
      @decline="handleDeclineFromReview"
    />

    <!-- Reusable Alert Dialog for confirmations and alerts -->
    <ActionAlertDialog
      :open="isOpen"
      :title="options?.title || 'Alert'"
      :message="options?.message || ''"
      :action-text="options?.actionText || 'OK'"
      :cancel-text="options?.cancelText || 'Cancel'"
      :show-cancel="options?.showCancel || false"
      @update:open="isOpen = $event"
      @action="handleAction"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import LucideIcon from '@/components/LucideIcon.vue'
import { Button } from '@/components/ui/button'
import MemberRow from '~/components/members/MemberRow.vue'
import { useGroupMembers } from '@/composables/useGroupMembers'
import { useAlertDialog } from '@/composables/useAlertDialog'
import MemberDocumentManager from '@/components/members/MemberDocumentManager.vue'
import ReviewDocumentsDialog from '@/components/members/ReviewDocumentsDialog.vue'
import ActionAlertDialog from '@/components/shared/ActionAlertDialog.vue'

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
  // 'review-documents' 
])

const { handleMemberRemove: removeMemberApi } = useGroupMembers(
  props.groupId, 
  computed(() => props.group),
  props.fetchGroup
)

// Initialize alert dialog for confirmations
const { 
  isOpen, 
  options,
  title, 
  message, 
  actionText, 
  cancelText, 
  showCancel,
  showAlert, 
  showConfirm, 
  handleAction, 
  handleCancel 
} = useAlertDialog()

const searchQuery = ref('')
const showMemberDocumentManager = ref(false)
const selectedMemberForDocs = ref(null)
const showReviewDialog = ref(false)
const selectedMemberForReview = ref(null)

// Check if the current user is an admin based on members data
const isCurrentUserAdminInMembers = computed(() => {
  if (!props.currentUser || !props.members || props.members.length === 0) {
    console.log('Missing data for admin check:', {
      currentUser: !!props.currentUser,
      members: props.members?.length || 0
    });
    return false;
  }
  
  const currentUserId = props.currentUser.id || 
                        props.currentUser.userId || 
                        props.currentUser.user_id || 
                        localStorage.getItem('userId');
  
  const currentUserMember = props.members.find(member => {
    const memberId = member.id || member.userId || member.user_id;
    const memberUserId = member.user?.id || member.userId || member.user_id;
    return memberId === currentUserId || memberUserId === currentUserId;
  });
  
  return currentUserMember?.isAdmin === true;
})

// Computed property to determine if the user can edit
const canEdit = computed(() => {
  const isAdmin = props.isCurrentUserAdmin === true || isCurrentUserAdminInMembers.value === true;
  if (isCurrentUserAdminInMembers.value === true && props.isCurrentUserAdmin !== true) {
    emit('admin-status-update', true);
  }
  return isAdmin;
})

onMounted(() => {
  console.log('MembersList - props.isCurrentUserAdmin:', props.isCurrentUserAdmin)
  console.log('MembersList - isCurrentUserAdminInMembers:', isCurrentUserAdminInMembers.value)
  console.log('MembersList - canEdit:', canEdit.value)
  console.log('MembersList - currentUser:', props.currentUser)
  console.log('MembersList - members:', props.members)
  
  window.addEventListener('user-data-updated', handleDataUpdated)
  window.addEventListener('group-data-updated', handleDataUpdated)
  window.addEventListener('refresh-members-list', handleRefreshMembersList)
  window.addEventListener('refresh-invited-members', handleRefreshMembersList)
})

onBeforeUnmount(() => {
  window.removeEventListener('user-data-updated', handleDataUpdated)
  window.removeEventListener('group-data-updated', handleDataUpdated)
  window.removeEventListener('refresh-members-list', handleRefreshMembersList)
  window.removeEventListener('refresh-invited-members', handleRefreshMembersList)
})

const handleDataUpdated = () => {
  console.log('MembersList received data update event')
  emit('refresh-members')
}

const handleRefreshMembersList = (event) => {
  console.log('[MembersList] Received refresh event:', event.detail);
  if (event.detail?.groupId === props.groupId) {
    console.log('[MembersList] Event matches current group ID. Refreshing members...');
    emit('refresh-members');
  } else {
    console.log('[MembersList] Event is for a different group. Ignoring.');
  }
}

const hasDocuments = (member) => {
  console.log(`MembersList - Checking if member ${member.name || 'Unknown'} has documents:`, {
    document_file_url: member.document_file_url,
    document_file_name: member.document_file_name,
    hasDocumentsFlag: member.hasDocuments,
    keys: Object.keys(member),
    member: member
  })
  
  if (member.hasDocuments === true) {
    return true
  }
  
  if (member.document_file_url || 
      member.document_file_name || 
      member.document_file_type || 
      member.document_file_size || 
      member.document_uploaded_at) {
    return true
  }
  
  console.log(`MembersList - Member ${member.name || 'Unknown'} has no documents`)
  return false
}

// Open the MemberDocumentManager
const openDocumentManager = (member) => {
  console.log('MembersList - Opening document manager for:', member.name)
  selectedMemberForDocs.value = member
  showMemberDocumentManager.value = true
}

// Close the MemberDocumentManager
const closeDocumentManager = () => {
  showMemberDocumentManager.value = false
  selectedMemberForDocs.value = null
}

// Open the ReviewDocumentsDialog
const openReviewDialog = (member) => {
  console.log('MembersList - Opening review dialog for:', member.name)
  selectedMemberForReview.value = member
  showReviewDialog.value = true
}

// Close the ReviewDocumentsDialog
const closeReviewDialog = () => {
  showReviewDialog.value = false
  selectedMemberForReview.value = null
}

// Handle actions from ReviewDocumentsDialog (adjust as needed for active members)
const handleAcceptFromReview = (member) => {
  console.log('MembersList - Accept action from ReviewDialog for:', member.name)
  closeReviewDialog()
  emit('refresh-members') 
}

const handleDeclineFromReview = (member) => {
  console.log('MembersList - Decline action from ReviewDialog for:', member.name)
  closeReviewDialog()
  emit('refresh-members')
}

// Handle document updates from MemberDocumentManager
const handleDocumentUpdated = (document) => {
  console.log('MembersList - Document updated:', document)
  const memberIndex = props.members.findIndex(m => m.id === selectedMemberForDocs.value.id)
  if (memberIndex !== -1) {
    props.members[memberIndex].document_file_url = document.url // Adjust based on actual response
    props.members[memberIndex].document_file_name = document.filename // Adjust based on actual response
  }
  emit('refresh-members')
}

// Handle the review-documents event from MemberRow
const handleReviewDocuments = (member) => {
  const currentUserId = props.currentUser.id || 
                        props.currentUser.userId || 
                        props.currentUser.user_id
  const memberId = member.id || member.userId || member.user_id || member.user?.id

  if (memberId === currentUserId) {
    openDocumentManager(member)
  } else {
    openReviewDialog(member)
  }
}

watch(() => props.members, (newMembers) => {
  console.log('MembersList - members changed:', newMembers?.length || 0)
}, { deep: true })

watch(() => props.currentUser, (newUser) => {
  console.log('MembersList - currentUser changed:', newUser?.id || 'none')
}, { deep: true })

const filteredMembers = computed(() => {
  if (!props.members) return []
  if (!searchQuery.value) return props.members
  
  return props.members.filter(member => {
    const name = member.name || member.user?.name || ''
    const email = member.email || member.user?.email || ''
    const query = searchQuery.value.toLowerCase()
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query)
  })
})

const handleMemberRemove = async (member) => {
  console.log('MembersList - handleMemberRemove called for:', member.name);
  
  // Show confirmation dialog using MembersList's useAlertDialog instance
  showConfirm(
    'Remove member',
    `Are you sure you want to remove ${member.name} from this group?`,
    async () => {
      // User confirmed - call the API
      try {
        await removeMemberApi(member);
        // Refresh the members list after removal
        emit('refresh-members');
      } catch (error) {
        // Error is already handled by removeMemberApi
        console.error('MembersList - Failed to remove member:', error);
      }
    },
    () => {
      // User cancelled
      console.log('MembersList - User cancelled member removal');
    }
  );
}
</script> 