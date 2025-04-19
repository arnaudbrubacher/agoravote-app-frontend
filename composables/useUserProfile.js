import { ref, computed } from 'vue'
import axios from '~/src/utils/axios'
import { useRouter } from 'vue-router'

export function useUserProfile() {
  const router = useRouter()
  const userData = ref(null)
  const loading = ref(true)
  const error = ref(null)
  const commonGroups = ref([])
  
  // Safe localStorage functions
  const getLocalStorage = (key, defaultValue = null) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || defaultValue;
    }
    return defaultValue;
  };

  const setLocalStorage = (key, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  };

  const removeLocalStorage = (key) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  };
  
  // Fetch current user's profile
  const fetchCurrentUserProfile = async () => {
    try {
      loading.value = true
      error.value = null
      const userId = getLocalStorage('userId')
      
      if (!userId) {
        console.error('No user ID found in localStorage')
        error.value = 'No active session found'
        router.push('/auth')
        return null
      }
      
      // Try first endpoint format
      try {
        const response = await axios.get(`/users/${userId}`)
        userData.value = response.data.user || response.data
        return userData.value
      } catch (err) {
        console.log('First endpoint attempt failed, trying alternative endpoint...')
        
        // Try second endpoint format
        try {
          const response = await axios.get(`/user/${userId}`)
          userData.value = response.data.user || response.data
          return userData.value
        } catch (err) {
          console.log('Second endpoint attempt failed, trying /user/profile/:id endpoint...')
          
          // Try third endpoint format - this is the correct backend endpoint
          const response = await axios.get(`/user/profile/${userId}`)
          console.log('Response from /user/profile/:id endpoint:', response.data)
          userData.value = response.data.user || response.data
          return userData.value
        }
      }
    } catch (err) {
      console.error('Failed to fetch current user profile:', err)
      error.value = err.response?.data?.error || 'Failed to load user profile'
      
      if (err.response?.status === 401) {
        // Handle unauthorized access
        removeLocalStorage('token')
        removeLocalStorage('userId')
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
      
      // Try first endpoint format
      try {
        const response = await axios.get(`/users/${userId}`)
        userData.value = response.data.user || response.data
        
        // Check if common groups data is available
        if (response.data.commonGroups) {
          commonGroups.value = response.data.commonGroups
        }
        
        return userData.value
      } catch (err) {
        console.log('First endpoint attempt failed, trying alternative endpoint...')
        
        // Try second endpoint format
        try {
          const response = await axios.get(`/user/${userId}`)
          userData.value = response.data.user || response.data
          
          // Check if common groups data is available
          if (response.data.commonGroups) {
            commonGroups.value = response.data.commonGroups
          }
          
          return userData.value
        } catch (err) {
          console.log('Second endpoint attempt failed, trying /user/profile/:id endpoint...')
          
          // Try third endpoint format - this is the correct backend endpoint
          const response = await axios.get(`/user/profile/${userId}`)
          userData.value = response.data.user || response.data
          
          // Check if common groups data is available
          if (response.data.commonGroups) {
            commonGroups.value = response.data.commonGroups
          }
          
          return userData.value
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      error.value = err.response?.data?.error || 'Failed to load user profile'
    } finally {
      loading.value = false
    }
  }
  
  // Function to create a user profile if it doesn't exist
  const createUserProfile = async () => {
    const userId = getLocalStorage('userId')
    if (!userId) {
      throw new Error('No user ID available to create profile')
    }
    
    // Get basic user info from localStorage if available
    const name = getLocalStorage('userName') || 'User'
    const email = getLocalStorage('userEmail') || ''
    
    console.log('Creating user profile for ID:', userId)
    
    loading.value = true
    error.value = null
    
    try {
      // Try creating user profile with different endpoint formats
      // since we're not sure which one the backend uses
      let response = null
      const userData = {
        id: userId,
        name,
        email,
        bio: '',
        profile_picture: ''
      }
      
      try {
        response = await axios.post('/users', userData)
      } catch (err) {
        console.log('First endpoint attempt failed, trying alternate endpoint')
        try {
          response = await axios.post('/user', userData)
        } catch (err2) {
          console.log('Second endpoint attempt failed, trying final endpoint')
          response = await axios.post('/user/profile', userData)
        }
      }
      
      console.log('User profile created:', response.data)
      userData.value = response.data
      return userData.value
    } catch (err) {
      console.error('Failed to create user profile:', err)
      error.value = err.response?.data?.error || 'Failed to create user profile'
      throw err
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
      const userId = getLocalStorage('userId')
      
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
      const userId = getLocalStorage('userId')
      
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
    createUserProfile,
    updateProfilePicture,
    resendVerificationEmail
  }
} 