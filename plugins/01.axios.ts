import { defineNuxtPlugin, useRuntimeConfig } from '#app' // Or 'nuxt/app' depending on your Nuxt version/setup
import axios from 'axios'
import type { AxiosInstance } from 'axios' // Optional: for stronger typing
// import Session from 'supertokens-web-js/recipe/session' // Import if you need it for global error handling here

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
      
      // Example: Global error handling for SuperTokens session expiry
      // if (error.response && error.response.status === 401) {
      //   Session.doesSessionExist().then(doesSessionExist => {
      //     if (!doesSessionExist) {
      //       // redirect to login or refresh session
      //       console.log("Session expired, redirecting to login...");
      //       // nuxtApp.vueApp.router.push('/auth'); // Or however you handle redirection
      //     }
      //   });
      // }
      return Promise.reject(error);
    }
  );

  // Provide the configured Axios instance to the Nuxt app
  // It will be available as $axiosInstance in components/pages via useNuxtApp()
  // And also on nuxtApp itself (nuxtApp.$axiosInstance)
  nuxtApp.provide('axiosInstance', configuredAxios) // Providing as $axiosInstance to be very explicit
}) 