import axios from 'axios'
import { jwtDecode } from "jwt-decode"; // Named import

export const login = async (email, password) => {
  try {
    const response = await axios.post('http://localhost:8080/login', {
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

export const getUserIdFromToken = () => {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const decoded = jwtDecode(token)
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
    const response = await axios.get(`http://localhost:8080/user/profile/${userId}`)
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
    await axios.delete(`http://localhost:8080/user/${userId}`)
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
  } catch (error) {
    console.error('Failed to delete user account:', error)
    throw error
  }
}