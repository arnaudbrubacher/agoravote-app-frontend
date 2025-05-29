// import axios from './axios' // REMOVE THIS
import SuperTokens from 'supertokens-web-js'
import EmailPassword from 'supertokens-web-js/recipe/emailpassword'
import Session from 'supertokens-web-js/recipe/session'
import EmailVerification from 'supertokens-web-js/recipe/emailverification'

// Adding a backup authentication system using localStorage
// Safe localStorage functions to prevent SSR issues
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

// Simple local auth system 
const localUsers = {
  getUsers: () => {
    try {
      return JSON.parse(getLocalStorage('localUsers', '[]'))
    } catch (e) {
      console.error('Error parsing local users:', e)
      return []
    }
  },
  addUser: (email, password, name) => {
    try {
      const users = localUsers.getUsers()
      const userId = 'user_' + Math.random().toString(36).substring(2, 15)
      users.push({ email, password, name, userId })
      setLocalStorage('localUsers', JSON.stringify(users))
      return userId
    } catch (e) {
      console.error('Error adding local user:', e)
      throw e
    }
  },
  findUser: (email, password) => {
    try {
      const users = localUsers.getUsers()
      return users.find(u => u.email === email && u.password === password)
    } catch (e) {
      console.error('Error finding local user:', e)
      return null
    }
  },
  emailExists: (email) => {
    try {
      const users = localUsers.getUsers()
      return users.some(u => u.email === email)
    } catch (e) {
      console.error('Error checking if email exists:', e)
      return false
    }
  }
}

// Use this flag to switch between SuperTokens and local auth
// const USE_LOCAL_AUTH = false
const USE_LOCAL_AUTH = false // Commented out and forced to false - only SuperTokens is used now

