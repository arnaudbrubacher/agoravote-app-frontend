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
                v-if="hasDocuments(group)"
                variant="default" 
                size="sm"
                @click.stop="manageDocuments(group)"
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
            :showActions="true"
            @click="$emit('view-group', group.id)"
          >
            <template #actions>
              <Button 
                v-if="hasDocuments(group) || groupRequiresDocuments(group)"
                variant="outline" 
                size="sm"
                @click.stop="manageDocuments(group)"
              >
                {{ hasDocuments(group) ? 'View Documents' : 'Upload Documents' }}
              </Button>
            </template>
          </GroupCard>
        </div>
      </div>
    </SheetContent>
  </Sheet>
  
  <!-- Member Document Manager Dialog -->
  <MemberDocumentManager
    v-if="showDocumentManager && selectedGroup"
    :group="selectedGroup"
    :requiresDocuments="groupRequiresDocuments(selectedGroup)"
    @close="closeDocumentManager"
    @document-updated="handleDocumentUpdated"
  />
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
import MemberDocumentManager from '@/components/members/MemberDocumentManager.vue'
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
  },
  pendingGroups: {
    type: Array,
    required: true,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:open', 'find-group', 'create-group', 'view-group', 'refresh-groups', 'join-group', 'review-documents', 'navigate-to-group'])

// Computed property for two-way binding of open state
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Computed property to check if we're in development mode
const isDevelopment = computed(() => {
  // Check if we're in development mode
  // This is a safer way to check than using import.meta.env.DEV directly in the template
  return process.env.NODE_ENV === 'development';
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
      console.log(`Including group with pending membership.status in Pending Groups: ${group.name}`);
      console.log(`Group membership details:`, {
        name: group.name,
        status: group.membership.status,
        invitation_accepted: group.membership.invitation_accepted,
        isInvitation: group.isInvitation,
        document_file_url: group.membership.document_file_url,
        document_file_name: group.membership.document_file_name,
        hasDocuments: hasDocuments(group)
      });
      
      // Log whether this is waiting for admin approval or user acceptance
      if (isWaitingForAdminApproval(group)) {
        console.log(`Group ${group.name} is waiting for admin approval`);
      } else {
        console.log(`Group ${group.name} is waiting for user acceptance`);
      }
      
      return true;
    }
    
    // Legacy checks for backward compatibility
    if (group.membership_status === 'pending') {
      console.log(`Including group with pending membership_status in Pending Groups: ${group.name}`);
      return true;
    }
    
    if (group.status === 'pending') {
      console.log(`Including group with pending status in Pending Groups: ${group.name}`);
      return true;
    }
    
    return false;
  });
})

// Function to check for documents via API for all pending groups
const checkDocumentsForPendingGroups = async () => {
  console.log('Checking documents for all pending groups');
  
  if (!pendingGroups.value || pendingGroups.value.length === 0) {
    console.log('No pending groups to check');
    return;
  }
  
  for (const group of pendingGroups.value) {
    console.log(`Checking documents for group ${group.name} (${group.id})`);
    
    try {
      const response = await axios.get(`/groups/${group.id}/members/documents`);
      console.log(`API documents response for group ${group.name}:`, response.data);
      
      // If we have documents from the API, update the group membership
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log(`Documents found via API call for group ${group.name}`);
        
        // If the group doesn't have a membership object, create one
        if (!group.membership) {
          group.membership = {
            status: 'pending',
            invitation_accepted: true
          };
        }
        
        // Update the document fields in the membership
        const doc = response.data[0];
        group.membership.document_file_url = doc.document_file_url || doc.url;
        group.membership.document_file_name = doc.document_file_name || doc.filename || doc.name;
        group.membership.document_file_type = doc.document_file_type || doc.type;
        group.membership.document_file_size = doc.document_file_size || doc.size;
        group.membership.document_uploaded_at = doc.document_uploaded_at || doc.uploaded_at;
        
        console.log(`Updated group ${group.name} membership with document information:`, group.membership);
      } else {
        console.log(`No documents found via API call for group ${group.name}`);
      }
    } catch (error) {
      console.error(`Error checking for documents via API for group ${group.name}:`, error);
    }
  }
}

