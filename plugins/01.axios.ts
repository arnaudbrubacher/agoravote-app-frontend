import { defineNuxtPlugin, useRuntimeConfig } from '#app' // Or 'nuxt/app' depending on your Nuxt version/setup
import axios from 'axios'
import type { AxiosInstance } from 'axios' // Optional: for stronger typing
import Session from 'supertokens-web-js/recipe/session' // Import Session for axios interceptors

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig()
  // Ensure apiBaseUrl is treated as a string. 
  // The || '' ensures it's at least an empty string if undefined, satisfying type requirements.
  const apiBaseUrl = (runtimeConfig.public.apiBaseUrl as string || '') 

  console.log('[Nuxt Plugin - Axios] Configuring Axios with baseURL:', apiBaseUrl)

  const configuredAxios: AxiosInstance = axios.create({
    baseURL: apiBaseUrl,
    timeout: 10000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Add SuperTokens axios interceptors for automatic authentication
  if (process.client) {
    try {
      Session.addAxiosInterceptors(configuredAxios)
      console.log('[Axios Plugin] SuperTokens axios interceptors added successfully')
    } catch (error) {
      console.warn('[Axios Plugin] Failed to add SuperTokens interceptors:', error)
    }
  }

  // Add request interceptor to handle FormData properly
  configuredAxios.interceptors.request.use(
    (config) => {
      // If the data is FormData, remove the Content-Type header to let the browser set it
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type']
        console.log('[Axios Request Interceptor] Detected FormData, removed Content-Type header to allow browser to set multipart/form-data with boundary')
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Add your global interceptors here
  configuredAxios.interceptors.response.use(
    (response) => {
      // Example: Log a specific endpoint, similar to your original util
      if (response.config.url && response.config.url.includes('/user/groups')) { // Made check more robust
        console.log('[Axios Interceptor in Plugin] Response for /user/groups:', {
          status: response.status,
          data: JSON.stringify(response.data)
        });
      }
      return response;
    },
    (error) => {
      if (error.config && error.config.url && error.config.url.includes('/user/groups')) { // Made check more robust
        console.error('[Axios Interceptor in Plugin] Error for /user/groups:', error);
      }
      
      // SuperTokens interceptors will handle 401 errors, but we can add additional logging
      if (error.response && error.response.status === 401) {
        console.log("[Axios Plugin] 401 Unauthorized error detected, SuperTokens will handle session refresh");
      }
      return Promise.reject(error);
    }
  );

  // Provide the configured Axios instance to the Nuxt app
  // It will be available as $axiosInstance in components/pages via useNuxtApp()
  // And also on nuxtApp itself (nuxtApp.$axiosInstance)
  nuxtApp.provide('axiosInstance', configuredAxios) // Providing as $axiosInstance to be very explicit
}) 