export const login = async (email, password) => {
  // Only run on client-side
  if (typeof window === 'undefined') {
    console.error('Cannot perform login on server-side')
    return null
  }
  
  // Use local auth if SuperTokens is having issues
  /* 
  if (USE_LOCAL_AUTH) {
    const user = localUsers.findUser(email, password)
    if (user) {
      // Store in localStorage for backwards compatibility
      setLocalStorage('userId', user.userId)
      return { token: "local-auth", userId: user.userId }
    } else {
      throw new Error("Invalid email or password")
    }
  }
  */
  
  try {
    const response = await EmailPassword.signIn({
      formFields: [
        { id: "email", value: email },
        { id: "password", value: password }
      ]
    })

    if (response.status === "OK") {
      // Check if session exists and get user ID
      if (await Session.doesSessionExist()) {
        const userId = await Session.getUserId()
        
        // Store in localStorage for backwards compatibility
        setLocalStorage('userId', userId)
        
        return { token: "session-exists", userId }
      } else {
        throw new Error("Login successful but no session created")
      }
    } else {
      throw new Error("Login failed: " + response.status)
    }
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

// MODIFIED SIGNATURE: Added axiosInstance parameter
export const signup = async (axiosInstance, name, email, password) => {
  // Only run on client-side
  if (typeof window === 'undefined') {
    console.error('Cannot perform signup on server-side')
    return null
  }
  
  try {
    console.log('Starting signup process with SuperTokens...', { email, name })
    
    // First, check if the email already exists to avoid internal server error
    try {
      const checkEmailResponse = await EmailPassword.doesEmailExist({
        email
      })
      
      if (checkEmailResponse.doesExist) {
        console.log('Email already exists, stopping signup process')
        throw new Error('An account with this email already exists. Please login instead.')
      }
    } catch (emailCheckError) {
      // If the error is that the email exists, rethrow it to stop the process
      if (emailCheckError.message && emailCheckError.message.includes('already exists')) {
        console.log('Email existence check failed, but error indicates email exists')
        throw emailCheckError
      }
      
      // Otherwise it's an API error, continue to the signup attempt
      console.warn('Email check failed with API error, continuing with signup:', emailCheckError)
    }
    
    // Call the signup API
    const response = await EmailPassword.signUp({
      formFields: [
        { id: "email", value: email },
        { id: "password", value: password },
        { id: "name", value: name }
      ]
    })
    
    console.log('Signup response:', response)
    
    // Log detailed field errors if present
    if (response.status === "FIELD_ERROR") {
      console.error('Field validation errors:')
      response.formFields.forEach(field => {
        console.error(`- ${field.id}: ${field.error}`)
      })
      
      // Create a more user-friendly error message
      const fieldErrors = response.formFields.map(field => `${field.id}: ${field.error}`).join(', ')
      throw new Error(`Signup validation failed: ${fieldErrors}`)
    }
    
    if (response.status === "OK") {
      // After signup, if successful, attempt to create a session
      await EmailPassword.signIn({
        formFields: [
          { id: "email", value: email },
          { id: "password", value: password }
        ]
      })
      
      // Update user profile with name
      if (await Session.doesSessionExist()) {
        const userId = await Session.getUserId()
        
        // Update user display name
        try {
          // USE THE PASSED axiosInstance HERE
          await axiosInstance.post('/users', { 
            id: userId,
            name: name,
            email: email
          })
          console.log('User profile updated with name')
        } catch (updateError) {
          console.error('Failed to update user with name:', updateError)
          // Continue anyway since authentication was successful
        }
        
        // Check email verification status
        let isVerified = false
        try {
          const verificationResponse = await EmailVerification.isEmailVerified()
          console.log('Email verification status:', verificationResponse)
          
          // Handle both boolean and object responses
          if (typeof verificationResponse === 'boolean') {
            isVerified = verificationResponse
          } else if (verificationResponse && typeof verificationResponse === 'object') {
            isVerified = verificationResponse.isVerified === true
          }
        } catch (error) {
          console.warn('Failed to check email verification status:', error)
        }
        
        console.log('Email verification status (boolean):', isVerified)
        
        // ADDED: Explicitly send verification email
        if (!isVerified) {
          console.log('Sending verification email after signup')
          try {
            // Pass axiosInstance to sendVerificationEmail if it uses it (it will after refactor)
            await sendVerificationEmail(axiosInstance) 
            console.log('Verification email sent successfully after signup')
          } catch (verificationError) {
            console.error('Failed to send verification email after signup:', verificationError)
            // Continue anyway since we can resend later
          }
        }
        
        // If email verification is not enabled or email is verified, proceed normally
        // Otherwise, we'll redirect to verify-email page from the component
        
        return { 
          status: "OK", 
          user: { id: userId, email, name },
          isEmailVerified: isVerified
        }
      } else {
        console.error('Failed to create session after signup')
        return { status: "OK", error: "Failed to create session" }
      }
    } else {
      throw new Error(`Signup failed with status: ${response.status}`)
    }
  } catch (error) {
    console.error('Signup error:', error)
    throw error
  }
}

export const getUserIdFromToken = async () => {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return null
  }
  
  // Use local auth if SuperTokens is having issues
  if (USE_LOCAL_AUTH) {
    return getLocalStorage('userId')
  }
  
  try {
    if (await Session.doesSessionExist()) {
      return await Session.getUserId()
    }
    return null
  } catch (error) {
    console.error('Failed to get user ID from session:', error)
    return null
  }
}

// MODIFIED SIGNATURE: Added axiosInstance parameter
export const fetchUserProfile = async (axiosInstance) => {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return null
  }
  
  // Use local auth if SuperTokens is having issues
  /*
  if (USE_LOCAL_AUTH) {
  const userId = localStorage.getItem('userId')
    if (!userId) throw new Error('No active session found')
    
    try {
      // First try to get from the backend
      const response = await axios.get(`/user/profile/${userId}`)
      return response.data.user
    } catch (error) {
      // Fall back to local storage if no user in backend yet
      const users = localUsers.getUsers()
      const user = users.find(u => u.userId === userId)
      if (user) {
        return { id: user.userId, name: user.name, email: user.email }
      }
      throw error
    }
  }
  */
  
  try {
    if (await Session.doesSessionExist()) {
      const userId = await Session.getUserId()
      setLocalStorage('userId', userId) // Ensure userId is in localStorage
      
    const response = await axiosInstance.get(`/user/profile/${userId}`)
    return response.data.user
    } else {
      throw new Error('No active session found')
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    throw error
  }
}

// MODIFIED SIGNATURE: Added axiosInstance parameter
export const deleteUserAccount = async (axiosInstance) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Check if we have an active session
    if (!(await Session.doesSessionExist())) {
      throw new Error('No active session found. Please log in again.');
    }
    
    // Get the user ID
    const userId = await Session.getUserId();
    if (!userId) {
      throw new Error('User ID not found before delete attempt.');
    }
    
    console.log('Attempting to delete user account with ID:', userId);
    
    // Force refresh session to ensure we have the most recent token
    try {
      await Session.attemptRefreshingSession();
      console.log('Session refreshed successfully before delete operation');
    } catch (refreshError) {
      console.error('Failed to refresh session:', refreshError);
      // Continue anyway - the session might still be valid
    }
    
    // Try direct API request with SuperTokens interceptors
    try {
      const response = await axiosInstance.delete(`/user/${userId}`);
      console.log('Account deletion response:', response.data);
      
      // Clean up after successful deletion
      removeLocalStorage('userId');
      
      // Sign out from SuperTokens
      await EmailPassword.signOut();
      
      return response.data;
    } catch (deleteError) {
      console.error('Delete request failed:', deleteError);
      
      if (deleteError.response?.status === 401) {
        console.log('Received 401 Unauthorized, attempting to refresh session and retry...');
        
        // Attempt to refresh session and retry
        await Session.attemptRefreshingSession();
        console.log('Session refreshed, retrying delete request');
        
        // Retry delete request after refreshing
        const retryResponse = await axiosInstance.delete(`/user/${userId}`);
        console.log('Retry deletion response:', retryResponse.data);
        
        // Clean up after successful deletion
        removeLocalStorage('userId');
        
        // Sign out from SuperTokens
        await EmailPassword.signOut();
        
        return retryResponse.data;
      }
      
      // Re-throw if not a 401 error
      throw deleteError;
    }
  } catch (error) {
    console.error('Failed to delete user account:', error);
    if (error.response?.data?.error && 
        error.response.data.error.includes('violates foreign key constraint') && 
        error.response.data.error.includes('posts')) {
      throw new Error('Cannot delete account because you have posts. Please delete all your posts first and try again.');
    }
    throw error;
  }
};

