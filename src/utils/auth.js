import axios from './axios'
import { jwtDecode } from 'jwt-decode' // Use named import

export const login = async (email, password) => {
  try {
    const response = await axios.post('/login', {
      email,
      password
    })
    const { token, userId } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('userId', userId)
    return { token, userId }
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

export const signup = async (name, email, password) => {
  try {
    const response = await axios.post('/signup', {
      name,
      email,
      password
    })
    const { token, userId } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('userId', userId)
    return { token, userId }
  } catch (error) {
    console.error('Signup failed:', error)
    throw error
  }
}

export const getUserIdFromToken = () => {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const decoded = jwtDecode(token) // Fixed: use jwtDecode instead of decode
    return decoded.user_id
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}

export const fetchUserProfile = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) throw new Error('User ID not found in local storage')

  try {
    const response = await axios.get(`/user/profile/${userId}`)
    console.log('Request URL:', `/user/profile/${userId}`)
    console.log('Response:', response.data)
    return response.data.user
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    throw error
  }
}

export const deleteUserAccount = async () => {
  const userId = localStorage.getItem('userId')
  if (!userId) throw new Error('User ID not found in local storage')

  try {
    const response = await axios.delete(`/user/${userId}`)
    console.log('Request URL:', `/user/${userId}`)
    console.log('Response:', response.data)
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
  } catch (error) {
    console.error('Failed to delete user account:', error)
    throw error
  }
}

// Function to change user password
export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  if (!userId) {
    userId = localStorage.getItem('userId')
    if (!userId) throw new Error('User ID not found in local storage')
  }

  // Validate userId is not undefined or null
  if (userId === 'undefined' || userId === 'null') {
    console.error('Invalid userId:', userId)
    throw new Error('Invalid user ID')
  }

  console.log(`Changing password for user with ID: ${userId}`)
  console.log(`Current password length: ${currentPassword.length}`)
  console.log(`New password length: ${newPassword.length}`)

  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Authentication token not found')

    // Backend API endpoint: PUT /users/:id/password
    // Required request body:
    // {
    //   current_password: string,
    //   new_password: string
    // }
    // Expected responses:
    // 200 OK: Password changed successfully
    // 400 Bad Request: Invalid input
    // 401 Unauthorized: Current password is incorrect
    // 403 Forbidden: Not authorized to change this user's password
    // 404 Not Found: User not found
    // 500 Internal Server Error: Server error
    
    // Use the axios instance with the base URL and interceptors
    const response = await axios.put(`/users/${userId}/password`, {
      current_password: currentPassword,
      new_password: newPassword
    })
    
    console.log('Password change response:', response.data)
    return response.data
  } catch (error) {
    console.error('Failed to change user password:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    throw error
  }
}

// Function to change group password
export const changeGroupPassword = async (groupId, currentPassword, newPassword) => {
  if (!groupId) throw new Error('Group ID is required')

  console.log(`Changing password for group ${groupId}`)
  console.log(`Current password length: ${currentPassword.length}`)
  console.log(`New password length: ${newPassword.length}`)

  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Authentication token not found')

    // Backend API endpoint: PUT /groups/:id/password
    // Required request body:
    // {
    //   current_password: string,
    //   new_password: string
    // }
    // Expected responses:
    // 200 OK: Password changed successfully
    // 400 Bad Request: Invalid input
    // 401 Unauthorized: Current password is incorrect
    // 403 Forbidden: Not authorized to change this group's password
    // 404 Not Found: Group not found
    // 500 Internal Server Error: Server error
    
    // Use the axios instance with the base URL and interceptors
    const response = await axios.put(`/groups/${groupId}/password`, {
      current_password: currentPassword,
      new_password: newPassword
    })
    
    console.log('Group password change response:', response.data)
    return response.data
  } catch (error) {
    console.error('Failed to change group password:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    throw error
  }
}

// Function to change group password (EMERGENCY VERSION)
export const emergencyChangeGroupPassword = async (groupId, newPassword) => {
  if (!groupId) throw new Error('Group ID is required')

  console.log(`EMERGENCY: Changing password for group ${groupId}`)
  console.log(`New password length: ${newPassword.length}`)

  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Authentication token not found')

    // Use the emergency endpoint that bypasses verification
    const response = await axios.put(`/groups/${groupId}/emergency-password`, {
      new_password: newPassword
    })
    
    console.log('Emergency group password change response:', response.data)
    return response.data
  } catch (error) {
    console.error('Failed to change group password (emergency):', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    throw error
  }
}