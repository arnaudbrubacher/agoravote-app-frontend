<template>
  <div class="mx-auto max-w-md">
    <div class="mb-2 text-center">
    </div>
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Signup</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="handleLogin" class="space-y-4">
              <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input id="email" v-model="loginEmail" type="email" placeholder="m@example.com" />
              </div>
              <div class="space-y-2">
                <Label for="password">Password</Label>
                <Input id="password" v-model="loginPassword" type="password" />
                <div class="text-right text-sm">
                  <NuxtLink to="/auth/request-password-reset" class="text-gray-700 hover:underline">Forgot Password?</NuxtLink>
                </div>
              </div>
              <div v-if="loginError" class="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {{ getFriendlyErrorMessage(loginError) }}
              </div>
              <Button type="submit" class="w-full" :disabled="isLoadingLogin">
                <span v-if="isLoadingLogin">Logging in...</span>
                <span v-else>Login</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="register">
        <Card>
          <CardHeader>
            <CardTitle>Signup</CardTitle>
          </CardHeader>
          <CardContent>
            <!-- Signup Access Code Section -->
            <div v-if="!showSignupForm" class="space-y-4">
              <div class="space-y-2">
                <Label for="signup-access-code">Access Code</Label>
                <Input id="signup-access-code" v-model="signupAccessCodeInput" type="password" placeholder="Enter signup access code" />
              </div>
              <Button @click="checkSignupAccessCode" class="w-full">Submit Access Code</Button>
              <div v-if="signupAccessError" class="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {{ signupAccessError }}
              </div>
            </div>

            <!-- Original Signup Form - Conditionally Rendered -->
            <form v-if="showSignupForm" @submit.prevent="handleSignup" class="space-y-4">
              <div class="space-y-2">
                <Label for="name">Name</Label>
                <Input id="name" v-model="signupName" />
              </div>
              <div class="space-y-2">
                <Label for="signup-email">Email</Label>
                <Input id="signup-email" v-model="signupEmail" type="email" placeholder="m@example.com" />
              </div>
              <div class="space-y-2">
                <Label for="signup-password">Password</Label>
                <Input id="signup-password" v-model="signupPassword" type="password" />
                <p class="text-xs text-gray-500">Password must be at least 8 characters long and include a number</p>
              </div>
              <div class="space-y-2">
                <Label for="signup-password-confirm">Confirm Password</Label>
                <Input 
                  id="signup-password-confirm" 
                  v-model="signupPasswordConfirm" 
                  type="password"
                  :class="{ 'border-red-500': passwordError }"
                />
                <p v-if="passwordError" class="text-sm text-red-500">Passwords do not match</p>
              </div>
              <div v-if="signupError" class="text-sm text-red-500 mb-2">
                {{ signupError }}
              </div>
              <Button type="submit" class="w-full" :disabled="isLoadingSignup">
                <span v-if="isLoadingSignup">Creating Account...</span>
                <span v-else>Create Account</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth-layout'
})

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login as loginUser, signup as signupUser } from '~/src/utils/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRuntimeConfig, useNuxtApp } from '#app'

const { $axiosInstance } = useNuxtApp()
const router = useRouter()
const config = useRuntimeConfig()
const activeTab = ref('login')
const loginEmail = ref('')
const loginPassword = ref('')
const signupName = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const signupPasswordConfirm = ref('')
const passwordError = ref(false)
const signupError = ref('')
const loginError = ref('')
const isLoadingLogin = ref(false)
const isLoadingSignup = ref(false)

// New refs for signup access control
const signupAccessCodeInput = ref('')
const showSignupForm = ref(false) 
const signupAccessError = ref('')

// Function to convert technical error messages to user-friendly ones
const getFriendlyErrorMessage = (error) => {
  if (!error) return '';
  
  // Check for specific error codes
  if (error.includes('WRONG_CREDENTIALS_ERROR')) {
    return 'Incorrect email or password. Please try again or reset your password.';
  }
  
  // Handle other common errors
  if (error.includes('Failed to fetch') || error.includes('Network Error')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  if (error.includes('Unauthorized') || error.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }
  
  // Return a more generic error for anything else
  return 'Unable to sign in. Please check your information and try again.';
}

// New function to check signup access code
const checkSignupAccessCode = () => {
  const correctAccessCode = config.public.signupAccessKey;
  if (!correctAccessCode) {
    signupAccessError.value = 'Signup access key is not configured. Please contact an administrator.';
    console.error('NUXT_PUBLIC_SIGNUP_ACCESS_KEY is not set in runtimeConfig.public');
    showSignupForm.value = false; // Ensure form remains hidden
    return;
  }
  if (signupAccessCodeInput.value === correctAccessCode) {
    showSignupForm.value = true;
    signupAccessError.value = '';
  } else {
    signupAccessError.value = 'Incorrect access code. Please try again.';
    showSignupForm.value = false; // Ensure form remains hidden
  }
};

// Add these helper functions
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

// Check if user has any groups
const checkUserGroups = async () => {
  try {
    const response = await $axiosInstance.get('/user/groups')
    return response.data && response.data.length > 0
  } catch (error) {
    console.error('Failed to fetch user groups:', error)
    return false
  }
}

// Get last used group ID
const getLastUsedGroupId = () => {
  return getLocalStorage('lastUsedGroupId')
}

// Handle post-authentication navigation
const handlePostAuthNavigation = async (isNewUser = false) => {
  // Always navigate to profile page after authentication
  router.push('/profile')
}

const handleLogin = async () => {
  isLoadingLogin.value = true
  loginError.value = ''
  try {
    await loginUser(loginEmail.value, loginPassword.value)
    await handlePostAuthNavigation()
  } catch (error) {
    console.error('Login failed in component:', error)
    loginError.value = getFriendlyErrorMessage(error.message || 'Login failed')
  } finally {
    isLoadingLogin.value = false
  }
}

const handleSignup = async () => {
  if (signupPassword.value !== signupPasswordConfirm.value) {
    passwordError.value = true
    signupError.value = 'Passwords do not match.'
    return
  }
  passwordError.value = false
  isLoadingSignup.value = true
  signupError.value = ''
  try {
    const signupResult = await signupUser($axiosInstance, signupName.value, signupEmail.value, signupPassword.value)
    
    if (signupResult && signupResult.status === 'OK') {
      if (signupResult.isEmailVerified) {
        console.log('Signup successful and email verified, proceeding to post-auth navigation.');
        await handlePostAuthNavigation(true)
      } else {
        console.log('Signup successful, email not verified. Redirecting to check-email page.');
        router.push({ path: '/check-email', query: { email: signupEmail.value } });
      }
    } else {
      signupError.value = getFriendlyErrorMessage(signupResult?.error || 'Signup failed with an unexpected status.')
    }

  } catch (error) {
    console.error('Signup failed in component:', error)
    signupError.value = getFriendlyErrorMessage(error.message || 'Signup failed');
  } finally {
    isLoadingSignup.value = false
  }
}
</script>

<style>
/* Your styles here */
</style>