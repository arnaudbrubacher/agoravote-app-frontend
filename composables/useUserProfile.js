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
      
      // No need to get userId from localStorage for /users/me
      // const userId = getLocalStorage('userId') 
      // if (!userId) { ... }

      // Directly call the /users/me endpoint
      const response = await axios.get('/users/me')
      console.log('Response from /users/me endpoint:', response.data)
      // Assuming the response data IS the user object directly
      userData.value = response.data 
      return userData.value

    } catch (err) {
      console.error('Failed to fetch current user profile (/users/me):', err)
      error.value = err.response?.data?.error || 'Failed to load user profile from /users/me'
      userData.value = null; // Ensure userData is null on error
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Handle unauthorized/forbidden access
        console.log(`Received ${err.response.status}, clearing auth data and redirecting.`)
        removeLocalStorage('token') // Assuming 'token' is used
        removeLocalStorage('userId') // Remove stored userId if present
        // Add other relevant localStorage removals if necessary
        router.push('/auth')
      }
      // Return null or throw error depending on desired handling downstream
      return null;
    } finally {
      loading.value = false
    }
  }
  
  // Fetch another user's profile
  const fetchUserProfile = async (userId) => {
    try {
      loading.value = true
      error.value = null
      
      // Assuming /user/profile/:id is the correct public endpoint
      // Remove the unnecessary fallbacks if they are incorrect
      const response = await axios.get(`/user/profile/${userId}`)
      userData.value = response.data.user || response.data // Adjust based on actual response structure
      
      // Check if common groups data is available
      if (response.data.commonGroups) {
        commonGroups.value = response.data.commonGroups
      }
      
      return userData.value

    } catch (err) {
       console.error(`Failed to fetch user profile for ID ${userId}:`, err)
       error.value = err.response?.data?.error || `Failed to load profile for ${userId}`
       // Don't clear current user's data here
       return null; // Return null on failure
    } finally {
      loading.value = false
    }
  }
  
  // Function to create a user profile if it doesn't exist
  const createUserProfile = async (userId, name, email) => {
    if (!userId || !email) { // Require ID and email for creation
      console.error('Cannot create profile: Missing userId or email')
      error.value = 'User ID or email not found for profile creation.'
      return null; 
    }
    
    console.log('Attempting to create/update user profile for ID:', userId)
    
    loading.value = true
    error.value = null
    
    try {
      // The backend route is POST /users
      const userDataPayload = {
        id: userId, // Send the SuperTokens ID
        name,
        email,
        // Add other fields if needed by the backend /users endpoint
      }
      
      const response = await axios.post('/users', userDataPayload)
      
      console.log('User profile created/updated via POST /users:', response.data)
      // Assume response.data contains the created/updated user object
      userData.value = response.data 
      return userData.value
    } catch (err) {
      console.error('Failed to create/update user profile via POST /users:', err)
      error.value = err.response?.data?.error || 'Failed to create/update user profile'
      // Don't set userData.value to null here, might overwrite existing data
      throw err // Re-throw for caller handling
    } finally {
      loading.value = false
    }
  }
  
  // Update profile picture
  const updateProfilePicture = async (userId, file) => {
    try {
      if (!file) return null
      
      // Create form data
      const formData = new FormData()
      formData.append('profile_picture', file)
      
      // Use the provided userId
      if (!userId) {
          console.error('User ID not provided for profile picture upload')
          throw new Error('User ID is required to upload profile picture.')
      }
      
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
  const resendVerificationEmail = async (userId) => {
    try {
      // const userId = getLocalStorage('userId') // Removed
      
      // Use the provided userId
      if (!userId) {
          console.error('User ID not provided for resend verification email')
          throw new Error('User ID is required to resend verification email.')
      }
      
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