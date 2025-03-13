<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container mx-auto flex h-16 items-center px-4">
        <div class="flex w-full items-center justify-between">
          <!-- Last Used Group Card (replaces Dashboard button) -->
          <div 
            v-if="isAuthenticated" 
            class="flex items-center cursor-pointer"
            @click="openDashboardSidebar"
          >
            <div class="flex-shrink-0 mr-2">
              <div v-if="!lastUsedGroup?.picture" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Users class="h-5 w-5 text-gray-600" />
              </div>
              <img 
                v-else
                :src="lastUsedGroup.picture" 
                alt="Group Picture"
                class="w-8 h-8 rounded-full object-cover"
              />
            </div>
            <div>
              <span class="text-sm font-medium truncate max-w-[120px]">{{ lastUsedGroup?.name || 'Groups' }}</span>
            </div>
          </div>
          
          
          <!-- App Title (center) -->
          <h1 class="text-xl font-bold absolute left-1/2 transform -translate-x-1/2">Agora Vote</h1>
          
          <!-- User Card (right) - Only show when authenticated -->
          <div 
            v-if="isAuthenticated" 
            class="flex items-center cursor-pointer"
            @click="openUserSettings"
          >
            <div class="flex-shrink-0 mr-2">
              <div v-if="!profilePictureUrl" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User class="h-5 w-5 text-gray-400" />
              </div>
              <img 
                v-else
                :src="profilePictureUrl" 
                alt="User Profile Picture"
                class="w-8 h-8 rounded-full object-cover border"
              />
            </div>
            <span class="text-sm font-medium">{{ userData?.name || 'User' }}</span>
          </div>
          <div v-else class="w-[120px]"></div> <!-- Spacer when user card is not shown -->
        </div>
      </div>
    </header>
    <main class="container mx-auto py-6 px-4">
      <slot />
    </main>
    <footer class="border-t">
      <div class="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Agora Vote. All rights reserved.</p>
      </div>
    </footer>

    <!-- User Settings Sheet Component -->
    <UserSettingsSheet 
      v-model:open="isUserSettingsOpen" 
      :userData="userData"
      @refresh-user-data="fetchUserData"
    />
    
    <!-- Dashboard Sidebar Component -->
    <DashboardSidebar
      v-model:open="isDashboardSidebarOpen"
      :groups="userGroups"
      :pendingGroups="pendingGroups"
      :isLoading="isLoadingGroups"
      @find-group="showFindGroupDialog = true"
      @create-group="showCreateGroupDialog = true"
      @view-group="navigateToGroup"
      @refresh-groups="fetchUserGroups"
      @join-group="joinGroup"
      @review-documents="handleReviewDocuments"
      @navigate-to-group="navigateToGroup"
    />
    
    <!-- Find Group Dialog -->
    <FindGroupDialog
      v-model:open="showFindGroupDialog"
      :userGroups="userGroups"
      @view-group="navigateToGroup"
      @join-group="joinGroup"
    />
    
    <!-- Group Admission Form -->
    <GroupAdmissionForm
      v-if="showAdmissionForm && selectedGroup"
      :group="selectedGroup"
      :error="admissionError"
      :review-mode="isReviewMode"
      @close="showAdmissionForm = false"
      @submit="handleAdmissionSubmit"
    />
    
    <!-- Create Group Dialog -->
    <NewGroupDialog
      v-if="showCreateGroupDialog"
      @close="showCreateGroupDialog = false"
      @group-created="handleGroupCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Users, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import axios from '~/src/utils/axios'
import UserSettingsSheet from '@/components/users/UserSettingsSheet.vue'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import FindGroupDialog from '@/components/groups/FindGroupDialog.vue'
import GroupAdmissionForm from '@/components/groups/GroupAdmissionForm.vue'
import NewGroupDialog from '@/components/groups/NewGroupDialog.vue'

const router = useRouter()
const route = useRoute()
const userData = ref(null)
const loading = ref(false)
const isUserSettingsOpen = ref(false)
const isDashboardSidebarOpen = ref(false)

// Groups data
const userGroups = ref([])
const isLoadingGroups = ref(false)
const lastUsedGroupId = ref(localStorage.getItem('lastUsedGroupId') || null)

// Computed property for the last used group
const lastUsedGroup = computed(() => {
  if (!lastUsedGroupId.value || userGroups.value.length === 0) {
    return userGroups.value[0] || null // Return first group or null if no groups
  }
  
  // Find the group with the matching ID
  const group = userGroups.value.find(g => g.id === lastUsedGroupId.value)
  
  // Return the found group or the first group as fallback
  return group || userGroups.value[0] || null
})

// Dialog states
const showFindGroupDialog = ref(false)
const showCreateGroupDialog = ref(false)
const showAdmissionForm = ref(false)
const selectedGroup = ref(null)
const admissionError = ref('')
const isReviewMode = ref(false)

