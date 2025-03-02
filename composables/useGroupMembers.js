import { ref } from 'vue'
import axios from '~/src/utils/axios'

export function useGroupMembers(groupId, group, fetchGroup) {
  const currentUser = ref(null)
  const isLoadingMembers = ref(false)
  const memberSearchQuery = ref('')

  // Fetch current user information
  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/users/me')
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
      const response = await axios.post(`/groups/${groupId}/members`, requestData)
      
      // Show success message
      alert(`Member ${memberData.email} added successfully`)
      
      // Refresh members list
      await fetchGroup()
      
      return response.data
    } catch (err) {
      console.error('Failed to add member:', err)
      alert('Failed to add member: ' + (err.response?.data?.error || err.message))
      throw err
    }
  }

  // Import members via CSV
  const handleCsvImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    try {
      const formData = new FormData()
      formData.append('csv', file)
      
      const response = await axios.post(`/groups/${groupId}/members/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Refresh members list
      await fetchGroup()
      
      console.log('Members imported successfully:', response.data)
      alert('Members imported successfully')
      
      return response.data
    } catch (err) {
      console.error('Failed to import members:', err)
      alert('Failed to import members: ' + (err.response?.data?.error || err.message))
      
      // Reset the file input
      event.target.value = ''
      throw err
    }
  }

  // Handle user added via search
  const handleUserAdded = async (user) => {
    console.log('User added via search:', user)
    
    // Refresh the group data to update the members list
    await fetchGroup()
  }

  // Promote member to admin
  const promoteMember = async (member) => {
    try {
      // Call API to promote member
      await axios.put(`/groups/${groupId}/members/${member.id}`, { 
        isAdmin: true 
      })
      
      // Show success message
      alert(`${member.name} is now an admin`)
      
      // Refresh group data to update members list
      await fetchGroup()
    } catch (err) {
      console.error('Failed to promote member:', err)
      alert('Failed to promote member: ' + (err.response?.data?.error || err.message))
      throw err
    }
  }

  // Demote member from admin
  const demoteMember = async (member) => {
    try {
      // Call API to demote member
      await axios.put(`/groups/${groupId}/members/${member.id}`, { 
        isAdmin: false 
      })
      
      // Show success message
      alert(`${member.name} is no longer an admin`)
      
      // Refresh group data to update members list
      await fetchGroup()
    } catch (err) {
      console.error('Failed to demote member:', err)
      alert('Failed to demote member: ' + (err.response?.data?.error || err.message))
      throw err
    }
  }

  // Remove member from group
  const removeMember = async (member) => {
    try {
      // Confirm removal
      if (!confirm(`Are you sure you want to remove ${member.name} from this group?`)) {
        return
      }
      
      // Call API to remove member
      await axios.delete(`/groups/${groupId}/members/${member.id}`)
      
      // Show success message
      alert(`${member.name} has been removed from the group`)
      
      // Refresh group data to update members list
      await fetchGroup()
    } catch (err) {
      console.error('Failed to remove member:', err)
      alert('Failed to remove member: ' + (err.response?.data?.error || err.message))
      throw err
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

  return {
    currentUser,
    isLoadingMembers,
    memberSearchQuery,
    fetchCurrentUser,
    addMember,
    handleCsvImport,
    handleUserAdded,
    promoteMember,
    demoteMember,
    removeMember,
    getMemberInitial,
    isCurrentMember
  }
}