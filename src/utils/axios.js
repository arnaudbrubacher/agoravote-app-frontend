import axios from 'axios'

const instance = axios.create({
  baseURL: 'http://localhost:8080', // Your backend API URL
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add interceptor for JWT tokens
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('Token from localStorage:', token)
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('Authorization header set:', config.headers.Authorization)
    } else {
      console.warn('No token found in localStorage')
    }
    
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    })
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
instance.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('Response error:', error.response || error)
    return Promise.reject(error)
  }
)

export default instance