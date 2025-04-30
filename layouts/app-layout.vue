<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container mx-auto flex h-16 items-center px-4">
        <div class="flex w-full items-center justify-between">
          <!-- Static Groups Button -->
          <Button 
            variant="ghost" 
            class="flex items-center cursor-pointer"
            @click="openDashboardSidebar"
            aria-label="Open groups sidebar"
          >
            <img src="/agora-vote-icon.png" alt="Groups Icon" class="h-10 w-10 mr-2" />
            <span class="text-sm font-medium">Groups</span>
          </Button>
          
          
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
      @refresh-groups="fetchUserGroups"
      @join-group="joinGroup"
      @review-documents="handleReviewDocuments"
      @navigate-to-group="navigateToGroup"
      @process-group-admission="handleProcessGroupAdmission"
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
      :invitationToken="admissionInvitationToken"
      @close="closeAdmissionForm"
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

    <!-- App Alert Dialog for Global Errors -->
    <AppAlertDialog
      :open="!!globalError" 
      :message="globalError || 'An unexpected error occurred.'"
      title="Error"
      @close="globalError = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Search } from 'lucide-vue-next'
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
import AppAlertDialog from '@/components/common/AppAlertDialog.vue'
import Session from 'supertokens-web-js/recipe/session'

const router = useRouter()
const route = useRoute()
const userData = ref(null)
const loading = ref(false)
const isUserSettingsOpen = ref(false)
const isDashboardSidebarOpen = ref(false)
const showUserSettingsDialog = ref(false)
const pendingGroups = ref([])

// Groups data
const userGroups = ref([])
const isLoadingGroups = ref(false)
const lastUsedGroupId = ref(null)

// Safely access localStorage for SSR
const getLocalStorage = (key, defaultValue = null) => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) || defaultValue;
  }
  return defaultValue;
};

