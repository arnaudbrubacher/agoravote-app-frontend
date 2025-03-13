<template>
  <Sheet v-model:open="isOpen" side="left">
    <SheetContent class="w-full sm:max-w-md overflow-y-auto" side="left">
      <SheetHeader class="pb-4">
        <SheetTitle>Dashboard</SheetTitle>
      </SheetHeader>
      
      <!-- Groups Section -->
      <div class="space-y-6 p-4">
        <!-- Group Actions -->
        <div class="space-y-2">
          <Button 
            variant="outline" 
            class="w-full justify-start"
            @click="$emit('find-group')"
          >
            <Search class="h-4 w-4 mr-2" />
            Find a Group
          </Button>
          
          <Button 
            variant="default" 
            class="w-full justify-start"
            @click="$emit('create-group')"
          >
            <Plus class="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>
      
      <!-- Pending Groups Section (formerly Group Invitations) -->
      <SheetHeader class="pb-4">
        <SheetTitle>Pending Groups</SheetTitle>
        <p class="text-sm text-muted-foreground">Groups you've been invited to or are waiting for approval</p>
      </SheetHeader>
      
      <div class="p-4 pt-0 space-y-4">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <Loader2 class="h-6 w-6 animate-spin inline-block" />
          <span class="ml-2 text-sm text-muted-foreground">Loading pending groups...</span>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="pendingGroups.length === 0" class="text-center py-6 text-sm text-muted-foreground">
          No pending invitations or join requests
        </div>
        
        <!-- Pending Groups List -->
        <div v-else class="space-y-3">
          <GroupCard 
            v-for="group in pendingGroups" 
            :key="group.id" 
            :group="group"
            :showActions="true"
            :showPrivateBadge="false"
          >
            <template #badges>
              <span v-if="isWaitingForAdminApproval(group)" class="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                {{ group.isInvitation === false ? 'Join Request Pending' : 'Awaiting Admin Approval' }}
              </span>
              <span v-else-if="(group.isInvitation === true || group.isInvitation === undefined) && 
                              group.membership && group.membership.status === 'pending' && 
                              group.membership.invitation_accepted !== true" 
                    class="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                Invitation
              </span>
            </template>
            <template #actions>
              <Button 
                variant="outline" 
                size="sm"
                @click.stop="cancelPendingGroup(group)"
              >
                Cancel
              </Button>
              <Button 
                v-if="group.membership && group.membership.documents_submitted && 
                     (typeof group.membership.documents_submitted === 'string' ? 
                      group.membership.documents_submitted !== '[]' && group.membership.documents_submitted !== '{}' : 
                      Array.isArray(group.membership.documents_submitted) && group.membership.documents_submitted.length > 0)"
                variant="default" 
                size="sm"
                @click.stop="reviewDocuments(group)"
              >
                Review
              </Button>
              <Button 
                v-else-if="!isWaitingForAdminApproval(group)"
                variant="default" 
                size="sm"
                @click.stop="acceptPendingGroup(group)"
              >
                Accept
              </Button>
              <div 
                v-else
                class="text-xs text-muted-foreground px-2 py-1 bg-muted rounded"
              >
                Awaiting Admin Approval
              </div>
            </template>
          </GroupCard>
        </div>
      </div>
      
      <!-- Your Groups Section -->
      <SheetHeader class="pb-4">
        <SheetTitle>Your Groups</SheetTitle>
      </SheetHeader>
      
      <div class="p-4 pt-0 space-y-4">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <Loader2 class="h-6 w-6 animate-spin inline-block" />
          <span class="ml-2 text-sm text-muted-foreground">Loading groups...</span>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="activeGroups.length === 0" class="text-center py-6 text-sm text-muted-foreground">
          No groups yet. Create your first group!
        </div>
        
        <!-- Groups List -->
        <div v-else class="space-y-3">
          <GroupCard 
            v-for="group in activeGroups" 
            :key="group.id" 
            :group="group"
            :showActions="false"
            @click="$emit('view-group', group.id)"
          />
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { 
  Search, 
  Plus, 
  Users,
  Loader2
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import GroupCard from '@/components/groups/GroupCard.vue'
import axios from '~/src/utils/axios'

// Props
const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  groups: {
    type: Array,
    required: true,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:open', 'find-group', 'create-group', 'view-group', 'refresh-groups', 'join-group', 'review-documents', 'navigate-to-group'])

// Computed property for two-way binding of open state
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Filter out pending memberships from the groups list
const activeGroups = computed(() => {
  // If no groups or not loaded yet, return empty array
  if (!props.groups || props.groups.length === 0) return []
  
  // Filter out groups where the user is a pending member
  return props.groups.filter(group => {
    // Check if the group has a membership property with status
    if (group.membership && group.membership.status === 'pending') {
      console.log(`Filtering out group with pending membership.status from Your Groups: ${group.name}`)
      return false
    }
    
    // Legacy checks for backward compatibility
    if (group.membership_status === 'pending') {
      console.log(`Filtering out group with pending membership_status from Your Groups: ${group.name}`)
      return false
    }
    
    if (group.status === 'pending') {
      console.log(`Filtering out group with pending status from Your Groups: ${group.name}`)
      return false
    }
    
    // Only include groups with approved status (or no status specified)
    return true
  })
})

// Get pending groups from the groups list
const pendingGroups = computed(() => {
  // If no groups or not loaded yet, return empty array
  if (!props.groups || props.groups.length === 0) return []
  
  // Filter for groups where the user is a pending member
  return props.groups.filter(group => {
    // Check if the group has a membership property with status
    if (group.membership && group.membership.status === 'pending') {
      console.log(`Including group with pending membership.status in Pending Groups: ${group.name}`)
      console.log(`Group invitation accepted status: ${group.membership.invitation_accepted}`)
      console.log(`Group isInvitation flag: ${group.isInvitation}`)
      
      // Log whether this is waiting for admin approval or user acceptance
      if (isWaitingForAdminApproval(group)) {
        console.log(`Group ${group.name} is waiting for admin approval`)
      } else {
        console.log(`Group ${group.name} is waiting for user acceptance`)
      }
      
      return true
    }
    
    // Legacy checks for backward compatibility
    if (group.membership_status === 'pending') {
      console.log(`Including group with pending membership_status in Pending Groups: ${group.name}`)
      return true
    }
    
    if (group.status === 'pending') {
      console.log(`Including group with pending status in Pending Groups: ${group.name}`)
      return true
    }
    
    return false
  })
})

// Listen for the user-left-group event
const handleUserLeftGroup = (event) => {
  console.log('User left group event received in DashboardSidebar:', event.detail)
  // Emit an event to refresh the groups list
  emit('refresh-groups')
}

// Handle the close-dashboard-sidebar event
const handleCloseDashboardSidebar = () => {
  isOpen.value = false
}

// Handle the group-data-updated event
const handleGroupDataUpdated = () => {
  console.log('Group data updated event received in DashboardSidebar')
  // Emit an event to refresh the groups list
  emit('refresh-groups')
}

// Set up event listeners
onMounted(() => {
  window.addEventListener('user-left-group', handleUserLeftGroup)
  window.addEventListener('close-dashboard-sidebar', handleCloseDashboardSidebar)
  window.addEventListener('group-data-updated', handleGroupDataUpdated)
  
  // Log the groups that are being displayed
  console.log('DashboardSidebar - All groups:', props.groups)
  console.log('DashboardSidebar - Active groups:', activeGroups.value)
})

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('user-left-group', handleUserLeftGroup)
  window.removeEventListener('close-dashboard-sidebar', handleCloseDashboardSidebar)
  window.removeEventListener('group-data-updated', handleGroupDataUpdated)
})