// Function to check for documents for a specific group by name
const checkDocumentsForGroupByName = async (groupName) => {
  console.log(`Checking documents for group with name: ${groupName}`);
  
  // Find the group with the specified name
  const group = props.groups.find(g => g.name === groupName);
  
  if (!group) {
    console.log(`Group with name ${groupName} not found`);
    return;
  }
  
  console.log(`Found group with name ${groupName}:`, group);
  
  try {
    const response = await axios.get(`/groups/${group.id}/members/documents`);
    console.log(`API documents response for group ${group.name}:`, response.data);
    
    // If we have documents from the API, update the group membership
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log(`Documents found via API call for group ${group.name}`);
      
      // If the group doesn't have a membership object, create one
      if (!group.membership) {
        group.membership = {
          status: 'pending',
          invitation_accepted: true
        };
      }
      
      // Update the document fields in the membership
      const doc = response.data[0];
      group.membership.document_file_url = doc.document_file_url || doc.url;
      group.membership.document_file_name = doc.document_file_name || doc.filename || doc.name;
      group.membership.document_file_type = doc.document_file_type || doc.type;
      group.membership.document_file_size = doc.document_file_size || doc.size;
      group.membership.document_uploaded_at = doc.document_uploaded_at || doc.uploaded_at;
      
      console.log(`Updated group ${group.name} membership with document information:`, group.membership);
      console.log(`Group ${group.name} has documents: ${hasDocuments(group)}`);
      console.log(`Group ${group.name} is waiting for admin approval: ${isWaitingForAdminApproval(group)}`);
      
      // Force a refresh of the component
      emit('refresh-groups');
    } else {
      console.log(`No documents found via API call for group ${group.name}`);
    }
  } catch (error) {
    console.error(`Error checking for documents via API for group ${group.name}:`, error);
  }
}

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
  
  // Force refresh the groups list when the component is mounted
  emit('refresh-groups');
  
  // Check for documents for all pending groups after a short delay
  // to ensure the groups list has been loaded
  setTimeout(() => {
    checkDocumentsForPendingGroups();
    
    // If you know the name of Alice's group, you can check it directly
    // Replace "Alice's Group" with the actual name of the group
    // checkDocumentsForGroupByName("Alice's Group");
  }, 1000);
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
  
  // Check for documents for all pending groups after groups are updated
  setTimeout(() => {
    checkDocumentsForPendingGroups();
  }, 500);
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
      invitationAccepted: group.membership?.invitation_accepted,
      document_file_url: group.membership?.document_file_url,
      hasDocuments: hasDocuments(group)
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
  // Use the new document manager instead
  manageDocuments(group);
}

// Helper function to check if a group is waiting for admin approval
const isWaitingForAdminApproval = (group) => {
  // Log for debugging
  console.log(`Checking if group ${group.name} is waiting for admin approval`);
  
  // Check if the group has a membership with pending status
  if (!group.membership || group.membership.status !== 'pending') {
    console.log(`Group ${group.name} has no membership or status is not pending`);
    return false;
  }
  
  // If this is an invitation (isInvitation is true or undefined) and it hasn't been accepted yet,
  // then it's not waiting for admin approval - it's waiting for user acceptance
  if ((group.isInvitation === true || group.isInvitation === undefined) && 
      group.membership.invitation_accepted !== true && 
      !hasDocuments(group)) {
    console.log(`Group ${group.name} is an invitation that hasn't been accepted yet`);
    return false;
  }
  
  // If this is a join request (isInvitation is explicitly false), it's waiting for admin approval
  if (group.isInvitation === false) {
    console.log(`Group ${group.name} is a join request waiting for admin approval`);
    return true;
  }
  
  // If the invitation has been explicitly accepted, it's waiting for admin approval
  if (group.membership.invitation_accepted === true) {
    console.log(`Group ${group.name} has invitation_accepted=true, waiting for admin approval`);
    return true;
  }
  
  // If the user has uploaded documents, it's waiting for admin approval
  if (hasDocuments(group)) {
    console.log(`Group ${group.name} has documents, waiting for admin approval`);
    return true;
  }
  
  // If none of the above conditions are met, it's not waiting for admin approval
  console.log(`Group ${group.name} is not waiting for admin approval`);
  return false;
}

