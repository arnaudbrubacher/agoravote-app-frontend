<template>
  <div class="mx-auto max-w-md">
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handlePasswordReset" class="space-y-4">
          <div class="space-y-2">
            <Label for="new-password">New Password</Label>
            <Input id="new-password" v-model="newPassword" type="password" required />
             <p class="text-xs text-gray-500">Password must be at least 8 characters long and include a number</p>
          </div>
          <div class="space-y-2">
            <Label for="confirm-password">Confirm New Password</Label>
            <Input 
              id="confirm-password" 
              v-model="confirmPassword" 
              type="password" 
              required
              :class="{ 'border-red-500': passwordError }" 
            />
             <p v-if="passwordError" class="text-sm text-red-500">Passwords do not match</p>
          </div>

          <div v-if="message" :class="messageIsError ? 'text-red-500' : 'text-green-500'" class="text-sm mb-2">
            {{ message }}
          </div>

          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Resetting...' : 'Reset Password' }}
          </Button>
          
          <div v-if="showLoginLink" class="text-center text-sm">
            <NuxtLink to="/auth" class="text-blue-600 hover:underline">Back to Login</NuxtLink>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { submitNewPassword } from 'supertokens-web-js/recipe/emailpassword'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: 'auth-layout'
})

const route = useRoute()
const router = useRouter()

const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref(false)
const loading = ref(false)
const message = ref('')
const messageIsError = ref(false)
const token = ref(null)
const showLoginLink = ref(false)

onMounted(() => {
  // Extract the token from the URL query parameters
  token.value = route.query.token
  if (!token.value) {
    message.value = "Password reset token is missing or invalid. Please request a new link."
    messageIsError.value = true
    showLoginLink.value = true
  }
})

const handlePasswordReset = async () => {
  if (!token.value) {
     message.value = "Password reset token is missing or invalid. Please request a new link."
     messageIsError.value = true
     showLoginLink.value = true
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = true
    message.value = "Passwords do not match."
    messageIsError.value = true
    return
  }
  passwordError.value = false
  loading.value = true
  message.value = ''
  messageIsError.value = false
  showLoginLink.value = false

  try {
    const response = await submitNewPassword({
      formFields: [{
        id: "password",
        value: newPassword.value
      }],
      token: token.value
    })

    if (response.status === "OK") {
      message.value = "Password reset successful! You can now log in with your new password."
      messageIsError.value = false
      showLoginLink.value = true
      // Optionally redirect after a delay
      // setTimeout(() => router.push('/auth'), 3000)
    } else if (response.status === "RESET_PASSWORD_INVALID_TOKEN_ERROR") {
      message.value = "Invalid or expired token. Please request a new password reset link."
      messageIsError.value = true
      showLoginLink.value = true
    } else {
       // Handle other potential errors (like password policy violations)
      message.value = response.status || "An unexpected error occurred. Please try again."
      if (response.status === 'FIELD_ERROR' && response.formFields[0].id === 'password') {
          message.value = `Password reset failed: ${response.formFields[0].error}`
      }
      messageIsError.value = true
      console.error("Password reset submission failed:", response)
    }
  } catch (error) {
    console.error("Error submitting new password:", error)
    message.value = "Failed to reset password. Please try again."
    messageIsError.value = true
  } finally {
    loading.value = false
  }
}
</script> 