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

// Add SuperTokens interceptors to the custom axios instance
if (typeof window !== 'undefined') {
  addAxiosInterceptors(instance)
}

export default instance