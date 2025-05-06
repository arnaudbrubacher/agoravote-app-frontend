<template>
  <Sidebar>
    <SidebarHeader class="p-2 border-b">
    
       <div
         v-if="props.isAuthenticated"
         class="flex items-center cursor-pointer p-2 rounded-md hover:bg-accent"
         @click="() => router.push('/profile')"
       >
         <div class="flex-shrink-0 mr-3">
           <div v-if="!props.profilePictureUrl" class="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
             <User class="h-5 w-5 text-muted-foreground" />
           </div>
           <img
             v-else
             :src="props.profilePictureUrl"
             alt="User Profile Picture"
             class="w-8 h-8 rounded-full object-cover border"
           />
         </div>
         <span class="text-sm font-medium truncate">{{ props.userData?.name || 'User' }}</span>
       </div>
       <div v-if="props.isAuthenticated" class="mt-2 space-y-1 px-2">
          <Button variant="ghost" size="sm" class="w-full justify-start" @click="goToSettings">
            <Settings class="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="ghost" size="sm" class="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50" @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
       <div v-else class="p-2">
          <Button variant="outline" size="sm" class="w-full" @click="() => router.push('/auth')">
             <LogIn class="mr-2 h-4 w-4" /> Log In
          </Button>
        </div>
    </SidebarHeader>
    <SidebarContent class="p-0">
      <!-- Group Actions -->
      <SidebarGroup class="p-4">
        <SidebarGroupLabel class="sr-only">Actions</SidebarGroupLabel> <!-- Screen reader only label -->
        <SidebarGroupContent class="space-y-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton @click="$emit('find-group')" class="w-full justify-start border">
                <Search class="h-4 w-4 mr-2" />
                <span>Find Group</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton @click="$emit('create-group')" class="w-full justify-start border">
                <Plus class="h-4 w-4 mr-2" />
                <span>Create Group</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator />

      <!-- Email Invitations Section (Collapsible) -->
       <Collapsible defaultOpen>
         <SidebarGroup class="p-4 pt-0 pb-0"> <!-- Reduced bottom padding -->
           <CollapsibleTrigger asChild>
             <Button variant="ghost" class="w-full flex justify-between items-center px-2 py-1 text-sm font-medium hover:bg-accent/50 group">
               <span>Email Invitations ({{ pendingEmailInvites.length }})</span>
               <ChevronDown class="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0" />
             </Button>
           </CollapsibleTrigger>
           <CollapsibleContent class="overflow-hidden">
             <SidebarGroupContent class="mt-2 space-y-2">
               <!-- Loading/Empty/List -->
               <div v-if="isLoadingEmailInvites" class="text-center py-4">
                 <Loader2 class="h-5 w-5 animate-spin inline-block" />
                 <span class="ml-2 text-xs text-muted-foreground">Loading...</span>
               </div>
               <p v-else-if="pendingEmailInvites.length === 0" class="px-2 py-2 text-xs text-muted-foreground">
                 No pending email invitations.
               </p>
               <div v-else class="space-y-2">
                 <GroupCard
                   v-for="invite in pendingEmailInvites"
                   :key="invite.token"
                   :group="{ id: invite.group_id, name: invite.group_name, picture: invite.group_picture_url, description: 'Invited to join' }" 
                   :clickable="false" 
                   :show-private-badge="false" 
                   :show-actions="true" 
                   class="py-2 px-2 border-0 shadow-none hover:bg-accent/80 rounded-md"
                 >
                    <template #actions>
                      <div class="flex space-x-1">
                        <Button
                          variant="outline"
                          size="xs"
                          @click.stop="declineEmailInvite(invite)"
                        >
                          Decline
                        </Button>
                        <Button
                          variant="default"
                          size="xs"
                          @click.stop="acceptEmailInvite(invite)"
                        >
                          Accept
                        </Button>
                      </div>
                    </template>
                 </GroupCard>
               </div>
             </SidebarGroupContent>
           </CollapsibleContent>
         </SidebarGroup>
       </Collapsible>

      <SidebarSeparator />

      <!-- Pending Admissions Section (Collapsible) -->
       <Collapsible defaultOpen>
         <SidebarGroup class="p-4 pt-0 pb-0"> <!-- Reduced bottom padding -->
           <CollapsibleTrigger asChild>
             <Button variant="ghost" class="w-full flex justify-between items-center px-2 py-1 text-sm font-medium hover:bg-accent/50 group">
               <span>Pending Admissions ({{ pendingGroups.length }})</span>
               <ChevronDown class="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0" />
             </Button>
           </CollapsibleTrigger>
           <CollapsibleContent class="overflow-hidden">
             <SidebarGroupContent class="mt-2 space-y-2">
               <!-- Loading/Empty/List -->
                <div v-if="isLoading" class="text-center py-4">
                  <Loader2 class="h-5 w-5 animate-spin inline-block" />
                  <span class="ml-2 text-xs text-muted-foreground">Loading...</span>
                </div>
               <p v-else-if="pendingGroups.length === 0" class="px-2 py-2 text-xs text-muted-foreground">
                 No groups awaiting admission.
               </p>
               <div v-else class="space-y-2">
                 <GroupCard
                   v-for="group in pendingGroups"
                   :key="group.id"
                   :group="group"
                   :clickable="false" 
                   :show-private-badge="false" 
                   :show-actions="true" 
                   class="py-2 px-2 border-0 shadow-none hover:bg-accent/80 rounded-md"
                 >
                   <template #top-right-actions>
                      <span v-if="isWaitingForAdminApproval(group)" class="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded-full leading-none">
                        {{ group.isInvitation === false ? 'Join Req. Pending' : 'Awaiting Admin' }}
                      </span>
                      <span v-else-if="(group.isInvitation === true || group.isInvitation === undefined) && group.membership && group.membership.status === 'pending' && group.membership.invitation_accepted !== true" class="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded-full leading-none">
                        Invitation
                      </span>
                   </template>
                   <template #actions>
                     <div class="flex space-x-1">
                        <Button
                          variant="outline"
                          size="xs"
                          @click.stop="cancelPendingGroup(group)"
                        >
                          Cancel
                        </Button>
                        <Button
                          v-if="hasDocuments(group)"
                          variant="secondary" 
                          size="xs"
                          @click.stop="manageDocuments(group)"
                        >
                          Review Docs
                        </Button>
                        <Button
                          v-else-if="!isWaitingForAdminApproval(group) && !group.membership?.invitation_accepted"
                          variant="default"
                          size="xs"
                          @click.stop="acceptPendingGroup(group)"
                        >
                          Accept
                        </Button>
                      </div>
                   </template>
                 </GroupCard>
               </div>
             </SidebarGroupContent>
           </CollapsibleContent>
         </SidebarGroup>
       </Collapsible>

      <SidebarSeparator />

      <!-- Your Groups Section (Collapsible) -->
       <Collapsible defaultOpen>
         <SidebarGroup class="p-4 pt-0 pb-0"> <!-- Reduced bottom padding -->
           <CollapsibleTrigger asChild>
             <Button variant="ghost" class="w-full flex justify-between items-center px-2 py-1 text-sm font-medium hover:bg-accent/50 group">
               <span>Your Groups ({{ activeGroups.length }})</span>
               <ChevronDown class="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0" />
             </Button>
           </CollapsibleTrigger>
           <CollapsibleContent class="overflow-hidden">
             <SidebarGroupContent class="mt-2 space-y-2">
                <!-- Loading/Empty/List -->
               <div v-if="isLoading" class="text-center py-4">
                 <Loader2 class="h-5 w-5 animate-spin inline-block" />
                 <span class="ml-2 text-xs text-muted-foreground">Loading...</span>
               </div>
               <p v-else-if="activeGroups.length === 0" class="px-2 py-2 text-xs text-muted-foreground">
                 No groups yet. Find or create one!
               </p>
               <div v-else class="space-y-2">
                 <GroupCard
                   v-for="group in activeGroups"
                   :key="group.id"
                   :group="group"
                   :clickable="true"
                   @click="navigateToGroup(group.id)"
                   :show-private-badge="true" 
                   :show-actions="false" 
                   class="py-2 px-2 border-0 shadow-none hover:bg-accent/80 rounded-md"
                 >
                    <!-- No actions needed here as the card itself is clickable -->
                 </GroupCard>
               </div>
             </SidebarGroupContent>
           </CollapsibleContent>
         </SidebarGroup>
       </Collapsible>

    </SidebarContent>
    <SidebarFooter class="p-4 border-t space-y-2">
       <!-- Close Sidebar Button -->
       <Button variant="ghost" class="w-full justify-start" @click="$emit('close-sidebar')">
         <PanelLeftClose class="mr-2 h-4 w-4" />
         Close Sidebar
       </Button>
       <div class="text-xs text-center text-muted-foreground">
         AgoraVote v0.1.0
       </div>
    </SidebarFooter>
  </Sidebar>

  <!-- Member Document Manager Dialog (Remains the same) -->
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
import { useRouter } from 'vue-router'
import {
  Search,
  Plus,
  Loader2,
  Check,
  X,
  FileText, // Using FileText for Review Docs
  User,
  LogIn,
  Settings,
  LogOut,
  ChevronDown,
  PanelLeftClose
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import GroupCard from '@/components/groups/GroupCard.vue'
import MemberDocumentManager from '@/components/members/MemberDocumentManager.vue'
import axios from '~/src/utils/axios'
import { signOut } from '@/src/utils/auth'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

// Props
const props = defineProps({
  groups: {
    type: Array,
    required: true,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  // Add props for user data needed in the footer
  isAuthenticated: {
      type: Boolean,
      required: true,
  },
  userData: {
      type: Object,
      default: null, // Use null for object types
  },
  profilePictureUrl: {
      type: String,
      default: null,
  },
})

// Emits
const emit = defineEmits([
  'find-group',
  'create-group',
  'refresh-groups',
  'join-group',
  'review-documents',
  'navigate-to-group',
  'process-group-admission',
  'close-sidebar'
])

// Router instance
const router = useRouter()

// New state for email invitations
const pendingEmailInvites = ref([])
const isLoadingEmailInvites = ref(false)

// Computed property to check if we're in development mode
const isDevelopment = computed(() => {
  return process.env.NODE_ENV === 'development';
})

// Filter out pending memberships from the groups list
const activeGroups = computed(() => {
  console.log('Recalculating activeGroups...');
  if (!props.groups || props.groups.length === 0) {
    console.log('No props.groups available.');
    return [];
  }
  console.log('Processing groups for activeGroups:', JSON.parse(JSON.stringify(props.groups)));
  return props.groups.filter(group => {
     const groupName = group.name || group.id;
     // Check primary membership status first
     if (group.membership && (group.membership.status === 'pending' || group.membership.status === 'pending_approval')) {
       console.log(`[ActiveGroups Filter] Excluding ${groupName} (Reason: group.membership.status is '${group.membership.status}')`);
       return false;
     }
     // Legacy checks
     if (group.membership_status === 'pending') {
       console.log(`[ActiveGroups Filter] Excluding ${groupName} (Reason: group.membership_status === 'pending')`);
       return false;
     }
     if (group.status === 'pending') {
       console.log(`[ActiveGroups Filter] Excluding ${groupName} (Reason: group.status === 'pending')`);
       return false;
     }
     console.log(`[ActiveGroups Filter] Including ${groupName}`);
     return true;
  });
})

// Get pending groups from the groups list
const pendingGroups = computed(() => {
  if (!props.groups || props.groups.length === 0) return [];

  const pendingInviteGroupIds = pendingEmailInvites.value.map(invite => invite.group_id);

  return props.groups.filter(group => {
    if (pendingInviteGroupIds.includes(group.id)) {
      console.log(`Excluding group ${group.name} from Pending Groups (already in Email Invites)`);
      return false;
    }
    // Check primary membership status first
    if (group.membership && (group.membership.status === 'pending' || group.membership.status === 'pending_approval')) {
      console.log(`Including group with status '${group.membership.status}' in Pending Groups: ${group.name}`);
      return true;
    }
     // Legacy checks
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

// Function to fetch pending email invitations
const fetchPendingEmailInvites = async () => {
  isLoadingEmailInvites.value = true;
  try {
    const response = await axios.get('/user/group-invitations');
    pendingEmailInvites.value = response.data || [];
    console.log('Fetched pending email invites:', pendingEmailInvites.value);
  } catch (error) {
    console.error('Failed to fetch pending email invitations:', error);
    pendingEmailInvites.value = [];
  } finally {
    isLoadingEmailInvites.value = false;
  }
}

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
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log(`Documents found via API call for group ${group.name}`);
        if (!group.membership) {
          group.membership = { status: 'pending', invitation_accepted: true };
        }
        const doc = response.data[0];
        group.membership.document_file_url = doc.document_file_url || doc.url;
        group.membership.document_file_name = doc.document_file_name || doc.filename || doc.name;
        // Add other fields if needed
        console.log(`Updated group ${group.name} membership with document information:`, group.membership);
      } else {
        console.log(`No documents found via API call for group ${group.name}`);
      }
    } catch (error) {
      console.error(`Error checking for documents via API for group ${group.name}:`, error);
    }
  }
}


// Listen for the user-left-group event
const handleUserLeftGroup = (event) => {
  console.log('User left group event received in AppSidebar:', event.detail)
  emit('refresh-groups')
}

// Handle the close-dashboard-sidebar event (No longer needed for Sheet)
// const handleCloseDashboardSidebar = () => {
//   isOpen.value = false
// }

// Handle the group-data-updated event
const handleGroupDataUpdated = () => {
  console.log('Group data updated event received in AppSidebar')
  emit('refresh-groups')
}

// Helper function to format group picture URLs
const formatGroupPictureUrl = (url) => {
  if (!url) return '/default-group-icon.png'; // Provide a default icon path
  if (url.startsWith('http') || url.startsWith('/')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  return `${baseUrl}/${url}`;
};


// Set up event listeners
onMounted(() => {
  window.addEventListener('user-left-group', handleUserLeftGroup)
  // window.addEventListener('close-dashboard-sidebar', handleCloseDashboardSidebar) // Not needed
  window.addEventListener('group-data-updated', handleGroupDataUpdated)
  fetchPendingEmailInvites();
  console.log('AppSidebar - All groups:', props.groups)
  console.log('AppSidebar - Active groups:', activeGroups.value)
  emit('refresh-groups'); // Initial refresh
  setTimeout(() => {
    checkDocumentsForPendingGroups();
  }, 1000);
})

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('user-left-group', handleUserLeftGroup)
  // window.removeEventListener('close-dashboard-sidebar', handleCloseDashboardSidebar) // Not needed
  window.removeEventListener('group-data-updated', handleGroupDataUpdated)
})

// Watch for changes in the groups prop
watch(() => props.groups, (newGroups) => {
  console.log('AppSidebar - Groups updated:', newGroups)
  console.log('AppSidebar - Active groups after update:', activeGroups.value)
  fetchPendingEmailInvites(); // Refresh invites on group change
  setTimeout(() => {
    checkDocumentsForPendingGroups();
  }, 500);
})

// Accept a pending group membership
const acceptPendingGroup = async (group) => {
  try {
    console.log('Accepting pending group membership for:', group.name);
    const requiresPassword = group.requiresPassword === true || group.requires_password === true;
    let requiresDocuments = false;
    const documents = group.requiredDocuments || group.required_documents;
    if (documents) {
      if (typeof documents === 'string') { try { const parsedDocs = JSON.parse(documents); requiresDocuments = Array.isArray(parsedDocs) && parsedDocs.length > 0; } catch (e) { console.error('Error parsing required documents:', e); } }
      else if (Array.isArray(documents)) { requiresDocuments = documents.length > 0; }
    }
    const hasRequiresDocumentsFlag = group.requiresDocuments === true || group.requires_documents === true;
    const requiresAdminApproval = group.requiresAdminApproval === true || group.requires_admin_approval === true;

    if (requiresPassword || (hasRequiresDocumentsFlag && requiresDocuments) || requiresAdminApproval) {
      console.log('Group requires password, documents, or admin approval, using join-group flow');
      emit('join-group', group.id, true);
      return;
    }

    const response = await axios.post(`/groups/${group.id}/accept`);
    console.log('Acceptance response:', response.data);
    const status = response.data?.status || 'pending';
    if (group.membership) {
      group.membership.invitation_accepted = true;
      if (status === 'approved') group.membership.status = 'approved';
    } else {
      group.membership = { invitation_accepted: true, status: status };
    }
    alert(response.data?.message || `You have successfully joined ${group.name || 'the group'}`);
    emit('refresh-groups');
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
  if (!confirm(`Are you sure you want to cancel your pending membership for ${group.name || 'this group'}?`)) return;
  try {
    await axios.post(`/groups/${group.id}/decline`);
    emit('refresh-groups');
  } catch (error) {
    console.error('Failed to cancel group membership:', error);
    alert('Failed to cancel group membership: ' + (error.response?.data?.error || 'Unknown error'));
  }
}

// Helper function to check if a group is waiting for admin approval
const isWaitingForAdminApproval = (group) => {
  if (!group.membership || group.membership.status !== 'pending') return false;
  if ((group.isInvitation === true || group.isInvitation === undefined) && group.membership.invitation_accepted !== true && !hasDocuments(group)) return false;
  if (group.isInvitation === false) return true;
  if (group.membership.invitation_accepted === true) return true;
  if (hasDocuments(group)) return true;
  return false;
}

// Add state for document manager
const showDocumentManager = ref(false)
const selectedGroup = ref(null)

// Helper function to check if a group has documents
const hasDocuments = (group) => {
  try {
    if (group.membership) {
      if (group.membership.document_file_url) return true;
      if (!!(group.membership.DocumentFileURL || group.membership.documentFileURL || group.membership.document_url || group.membership.documentUrl)) return true;
      if (group.membership.DocumentsSubmitted || group.membership.documents_submitted) {
        const docsField = group.membership.DocumentsSubmitted || group.membership.documents_submitted;
        if (typeof docsField === 'string') {
          if (docsField === '[]' || docsField === '{}') return false;
          try { const parsed = JSON.parse(docsField); return (Array.isArray(parsed) && parsed.length > 0) || (typeof parsed === 'object' && parsed !== null && parsed.url); } catch (e) { if (docsField && docsField !== '{}' && docsField !== '[]') return true; return false; }
        } else if (typeof docsField === 'object' && docsField !== null) {
          return (Array.isArray(docsField) && docsField.length > 0) || !!docsField.url;
        }
      }
      if (group.membership.documents) {
        if (typeof group.membership.documents === 'string') {
           if (group.membership.documents === '[]' || group.membership.documents === '{}') return false;
           try { const parsed = JSON.parse(group.membership.documents); return Array.isArray(parsed) && parsed.length > 0 && parsed[0].url; } catch (e) { return false; }
        } else if (Array.isArray(group.membership.documents) && group.membership.documents.length > 0 && group.membership.documents[0].url) return true;
      }
      if (group.membership.document_file_name && group.membership.document_file_url) return true;
      if (group.membership.documentFileName && group.membership.documentFileURL) return true;
      if (group.membership.DocumentFileName && group.membership.DocumentFileURL) return true;
    }
    if (!!(group.DocumentFileURL || group.document_file_url || group.documentFileURL || group.document_url || group.documentUrl)) return true;
    if (group.documents) {
      if (typeof group.documents === 'string') {
        if (group.documents === '[]' || group.documents === '{}') return false;
        try { const parsed = JSON.parse(group.documents); return Array.isArray(parsed) && parsed.length > 0 && parsed[0].url; } catch (e) { return false; }
      } else if (Array.isArray(group.documents) && group.documents.length > 0 && group.documents[0].url) return true;
    }
    return false;
  } catch (error) { console.error('Error in hasDocuments function:', error); return false; }
}

// Helper function to check if a group requires documents
const groupRequiresDocuments = (group) => {
  if (group.requiresDocuments === true || group.requires_documents === true) return true;
  const documents = group.requiredDocuments || group.required_documents;
  if (documents) {
    if (typeof documents === 'string') { try { const parsedDocs = JSON.parse(documents); return Array.isArray(parsedDocs) && parsedDocs.length > 0; } catch (e) { console.error('Error parsing required documents:', e); } }
    else if (Array.isArray(documents) && documents.length > 0) return true;
  }
  return false;
}

// Open the document manager for a group
const manageDocuments = async (group) => {
  console.log('Opening document manager for group:', group.name);
  const requiresDocumentsFlag = groupRequiresDocuments(group);
  // API check can be added here if needed, but rely on local data first
  // try { ... await axios.get(...) ... } catch { ... }
  
  // Emit 'review-documents' instead of opening dialog directly?
  // OR keep dialog logic here. Let's keep it here for now.
  selectedGroup.value = { ...group, requiresDocuments: requiresDocumentsFlag };
  showDocumentManager.value = true;
  // No need to close sidebar, it's not a sheet anymore
  // isOpen.value = false;
}

// Close the document manager
const closeDocumentManager = () => {
  showDocumentManager.value = false;
  selectedGroup.value = null;
}

// Handle document updated event
const handleDocumentUpdated = (document) => {
  console.log('Document updated:', document);
  emit('refresh-groups'); // Refresh list to show changes
}

// Navigate to group page
const navigateToGroup = (groupId) => {
  if (!groupId) { console.error('Cannot navigate: groupId is missing'); return; }
  console.log(`Navigating to group page with ID: ${groupId}`);
  // No need to close sidebar explicitly, navigation will happen
  emit('navigate-to-group', groupId); // Emit to parent layout
}

// Initiate the acceptance process for an email invitation
const acceptEmailInvite = async (invite) => {
  console.log('Initiating acceptance for email invite:', invite.group_name, 'Token:', invite.token);
  try {
    const response = await axios.get(`/groups/${invite.group_id}?invitation_token=${invite.token}`);
    const group = response.data;
    console.log('Fetched group details for invitation:', group);
    const requiresPassword = group.requiresPassword === true || group.requires_password === true;
    const documentsRequired = group.documents_are_required === true; // Check backend field

    if (requiresPassword || documentsRequired) {
      console.log('Requirements detected, emitting process-group-admission.');
      emit('process-group-admission', { group, invitationToken: invite.token });
      // No need to close sidebar explicitly
    } else {
      console.log('No password/document requirements, calling /member/accept-invitation directly.');
      const acceptResponse = await axios.post('/member/accept-invitation', { token: invite.token });
      console.log('Direct email invitation acceptance response:', acceptResponse.data);
      alert(`Invitation for ${invite.group_name} accepted successfully!`);
      fetchPendingEmailInvites();
      emit('refresh-groups');
      if (acceptResponse.data.groupId) {
         emit('navigate-to-group', acceptResponse.data.groupId);
      }
    }
  } catch (error) {
    console.error('Failed to process email invitation acceptance:', error);
    alert('Failed to process email invitation: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    fetchPendingEmailInvites();
    emit('refresh-groups');
  }
}

// Decline an email invitation
const declineEmailInvite = async (invite) => {
  if (!confirm(`Are you sure you want to decline the invitation to join ${invite.group_name}?`)) return;
  console.log('Declining email invite for group:', invite.group_name, 'Token:', invite.token);
  try {
    await axios.post('/member/decline-invitation', { token: invite.token });
    alert(`Invitation for ${invite.group_name} declined.`);
    fetchPendingEmailInvites(); // Refresh list
  } catch (error) {
    console.error('Failed to decline email invitation:', error);
    alert('Failed to decline email invitation: ' + (error.response?.data?.error || 'Unknown error'));
    fetchPendingEmailInvites(); // Refresh list even on error
  }
}

// Navigate to settings page
const goToSettings = () => {
  router.push('/usersettings');
};

// Handle user logout
const handleLogout = async () => {
  try {
    await signOut();
    // Redirect to login page or home page after logout
    // Using window.location.href for a full page reload to clear state
    window.location.href = '/auth'; 
  } catch (error) {
    console.error('Logout failed:', error);
    alert('Logout failed. Please try again.');
  }
};
</script>

<style scoped>
/* Add any specific styles for AppSidebar if needed */
/* Minor adjustments for hover actions */
.group .absolute {
  transition: opacity 0.2s ease-in-out;
}
</style> 