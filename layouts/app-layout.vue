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
            :class="{'bg-primary/10 rounded-md px-2 py-1': isOnGroupPage}"
          >
            <div class="flex-shrink-0 mr-2">
              <!-- Fallback icon -->
              <div 
                v-show="!groupPictureUrl || showFallbackIcon" 
                class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                ref="fallbackIcon"
              >
                <Users class="h-5 w-5 text-gray-600" />
              </div>
              
              <!-- Group image -->
              <img 
                v-if="groupPictureUrl"
                :src="groupPictureUrl" 
                alt="Group Picture"
                class="w-8 h-8 rounded-full object-cover"
                @error="handleGroupImageError"
                v-show="!showFallbackIcon"
              />
            </div>
            <span class="text-sm font-medium truncate max-w-[120px]">{{ lastUsedGroup?.name || 'Groups' }}</span>
          </div>
          
          
          <!-- App Title (center) -->
          <h1 class="text-xl font-bold absolute left-1/2 transform -translate-x-1/2">Agora Vote</h1>
          
          <!-- User Card (right) - Only show when authenticated -->
          <div 
            v-if="isAuthenticated" 
            class="flex items-center cursor-pointer"
            @click="openUserSettings"
            :class="{'bg-primary/10 rounded-md px-2 py-1': isOnProfilePage}"
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
      :userData="userData || {}"
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
    
    <!-- User Settings Dialog -->
    <UserSettingsDialog 
      v-model:open="showUserSettingsDialog"
      :userData="userData || {}"
      @refresh-user-data="fetchUserData"
    />
    
    <!-- Global Alert Dialog -->
    <GlobalAlertDialog />
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
import UserSettingsDialog from '@/components/users/UserSettingsDialog.vue'
import GlobalAlertDialog from '@/components/common/GlobalAlertDialog.vue'
import Session from 'supertokens-web-js/recipe/session'

const router = useRouter()
const route = useRoute()
const userData = ref(null)
const loading = ref(false)
const isUserSettingsOpen = ref(false)
const isDashboardSidebarOpen = ref(false)
const showFallbackIcon = ref(false)
const showUserSettingsDialog = ref(false)
const pendingGroups = ref([])

// Groups data
const userGroups = ref([])
const isLoadingGroups = ref(false)
const lastUsedGroupId = ref(localStorage.getItem('lastUsedGroupId') || null)

// Computed properties to check current route
const isOnGroupPage = computed(() => {
  return route.path.startsWith('/group/')
})

const isOnProfilePage = computed(() => {
  return route.path === '/profile' || route.path === '/settings'
})

// Computed property for the last used group
const lastUsedGroup = computed(() => {
  if (!lastUsedGroupId.value || userGroups.value.length === 0) {
    console.log('No last used group or empty groups array');
    return userGroups.value[0] || null // Return first group or null if no groups
  }
  
  // Find the group with the matching ID
  const group = userGroups.value.find(g => g.id === lastUsedGroupId.value)
  
  // Log the group object to inspect its structure
  if (group) {
    console.log('Found last used group:', JSON.stringify(group));
    console.log('Group picture property:', group.picture);
    // Check if the picture property might be under a different name
    const groupKeys = Object.keys(group);
    console.log('Group object keys:', groupKeys);
  } else {
    console.log('Last used group not found, using first group');
  }
  
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
  // This computed property will primarily react to userData presence.
  // Actual auth check happens in loadLayoutData using Session.doesSessionExist()
  return !!userData.value; 
})

// Fetch user data if authenticated
const fetchUserData = async () => {
  // ... (keep existing try/catch, but maybe remove the router.push on 401 here?)
  // Let loadLayoutData handle the auth flow redirect.
  try {
    loading.value = true;
    const response = await axios.get('/users/me');
    userData.value = response.data;
    console.log('User data fetched in app-layout:', userData.value);
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    userData.value = null; // Clear user data on fetch error
    if (error.response?.status === 401) {
      // If unauthorized, let loadLayoutData handle redirect/state clearing
      console.log('fetchUserData received 401, will re-run loadLayoutData check.');
    } else {
      // Handle other errors if necessary
    }
  } finally {
    loading.value = false;
  }
}