// Safely set localStorage for SSR
const setLocalStorage = (key, value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

// Safely remove localStorage for SSR
const removeLocalStorage = (key) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

// Computed properties to check current route
const isOnProfilePage = computed(() => {
  return route.path === '/profile' || route.path === '/settings'
})

// Dialog states
const showFindGroupDialog = ref(false)
const showCreateGroupDialog = ref(false)
const showAdmissionForm = ref(false)
const selectedGroup = ref(null)
const admissionError = ref('')
const isReviewMode = ref(false)
const appLayoutHandlers = ref({}) // Store event handler references

// Check if user is authenticated
const isAuthenticated = computed(() => {
  // This computed property will primarily react to userData presence.
  // Actual auth check happens in loadLayoutData using Session.doesSessionExist()
  return !!userData.value; 
})

// Encapsulated data loading function with SuperTokens check
const loadLayoutData = async () => {
  // Check if this is during intentional group deletion
  const isIntentionalDeletion = localStorage.getItem('intentionalGroupDeletion') === 'true';
  
  if (isIntentionalDeletion) {
    console.log('Skipping session check during intentional group deletion');
    return; // Skip session check during intentional deletion
  }
  
  console.log('loadLayoutData checking session...');
  let sessionExists = false;
  try {
    sessionExists = await Session.doesSessionExist();
  } catch (sessionError) {
    console.error('Error checking SuperTokens session existence:', sessionError);
    // Treat error during check as session not existing for safety
    clearAuthDataAndRedirect();
    return;
  }
  console.log('Session.doesSessionExist() result:', sessionExists);

  if (sessionExists) {
    console.log('Session exists. Proceeding to fetch data.');
    let fetchUserSuccess = true;
    // Fetch user data if not already loaded or if it was nullified by a previous error
    if (!userData.value) { 
      console.log('Fetching user data in loadLayoutData...');
      try {
        // Directly call fetchUserData which handles its own try/catch
        await fetchUserData(); 
        if (!userData.value) {
          // Fetch succeeded but returned no data (shouldn't happen for /users/me)
          // Or fetchUserData caught an error and set userData to null
          console.warn('fetchUserData completed but userData is still null.');
          fetchUserSuccess = false; // Mark as failed
        }
      } catch (fetchError) {
        // This catch might be redundant if fetchUserData handles its own errors
        // but added for safety
        console.error('Error occurred during fetchUserData call:', fetchError);
        fetchUserSuccess = false; // Mark as failed
        userData.value = null; // Ensure userData is null on error
      }
    }
    
    // ---> MODIFICATION: Only redirect if session is definitively lost, 
    // --->             otherwise handle data fetch failure gracefully.
    if (!fetchUserSuccess) {
        console.warn('Failed to fetch user data, but session still seems to exist. Will not redirect immediately.');
        // Optionally: Show a non-blocking error message to the user in the UI
        // Example: globalErrorState.value = "Could not load user profile. Please try refreshing.";
        // We avoid redirecting here just because data fetch failed.
        // Let the user stay logged in if the session token is still valid.
    }
    // ---> END MODIFICATION

    // Fetch groups only if user data fetch was successful and groups are empty
    if (userData.value && fetchUserSuccess && userGroups.value.length === 0) {
      console.log('Fetching user groups in loadLayoutData...');
      await fetchUserGroups(); // fetchUserGroups should also handle its own errors
    } else {
      console.log('Skipping groups fetch: User data missing/fetch failed or groups already loaded.');
    }
  } else {
    console.log('No active session found by SuperTokens. Clearing state and redirecting.');
    // ---> ADDED CHECK: Avoid redirecting if already on /auth page <---
    if (route.path !== '/auth') {
        clearAuthDataAndRedirect();
    } else {
        console.log('Already on /auth page, skipping redirect.');
        // Ensure data is still cleared even if not redirecting
        userData.value = null;
        userGroups.value = [];
        removeLocalStorage('token');
        removeLocalStorage('userId');
        removeLocalStorage('lastUsedGroupId');
    }
    // ---> END ADDED CHECK <---
  }
}

// Helper to clear local auth state and redirect
const clearAuthDataAndRedirect = () => {
  console.log('Clearing auth data and redirecting to /auth');
  userData.value = null;
  userGroups.value = [];
  removeLocalStorage('token');
  removeLocalStorage('userId');
  removeLocalStorage('lastUsedGroupId');
  // Check if already on auth page to prevent loop (redundant with check above, but safe)
  if (route.path !== '/auth') {
     router.push('/auth');
  }
}

// Fetch user data if authenticated
const fetchUserData = async () => {
  try {
    // Removed loading.value toggle from here, manage in calling context if needed
    console.log('Attempting to fetch /users/me');
    const response = await axios.get('/users/me');
    userData.value = response.data; // Assuming response.data is the user object
    console.log('User data fetched successfully:', userData.value);
    // Clear any previous error state related to user fetch
    // Example: globalErrorState.value = null;
  } catch (error) {
    console.error('Failed to fetch user data (/users/me):', error);
    userData.value = null; // CRITICAL: Ensure userData is null on failure
    // Do not redirect here, let the caller (loadLayoutData) decide based on session status
    // Re-throw the error if the caller needs to know about it
    // throw error; 
  } 
}

// Fetch user groups
const fetchUserGroups = async () => {
  try {
    isLoadingGroups.value = true;
    const response = await axios.get('/user/groups');
    console.log('Raw API response for user groups:', response.data);

    // Handle different response types
    if (Array.isArray(response.data)) {
      // Normal case: API returns an array of groups
      userGroups.value = response.data;
      console.log('User groups set:', userGroups.value);
    } else if (response.data === null) {
      // Backend can return null if user has no groups
      console.warn('/user/groups endpoint returned null, defaulting to empty array');
      userGroups.value = []; // Use empty array when response is null
    } else if (typeof response.data === 'object' && response.data !== null) {
      // Handle case where response might be an object with groups inside
      // (This branch might not be needed, but added for robustness)
      const possibleGroups = response.data.groups || response.data.data || [];
      console.warn('/user/groups returned an object instead of array, attempting to extract groups:', possibleGroups);
      userGroups.value = Array.isArray(possibleGroups) ? possibleGroups : [];
    } else {
      // Any other unexpected response
      console.warn('/user/groups returned unexpected data type:', typeof response.data);
      userGroups.value = []; // Default to empty array
    }
    
    // Always update last used group after setting groups, 
    // this handles the case where groups are now empty
    updateLastUsedGroup();
  } catch (error) {
    console.error('Failed to fetch user groups:', error);
    
    // Check if this is during intentional group deletion
    const isIntentionalDeletion = localStorage.getItem('intentionalGroupDeletion') === 'true';
    
    // Only trigger session check on auth errors if not during intentional deletion
    if (error.response && error.response.status === 401 && !isIntentionalDeletion) {
      console.warn('Authentication error during groups fetch, checking session status');
      // Use setTimeout to avoid immediate check during navigation
      setTimeout(() => loadLayoutData(), 500);
    } else {
      userGroups.value = []; // Always set to empty array on error
      updateLastUsedGroup(); // Also update last used group on error
    }
  } finally {
    isLoadingGroups.value = false;
  }
}

// Helper function to update last used group after fetching
const updateLastUsedGroup = () => {
  if (userGroups.value.length > 0) {
    const storedLastUsedGroupId = getLocalStorage('lastUsedGroupId')
    const lastGroupExists = storedLastUsedGroupId && userGroups.value.some(g => g.id === storedLastUsedGroupId);

    if (!lastGroupExists) {
      // Update the ref AND localStorage
      lastUsedGroupId.value = userGroups.value[0].id 
      setLocalStorage('lastUsedGroupId', lastUsedGroupId.value) // Use the ref's value

      const currentPath = route.path
      const groupMatch = currentPath.match(/\/group\/([^/]+)/);
      // Check if the stored ID exists before comparing
      if (storedLastUsedGroupId && groupMatch && groupMatch[1] === storedLastUsedGroupId) {
        console.log('User is on a group page they no longer belong to, redirecting to profile')
        router.push('/profile')
      }
    } else {
      // Update the ref if it's different from the stored value
      if (lastUsedGroupId.value !== storedLastUsedGroupId) {
         lastUsedGroupId.value = storedLastUsedGroupId 
      }
    }
  } else {
    // Update the ref AND localStorage
    lastUsedGroupId.value = null 
    removeLocalStorage('lastUsedGroupId')
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

// Provide user data and refresh function to child components
provide('appUserData', userData)
provide('refreshAppUserData', fetchUserData) // Keep old provide for compatibility if needed
provide('loadLayoutData', loadLayoutData); // Provide new loader

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
  setLocalStorage('lastUsedGroupId', groupId)
  
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
    setLocalStorage('lastUsedGroupId', newGroup.id)
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
  
  // Check if this is a deletion event
  if (event.detail && event.detail.isDeleted) {
    console.log('Group deletion detected for group:', event.detail.groupId);
    
    // For group deletion, do minimal processing to avoid triggering session checks
    // Clear the last used group if it matches the deleted group
    if (lastUsedGroupId.value === event.detail.groupId) {
      console.log('Clearing last used group ID since it was deleted');
      lastUsedGroupId.value = null;
      removeLocalStorage('lastUsedGroupId');
    }
    
    // Empty the user groups array (will be refreshed on next view that needs it)
    userGroups.value = [];
    return; // Skip the rest of the processing
  }
  
  // Non-deletion event handling (existing code)
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
  
  // Refresh the groups list (for non-deletion events)
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
      removeLocalStorage('lastUsedGroupId')
    }
    
    // Refresh the groups list
    fetchUserGroups()
  }
}

