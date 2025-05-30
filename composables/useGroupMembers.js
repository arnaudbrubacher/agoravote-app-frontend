import { ref } from 'vue'
// import axios from '~/src/utils/axios' // REMOVED OLD AXIOS IMPORT
import { useAlert } from '@/composables/useAlert'
import { useNuxtApp } from '#app'

export function useGroupMembers(groupId, group, fetchGroup) {
  const currentUser = ref(null)
  const isLoadingMembers = ref(false)
  const memberSearchQuery = ref('')
  
  // Initialize alert dialog system
  const { alert: showAlert } = useAlert()

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
      const response = await getAxiosInstance().post(`/api/groups/${groupId}/members`, requestData) // USE PASSED INSTANCE
      
      // Show success message
      await showAlert(`Member ${memberData.email} added successfully`, 'Success')
      
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
      await showAlert('Failed to add member: ' + (err.response?.data?.error || err.message), 'Error')
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
      const response = await getAxiosInstance().post(`/api/groups/${groupId}/members/upload-csv`, formData, { // USE PASSED INSTANCE
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
      
      // Analyze and categorize the results for a comprehensive summary
      const results = response.data.results || []
      const totalEmails = results.length
      
      // Categorize results
      const invitedUsers = results.filter(r => r.success && (r.message.includes('created and email sent') || r.message.includes('sent successfully')))
      const alreadyMembers = results.filter(r => !r.success && r.message.includes('already an active member'))
      const existingInvites = results.filter(r => !r.success && r.message.includes('active invitation already exists'))
      const emailDisabledInvites = results.filter(r => r.success && r.message.includes('email sending is disabled'))
      const otherFailures = results.filter(r => !r.success && 
        !r.message.includes('already an active member') && 
        !r.message.includes('active invitation already exists'))
      
      // Build comprehensive summary message
      let title = 'Member Import Summary'
      let message = `📊 **Processing Summary** (${totalEmails} email${totalEmails === 1 ? '' : 's'} processed)\n\n`
      
      // Successful invitations
      if (invitedUsers.length > 0) {
        message += `✅ **${invitedUsers.length} User${invitedUsers.length === 1 ? '' : 's'} Invited Successfully:**\n`
        message += invitedUsers.map(r => `   • ${r.email}`).join('\n')
        message += '\n\n'
      }
      
      // Invitations created but email disabled
      if (emailDisabledInvites.length > 0) {
        message += `📧 **${emailDisabledInvites.length} Invitation${emailDisabledInvites.length === 1 ? '' : 's'} Created (Email Disabled):**\n`
        message += emailDisabledInvites.map(r => `   • ${r.email}`).join('\n')
        message += '\n\n'
      }
      
      // Already existing members
      if (alreadyMembers.length > 0) {
        message += `👥 **${alreadyMembers.length} User${alreadyMembers.length === 1 ? '' : 's'} Already Group Member${alreadyMembers.length === 1 ? '' : 's'}:**\n`
        message += alreadyMembers.map(r => `   • ${r.email}`).join('\n')
        message += '\n\n'
      }
      
      // Existing pending invitations
      if (existingInvites.length > 0) {
        message += `⏳ **${existingInvites.length} User${existingInvites.length === 1 ? '' : 's'} Already Invited:**\n`
        message += existingInvites.map(r => `   • ${r.email}`).join('\n')
        message += '\n\n'
      }
      
      // Other failures
      if (otherFailures.length > 0) {
        message += `❌ **${otherFailures.length} Invitation${otherFailures.length === 1 ? '' : 's'} Failed:**\n`
        message += otherFailures.map(r => `   • ${r.email} - ${r.message}`).join('\n')
        message += '\n\n'
      }
      
      // Summary line
      const successCount = invitedUsers.length + emailDisabledInvites.length
      if (successCount > 0 && (alreadyMembers.length > 0 || existingInvites.length > 0 || otherFailures.length > 0)) {
        message += `📈 **Result:** ${successCount} new invitation${successCount === 1 ? '' : 's'} sent, ${alreadyMembers.length + existingInvites.length + otherFailures.length} skipped or failed.`
      } else if (successCount > 0) {
        message += `🎉 **All invitations sent successfully!**`
        title = 'Invitations Sent Successfully!'
      } else if (alreadyMembers.length === totalEmails) {
        message += `ℹ️ **All users are already group members.**`
        title = 'No New Invitations Needed'
      } else {
        message += `⚠️ **No invitations could be sent.**`
        title = 'Import Failed'
      }
      
      // Log detailed errors for debugging
      if (otherFailures.length > 0) {
        console.group('CSV Import - Detailed Errors:')
        otherFailures.forEach(r => console.warn(`Failed invitation for ${r.email}: ${r.message}`))
        console.groupEnd()
      }
      
      console.log('About to show alert with:', { title, message })
      await showAlert(message, title)
      console.log('Alert should have been shown')

      return response.data
    } catch (err) {
      console.error('Failed to process file:', err)
      
      // Provide more specific error messaging
      let errorMessage = 'Failed to process file'
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      
      // Check for specific error types
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in and try again.'
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to invite members to this group.'
      } else if (err.response?.status === 413) {
        errorMessage = 'File is too large. Please use a smaller file.'
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.'
      }
      
      await showAlert(errorMessage, 'Import Error')

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
      await showAlert(`Invitation sent to ${user.name || user.email}. They will need to accept it.`, 'Info')
    } else {
      console.log('User was added directly')
      await showAlert(`${user.name || user.email} added to the group successfully`, 'Success')
    }
    
    // DO NOT call fetchGroup() here as it can cause 404 redirect issues due to temporary DB connection problems
    // The individual member list components handle their own refreshes via events
    
    // Dispatch events to refresh the relevant member lists
    window.dispatchEvent(new CustomEvent('refresh-pending-members', {
      detail: { groupId }
    }))
    
    window.dispatchEvent(new CustomEvent('refresh-invited-members', {
      detail: { groupId }
    }))
    
    window.dispatchEvent(new CustomEvent('refresh-members-list', {
      detail: { groupId }
    }))
  }

  // Remove member from group (no confirmation - handled by parent)
  const handleMemberRemove = async (member) => {
    console.log('useGroupMembers - Member removal function called with:', member);
    
    try {
      // Get the correct user ID - prioritize user_id since that's the column name in the database
      const userId = member.user_id || member.userId || (member.user && member.user.id) || member.id;
      
      console.log('useGroupMembers - Removing member with details:', {
        member,
        userId,
        originalId: member.id,
        groupId
      });
      
      // Call API to remove member using the user ID
      console.log(`useGroupMembers - Making API call to: /api/groups/${groupId}/members/${userId}`);
      const response = await getAxiosInstance().delete(`/api/groups/${groupId}/members/${userId}`);
      console.log('useGroupMembers - API response:', response.data);
      
      // Refresh group data to update members list
      console.log('useGroupMembers - Refreshing group data');
      await fetchGroup();
      console.log('useGroupMembers - Group data refreshed');
      
      return response.data;
    } catch (err) {
      console.error('useGroupMembers - Failed to remove member:', err);
      console.error('useGroupMembers - Error response:', err.response?.data);
      await showAlert('Failed to remove member: ' + (err.response?.data?.error || err.message), 'Error')
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
      showAlert('Cannot invite member: Group ID is missing.', 'Error');
      return; // Or throw error
    }
    if (!email) {
      console.error('Email is missing');
      showAlert('Cannot invite member: Email is missing.', 'Error');
      return; // Or throw error
    }

    try {
      console.log(`[useGroupMembers] Attempting axiosInstance.post to /api/groups/${groupId}/invite`);
      // Call API to invite member by email
      const response = await getAxiosInstance().post(`/api/groups/${groupId}/invite`, { email }); // USE PASSED INSTANCE
      console.log("[useGroupMembers] axiosInstance.post successful:", response.data);

      // Show success message (backend currently returns generic success)
      await showAlert(`Invitation request sent for ${email}. They will receive an email if the address is valid and not already a member.`, 'Invitation Sent')

      // DO NOT call fetchGroup() here as it can cause 404 redirect issues due to temporary DB connection problems
      // The individual member list components handle their own refreshes via events
      
      // Dispatch events to refresh invited and pending members lists
      window.dispatchEvent(new CustomEvent('refresh-invited-members', {
        detail: { groupId, email }
      }))
      
      window.dispatchEvent(new CustomEvent('refresh-pending-members', {
        detail: { groupId, email }
      }))
      
      // Dispatch general group data updated event (without triggering fetchGroup)
      window.dispatchEvent(new CustomEvent('group-data-updated', {
        detail: { action: 'invite-sent', groupId, email }
      }))

      console.log(`[useGroupMembers] Invitation sent successfully for ${email}. Events dispatched for list refreshes.`);

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
      const response = await getAxiosInstance().patch(`/api/groups/${groupId}/members/${memberId}/promote`); // USE PASSED INSTANCE
      
      // Show success message
      await showAlert(`${member.name} has been promoted to admin.`, 'Success')
      
      // Refresh group data to update members list
      await fetchGroup();
    } catch (err) {
      console.error('Failed to promote member:', err);
      await showAlert('Failed to promote member: ' + (err.response?.data?.error || err.message), 'Error')
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
      const response = await getAxiosInstance().patch(`/api/groups/${groupId}/members/${memberId}/demote`); // USE PASSED INSTANCE
      
      // Show success message
      await showAlert(`${member.name} has been demoted to member.`, 'Success')
      
      // Refresh group data to update members list
      await fetchGroup();
    } catch (err) {
      console.error('Failed to demote member:', err);
      await showAlert('Failed to demote member: ' + (err.response?.data?.error || err.message), 'Error')
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