// Fetch user groups
const fetchUserGroups = async () => {
  try {
    isLoadingGroups.value = true;
    const response = await axios.get('/user/groups');
    console.log('Raw API response for user groups:', response.data);

    if (Array.isArray(response.data)) {
      userGroups.value = response.data;
      console.log('User groups set:', userGroups.value);
    } else {
      console.warn('/user/groups did not return an array, received:', response.data);
      userGroups.value = []; // Default to empty array if response is not an array
    }
    updateLastUsedGroup();
  } catch (error) {
    console.error('Failed to fetch user groups:', error);
    userGroups.value = []; // Clear groups on error
    // Don't redirect here, let loadLayoutData handle auth errors
  } finally {
    isLoadingGroups.value = false;
  }
}

// Helper function to update last used group after fetching
const updateLastUsedGroup = () => {
  if (userGroups.value.length > 0) {
    const storedLastUsedGroupId = localStorage.getItem('lastUsedGroupId')
    const lastGroupExists = storedLastUsedGroupId && userGroups.value.some(g => g.id === storedLastUsedGroupId);

    if (!lastGroupExists) {
      lastUsedGroupId.value = userGroups.value[0].id
      localStorage.setItem('lastUsedGroupId', userGroups.value[0].id)

      const currentPath = route.path
      const groupMatch = currentPath.match(/\/group\/([^/]+)/);
      if (groupMatch && groupMatch[1] === storedLastUsedGroupId) {
        console.log('User is on a group page they no longer belong to, redirecting to profile')
        router.push('/profile')
      }
    } else {
      lastUsedGroupId.value = storedLastUsedGroupId
    }
  } else {
    lastUsedGroupId.value = null
    localStorage.removeItem('lastUsedGroupId')
  }
}

// Encapsulated data loading function with SuperTokens check
const loadLayoutData = async () => {
  console.log('loadLayoutData checking session...');
  const sessionExists = await Session.doesSessionExist();
  console.log('Session.doesSessionExist() result:', sessionExists);

  if (sessionExists) {
    console.log('Session exists. Proceeding to fetch data.');
    // Fetch user data if not already loaded or if it was nullified by a previous error
    if (!userData.value) { 
      console.log('Fetching user data in loadLayoutData...');
      await fetchUserData();
      // If fetchUserData failed (e.g., 401), userData will be null, 
      // and we should re-check session and potentially redirect.
      if (!userData.value) {
        console.log('User data is null after fetch attempt, re-checking session...');
        const stillExists = await Session.doesSessionExist();
        if (!stillExists) {
          console.log('Session lost after user data fetch failure. Clearing state and redirecting.');
          clearAuthDataAndRedirect();
          return; // Stop further execution
        }
      }
    }
    // Fetch groups only if authenticated and groups are empty
    if (userData.value && userGroups.value.length === 0) { // Ensure user data is present before fetching groups
      console.log('Fetching user groups in loadLayoutData...');
      await fetchUserGroups();
    } else {
      console.log('Skipping groups fetch: User data missing or groups already loaded.');
    }
  } else {
    console.log('No active session found by SuperTokens. Clearing state and redirecting.');
    clearAuthDataAndRedirect();
  }
}

// Helper to clear local auth state and redirect
const clearAuthDataAndRedirect = () => {
  console.log('Clearing auth data and redirecting to /auth');
  userData.value = null;
  userGroups.value = [];
  lastUsedGroupId.value = null;
  localStorage.removeItem('token'); // Clear potential stale token
  localStorage.removeItem('userId'); // Clear potential stale userId
  localStorage.removeItem('lastUsedGroupId');
  // Check if already on auth page to prevent loop
  if (route.path !== '/auth') {
     router.push('/auth');
  }
}

// Computed property for the last used group picture URL
const groupPictureUrl = computed(() => {
  console.log('Last used group:', lastUsedGroup.value);
  if (!lastUsedGroup.value) return null;
  
  // Check for both camelCase and snake_case versions of the picture property
  const picture = lastUsedGroup.value.picture || lastUsedGroup.value.profile_picture || lastUsedGroup.value.image;
  
  if (!picture) {
    console.log('No picture found for group using any property name');
    return null;
  }
  
  // Check if it's already a full URL
  if (picture.startsWith('http://') || picture.startsWith('https://')) {
    console.log('Using full URL for group picture:', picture);
    return picture;
  }
  
  // Otherwise, prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  
  // Ensure the path starts with a slash
  const picturePath = picture.startsWith('/') ? picture : `/${picture}`;
  const fullUrl = `${baseUrl}${picturePath}`;
  
  console.log('Using relative URL for group picture:', fullUrl);
  return fullUrl;
})

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