// Check if user is authenticated
const isAuthenticated = computed(() => {
  return !!localStorage.getItem('token')
})

// Open user settings sheet
const openUserSettings = () => {
  isUserSettingsOpen.value = true
}

// Open dashboard sidebar
const openDashboardSidebar = () => {
  // Fetch groups if not already loaded
  if (userGroups.value.length === 0 && !isLoadingGroups.value) {
    fetchUserGroups()
  }
  // Toggle the sidebar
  isDashboardSidebarOpen.value = !isDashboardSidebarOpen.value
}

// Navigate to group page
const navigateToGroup = (groupId) => {
  // Store the last used group ID
  lastUsedGroupId.value = groupId
  localStorage.setItem('lastUsedGroupId', groupId)
  
  // Close the sidebar and navigate
  isDashboardSidebarOpen.value = false
  router.push(`/group/${groupId}`)
}

// Handle group created event from NewGroupDialog
const handleGroupCreated = async (newGroup) => {
  // Close dialog
  showCreateGroupDialog.value = false
  
  // Refresh groups
  await fetchUserGroups()
  
  // Navigate to the new group and set as last used
  if (newGroup && newGroup.id) {
    lastUsedGroupId.value = newGroup.id
    localStorage.setItem('lastUsedGroupId', newGroup.id)
    router.push(`/group/${newGroup.id}`)
  }
}

// Join a group
const joinGroup = async (groupId, isInvitation = false) => {
  try {
    // Get the group details
    let group = userGroups.value.find(g => g.id === groupId);
    
    // If the group wasn't found in userGroups, it might be a pending group
    // In that case, we need to set isInvitation to true
    if (!group) {
      console.log('Group not found in userGroups, checking if it is a pending group');
      // Try to find the group in the pendingGroups (groups with pending membership)
      const pendingGroup = userGroups.value.find(g => g.id === groupId && g.membership?.status === 'pending');
      if (pendingGroup) {
        group = pendingGroup;
        isInvitation = true; // Override the isInvitation parameter since this is a pending group
      }
    }
    
    if (!group) {
      console.error('Group not found:', groupId);
      alert('Group not found');
      return;
    }
    
    // Check if the group requires password or documents
    const requiresPassword = group?.requiresPassword === true || group?.requires_password === true;
    
    // More robust check for required documents
    let requiresDocuments = false;
    let requiredDocumentsArray = [];
    
    // Check both camelCase and snake_case versions
    const documents = group?.requiredDocuments || group?.required_documents;
    
    if (documents) {
      // If it's a string (JSON), parse it
      if (typeof documents === 'string') {
        try {
          requiredDocumentsArray = JSON.parse(documents);
          requiresDocuments = Array.isArray(requiredDocumentsArray) && requiredDocumentsArray.length > 0;
        } catch (e) {
          console.error('Error parsing required documents:', e);
        }
      } 
      // If it's already an array
      else if (Array.isArray(documents)) {
        requiredDocumentsArray = documents;
        requiresDocuments = documents.length > 0;
      }
    }
    
    // Also check the requiresDocuments flag
    const hasRequiresDocumentsFlag = group?.requiresDocuments === true || group?.requires_documents === true;
    
    console.log('Group join requirements:', {
      requiresPassword,
      requiresDocuments,
      hasRequiresDocumentsFlag,
      requiredDocumentsArray,
      groupId,
      isInvitation
    });
    
    // Only show the admission form if there are actual requirements
    if ((requiresPassword) || (hasRequiresDocumentsFlag && requiresDocuments)) {
      // Show the admission form
      selectedGroup.value = {
        ...group,
        // Ensure the required documents are properly set
        requiredDocuments: requiredDocumentsArray
      };
      showAdmissionForm.value = true;
      admissionError.value = '';
      
      // Store whether this is an invitation acceptance
      selectedGroup.value.isInvitation = isInvitation;
      
      // Close the dashboard sidebar
      isDashboardSidebarOpen.value = false;
      return;
    }
    
    // If no special requirements, proceed with direct join/accept
    if (isInvitation) {
      // This is an invitation acceptance
      const response = await axios.post(`/groups/${groupId}/accept`);
      console.log('Invitation acceptance response:', response.data);
      
      // Check if the user was immediately approved
      const status = response.data?.status || 'pending';
      
      // Refresh groups after joining
      await fetchUserGroups();
      
      // If the user was immediately approved, navigate to the group
      if (status === 'approved') {
        console.log('User was immediately approved, navigating to group');
        navigateToGroup(groupId);
      } else {
        console.log('Invitation acceptance is pending approval');
        // Dispatch a custom event to refresh the dashboard sidebar
        window.dispatchEvent(new CustomEvent('group-data-updated'));
      }
    } else {
      // This is a regular join
      const response = await axios.post(`/groups/${groupId}/join`);
      console.log('Join response:', response.data);
      
      // Check if the user was immediately approved
      const status = response.data?.status || 'pending';
      
      // Refresh groups after joining
      await fetchUserGroups();
      
      // If the user was immediately approved, navigate to the group
      if (status === 'approved') {
        console.log('User was immediately approved, navigating to group');
        navigateToGroup(groupId);
      } else {
        console.log('Join request is pending approval');
        // Dispatch a custom event to refresh the dashboard sidebar
        window.dispatchEvent(new CustomEvent('group-data-updated'));
      }
    }
  } catch (error) {
    console.error('Failed to join group:', error);
    alert('Failed to join group: ' + (error.response?.data?.error || 'Unknown error'));
  }
}

