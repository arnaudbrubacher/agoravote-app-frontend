import { ref } from 'vue';
import axios from '~/src/utils/axios';

export function useUserService() {
  const loading = ref(false);
  const error = ref(null);
  
  /**
   * Find a user by email address
   * @param {string} email - The email to search for
   * @returns {Promise<Object|null>} - User data if found, null otherwise
   */
  const findUserByEmail = async (email) => {
    if (!email) {
      console.error('Email is required to find a user');
      return null;
    }
    
    loading.value = true;
    error.value = null;
    
    try {
      // Call the API endpoint to find user by email
      const response = await axios.get(`/users/lookup`, {
        params: { email }
      });
      
      // Return the user data if found
      if (response.data && response.data.user) {
        return response.data.user;
      }
      
      // If no user found but response is successful
      return null;
    } catch (err) {
      console.error(`Failed to find user by email (${email}):`, err);
      error.value = err.response?.data?.error || 'Failed to find user by email';
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    loading,
    error,
    findUserByEmail
  };
} 