// Watch for changes in the groups prop
watch(() => props.groups, (newGroups) => {
  console.log('DashboardSidebar - Groups updated:', newGroups)
  console.log('DashboardSidebar - Active groups after update:', activeGroups.value)
})

// Helper function to properly format group picture URLs

// Accept a pending group membership
const acceptPendingGroup = async (group) => {
  try {
    console.log('Accepting pending group membership for:', group.name);
    console.log('Group details:', {
      id: group.id,
      isInvitation: group.isInvitation,
      membershipStatus: group.membership?.status,
      invitationAccepted: group.membership?.invitation_accepted
    });
    
    // Check if the group requires a password
    const requiresPassword = group.requiresPassword === true || group.requires_password === true;
    
    // More robust check for document requirements
    let requiresDocuments = false;
    
    // Check both camelCase and snake_case versions
    const documents = group.requiredDocuments || group.required_documents;
    
    if (documents) {
      // If it's a string (JSON), parse it
      if (typeof documents === 'string') {
        try {
          const parsedDocs = JSON.parse(documents);
          requiresDocuments = Array.isArray(parsedDocs) && parsedDocs.length > 0;
        } catch (e) {
          console.error('Error parsing required documents:', e);
        }
      } 
      // If it's already an array
      else if (Array.isArray(documents)) {
        requiresDocuments = documents.length > 0;
      }
    }
    
    // Also check the requiresDocuments flag
    const hasRequiresDocumentsFlag = group.requiresDocuments === true || group.requires_documents === true;
    
    // Check if the group requires admin approval
    const requiresAdminApproval = group.requiresAdminApproval === true || group.requires_admin_approval === true;
    
    console.log('Group acceptance requirements:', {
      requiresPassword,
      requiresDocuments,
      hasRequiresDocumentsFlag,
      requiresAdminApproval,
      groupName: group.name
    });
    
    // If the group requires a password, documents, or admin approval, use the existing join-group flow
    if (requiresPassword || (hasRequiresDocumentsFlag && requiresDocuments) || requiresAdminApproval) {
      console.log('Group requires password, documents, or admin approval, using join-group flow');
      // Emit the join-group event to reuse the existing flow
      emit('join-group', group.id, true); // Pass true to indicate this is an invitation acceptance
      return;
    }
    
    // If no special requirements, proceed with direct acceptance
    const response = await axios.post(`/groups/${group.id}/accept`);
    console.log('Acceptance response:', response.data);

    // Get the status from the response
    const status = response.data?.status || 'pending';

    // Update the local state to reflect the acceptance
    if (group.membership) {
      console.log('Updating local state: Setting invitation_accepted to true');
      group.membership.invitation_accepted = true;
      
      // If the user was immediately approved, update the status
      if (status === 'approved') {
        group.membership.status = 'approved';
      }
    } else {
      console.log('Creating membership object with invitation_accepted=true');
      group.membership = { 
        invitation_accepted: true,
        status: status
      };
    }

    // Show success message
    alert(response.data?.message || `You have successfully joined ${group.name || 'the group'}`);

    // Refresh the groups list to show the newly joined group
    emit('refresh-groups');

    // If the user was immediately approved, navigate to the group
    if (status === 'approved') {
      console.log('User was immediately approved, navigating to group');
      emit('navigate-to-group', group.id);
    }
  } catch (error) {
    console.error('Failed to accept group membership:', error);
    alert('Failed to accept group membership: ' + (error.response?.data?.error || 'Unknown error'));
  }
}

