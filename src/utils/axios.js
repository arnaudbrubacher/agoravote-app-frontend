import axios from 'axios'
import Session, { addAxiosInterceptors } from 'supertokens-web-js/recipe/session'

const instance = axios.create({
  baseURL: 'http://localhost:8080', // Your backend API URL
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add a custom interceptor to log the response for /user/groups
instance.interceptors.response.use(
  (response) => {
    // Log only for the specific endpoint
    if (response.config.url === '/user/groups') {
      console.log('[Axios Interceptor] Response for /user/groups:', {
        status: response.status,
        data: JSON.stringify(response.data) // Stringify to see null vs [] clearly
      });
    }
    return response; // Pass the response along
  },
  (error) => {
    // Also log errors for this endpoint
    if (error.config?.url === '/user/groups') {
      console.error('[Axios Interceptor] Error for /user/groups:', error);
    }
    return Promise.reject(error); // Pass the error along
  }
);

// SuperTokens will automatically add its interceptors - no need to call addAxiosInterceptors

export default instance