// Fetch user groups
const fetchUserGroups = async () => {
  if (!isAuthenticated.value) return
  
  try {
    isLoadingGroups.value = true
    const response = await axios.get('/user/groups')
    userGroups.value = response.data
    
    // After fetching groups, check if we need to update the last used group
    if (userGroups.value.length > 0) {
      // Get the last used group ID from localStorage
      const storedLastUsedGroupId = localStorage.getItem('lastUsedGroupId')
      
      // Check if the last used group still exists in the user's groups
      const lastGroupExists = storedLastUsedGroupId && userGroups.value.some(g => g.id === storedLastUsedGroupId)
      
      if (!lastGroupExists) {
        // If the last used group doesn't exist in the current groups, update it to the first available group
        lastUsedGroupId.value = userGroups.value[0].id
        localStorage.setItem('lastUsedGroupId', userGroups.value[0].id)
        
        // If we're currently on the group page of a group that no longer exists in the user's groups,
        // redirect to the profile page
        const currentPath = route.path
        const groupMatch = currentPath.match(/\/group\/([^/]+)/)
        
        if (groupMatch && groupMatch[1] === storedLastUsedGroupId) {
          console.log('User is on a group page they no longer belong to, redirecting to profile')
          router.push('/profile')
        }
      } else {
        // If the last used group still exists, update the lastUsedGroupId ref
        lastUsedGroupId.value = storedLastUsedGroupId
      }
    } else {
      // If the user has no groups, clear the last used group ID
      lastUsedGroupId.value = null
      localStorage.removeItem('lastUsedGroupId')
    }
  } catch (error) {
    console.error('Failed to fetch user groups:', error)
  } finally {
    isLoadingGroups.value = false
  }
}

// Computed property for profile picture URL
const profilePictureUrl = computed(() => {
  if (!userData.value?.profile_picture) return null
  
  // If the profile picture is a full URL, return it as is
  if (userData.value.profile_picture.startsWith('http')) {
    return userData.value.profile_picture
  }
  
  // Otherwise, prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${baseUrl}/${userData.value.profile_picture}`
})

// Fetch user data if authenticated
const fetchUserData = async () => {
  if (isAuthenticated.value) {
    try {
      loading.value = true
      // Use axios instance with proper configuration
      const response = await axios.get('/users/me')
      userData.value = response.data
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      if (error.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        router.push('/auth')
      }
    } finally {
      loading.value = false
    }
  }
}

// Provide user data to child components
provide('appUserData', userData)
provide('refreshAppUserData', fetchUserData)

// Watch for route changes to refresh user data
watch(
  () => route.path,
  () => {
    if (isAuthenticated.value) {
      fetchUserData()
    }
  }
)

// Watch for route changes to update last used group
watch(
  () => route.path,
  (newPath) => {
    // Check if the current route is a group page
    const groupMatch = newPath.match(/\/group\/([^/]+)/)
    if (groupMatch && groupMatch[1]) {
      // Update last used group ID
      lastUsedGroupId.value = groupMatch[1]
      localStorage.setItem('lastUsedGroupId', groupMatch[1])
    }
  }
)

