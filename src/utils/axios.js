import axios from 'axios'
import Session from 'supertokens-web-js/recipe/session'

const instance = axios.create({
  baseURL: 'http://localhost:8080', // Your backend API URL
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Only add SuperTokens interceptors on client-side
if (typeof window !== 'undefined') {
  // Add interceptor for handling sessions
  instance.interceptors.request.use(
    async (config) => {
      try {
        // SuperTokens will automatically add the session token
        // to requests that go to URLs protected by the Session recipe
        if (await Session.doesSessionExist()) {
          // Add anti-CSRF token if needed
          const antiCsrf = await Session.getAccessTokenPayloadSecurely();
          if (antiCsrf && antiCsrf.antiCsrf) {
            config.headers['anti-csrf'] = antiCsrf.antiCsrf;
          }
        }
      } catch (err) {
        console.error('Error in interceptor:', err);
      }
      
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error)
      return Promise.reject(error)
    }
  )

  // Add response interceptor for handling session errors
  instance.interceptors.response.use(
    (response) => {
      return response
    },
    async (error) => {
      // If error is related to an unauthorized session
      if (error.response && error.response.status === 401) {
        // Check if unauthorized due to session expiry
        const isSessionExpiredError = await Session.doesSessionExist() && 
          error.response.data && 
          (error.response.data.message === 'session expired' || 
           error.response.data.message === 'unauthorized');
        
        if (isSessionExpiredError) {
          // Redirect to login page
          window.location.href = '/auth';
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      }
      
      return Promise.reject(error)
    }
  )
}

export default instance