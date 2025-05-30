<template>
  <SidebarProvider v-model:open="isSidebarExplicitlyOpen">
    <AppSidebar
      :groups="userGroups"
      :isLoading="isLoadingGroups"
      :isAuthenticated="isAuthenticated"
      :userData="userData"
      :profilePictureUrl="profilePictureUrl"
      @refresh-groups="fetchUserGroups"
      @join-group="joinGroup"
      @review-documents="handleReviewDocuments"
      @navigate-to-group="navigateToGroup"
      @process-group-admission="handleProcessGroupAdmission"
      @close-sidebar="closeSidebar"
    />

    <!-- Main content area, positioned absolutely -->
    <div class="absolute inset-0 min-h-screen bg-background overflow-y-auto">
      <div class="fixed top-4 left-4 z-50">
        <CustomSidebarTrigger />
      </div>
      <main class="w-full max-w-4xl mx-auto pt-20 px-4 min-h-screen">
        <!-- Increased pt to 20 (5rem) to ensure content is below trigger -->
        <slot />
      </main>
    </div>

    <!-- Dialogs: Ensure they are correctly layered if they are not global modals -->
    <GroupAdmissionForm
      v-if="showAdmissionForm && selectedGroup"
      :group="selectedGroup"
      :error="admissionError"
      :review-mode="isReviewMode"
      :invitationToken="admissionInvitationToken"
      @close="closeAdmissionForm"
      @submit="handleAdmissionSubmit"
    />

    <GlobalAlertDialog />

    <AppAlertDialog
      :open="!!globalError"
      :message="globalError || 'An unexpected error occurred.'"
      title="Error"
      @close="globalError = null"
    />
  </SidebarProvider>
</template>