// Add state for document manager
const showDocumentManager = ref(false)
const selectedGroup = ref(null)

// Helper function to check if a group has documents
const hasDocuments = (group) => {
  // Log for debugging
  console.log('Checking if group has documents:', group.name);
  
  try {
    // Check if the group has a membership with document fields
    if (group.membership) {
      // Direct check for document_file_url field (most reliable)
      if (group.membership.document_file_url) {
        console.log(`Group ${group.name} has document_file_url:`, group.membership.document_file_url);
        return true;
      }
      
      // Check for other document URL fields (camelCase, PascalCase)
      const hasDocumentUrl = !!(
        group.membership.DocumentFileURL || 
        group.membership.documentFileURL ||
        group.membership.document_url ||
        group.membership.documentUrl
      );
      
      if (hasDocumentUrl) {
        console.log(`Group ${group.name} has document URL field`);
        return true;
      }
      
      // Check for DocumentsSubmitted field (from group package)
      if (group.membership.DocumentsSubmitted || group.membership.documents_submitted) {
        const docsField = group.membership.DocumentsSubmitted || group.membership.documents_submitted;
        console.log(`Group ${group.name} has DocumentsSubmitted field:`, docsField);
        
        // If it's a string, check if it's not empty JSON and try to parse it
        if (typeof docsField === 'string') {
          // Skip empty arrays or objects
          if (docsField === '[]' || docsField === '{}') {
            console.log(`Group ${group.name} has empty DocumentsSubmitted string`);
            return false;
          }
          
          try {
            const parsed = JSON.parse(docsField);
            // Check if it's a non-empty array or object with url property
            if ((Array.isArray(parsed) && parsed.length > 0) || 
                (typeof parsed === 'object' && parsed !== null && parsed.url)) {
              console.log(`Group ${group.name} has valid documents in DocumentsSubmitted`);
              return true;
            }
            return false;
          } catch (e) {
            console.error('Error parsing DocumentsSubmitted:', e);
            // If we can't parse it but it's not empty, assume it contains a document
            if (docsField && docsField !== '{}' && docsField !== '[]') {
              console.log(`Group ${group.name} has non-empty DocumentsSubmitted that couldn't be parsed`);
              return true;
            }
            return false;
          }
        }
        // If it's already an object or array
        else if (typeof docsField === 'object' && docsField !== null) {
          // If it's an array with items
          if (Array.isArray(docsField) && docsField.length > 0) {
            console.log(`Group ${group.name} has DocumentsSubmitted array with items`);
            return true;
          }
          // If it's an object with a url property
          else if (docsField.url) {
            console.log(`Group ${group.name} has DocumentsSubmitted object with url`);
            return true;
          }
        }
      }
      
      // Check for documents_submitted field (legacy)
      if (group.membership.documents_submitted) {
        // If it's a string, check if it's not empty JSON and try to parse it
        if (typeof group.membership.documents_submitted === 'string') {
          // Skip empty arrays or objects
          if (group.membership.documents_submitted === '[]' || 
              group.membership.documents_submitted === '{}') {
            console.log(`Group ${group.name} has empty documents_submitted string`);
            return false;
          }
          
          try {
            const parsed = JSON.parse(group.membership.documents_submitted);
            // Check if it's a non-empty array
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
              console.log(`Group ${group.name} has valid documents in documents_submitted`);
              return true;
            }
            return false;
          } catch (e) {
            console.error('Error parsing documents_submitted:', e);
            return false;
          }
        }
        // If it's already an array, check if it has items with URLs
        else if (Array.isArray(group.membership.documents_submitted) && 
                group.membership.documents_submitted.length > 0 &&
                group.membership.documents_submitted[0].url) {
          console.log(`Group ${group.name} has documents_submitted array with URLs`);
          return true;
        }
      }
      
      // Check for documents field (another possible format)
      if (group.membership.documents) {
        // If it's a string, check if it's not empty JSON and try to parse it
        if (typeof group.membership.documents === 'string') {
          // Skip empty arrays or objects
          if (group.membership.documents === '[]' || 
              group.membership.documents === '{}') {
            console.log(`Group ${group.name} has empty documents string`);
            return false;
          }
          
          try {
            const parsed = JSON.parse(group.membership.documents);
            // Check if it's a non-empty array
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
              console.log(`Group ${group.name} has valid documents in documents field`);
              return true;
            }
            return false;
          } catch (e) {
            console.error('Error parsing documents field:', e);
            return false;
          }
        }
        // If it's already an array, check if it has items with URLs
        else if (Array.isArray(group.membership.documents) && 
                group.membership.documents.length > 0 &&
                group.membership.documents[0].url) {
          console.log(`Group ${group.name} has documents array with URLs`);
          return true;
        }
      }
      
      // Check for document_file_name with document_file_url
      if (group.membership.document_file_name && group.membership.document_file_url) {
        console.log(`Group ${group.name} has document_file_name and document_file_url`);
        return true;
      }
      
      // Check for documentFileName with documentFileURL (camelCase)
      if (group.membership.documentFileName && group.membership.documentFileURL) {
        console.log(`Group ${group.name} has documentFileName and documentFileURL`);
        return true;
      }
      
      // Check for DocumentFileName with DocumentFileURL (PascalCase)
      if (group.membership.DocumentFileName && group.membership.DocumentFileURL) {
        console.log(`Group ${group.name} has DocumentFileName and DocumentFileURL`);
        return true;
      }
      
      // REMOVED: The assumption that invitation_accepted=true means documents exist
    }
    
    // Check if the group itself has document URL fields
    const hasDirectDocumentUrl = !!(
      group.DocumentFileURL || 
      group.document_file_url || 
      group.documentFileURL ||
      group.document_url ||
      group.documentUrl
    );
    
    if (hasDirectDocumentUrl) {
      console.log(`Group ${group.name} has direct document URL field`);
      return true;
    }
    
    // Check for documents field on the group itself
    if (group.documents) {
      // If it's a string, check if it's not empty JSON and try to parse it
      if (typeof group.documents === 'string') {
        // Skip empty arrays or objects
        if (group.documents === '[]' || group.documents === '{}') {
          console.log(`Group ${group.name} has empty documents string directly`);
          return false;
        }
        
        try {
          const parsed = JSON.parse(group.documents);
          // Check if it's a non-empty array
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
            console.log(`Group ${group.name} has valid documents directly`);
            return true;
          }
          return false;
        } catch (e) {
          console.error('Error parsing direct documents field:', e);
          return false;
        }
      }
      // If it's already an array, check if it has items with URLs
      else if (Array.isArray(group.documents) && 
              group.documents.length > 0 &&
              group.documents[0].url) {
        console.log(`Group ${group.name} has documents array directly with URLs`);
        return true;
      }
    }
    
    // If we've checked everything and found no documents, return false
    console.log(`Group ${group.name} has no documents`);
    return false;
  } catch (error) {
    console.error('Error in hasDocuments function:', error);
    return false;
  }
}

