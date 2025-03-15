import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { getUserIdFromToken } from '~/src/utils/auth'
import { jwtDecode } from 'jwt-decode'

export function useGroupData(groupId) {
  const router = useRouter()
  
  const group = ref(null)
  const isLoading = ref(false)
  



  const fetchGroup = async () => {
    try {
      isLoading.value = true
      const response = await axios.get(`/groups/${groupId}`)
      group.value = response.data
      
      // Add debugging to see what's coming from API
      console.log('Group data from API:', group.value)
      console.log('User role in group:', group.value?.currentUserRole)
      console.log('Is admin flag:', group.value?.currentUserIsAdmin)
      console.log('Admin ID:', group.value?.admin_id)
      console.log('Current user ID from API:', group.value?.currentUser?.id)
      
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
      
      // If currentUserIsAdmin is not set but we have admin_id, check if current user is the admin
      if (group.value && group.value.currentUserIsAdmin === undefined) {
        // Get current user ID from local storage or auth store
        const currentUserId = localStorage.getItem('userId') // Adjust based on your auth implementation
        
        console.log('Current user ID from localStorage:', currentUserId)
        console.log('Comparing with admin_id:', group.value.admin_id)
        
        // Set admin flag if current user is the group admin
        if (currentUserId && group.value.admin_id && currentUserId === group.value.admin_id) {
          console.log('Setting currentUserIsAdmin to true based on admin_id match')
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
      const response = await axios.put(`/groups/${groupId}`, settings)
      
      // Update local group data
      Object.assign(group.value, response.data)
      
      return response.data
    } catch (error) {
      console.error('Failed to update group settings:', error)
      throw error
    }
  }
  
  const confirmDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return
    }
    
    try {
      // Store the current group ID before deletion
      const currentGroupId = groupId
      
      // Delete the group
      await axios.delete(`/groups/${groupId}`)
      
      // Get all user groups to find a valid group to navigate to
      const groupsResponse = await axios.get('/user/groups')
      const userGroups = groupsResponse.data
      
      // Get the last visited group ID from localStorage
      let lastVisitedGroupId = localStorage.getItem('lastVisitedGroupId')
      
      // If the last visited group is the one being deleted, set it to null
      if (lastVisitedGroupId === currentGroupId) {
        lastVisitedGroupId = null
      }
      
      // Filter out the deleted group and get approved groups
      const availableGroups = userGroups.filter(group => {
        // Skip the deleted group
        if (group.id === currentGroupId) return false
        
        // Skip pending groups
        if (group.membership && group.membership.status === 'pending') return false
        if (group.membership_status === 'pending') return false
        if (group.status === 'pending') return false
        
        return true
      })
      
      // Dispatch an event to update the dashboard sidebar
      window.dispatchEvent(new CustomEvent('group-data-updated'))
      
      // Navigate to the appropriate page
      if (availableGroups.length > 0) {
        // If we have a valid last visited group that's not the deleted one
        if (lastVisitedGroupId && availableGroups.some(g => g.id === lastVisitedGroupId)) {
          console.log('Navigating to last visited group:', lastVisitedGroupId)
          router.push(`/group/${lastVisitedGroupId}`)
        } else {
          // Otherwise, navigate to the first available group
          console.log('Navigating to first available group:', availableGroups[0].id)
          
          // Update the last visited group ID
          localStorage.setItem('lastVisitedGroupId', availableGroups[0].id)
          
          router.push(`/group/${availableGroups[0].id}`)
        }
      } else {
        // If no groups are available, navigate to the profile page
        console.log('No available groups, navigating to profile page')
        router.push('/profile')
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
      throw error
    }
  }
  
  const leaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return
    }
    
    try {
      console.log('Attempting to leave group with ID:', groupId)
      
      // Get the token directly
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.')
      }
      
      // Decode the token to get the user ID
      const decoded = jwtDecode(token)
      const userId = decoded.user_id
      
      if (!userId) {
        throw new Error('User ID not found in token. Please log in again.')
      }
      
      console.log('Leaving group with user ID from token:', userId)
      
      // Use the user ID from the token
      await axios.delete(`/groups/${groupId}/members/${userId}`)
      
      console.log('Successfully left group')
      
      // Dispatch an event to update the dashboard sidebar
      window.dispatchEvent(new CustomEvent('user-left-group', { 
        detail: { groupId }
      }))
      
      // Navigate to the profile page instead of the dashboard
      router.push('/profile')
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
        avatar: member.avatar || member.profilePicture || userData.avatar || userData.profilePicture,
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
    
    // Get current user ID from local storage or auth store
    const currentUserId = localStorage.getItem('userId'); // Adjust based on your auth implementation
    console.log('Current user ID from localStorage:', currentUserId);
    console.log('Admin ID from group:', group.value.admin_id);
    
    // Check all possible admin indicators
    const adminByRole = group.value?.currentUserRole === 'admin';
    const adminByFlag = group.value?.currentUserIsAdmin === true;
    const adminByUserRole = group.value?.userRole === 'admin';
    const adminInMembers = group.value?.members?.some(m => {
      const memberId = m.id || m.userId || m.user_id;
      const memberUserId = m.user?.id || m.userId || m.user_id;
      const isCurrentUser = (memberId === currentUserId || memberUserId === currentUserId);
      const isAdmin = m.isAdmin || m.is_admin || m.role === 'admin';
      
      console.log('Member admin check:', {
        memberId,
        memberUserId,
        currentUserId,
        isCurrentUser,
        isAdmin
      });
      
      return isCurrentUser && isAdmin;
    });
    const isGroupCreator = currentUserId && group.value.admin_id && 
                           (currentUserId === group.value.admin_id || 
                            currentUserId === group.value.admin_id.toString());
    
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