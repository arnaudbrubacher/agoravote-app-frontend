import { ref } from 'vue'
// import axios from '~/src/utils/axios' // REMOVED OLD AXIOS IMPORT
import { useAlertDialog } from '@/composables/useAlertDialog'
import { useNuxtApp } from '#app'

export function useGroupMembers(groupId, group, fetchGroup) {
  const currentUser = ref(null)
  const isLoadingMembers = ref(false)
  const memberSearchQuery = ref('')
  
  // Initialize alert dialog system
  const { showAlert, showConfirm } = useAlertDialog()

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

  // Fetch current user information
  const fetchCurrentUser = async () => {
    try {
      const response = await getAxiosInstance().get('/users/me') // USE PASSED INSTANCE
      currentUser.value = response.data
      console.log("Current user:", currentUser.value)
      return currentUser.value
    } catch (err) {
      console.error('Failed to fetch current user:', err)
      // Handle error - could return false or throw
      if (err.response?.status === 401) {
        // User is not authenticated
        return null
      }
      throw err
    }
  }

  // Add a member by email
  const addMember = async (memberData) => {
    try {
      // Format the request data
      const requestData = {
        email: memberData.email,
        isAdmin: memberData.role === 'admin'
      }
      
      // Call API to add member
      const response = await getAxiosInstance().post(`/groups/${groupId}/members`, requestData) // USE PASSED INSTANCE
      
      // Show success message
      showAlert('Success', `Member ${memberData.email} added successfully`)
      
      // Update admin status if provided in the response
      if (response.data.currentUserIsAdmin !== undefined) {
        console.log('Received currentUserIsAdmin from API:', response.data.currentUserIsAdmin)
        if (group.value) {
          console.log('Updating group.currentUserIsAdmin from', group.value.currentUserIsAdmin, 'to', response.data.currentUserIsAdmin)
          group.value.currentUserIsAdmin = response.data.currentUserIsAdmin
        }
      }
      
      // Refresh members list
      await fetchGroup()
      
      // Dispatch an event to notify components that group data has been updated
      window.dispatchEvent(new CustomEvent('group-data-updated'))
      
      return response.data
    } catch (err) {
      console.error('Failed to add member:', err)
      showAlert('Error', 'Failed to add member: ' + (err.response?.data?.error || err.message))
      throw err
    }
  }

  // Import members via CSV or XLSX
  const handleCsvImport = async (file) => {
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use the correct endpoint for CSV/XLSX upload
      const response = await getAxiosInstance().post(`/groups/${groupId}/members/upload-csv`, formData, { // USE PASSED INSTANCE
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Refresh members list (and pending/invited lists)
      await fetchGroup()

      // Dispatch event to refresh invited/pending lists in MembersTab
      window.dispatchEvent(new CustomEvent('refresh-pending-members', {
        detail: { groupId }
      }))

      console.log('File processed successfully:', response.data)
      // Provide more detailed feedback based on the response
      const results = response.data.results || []
      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount
      let message = `File processed. ${successCount} invitations sent successfully.`
      if (failCount > 0) {
        message += ` ${failCount} invitations failed. Check console for details.`
        // Optionally log detailed errors
        results.filter(r => !r.success).forEach(r => console.warn(`Failed invitation for ${r.email}: ${r.message}`))
      }
      showAlert('Success', message)

      return response.data
    } catch (err) {
      console.error('Failed to process file:', err)
      showAlert('Error', 'Failed to process file: ' + (err.response?.data?.error || err.message))

      // Resetting the file input might be harder here as we don't have the original event
      // Consider handling this in the component that calls this function if needed.
      throw err
    }
  }

  // Handle user added via search
  const handleUserAdded = async (user) => {
    console.log('User added via search:', user)
    
    // Check if the user was added as pending
    if (user.status === 'pending') {
      console.log('User was invited with pending status')
      showAlert('Info', `Invitation sent to ${user.name || user.email}. They will need to accept it.`)
    } else {
      console.log('User was added directly')
      showAlert('Success', `${user.name || user.email} added to the group successfully`)
    }
    
    // Refresh the group data to update the members list
    await fetchGroup()
    
    // Dispatch an event to refresh the pending members list
    window.dispatchEvent(new CustomEvent('refresh-pending-members', {
      detail: { groupId }
    }))
  }

  // Remove member from group
  const handleMemberRemove = async (member) => {
    console.log('useGroupMembers - Member removal function called with:', member);
    try {
      // Confirm removal
      console.log('useGroupMembers - Showing confirmation dialog');
      
      // Replace browser confirm with shadcn alert dialog
      showConfirm(
        'Confirm Removal', 
        `Are you sure you want to remove ${member.name} from this group?`,
        async () => {
          // Get the correct user ID - prioritize user_id since that's the column name in the database
          const userId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
          
          console.log('useGroupMembers - Removing member with details:', {
            member,
            userId,
            originalId: member.id,
            groupId
          });
          
          // Call API to remove member using the user ID
          console.log(`useGroupMembers - Making API call to: /groups/${groupId}/members/${userId}`);
          const response = await getAxiosInstance().delete(`/groups/${groupId}/members/${userId}`); // USE PASSED INSTANCE
          console.log('useGroupMembers - API response:', response.data);
          
          // Show success message
          showAlert('Success', `${member.name} has been removed from the group`);
          
          // Refresh group data to update members list
          console.log('useGroupMembers - Refreshing group data');
          await fetchGroup();
          console.log('useGroupMembers - Group data refreshed');
        },
        () => {
          console.log('useGroupMembers - User cancelled member removal');
        }
      );
    } catch (err) {
      console.error('useGroupMembers - Failed to remove member:', err);
      console.error('useGroupMembers - Error response:', err.response?.data);
      showAlert('Error', 'Failed to remove member: ' + (err.response?.data?.error || err.message));
      throw err;
    }
  }

  // Helper: Get member's initial letter
  const getMemberInitial = (member) => {
    if (!member || !member.name || member.name === 'Unknown Member') return 'U'
    return member.name.charAt(0).toUpperCase()
  }

  // Helper: Check if member is the current user
  const isCurrentMember = (member) => {
    if (!currentUser.value || !member) return false
    
    return member.id === currentUser.value.id || 
           member.userId === currentUser.value.id || 
           member.user_id === currentUser.value.id
  }

  // Invite member by email
  const inviteMemberByEmail = async (email) => {
    console.log("[useGroupMembers] inviteMemberByEmail called with email:", email);
    if (!groupId) {
      console.error('Group ID is missing');
      showAlert('Error', 'Cannot invite member: Group ID is missing.');
      return; // Or throw error
    }
    if (!email) {
      console.error('Email is missing');
      showAlert('Error', 'Cannot invite member: Email is missing.');
      return; // Or throw error
    }

    try {
      console.log(`[useGroupMembers] Attempting axiosInstance.post to /groups/${groupId}/invite`);
      // Call API to invite member by email
      const response = await getAxiosInstance().post(`/groups/${groupId}/invite`, { email }); // USE PASSED INSTANCE
      console.log("[useGroupMembers] axiosInstance.post successful:", response.data);

      // Show success message (backend currently returns generic success)
      showAlert('Invitation Sent', `Invitation request sent for ${email}. They will receive an email if the address is valid and not already a member.`);

      return response.data; // Return data which might be just { message: "..." }
    } catch (err) {
      console.error('[useGroupMembers] Failed to invite member by email:', err);
      
      // Extract specific error message from response
      let errorMessage = 'Failed to send invitation';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      // Customize error messages based on backend errors
      if (errorMessage.includes('this user is already an active member')) {
        errorMessage = 'This user is already a member of the group.';
      } else if (errorMessage.includes('an active invitation already exists')) {
        errorMessage = 'An active invitation already exists for this email address.';
      }
      
      // Rethrow with enhanced message for the handler in [Id].vue
      throw new Error(errorMessage);
    }
  }

  // Promote member to admin
  const promoteMember = async (member) => {
    try {
      // Get the correct member ID for the backend
      const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
      
      console.log('useGroupMembers - Promoting member with details:', {
        member,
        memberId,
        groupId
      });
      
      // Use the correct URL path with consistent parameter names
      const response = await getAxiosInstance().patch(`/groups/${groupId}/members/${memberId}/promote`); // USE PASSED INSTANCE
      
      // Show success message
      showAlert('Success', `${member.name} has been promoted to admin.`);
      
      // Refresh group data to update members list
      await fetchGroup();
    } catch (err) {
      console.error('Failed to promote member:', err);
      showAlert('Error', 'Failed to promote member: ' + (err.response?.data?.error || err.message));
      throw err;
    }
  }

  // Demote member from admin
  const demoteMember = async (member) => {
    try {
      // Get the correct member ID for the backend
      const memberId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
      
      console.log('useGroupMembers - Demoting member with details:', {
        member,
        memberId,
        groupId
      });
      
      // Use the correct URL path with consistent parameter names
      const response = await getAxiosInstance().patch(`/groups/${groupId}/members/${memberId}/demote`); // USE PASSED INSTANCE
      
      // Show success message
      showAlert('Success', `${member.name} has been demoted to member.`);
      
      // Refresh group data to update members list
      await fetchGroup();
    } catch (err) {
      console.error('Failed to demote member:', err);
      showAlert('Error', 'Failed to demote member: ' + (err.response?.data?.error || err.message));
      throw err;
    }
  }

  return {
    currentUser,
    isLoadingMembers,
    memberSearchQuery,
    fetchCurrentUser,
    addMember,
    inviteMemberByEmail,
    handleCsvImport,
    handleUserAdded,
    promoteMember,
    demoteMember,
    handleMemberRemove,
    getMemberInitial,
    isCurrentMember
  }
}