// Helper function to check if a group requires documents
const groupRequiresDocuments = (group) => {
  // Check both camelCase and snake_case versions of the flag
  if (group.requiresDocuments === true || group.requires_documents === true) {
    console.log(`Group ${group.name} requires documents (flag)`);
    return true;
  }
  
  // Check for required documents array
  const documents = group.requiredDocuments || group.required_documents;
  
  if (documents) {
    // If it's a string (JSON), parse it
    if (typeof documents === 'string') {
      try {
        const parsedDocs = JSON.parse(documents);
        if (Array.isArray(parsedDocs) && parsedDocs.length > 0) {
          console.log(`Group ${group.name} requires documents (parsed array)`);
          return true;
        }
      } catch (e) {
        console.error('Error parsing required documents:', e);
      }
    } 
    // If it's already an array
    else if (Array.isArray(documents) && documents.length > 0) {
      console.log(`Group ${group.name} requires documents (array)`);
      return true;
    }
  }
  
  console.log(`Group ${group.name} does not require documents`);
  return false;
}

// Open the document manager for a group
const manageDocuments = async (group) => {
  console.log('Opening document manager for group:', group.name);
  console.log('Group ID:', group.id);
  console.log('Group membership status:', group.membership?.status);
  
  // Check if the group has documents
  const hasDocsResult = hasDocuments(group);
  console.log('Group has documents (from local check):', hasDocsResult);
  
  // Check if the group requires documents
  const requiresDocuments = groupRequiresDocuments(group);
  console.log('Group requires documents:', requiresDocuments);
  
  // If the group doesn't require documents and doesn't have documents, don't proceed
  if (!requiresDocuments && !hasDocsResult) {
    console.log(`Group ${group.name} doesn't require documents and doesn't have any, not opening document manager`);
    return;
  }
  
  // Document fields in membership
  if (group.membership) {
    console.log('Document fields in membership:');
    console.log('- document_file_url:', group.membership.document_file_url);
    console.log('- document_file_name:', group.membership.document_file_name);
    console.log('- documents_submitted:', group.membership.documents_submitted);
    console.log('- DocumentsSubmitted:', group.membership.DocumentsSubmitted);
    console.log('- membership status:', group.membership.status);
  } else {
    console.log('No membership object found');
  }
  
  // Make a direct API call to check for documents
  try {
    console.log(`Making API call to /groups/${group.id}/members/documents`);
    const response = await axios.get(`/groups/${group.id}/members/documents`);
    console.log('API documents response status:', response.status);
    console.log('API documents response data:', response.data);
    
    // If we have documents from the API, update the group membership
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log('Documents found via API call');
      
      // If the group doesn't have a membership object, create one
      if (!group.membership) {
        group.membership = {
          // For approved groups in "Your Groups" section, set status to approved
          status: activeGroups.value.includes(group) ? 'approved' : 'pending'
        };
      }
      
      // Update the document fields in the membership
      const doc = response.data[0];
      group.membership.document_file_url = doc.document_file_url || doc.url;
      group.membership.document_file_name = doc.document_file_name || doc.filename || doc.name;
      group.membership.document_file_type = doc.document_file_type || doc.type;
      group.membership.document_file_size = doc.document_file_size || doc.size;
      group.membership.document_uploaded_at = doc.document_uploaded_at || doc.uploaded_at;
      
      console.log('Updated group membership with document information');
    } else {
      console.log('No documents found via API call (empty response or empty array)');
    }
  } catch (error) {
    console.error('Error checking for documents via API:', error);
    
    if (error.response) {
      console.log('API error status:', error.response.status);
      console.log('API error data:', error.response.data);
      
      if (error.response.status === 404) {
        console.log('404 error: Documents endpoint not found or no documents exist for this user in this group');
      }
    } else if (error.request) {
      console.log('No response received from server');
    } else {
      console.log('Error setting up request:', error.message);
    }
    // Continue with the local data if the API call fails
  }
  
  // Close the dashboard sidebar
  isOpen.value = false;
  
  // Set the selected group and show the document manager
  selectedGroup.value = group;
  // Store whether the group requires documents
  selectedGroup.value.requiresDocuments = requiresDocuments;
  showDocumentManager.value = true;
}

// Close the document manager
const closeDocumentManager = () => {
  showDocumentManager.value = false;
  selectedGroup.value = null;
}

// Handle document updated event
const handleDocumentUpdated = (document) => {
  console.log('Document updated:', document);
  
  // Refresh the groups list to reflect the updated document
  emit('refresh-groups');
}
</script> 