// Provide user data and refresh function to child components
provide('appUserData', userData)
provide('refreshAppUserData', fetchUserData) // Keep old provide for compatibility if needed
provide('loadLayoutData', loadLayoutData); // Provide new loader

// Watch for authentication status changes - Keep this simple now
// We rely more on explicit calls and Session checks
watch(isAuthenticated, (newVal) => {
  console.log('isAuthenticated computed changed to:', newVal);
  // Maybe trigger loadLayoutData if newVal becomes true after being false?
  // This needs careful handling to avoid loops.
  // For now, let explicit triggers manage loading.
}, { immediate: false }); // Run only on change, not immediately

// Watch for route changes primarily to update last used group ID visually
watch(
  () => route.path,
  (newPath) => {
    console.log('Route path changed:', newPath);
    const groupMatch = newPath.match(/\/group\/([^/]+)/);
    if (groupMatch && groupMatch[1]) {
      const newGroupId = groupMatch[1];
      if (newGroupId !== lastUsedGroupId.value) {
         console.log('Updating last used group ID based on route:', newGroupId);
         lastUsedGroupId.value = newGroupId;
         localStorage.setItem('lastUsedGroupId', newGroupId);
         // Optionally re-fetch groups if needed, but maybe not necessary
         // fetchUserGroups();
      }
    }
    // Consider if other route changes necessitate data refresh
    // if (!newPath.startsWith('/group/')) {
    //    loadLayoutData(); // Example: refresh layout data if navigating away from groups?
    // }
  }
);

// Watch for changes to lastUsedGroup to reset the fallback icon
watch(
  () => lastUsedGroup.value,
  () => {
    // Reset the fallback icon when the group changes
    showFallbackIcon.value = false;
  }
)

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
const joinGroup = async (groupId, isInvitation = false, isSuccessfulJoin = false) => {
  try {
    // Check if this is a callback from a successful join in FindGroupDialog
    if (isSuccessfulJoin) {
      console.log('This is a callback from a successful join, skipping group existence check');
      // Just refresh groups and return
      await fetchUserGroups();
      return;
    }
    
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

// Handle admission form submission
const handleAdmissionSubmit = async (admissionData) => {
  try {
    // Make sure we have a selected group
    if (!selectedGroup.value) {
      console.error('No group selected for admission');
      return;
    }
    
    // Check if the message has already been handled by the form component
    if (admissionData.handledMessage) {
      console.log('Message already handled by the form component, skipping additional API calls');
      
      // Close the admission form
      showAdmissionForm.value = false;
      selectedGroup.value = null;
      isReviewMode.value = false;
      
      // Refresh the groups list
      fetchUserGroups();
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

// Handle when a user leaves a group
const handleUserLeftGroup = (event) => {
  console.log('User left group event received in app-layout')
  
  // Check if the event has detail with groupId
  if (event.detail && event.detail.groupId) {
    console.log('User left group:', event.detail.groupId)
    
    // If the user is currently on the page of the group they left, redirect to profile
    if (route.path === `/group/${event.detail.groupId}`) {
      console.log('User is on the page of the group they left, redirecting to profile')
      router.push('/profile')
    }
    
    // If this was the last used group, clear it
    if (lastUsedGroupId.value === event.detail.groupId) {
      lastUsedGroupId.value = null
      localStorage.removeItem('lastUsedGroupId')
    }
    
    // Refresh the groups list
    fetchUserGroups()
  }
}

// Handle group image loading error
const handleGroupImageError = (event) => {
  console.error('Error loading group image:', event);
  // Log the URL that failed to load
  console.error('Failed image URL:', event.target.src);
  
  // Show the fallback icon
  showFallbackIcon.value = true;
}

onMounted(async () => {
  console.log('app-layout onMounted - calling loadLayoutData');
  await loadLayoutData(); // Initial load attempt

  // Add event listeners
  // Consider changing 'user-data-updated' to trigger loadLayoutData if necessary
  window.addEventListener('user-data-updated', loadLayoutData); 
  window.addEventListener('group-data-updated', handleGroupDataUpdated);
  window.addEventListener('close-dashboard-sidebar', () => {
    showFindGroupDialog.value = false;
  });
  window.addEventListener('user-left-group', handleUserLeftGroup);
});

onBeforeUnmount(() => {
  console.log('app-layout onBeforeUnmount');
  window.removeEventListener('user-data-updated', loadLayoutData);
  // ... remove other listeners ...
});
</script>