// State for Group Admission Form
const groupForAdmission = ref(null)
const admissionInvitationToken = ref(null) // To store the token for email invites

// Reactive state for global error
const globalError = ref(null)

// Handler for email invitations requiring admission steps
const handleProcessGroupAdmission = (payload) => {
  console.log("app-layout: Received process-group-admission event:", payload);
  if (payload && payload.group && payload.invitationToken) {
    selectedGroup.value = payload.group; // Use selectedGroup instead of groupForAdmission
    admissionInvitationToken.value = payload.invitationToken; // Store the token
    admissionError.value = ''; // Clear any previous error
    isReviewMode.value = false; // Ensure review mode is off
    showAdmissionForm.value = true; // Open the form
  } else {
    console.error("Invalid payload received for process-group-admission");
    globalError.value = "Could not process the group invitation properly.";
  }
};

// Close the admission form
const closeAdmissionForm = () => {
  showAdmissionForm.value = false;
  selectedGroup.value = null; // Clear selectedGroup
  admissionInvitationToken.value = null;
  admissionError.value = ''; // Clear error
  isReviewMode.value = false; // Reset review mode
};

onMounted(() => {
  lastUsedGroupId.value = getLocalStorage('lastUsedGroupId');
  loadLayoutData(); // Load initial data
  
  // Event listener for successful group joins from FindGroupDialog
  window.addEventListener('group-joined-successfully', handleGroupJoinedEvent);
  
  // Event listener for group deletion
  window.addEventListener('group-data-updated', handleGroupDataUpdatedEvent);
});

onBeforeUnmount(() => {
  window.removeEventListener('group-joined-successfully', handleGroupJoinedEvent);
  window.removeEventListener('group-data-updated', handleGroupDataUpdatedEvent);
});

// Handle the group-joined-successfully event
const handleGroupJoinedEvent = (event) => {
  console.log('app-layout: Received group-joined-successfully event', event.detail);
  fetchUserGroups(); // Refresh the user's group list
  if (event.detail?.groupId) {
    navigateToGroup(event.detail.groupId); // Navigate to the newly joined group
  }
};

// Handle the group-data-updated event (specifically for deletions)
const handleGroupDataUpdatedEvent = (event) => {
  console.log('app-layout: Received group-data-updated event', event.detail);
  if (event.detail?.isDeleted === true) {
    const deletedGroupId = localStorage.getItem('deletedGroupId'); // Get the ID stored before deletion
    console.log('app-layout: Group deletion confirmed, deletedGroupId:', deletedGroupId);
    
    // If the deleted group was the last visited group, clear the last visited state
    if (lastUsedGroupId.value === deletedGroupId) {
      console.log('app-layout: Deleted group was the last visited group, clearing lastUsedGroupId.');
      lastUsedGroupId.value = null;
      removeLocalStorage('lastUsedGroupId');
    }
    
    // Clear the deletion flags AFTER handling
    localStorage.removeItem('intentionalGroupDeletion');
    localStorage.removeItem('deletedGroupId');
    
    // No need to fetchUserGroups here, as the sidebar event handler should trigger it
    // and we might be navigating away anyway.
  } else {
    // If it's not a deletion, just refresh the groups
    fetchUserGroups();
  }
};
</script>