// Handle admission form submission
const handleAdmissionSubmit = async (admissionData) => {
  try {
    // Make sure we have a selected group
    if (!selectedGroup.value) {
      console.error('No group selected for admission');
      return;
    }
    
    // Determine if this is an invitation acceptance or a regular join
    const isInvitation = selectedGroup.value.isInvitation === true;
    
    // Log the admission data being sent
    console.log('Sending admission data:', JSON.stringify(admissionData));
    console.log('Group ID:', selectedGroup.value.id);
    console.log('Is invitation:', isInvitation);
    
    // Ensure we have a valid object to send
    if (!admissionData || Object.keys(admissionData).length === 0) {
      console.error('No admission data provided');
      alert('Please provide the required information');
      return;
    }
    
    // Send the admission data to the server
    let response;
    if (isInvitation) {
      // This is an invitation acceptance
      response = await axios.post(`/groups/${selectedGroup.value.id}/accept`, admissionData);
      
      // Check if the response indicates documents are pending review
      if (response.data && response.data.status === 'pending') {
        alert('Your documents have been submitted for review. You will be notified when your membership is approved.');
        // Dispatch a custom event to refresh the dashboard sidebar
        window.dispatchEvent(new CustomEvent('group-data-updated'));
      } else {
        alert(`You have successfully accepted the invitation to join ${selectedGroup.value.name || 'the group'}`);
      }
    } else {
      // This is a regular join
      response = await axios.post(`/groups/${selectedGroup.value.id}/join`, admissionData);
      
      // Check if the response indicates documents are pending review
      if (response.data && response.data.status === 'pending') {
        alert('Your documents have been submitted for review. You will be notified when your membership is approved.');
        // Dispatch a custom event to refresh the dashboard sidebar
        window.dispatchEvent(new CustomEvent('group-data-updated'));
      } else {
        alert(`You have successfully joined ${selectedGroup.value.name || 'the group'}`);
      }
    }
    
    // Log the response
    console.log('Server response:', response.data);
    
    // Close the admission form
    showAdmissionForm.value = false;
    selectedGroup.value = null;
    isReviewMode.value = false;
    
    // Refresh the groups list
    fetchUserGroups();
  } catch (error) {
    console.error('Failed to submit admission form:', error);
    console.error('Error response:', error.response?.data);
    
    // Check if the error is related to password
    if (error.response?.data?.error?.includes('password')) {
      admissionError.value = error.response.data.error;
    } else if (error.response?.data?.error?.includes('document')) {
      // Handle document-related errors
      admissionError.value = error.response.data.error;
      alert('Document error: ' + error.response.data.error);
    } else {
      const actionText = selectedGroup.value.isInvitation ? 'accept invitation' : 'join group';
      alert(`Failed to ${actionText}: ${error.response?.data?.error || 'Unknown error'}`);
    }
  }
}

// Function to handle reviewing documents
const handleReviewDocuments = async (groupId) => {
  try {
    // Get the group details
    const group = userGroups.value.find(g => g.id === groupId);
    
    if (!group) {
      console.error('Group not found:', groupId);
      alert('Group not found');
      return;
    }
    
    // Set the selected group and show the admission form in review mode
    selectedGroup.value = group;
    isReviewMode.value = true;
    showAdmissionForm.value = true;
    admissionError.value = '';
    
    // Close the dashboard sidebar
    isDashboardSidebarOpen.value = false;
  } catch (error) {
    console.error('Failed to review documents:', error);
    alert('Failed to review documents: ' + (error.response?.data?.error || 'Unknown error'));
  }
}

// Handle the group-data-updated event
const handleGroupDataUpdated = (event) => {
  console.log('Group data updated event received in app-layout');
  
  // Check if the event has detail with groupId and isJoinRequest
  if (event.detail && event.detail.groupId && event.detail.isJoinRequest) {
    console.log('Join request detected for group:', event.detail.groupId);
    
    // Find the group in userGroups
    const groupIndex = userGroups.value.findIndex(g => g.id === event.detail.groupId);
    
    // If the group exists, update its isInvitation flag
    if (groupIndex !== -1) {
      // Create a new object to ensure reactivity
      userGroups.value[groupIndex] = {
        ...userGroups.value[groupIndex],
        isInvitation: false
      };
    }
  }
  
  // Refresh the groups list
  fetchUserGroups();
}

onMounted(async () => {
  // First fetch user data
  await fetchUserData()
   
  // Then fetch user groups
  await fetchUserGroups()
      
  // Check if the current route is a group page
  const currentPath = route.path
  const groupMatch = currentPath.match(/\/group\/([^/]+)/)
   
  if (groupMatch && groupMatch[1]) {
    const groupId = groupMatch[1]
     
    // Check if the user is a member of this group
    const isMember = userGroups.value.some(g => g.id === groupId)
     
    if (!isMember) {
      console.log('User is not a member of the current group, redirecting to profile')
      router.push('/profile')
    }
  }
    
  // Listen for the global user-data-updated event
  window.addEventListener('user-data-updated', fetchUserData)
   
  // Listen for the global group-data-updated event
  window.addEventListener('group-data-updated', handleGroupDataUpdated)
   
  // Listen for the close-dashboard-sidebar event to also close the FindGroupDialog
  window.addEventListener('close-dashboard-sidebar', () => {
    showFindGroupDialog.value = false
  })
  
  // Listen for the user-left-group event
  window.addEventListener('user-left-group', handleUserLeftGroup)
})
  
// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('user-data-updated', fetchUserData)
  window.removeEventListener('group-data-updated', handleGroupDataUpdated)
  window.removeEventListener('close-dashboard-sidebar', () => {
    showFindGroupDialog.value = false
  })
  window.removeEventListener('user-left-group', handleUserLeftGroup)
})
</script>