<script setup>
import { ref, computed, onMounted, provide, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import AppSidebar from '@/components/dashboard/AppSidebar.vue'
import { SidebarProvider } from '@/components/ui/sidebar'
import CustomSidebarTrigger from '@/components/common/CustomSidebarTrigger.vue'
import GroupAdmissionForm from '@/components/groups/GroupAdmissionForm.vue'
import GlobalAlertDialog from '@/components/common/GlobalAlertDialog.vue'
import AppAlertDialog from '@/components/common/AppAlertDialog.vue'
import Session from 'supertokens-web-js/recipe/session'
import { useNuxtApp } from '#app'

const { $axiosInstance } = useNuxtApp()

const router = useRouter()
const route = useRoute()
const userData = ref(null)
const loading = ref(false)
const showUserSettingsDialog = ref(false)
const pendingGroups = ref([])
const isSidebarExplicitlyOpen = ref(true)

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
const showAdmissionForm = ref(false)
const selectedGroup = ref(null)
const admissionError = ref('')
const isReviewMode = ref(false)
const appLayoutHandlers = ref({}) // Store event handler references

// Check if user is authenticated
const isAuthenticated = computed(() => {
  return !!userData.value;
})

// Encapsulated data loading function with SuperTokens check
const loadLayoutData = async () => {
  const isIntentionalDeletion = localStorage.getItem('intentionalGroupDeletion') === 'true';
  if (isIntentionalDeletion) {
    console.log('Skipping session check during intentional group deletion');
    return;
  }
  console.log('loadLayoutData checking session...');
  
  // Check for refresh_subscription parameter in the URL
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const refreshSubscription = urlParams.get('refresh_subscription');
    if (refreshSubscription === 'true') {
      // Remove the parameter from the URL without refreshing the page
      const newUrl = window.location.pathname + (urlParams.size > 1 ? 
        '?' + Array.from(urlParams.entries())
          .filter(([key]) => key !== 'refresh_subscription')
          .map(([key, value]) => `${key}=${value}`)
          .join('&') : '');
      window.history.replaceState({}, document.title, newUrl);
      
      // Get the group ID from the path
      const groupIdMatch = window.location.pathname.match(/\/group\/([^\/]+)/);
      if (groupIdMatch && groupIdMatch[1]) {
        const groupId = groupIdMatch[1];
        console.log(`URL contains refresh_subscription=true for group ${groupId}, handling without page refresh`);
        
        // Trigger a targeted refresh for this specific group
        setTimeout(() => {
          handleSubscriptionUpdatedEvent({ 
            detail: { 
              groupId,
              status: 'active' // Assume successful payment
            } 
          });
        }, 500);
      }
    }
  }
  
  let sessionExists = false;
  try {
    sessionExists = await Session.doesSessionExist();
  } catch (sessionError) {
    console.error('Error checking SuperTokens session existence:', sessionError);
    clearAuthDataAndRedirect();
    return;
  }
  console.log('Session.doesSessionExist() result:', sessionExists);

  if (sessionExists) {
    console.log('Session exists. Proceeding to fetch data.');
    let fetchUserSuccess = true;
    if (!userData.value) {
      console.log('Fetching user data in loadLayoutData...');
      try {
        await fetchUserData();
        if (!userData.value) {
          console.warn('fetchUserData completed but userData is still null.');
          fetchUserSuccess = false;
        }
      } catch (fetchError) {
        console.error('Error occurred during fetchUserData call:', fetchError);
        fetchUserSuccess = false;
        userData.value = null;
      }
    }

    if (!fetchUserSuccess) {
        console.warn('Failed to fetch user data, but session still seems to exist. Will not redirect immediately.');
    }

    // Fetch groups only if user data fetch was successful and groups are empty OR explicitly requested refresh
    // The AppSidebar will emit 'refresh-groups' on mount, triggering this.
    if (userData.value && fetchUserSuccess && userGroups.value.length === 0) {
       console.log('Fetching user groups in loadLayoutData (initial or forced)...');
       await fetchUserGroups();
     } else if (userData.value && fetchUserSuccess) {
        // We have user data, but maybe groups are already loaded.
        // AppSidebar will manage subsequent refreshes via emits.
        console.log('Skipping initial groups fetch: User data present and groups might be loaded.');
     } else {
       console.log('Skipping groups fetch: User data missing or fetch failed.');
     }

  } else {
    console.log('No active session found by SuperTokens. Clearing state and redirecting.');
    if (route.path !== '/auth') {
        clearAuthDataAndRedirect();
    } else {
        console.log('Already on /auth page, skipping redirect.');
        userData.value = null;
        userGroups.value = [];
        removeLocalStorage('token');
        removeLocalStorage('userId');
        removeLocalStorage('lastUsedGroupId');
    }
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
  if (route.path !== '/auth') {
     router.push('/auth');
  }
}

// Fetch user data if authenticated
const fetchUserData = async () => {
  try {
    console.log('Attempting to fetch /users/me');
    const response = await $axiosInstance.get('/users/me');
    userData.value = response.data;
    console.log('User data fetched successfully:', userData.value);
  } catch (error) {
    console.error('Failed to fetch user data (/users/me):', error);
    userData.value = null;
  }
}

// Fetch user groups
const fetchUserGroups = async () => {
  // Check if already loading to prevent concurrent requests
  if (isLoadingGroups.value) {
    console.log('Already fetching groups, skipping duplicate request.');
    return;
  }
  try {
    isLoadingGroups.value = true;
    console.log('Fetching user groups from /api/groups/user-groups...'); // Updated log
    const response = await $axiosInstance.get('/api/groups/user-groups'); // Corrected path
    console.log('Raw API response for user groups:', response.data);

    if (Array.isArray(response.data)) {
      userGroups.value = response.data;
      console.log('User groups set:', userGroups.value);
    } else if (response.data === null) {
      console.warn('/api/groups/user-groups endpoint returned null, defaulting to empty array');
      userGroups.value = [];
    } else if (typeof response.data === 'object' && response.data !== null) {
      const possibleGroups = response.data.groups || response.data.data || [];
      console.warn('/api/groups/user-groups returned an object instead of array, attempting to extract groups:', possibleGroups);
      userGroups.value = Array.isArray(possibleGroups) ? possibleGroups : [];
    } else {
      console.warn('/api/groups/user-groups returned unexpected data type:', typeof response.data);
      userGroups.value = [];
    }

    updateLastUsedGroup();
  } catch (error) {
    console.error('Failed to fetch user groups:', error);
    const isIntentionalDeletion = localStorage.getItem('intentionalGroupDeletion') === 'true';
    if (error.response && error.response.status === 401 && !isIntentionalDeletion) {
      console.warn('Authentication error during groups fetch, checking session status');
      setTimeout(() => loadLayoutData(), 500);
    } else {
      userGroups.value = [];
      updateLastUsedGroup();
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
      lastUsedGroupId.value = userGroups.value[0].id
      setLocalStorage('lastUsedGroupId', lastUsedGroupId.value)

      const currentPath = route.path
      const groupMatch = currentPath.match(/\/group\/([^/]+)/);
      if (storedLastUsedGroupId && groupMatch && groupMatch[1] === storedLastUsedGroupId) {
        console.log('User is on a group page they no longer belong to, redirecting to profile')
        router.push('/profile')
      }
    } else {
      if (lastUsedGroupId.value !== storedLastUsedGroupId) {
         lastUsedGroupId.value = storedLastUsedGroupId
      }
    }
  } else {
    lastUsedGroupId.value = null
    removeLocalStorage('lastUsedGroupId')
  }
}

// Computed property for profile picture URL
const profilePictureUrl = computed(() => {
  if (!userData.value?.profile_picture) return null
  if (userData.value.profile_picture.startsWith('http')) {
    return userData.value.profile_picture
  }
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl || 'http://localhost:8088'
  return `${baseUrl}/${userData.value.profile_picture}`
})

// Provide user data and refresh function to child components
provide('appUserData', userData)
provide('refreshAppUserData', fetchUserData)
provide('loadLayoutData', loadLayoutData);

// Navigate to group page
const navigateToGroup = (groupId) => {
  lastUsedGroupId.value = groupId
  setLocalStorage('lastUsedGroupId', groupId)
  router.push(`/group/${groupId}`)
}

// Join a group (triggered by FindGroupDialog or AppSidebar's accept action)
const joinGroup = async (groupId, isInvitation = false, isSuccessfulJoin = false) => {
   console.log(`app-layout joinGroup called with: groupId=${groupId}, isInvitation=${isInvitation}, isSuccessfulJoin=${isSuccessfulJoin}`); // Debug log
  try {
    if (isSuccessfulJoin) {
      console.log('This is a callback from a successful join, skipping group existence check');
      await fetchUserGroups(); // Refresh sidebar
      return;
    }

    // Attempt to find the group in the current userGroups list first
    let group = userGroups.value.find(g => g.id === groupId);

    // If not found locally, fetch group details directly, needed for requirement checks
    // This handles cases like joining via FindGroupDialog where the group isn't in userGroups yet
    if (!group) {
       console.log(`Group ${groupId} not found locally, fetching details...`);
       try {
          // We might need an invitation token if this is triggered by an email invite flow later
          const fetchUrl = `/api/groups/${groupId}${admissionInvitationToken.value ? '?invitation_token='+admissionInvitationToken.value : ''}`;
          const response = await $axiosInstance.get(fetchUrl);
          group = response.data;
          console.log(`Fetched group details for ${groupId}:`, group);
       } catch (fetchError) {
          console.error(`Failed to fetch details for group ${groupId}:`, fetchError);
          alert('Group not found or could not be fetched.');
          return;
       }
    } else {
        console.log(`Group ${groupId} found locally.`);
    }

    // If still no group after fetch attempt (should not happen if fetch succeeded)
    if (!group) {
       console.error('Group not found after fetch attempt:', groupId);
       alert('Group not found');
       return;
    }


    // Check requirements (using potentially freshly fetched group data)
    const requiresPassword = group?.requiresPassword === true || group?.requires_password === true;
    let requiresDocuments = false;
    let requiredDocumentsArray = [];
    const documents = group?.requiredDocuments || group?.required_documents;
    if (documents) {
      if (typeof documents === 'string') {
        try { requiredDocumentsArray = JSON.parse(documents); requiresDocuments = Array.isArray(requiredDocumentsArray) && requiredDocumentsArray.length > 0; } catch (e) { console.error('Error parsing required documents:', e); }
      } else if (Array.isArray(documents)) {
        requiredDocumentsArray = documents; requiresDocuments = documents.length > 0;
      }
    }
    const hasRequiresDocumentsFlag = group?.requiresDocuments === true || group?.requires_documents === true;
     // Check for admin approval requirement as well
    const requiresAdminApproval = group.requiresAdminApproval === true || group.requires_admin_approval === true;


    console.log('Group join requirements:', { requiresPassword, requiresDocuments, hasRequiresDocumentsFlag, requiresAdminApproval, groupId, isInvitation });

    // Show admission form IF requirements exist OR if it's an invitation acceptance (to handle potential password/doc entry)
    // The AppSidebar's acceptPendingGroup logic already handles the case where no requirements exist,
    // so if joinGroup is called with isInvitation=true, it implies requirements OR the need for the form.
    if ((requiresPassword || (hasRequiresDocumentsFlag && requiresDocuments) || requiresAdminApproval) || isInvitation) {
       // Ensure we pass the potentially fetched group details to the form
       selectedGroup.value = {
         ...group,
         requiredDocuments: requiredDocumentsArray, // Use parsed array
         isInvitation: isInvitation // Store if it's an invitation flow
       };
       showAdmissionForm.value = true;
       admissionError.value = '';
       return;
    }


    // If no special requirements and NOT an invitation acceptance flow (handled by AppSidebar), proceed with direct join request
     console.log('No special requirements/invitation, sending direct join request...'); // Added log
    const response = await $axiosInstance.post(`/api/groups/${groupId}/join`);
    console.log('Join response:', response.data);
    const status = response.data?.status || 'pending';
    await fetchUserGroups(); // Refresh sidebar

    if (status === 'approved') {
      console.log('User was immediately approved, navigating to group');
      navigateToGroup(groupId);
    } else {
      console.log('Join request is pending approval');
      window.dispatchEvent(new CustomEvent('group-data-updated')); // Notify sidebar
    }
  } catch (error) {
    console.error('Failed to join group:', error);
    alert('Failed to join group: ' + (error.response?.data?.error || 'Unknown error'));
  }
}


// Handle admission form submission
const handleAdmissionSubmit = async (formData) => {
  admissionError.value = ''
  try {
    let response;
    // If it's review mode, it means an admin is approving/rejecting an existing request.
    // This logic seems to be handled by GroupCard.vue or GroupTabs.vue now for admins.
    // This form is likely for a user submitting their *own* application or accepting an invite.

    if (formData.invitationToken) {
      // Accept invitation
      console.log('Accepting invitation with token:', formData.invitationToken, 'for group:', selectedGroup.value.id);
      response = await $axiosInstance.post(`/api/groups/${selectedGroup.value.id}/invitations/accept`, {
        token: formData.invitationToken,
      }, {
        headers: {
        }
      });
      console.log('Invitation accepted response:', response.data);
    } else {
      // Apply to join group (potentially with document)
      console.log('Applying to join group:', selectedGroup.value.id, 'with form data:', formData);
      const dataToSend = new FormData();
      dataToSend.append('message', formData.message || ''); // Ensure message is always sent, even if empty
      if (formData.document) {
        dataToSend.append('document', formData.document);
      }
      // No need to append groupId to FormData body if it's in the URL
      
      response = await $axiosInstance.post(`/api/groups/${selectedGroup.value.id}/apply`, dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Group application response:', response.data);
    }

    // Handle successful submission
    closeAdmissionForm()
    await fetchUserGroups() // Refresh group list to reflect new status

    // Optionally, show a success message to the user (e.g., using a toast or alert)
    // For example, if using a composable for alerts:
    // showSuccessAlert('Application submitted successfully!' or 'Invitation accepted!');

  } catch (error) {
    console.error('Error submitting admission form:', error.response?.data || error.message);
    admissionError.value = error.response?.data?.error || 'Failed to submit application. Please try again.';
  }
}


// Function to handle reviewing documents (triggered by AppSidebar)
const handleReviewDocuments = async (groupId) => {
   console.log(`app-layout handleReviewDocuments called for group: ${groupId}`); // Debug log
  try {
    // Fetch fresh group details to ensure we have the latest membership status and doc requirements
    let group;
     try {
        const response = await $axiosInstance.get(`/api/groups/${groupId}`);
        group = response.data;
     } catch (fetchError) {
        console.error(`Failed to fetch group ${groupId} for document review:`, fetchError);
        alert('Could not load group details for document review.');
        return;
     }


    if (!group) {
      console.error('Group not found for review:', groupId);
      alert('Group not found');
      return;
    }

    // Set the selected group and show the admission form in review mode
    selectedGroup.value = group;
    isReviewMode.value = true;
    showAdmissionForm.value = true; // Use the same admission form
    admissionError.value = '';
  } catch (error) {
    console.error('Failed to prepare document review:', error);
    alert('Failed to prepare document review: ' + (error.response?.data?.error || 'Unknown error'));
  }
}


// Handle the group-data-updated event (emitted by AppSidebar or other components)
const handleGroupDataUpdated = (event) => {
  console.log('Group data updated event received in app-layout', event?.detail); // Log event detail
  const isDeletion = event?.detail?.isDeleted === true;
  const deletedGroupId = isDeletion ? localStorage.getItem('deletedGroupId') : null;

  if (isDeletion && deletedGroupId) {
    console.log('Group deletion confirmed for group:', deletedGroupId);
    if (lastUsedGroupId.value === deletedGroupId) {
      console.log('Clearing last used group ID since it was deleted');
      lastUsedGroupId.value = null;
      removeLocalStorage('lastUsedGroupId');
    }
    // Clear deletion flags AFTER handling
    localStorage.removeItem('intentionalGroupDeletion');
    localStorage.removeItem('deletedGroupId');
    // No need to refresh here, handled by sidebar already or navigation
  } else if (!isDeletion) {
     // Non-deletion event or generic update, refresh the groups
     console.log('Refreshing groups due to group-data-updated event.');
     fetchUserGroups();
  }
}


// Handle when a user leaves a group
const handleUserLeftGroup = (event) => {
  console.log('User left group event received in app-layout', event?.detail)
  if (event?.detail?.groupId) {
    console.log('User left group:', event.detail.groupId)
    if (route.path === `/group/${event.detail.groupId}`) {
      console.log('User is on the page of the group they left, redirecting to profile')
      router.push('/profile')
    }
    if (lastUsedGroupId.value === event.detail.groupId) {
      lastUsedGroupId.value = null
      removeLocalStorage('lastUsedGroupId')
    }
    fetchUserGroups() // Refresh sidebar
  }
}

// State for Group Admission Form
// selectedGroup is already defined
const admissionInvitationToken = ref(null)

// Reactive state for global error
const globalError = ref(null)

// Handler for email invitations requiring admission steps (triggered by AppSidebar)
const handleProcessGroupAdmission = (payload) => {
  console.log("app-layout: Received process-group-admission event:", payload);
  if (payload && payload.group && payload.invitationToken) {
    selectedGroup.value = payload.group;
    admissionInvitationToken.value = payload.invitationToken;
    admissionError.value = '';
    isReviewMode.value = false;
    showAdmissionForm.value = true; // Open the admission form
  } else {
    console.error("Invalid payload received for process-group-admission");
    globalError.value = "Could not process the group invitation properly.";
  }
};

// Close the admission form
const closeAdmissionForm = () => {
  showAdmissionForm.value = false;
  selectedGroup.value = null;
  admissionInvitationToken.value = null;
  admissionError.value = '';
  isReviewMode.value = false;
};

// Function to explicitly close the sidebar
const closeSidebar = () => {
  isSidebarExplicitlyOpen.value = false;
};

onMounted(() => {
  lastUsedGroupId.value = getLocalStorage('lastUsedGroupId');
  loadLayoutData(); // Load initial data (will trigger group fetch if needed)

  // Event listener for successful group joins from FindGroupDialog
  window.addEventListener('group-joined-successfully', handleGroupJoinedEvent);

  // Event listener for generic group data updates (including deletions handled above)
  window.addEventListener('group-data-updated', handleGroupDataUpdatedEvent);

  // Event listener for user leaving a group
   window.addEventListener('user-left-group', handleUserLeftGroupEvent); // Renamed handler slightly
   
  // Event listener for user data updates (e.g. profile picture changes)
  window.addEventListener('user-data-updated', handleUserDataUpdatedEvent);
  
  // Event listener for subscription updates (from PurchaseOptions.vue)
  window.addEventListener('subscription-updated', handleSubscriptionUpdatedEvent);
});

onBeforeUnmount(() => {
  window.removeEventListener('group-joined-successfully', handleGroupJoinedEvent);
  window.removeEventListener('group-data-updated', handleGroupDataUpdatedEvent);
   window.removeEventListener('user-left-group', handleUserLeftGroupEvent); // Renamed handler slightly
   window.removeEventListener('user-data-updated', handleUserDataUpdatedEvent);
  window.removeEventListener('subscription-updated', handleSubscriptionUpdatedEvent);
});

// Handle the group-joined-successfully event (from FindGroupDialog)
const handleGroupJoinedEvent = (event) => {
  console.log('app-layout: Received group-joined-successfully event', event.detail);
  fetchUserGroups(); // Refresh the user's group list in the sidebar
  if (event.detail?.groupId) {
    navigateToGroup(event.detail.groupId); // Navigate to the newly joined group
  }
};

// Handle the group-data-updated event (for deletions primarily now)
const handleGroupDataUpdatedEvent = (event) => {
  // Delegate most handling to the main handleGroupDataUpdated function
  handleGroupDataUpdated(event);
};

// Handle the user-left-group event
const handleUserLeftGroupEvent = (event) => {
   // Delegate handling to the main handleUserLeftGroup function
   handleUserLeftGroup(event);
};

// Handle user data updated event (for profile picture changes)
const handleUserDataUpdatedEvent = () => {
  console.log('app-layout: Received user-data-updated event');
  fetchUserData(); // Refresh the user data including profile picture
};

// Add this new function to handle subscription updates without a page refresh
const handleSubscriptionUpdatedEvent = (event) => {
  console.log('app-layout: Received subscription-updated event', event.detail);
  
  if (event.detail?.groupId) {
    const groupId = event.detail.groupId;
    
    // Refresh the specific group data without a full reload
    const refreshGroupData = async () => {
      try {
        console.log(`Refreshing group data for ${groupId} after subscription update`);
        // Fetch updated group data
        const response = await $axiosInstance.get(`/api/groups/${groupId}`);
        const updatedGroup = response.data;
        
        // Update the group in our local state
        const groupIndex = userGroups.value.findIndex(g => g.id === groupId);
        if (groupIndex !== -1) {
          // Update the existing group object
          const updatedGroups = [...userGroups.value];
          updatedGroups[groupIndex] = {
            ...updatedGroups[groupIndex], 
            ...updatedGroup
          };
          userGroups.value = updatedGroups;
          console.log('Updated local group data after subscription change');
        }
        
        // Dispatch an event to notify other components
        window.dispatchEvent(new CustomEvent('group-data-updated'));
      } catch (error) {
        console.error('Failed to refresh group data after subscription update:', error);
      }
    };
    
    refreshGroupData();
  }
};

</script>