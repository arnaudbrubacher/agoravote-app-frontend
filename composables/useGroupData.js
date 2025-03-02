import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'

export function useGroupData(groupId) {
  const router = useRouter()
  
  const group = ref(null)
  const isLoading = ref(false)
  
  const fetchGroup = async () => {
    try {
      isLoading.value = true
      const response = await axios.get(`/groups/${groupId}`)
      group.value = response.data
      
      // Normalize member data if needed
      if (group.value.members) {
        group.value.members = normalizeMembers(group.value.members)
      }
      
      return group.value
    } catch (error) {
      console.error('Failed to fetch group:', error)
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
      await axios.delete(`/groups/${groupId}`)
      router.push('/dashboard')
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
      await axios.delete(`/groups/${groupId}/members/me`)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to leave group:', error)
      throw error
    }
  }
  
  // Helper function to normalize member data
  const normalizeMembers = (members) => {
    return members.map(member => {
      const userData = member.user || {}
      
      return {
        id: member.id || member.userId || member.user_id || userData.id,
        name: member.name || member.username || userData.name || userData.username || 'Unknown Member',
        email: member.email || userData.email || '',
        avatar: member.avatar || member.profilePicture || userData.avatar || userData.profilePicture,
        isAdmin: member.isAdmin || member.is_admin || member.role === 'admin' || userData.role === 'admin'
      }
    })
  }
  
  // Check if current user is admin
  const isCurrentUserAdmin = computed(() => {
    if (!group.value?.currentUserRole) return false
    return group.value.currentUserRole === 'admin'
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