// MODIFIED SIGNATURE: Added axiosInstance parameter
export const changeUserPassword = async (axiosInstance, userId, currentPassword, newPassword) => {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    // First verify the current password by attempting to sign in
    if (await Session.doesSessionExist()) {
      if (!userId) {
        userId = await Session.getUserId()
      }
      
      // Use SuperTokens to update the password
      // Note: SuperTokens doesn't have a direct method to change password while authenticated
      // So we'll use the backend API for this
    const response = await axiosInstance.put(`/users/${userId}/password`, {
      current_password: currentPassword,
      new_password: newPassword
    })
    
    return response.data
    } else {
      throw new Error('No active session found')
    }
  } catch (error) {
    console.error('Failed to change user password:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    throw error
  }
}

// MODIFIED SIGNATURE: Added axiosInstance parameter
export const changeGroupPassword = async (axiosInstance, groupId, newPassword) => {
  try {
    console.log('Changing group password for group:', groupId)
    
    const response = await axiosInstance.put(`/groups/${groupId}/password`, {
      new_password: newPassword
    })
    
    return response.data
  } catch (error) {
    console.error('Failed to change group password:', error)
    throw error
  }
}

// MODIFIED SIGNATURE: Added axiosInstance parameter
export const emergencyChangeGroupPassword = async (axiosInstance, groupId, newPassword) => {
  if (!groupId) throw new Error('Group ID is required')

  try {
    // This function doesn't involve user authentication directly,
    // so we'll continue to use the existing API
    const response = await axiosInstance.put(`/groups/${groupId}/emergency-password`, {
      new_password: newPassword
    })
    
    return response.data
  } catch (error) {
    console.error('Failed to change group password (emergency):', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    throw error
  }
}

export const signOut = async () => {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return
  }
  
  /* 
  if (USE_LOCAL_AUTH) {
    localStorage.removeItem('userId')
    return
  }
  */
  
  try {
    await EmailPassword.signOut()
    removeLocalStorage('userId')
    removeLocalStorage('token')
    removeLocalStorage('lastUsedGroupId')
    console.log('User signed out successfully')
    return true
  } catch (error) {
    console.error('Error signing out:', error)
    // Try to clean up local storage even if API fails
    removeLocalStorage('userId')
    removeLocalStorage('token')
    removeLocalStorage('lastUsedGroupId')
    throw error
  }
}

