<template>
  <div class="mx-auto max-w-md">
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Enter your email address and we'll send you a link to reset your password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRequestReset" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" placeholder="m@example.com" required />
          </div>
          <div v-if="message" :class="messageIsError ? 'text-red-500' : 'text-green-500'" class="text-sm mb-2">
            {{ message }}
          </div>
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </Button>
          <div class="text-center text-sm">
            <NuxtLink to="/auth" class="text-gray-700 hover:underline">Back to Login</NuxtLink>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { sendPasswordResetEmail } from 'supertokens-web-js/recipe/emailpassword'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: 'auth-layout'
})

const router = useRouter()
const email = ref('')
const loading = ref(false)
const message = ref('')
const messageIsError = ref(false)

const handleRequestReset = async () => {
  loading.value = true
  message.value = ''
  messageIsError.value = false

  try {
    const response = await sendPasswordResetEmail({
      formFields: [{
        id: "email",
        value: email.value
      }]
    })

    if (response.status === "OK" || response.status === "UNKNOWN_USER_ID_ERROR") {
      window.alert("If an account with this email exists, a password reset link has been sent. Please check your email.");
      router.push('/auth');
    } else {
      message.value = "An unexpected error occurred. Please try again."
      messageIsError.value = true
      console.error("Password reset request failed:", response)
    }
  } catch (error) {
    console.error("Error requesting password reset:", error)
    message.value = "Failed to send reset link. Please try again."
    messageIsError.value = true
  } finally {
    loading.value = false
  }
}
</script> 