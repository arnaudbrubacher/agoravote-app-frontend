import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
// import axios from '~/src/utils/axios' // REMOVED OLD AXIOS IMPORT
import { getUserIdFromToken } from '~/src/utils/auth'
import { jwtDecode } from 'jwt-decode'
import Session from 'supertokens-web-js/recipe/session'
import { useNuxtApp } from '#app'

export function useGroupData(groupId) {
  const router = useRouter()
  
  const group = ref(null)
  const isLoading = ref(false)
  const currentUserId = ref(null) // Add a ref to store the current user ID
  
  // Helper function to get axios instance
  const getAxiosInstance = () => {
    if (process.client) {
      const { $axiosInstance } = useNuxtApp()
      if ($axiosInstance) {
        return $axiosInstance
      }
    }
    throw new Error('Axios instance not available')
  }
  
  // Function to initialize current user ID
  const initializeCurrentUserId = async () => {
    if (process.client) {
      try {
        const userId = await getUserIdFromToken()
        currentUserId.value = userId
        // Also sync with localStorage for backward compatibility
        if (userId) {
          localStorage.setItem('userId', userId)
        }
      } catch (error) {
        console.error('Failed to get user ID from token:', error)
        // Fallback to localStorage
        currentUserId.value = localStorage.getItem('userId')
      }
    }
  }
  
  const fetchGroup = async () => {
    try {
      isLoading.value = true
      
      // Initialize current user ID first
      await initializeCurrentUserId()
      
      const axiosInstance = getAxiosInstance()
      const response = await axiosInstance.get(`/api/groups/${groupId}`) // USE PASSED INSTANCE
      group.value = response.data
      
      // Add debugging to see what's coming from API
      console.log('Group data from API:', group.value)
      console.log('User role in group:', group.value?.currentUserRole)
      console.log('Is admin flag:', group.value?.currentUserIsAdmin)
      console.log('Creator ID:', group.value?.creator_id)
      console.log('Current user ID from session:', currentUserId.value)
      
      // Check if the user has pending status
      if (group.value && (
        (group.value.membership && group.value.membership.status === 'pending') ||
        group.value.membership_status === 'pending' ||
        group.value.status === 'pending'
      )) {
        console.error('User has pending status for this group')
        
        // This will be handled by the component that calls this function
        throw new Error('You cannot access this group until your membership is approved.')
      }
      
      // If we got here, the user has access to the group
      // Save this group as the last visited group
      localStorage.setItem('lastVisitedGroupId', groupId)
      
      // If currentUserIsAdmin is not set but we have creator_id, check if current user is the creator
      if (group.value && group.value.currentUserIsAdmin === undefined) {
        console.log('Current user ID from session:', currentUserId.value)
        console.log('Comparing with creator_id:', group.value.creator_id || group.value.admin_id) // Support both for backward compatibility
        
        // Set admin flag if current user is the group creator
        if (currentUserId.value && 
            ((group.value.creator_id && currentUserId.value === group.value.creator_id) || 
             (group.value.admin_id && currentUserId.value === group.value.admin_id))) {
          console.log('Setting currentUserIsAdmin to true based on creator match')
          group.value.currentUserIsAdmin = true
        }
      }
      
      // Normalize member data if needed
      if (group.value.members) {
        group.value.members = normalizeMembers(group.value.members)
      }
      
      return group.value
    } catch (error) {
      console.error('Failed to fetch group:', error)
      
      // Enhanced detection of database connection issues
      const is404 = error.response && error.response.status === 404;
      const is500 = error.response && error.response.status === 500;
      
      const isDatabaseConnectionIssue = (
        // Connection-related errors
        (error.message && (
          error.message.includes('connection') || 
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND')
        )) ||
        // Backend error messages indicating database issues
        (error.response?.data?.error && (
          error.response.data.error.includes('connection') ||
          error.response.data.error.includes('SUPERUSER attribute') ||
          error.response.data.error.includes('remaining connection slots') ||
          error.response.data.error.includes('database') ||
          error.response.data.error.includes('FATAL')
        )) ||
        // Server errors (500) often indicate database issues
        is500 ||
        // Generic backend error without specific message (likely database issue)
        (is404 && !error.response?.data?.message)
      );
      
      // For database connection issues, add a flag to the error to prevent redirects
      if (isDatabaseConnectionIssue) {
        console.warn('Database connection issue detected in fetchGroup, flagging error')
        error.isDatabaseConnectionIssue = true;
      }
      
      // Check if this is a pending membership error
      if (error.response?.data?.pending_membership) {
        // Add the active groups to the error object so the component can handle it
        if (error.response?.data?.active_groups) {
          error.activeGroups = error.response.data.active_groups
        }
        
        // Add a flag to indicate this is a pending membership error
        error.isPendingMembership = true
      }
      
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  const updateGroupSettings = async (settings) => {
    try {
      const axiosInstance = getAxiosInstance()
      const response = await axiosInstance.put(`/api/groups/${groupId}`, settings) // USE PASSED INSTANCE
      
      // Update local group data
      Object.assign(group.value, response.data)
      
      return response.data
    } catch (error) {
      console.error('Failed to update group settings:', error)
      throw error
    }
  }
  
  const confirmDeleteGroup = async () => {
    // Remove the window.confirm since the UI component handles confirmation
    // if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
    //   return
    // }
    
    try {
      // Store the current group ID before deletion
      const currentGroupId = groupId
      
      // Set a flag in localStorage to indicate controlled deletion BEFORE the API call
      // This will be used to prevent unwanted redirects in event handlers
      localStorage.setItem('intentionalGroupDeletion', 'true')
      localStorage.setItem('deletedGroupId', currentGroupId)
      
      // Delete the group
      const axiosInstance = getAxiosInstance()
      await axiosInstance.delete(`/api/groups/${groupId}`) // USE PASSED INSTANCE
      console.log('Group deleted successfully, navigating to profile page.')
      
      // Dispatch an event to update the dashboard sidebar immediately
      window.dispatchEvent(new CustomEvent('group-data-updated', {
        detail: { 
          isDeleted: true,
          groupId: currentGroupId
        }
      }))
      
      // Clear any cached data related to this group
      localStorage.removeItem('lastVisitedGroupId')
      
      // Use a cleaner approach for navigation - a full page reload to /profile
      // This ensures a clean state without any component issues
      setTimeout(() => {
        // Use location.replace to prevent back button from returning to the deleted group
        window.location.replace('/profile')
        
        // No need to clear the flag here, it will be handled by profile page load
      }, 200)
    } catch (error) {
      // Clear the flag if deletion fails
      localStorage.removeItem('intentionalGroupDeletion')
      localStorage.removeItem('deletedGroupId')
      console.error('Failed to delete group:', error)
      throw error
    }
  }
  
  const leaveGroup = async () => {
    // Remove the window.confirm dialog that's causing the duplicate confirmation
    // if (!window.confirm('Are you sure you want to leave this group?')) {
    //   return
    // }
    
    try {
      console.log('Attempting to leave group with ID:', groupId)

      // Get the user ID directly from the Supertokens session
      const axiosInstance = getAxiosInstance()
      const userId = await Session.getUserId();

      if (!userId) {
        // This might happen if the session expired or user is not logged in
        throw new Error('User session not found or expired. Please log in again.')
      }

      console.log('Leaving group with user ID from Supertokens session:', userId)
      
      // Supertokens handles adding the auth header automatically via Axios interceptors.
      // The backend requires the userId in the path for this specific endpoint.
      await axiosInstance.delete(`/api/groups/${groupId}/members/${userId}`) // USE PASSED INSTANCE
      
      console.log('Successfully left group')
      
      // Dispatch an event to update the dashboard sidebar
      console.log('Dispatching user-left-group event...');
      window.dispatchEvent(new CustomEvent('user-left-group', { 
        detail: { groupId }
      }))
      console.log('Event dispatched.');
      
      // Navigate to the profile page instead of the dashboard
      console.log('Attempting navigation to /profile...');
      router.push('/profile')
      console.log('Navigation to /profile initiated.'); // This might not log if redirect happens immediately
    } catch (error) {
      console.error('Failed to leave group:', error)
      throw error
    }
  }
  
  // Helper function to normalize member data
  const normalizeMembers = (members) => {
    return members.map(member => {
      const userData = member.user || {}
      
      // Log the original member data to see document fields
      console.log('Normalizing member data for:', member.name || userData.name || 'Unknown Member', {
        document_file_url: member.document_file_url,
        document_file_name: member.document_file_name,
        document_file_type: member.document_file_type,
        document_file_size: member.document_file_size,
        document_uploaded_at: member.document_uploaded_at
      });
      
      return {
        id: member.id || member.userId || member.user_id || userData.id,
        name: member.name || member.username || userData.name || userData.username || 'Unknown Member',
        email: member.email || userData.email || '',
        avatar: member.avatar || member.profilePicture || member.profile_picture || userData.avatar || userData.profilePicture || userData.profile_picture,
        isAdmin: member.isAdmin || member.is_admin || member.role === 'admin' || userData.role === 'admin',
        status: member.status || 'approved', // Preserve the status field, default to 'approved' if not present
        user_id: member.user_id || member.userId || userData.id, // Preserve user_id for API calls
        user: member.user, // Preserve the original user object
        
        // Preserve document fields
        document_file_url: member.document_file_url,
        document_file_name: member.document_file_name,
        document_file_type: member.document_file_type,
        document_file_size: member.document_file_size,
        document_uploaded_at: member.document_uploaded_at
      }
    })
  }
  
  // Add detailed logging to see exactly what's happening with admin status
  const isCurrentUserAdmin = computed(() => {
    if (!group.value) {
      console.log('Group data not available yet');
      return false;
    }
    
    // Log all relevant data
    console.log('---- ADMIN CHECK DATA ----');
    console.log('Group data:', group.value);
    console.log('Current user ID from ref:', currentUserId.value);
    console.log('Creator ID from group:', group.value.creator_id || group.value.admin_id); // Support both for backward compatibility
    
    // Check all possible admin indicators
    const adminByRole = group.value?.currentUserRole === 'admin';
    const adminByFlag = group.value?.currentUserIsAdmin === true;
    const adminByUserRole = group.value?.userRole === 'admin';
    const adminInMembers = group.value?.members?.some(m => {
      const memberId = m.id || m.userId || m.user_id;
      const memberUserId = m.user?.id || m.userId || m.user_id;
      const isCurrentUser = (memberId === currentUserId.value || memberUserId === currentUserId.value);
      const isAdmin = m.isAdmin || m.is_admin || m.role === 'admin';
      
      console.log('Member admin check:', {
        memberId,
        memberUserId,
        currentUserId: currentUserId.value,
        isCurrentUser,
        isAdmin
      });
      
      return isCurrentUser && isAdmin;
    });
    const isGroupCreator = currentUserId.value && 
                          ((group.value.creator_id && 
                           (currentUserId.value === group.value.creator_id || 
                            currentUserId.value === group.value.creator_id.toString())) ||
                           (group.value.admin_id && 
                           (currentUserId.value === group.value.admin_id || 
                            currentUserId.value === group.value.admin_id.toString())));
    
    console.log('Admin checks:', {
      adminByRole,
      adminByFlag,
      adminByUserRole, 
      adminInMembers,
      isGroupCreator,
      currentUserRole: group.value?.currentUserRole,
      currentUserIsAdmin: group.value?.currentUserIsAdmin,
      userRole: group.value?.userRole
    });
    
    // If any check indicates admin status, update the group object for consistency
    const isAdmin = adminByRole || adminByFlag || adminByUserRole || adminInMembers || isGroupCreator;
    
    // Update the group object if we determined admin status but it's not set
    if (isAdmin && group.value.currentUserIsAdmin !== true) {
      console.log('Updating group.currentUserIsAdmin to true based on computed checks');
      group.value.currentUserIsAdmin = true;
    }
    
    // Expand our check to catch all possible admin indicators
    return isAdmin;
  })
  
  return {
    group,
    isLoading,
    fetchGroup,
    updateGroupSettings,
    confirmDeleteGroup,
    leaveGroup,
    isCurrentUserAdmin
  }
}