// Add function to check if email is verified
export const isEmailVerified = async () => {
  if (typeof window === 'undefined') {
    console.error('Cannot check email verification on server-side')
    return { status: 'ERROR', isVerified: false }
  }
  
  try {
    // First check if a session exists
    if (await Session.doesSessionExist()) {
      // Then check if email is verified
      const response = await EmailVerification.isEmailVerified()
      console.log('Raw verification response:', response)
      
      // Ensure we return a structured response
      if (typeof response === 'boolean') {
        return { status: 'OK', isVerified: response }
      } else if (response && typeof response === 'object') {
        // If it's already an object with isVerified, ensure it has the property
        return { 
          ...response, 
          isVerified: response.isVerified === true
        }
      }
      
      return { status: 'OK', isVerified: false }
    }
    return { status: 'NO_SESSION', isVerified: false }
  } catch (error) {
    console.error('Error checking email verification status:', error)
    return { status: 'ERROR', isVerified: false, error: error.message }
  }
}

// Add a utility function to get authentication headers
export const getAuthHeader = async () => {
  if (typeof window === 'undefined') {
    return {};
  }
  
  try {
    if (await Session.doesSessionExist()) {
      const accessToken = await Session.getAccessToken();
      return {
        'Authorization': `Bearer ${accessToken}`
      };
    }
  } catch (error) {
    console.error('Error getting auth header:', error);
  }
  
  return {};
};

// MODIFIED SIGNATURE: Added axiosInstance parameter
export const sendVerificationEmail = async (axiosInstance) => {
  if (typeof window === 'undefined') {
    console.error('Cannot send verification email on server-side')
    return { status: 'ERROR' }
  }
  
  try {
    // Call SuperTokens API first
    console.log('Sending verification email via SuperTokens API')
    const response = await EmailVerification.sendVerificationEmail()
    
    // Also call our custom endpoints to ensure it's sent through Resend
    try {
      const userId = getLocalStorage('userId')
      const userEmail = getLocalStorage('userEmail')
      
      if (userId) {
        console.log('Also sending verification email via custom endpoints for userId:', userId)
        
        // Get auth headers
        const headers = await getAuthHeader();
        console.log('Using auth headers:', Object.keys(headers).length > 0 ? 'Authorization header present' : 'No auth headers');
        
        // REMOVED dynamic import, use passed axiosInstance
        try {
          // Try the original endpoint first (with authentication)
          await axiosInstance.post(`/users/${userId}/resend-verification`, {}, { headers })
          console.log('Successfully sent verification request to /users endpoint')
        } catch (error1) {
          console.warn('First endpoint failed:', error1.message)
          
          // Only use the fallback method if we actually have an email
          if (userEmail) {
            console.log('Using email for verification request:', userEmail)
            try {
              // Don't include auth headers to prevent 401 -> retry loop
              await axiosInstance.post(`/auth-verify/${userEmail}`, {}, { 
                headers: { 'Content-Type': 'application/json' } // Only basic headers, no auth
              })
          console.log('Successfully sent verification request to /auth-verify endpoint')
            } catch (error2) {
              console.error('Error with fallback verification endpoint:', error2.message)
              // Don't retry automatically - this prevents infinite loops
            }
          }
        }
      }
    } catch (customError) {
      console.error('Error calling custom verification endpoints:', customError)
      // Don't fail if this fails, we still have the SuperTokens flow
    }
    
    return response
  } catch (error) {
    console.error('Error sending verification email:', error)
    return { status: 'ERROR', error: error.message }
  }
}