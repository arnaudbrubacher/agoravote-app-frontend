import { ref } from 'vue'
import axios from '~/src/utils/axios'
import { useRouter } from 'vue-router'

export function useUserProfile() {
  const router = useRouter()
  const userData = ref(null)
  const loading = ref(true)
  const error = ref(null)
  const commonGroups = ref([])
  
  // Fetch current user's profile
  const fetchCurrentUserProfile = async () => {
    try {
      loading.value = true
      error.value = null
      
      console.log('Fetching current user profile...')
      const response = await axios.get('/users/me')
      console.log('Current user profile response:', response.data)
      
      userData.value = response.data
      console.log('Updated userData.value:', userData.value)
      
      return userData.value
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      error.value = err.response?.data?.error || 'Failed to load user profile'
      
      if (err.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        router.push('/auth')
      }
    } finally {
      loading.value = false
    }
  }
  
  // Fetch another user's profile
  const fetchUserProfile = async (userId) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await axios.get(`/user/profile/${userId}`)
      userData.value = response.data
      
      // Check if common groups data is available
      if (response.data.commonGroups) {
        commonGroups.value = response.data.commonGroups
      }
      
      return userData.value
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      error.value = err.response?.data?.error || 'Failed to load user profile'
    } finally {
      loading.value = false
    }
  }
  
  // Update profile picture
  const updateProfilePicture = async (file) => {
    try {
      if (!file) return null
      
      // Create form data
      const formData = new FormData()
      formData.append('profile_picture', file)
      
      // Get user ID from localStorage
      const userId = localStorage.getItem('userId')
      
      console.log('Uploading profile picture for user:', userId)
      
      // Upload the file
      const response = await axios.post(`/users/${userId}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      console.log('Upload response:', response.data)
      
      // Get the profile picture path from the response
      const profilePicturePath = response.data.profile_picture
      console.log('Profile picture path:', profilePicturePath)
      
      // Update the user data with new profile picture
      userData.value = {
        ...userData.value,
        profile_picture: profilePicturePath
      }
      
      console.log('Updated userData with new profile picture:', userData.value)
      
      return profilePicturePath
    } catch (error) {
      console.error('Failed to upload profile picture:', error)
      throw error
    }
  }
  
  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      const userId = localStorage.getItem('userId')
      
      await axios.post(`/users/${userId}/resend-verification`)
      return true
    } catch (error) {
      console.error('Failed to resend verification email:', error)
      throw error
    }
  }
  
  return {
    userData,
    loading,
    error,
    commonGroups,
    fetchCurrentUserProfile,
    fetchUserProfile,
    updateProfilePicture,
    resendVerificationEmail
  }
} 