// Cancel a pending group membership
const cancelPendingGroup = async (group) => {
  if (!confirm(`Are you sure you want to cancel your pending membership for ${group.name || 'this group'}?`)) {
    return;
  }
  
  try {
    await axios.post(`/groups/${group.id}/decline`);
    
    // Refresh the groups list
    emit('refresh-groups');
  } catch (error) {
    console.error('Failed to cancel group membership:', error);
    alert('Failed to cancel group membership: ' + (error.response?.data?.error || 'Unknown error'));
  }
}

// Review documents for a group
const reviewDocuments = (group) => {
  // Emit an event to show the GroupAdmissionForm in review mode
  emit('review-documents', group.id)
}

// Helper function to check if a group is waiting for admin approval
const isWaitingForAdminApproval = (group) => {
  // Check if the group has a membership with pending status
  if (!group.membership || group.membership.status !== 'pending') {
    return false;
  }
  
  // If this is an invitation (isInvitation is true or undefined) and it hasn't been accepted yet,
  // then it's not waiting for admin approval - it's waiting for user acceptance
  if ((group.isInvitation === true || group.isInvitation === undefined) && 
      group.membership.invitation_accepted !== true) {
    return false;
  }
  
  // If this is a join request (isInvitation is explicitly false) or 
  // an invitation that has been accepted (invitation_accepted is true),
  // then it's waiting for admin approval
  return group.isInvitation === false || group.membership.invitation_accepted === true;
}
</script> 