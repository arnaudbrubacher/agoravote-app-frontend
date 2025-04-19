<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
      <div>
        <LucideIcon name="MailCheck" class="mx-auto h-12 w-auto text-primary" />
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Email
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          A verification email has been sent to <strong class="font-medium">{{ userEmail }}</strong>.
        </p>
        <p class="mt-2 text-center text-sm text-gray-600">
          Please check your inbox (and spam folder) and click the link to activate your account.
        </p>
      </div>
      <div class="mt-8 space-y-6">
        <Button 
          @click="resendVerificationEmail"
          :disabled="resending || emailSent"
          class="w-full"
        >
          <LucideIcon v-if="resending" name="Loader2" class="mr-2 h-4 w-4 animate-spin" />
          <span v-if="emailSent">Verification Email Sent!</span>
          <span v-else>Resend Verification Email</span>
        </Button>
        <div v-if="resendError" class="text-sm text-red-500 text-center">
          {{ resendError }}
        </div>
        <div class="text-center text-sm">
          <router-link to="/auth" class="font-medium text-primary hover:text-primary-dark">
            Back to Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import LucideIcon from '@/components/LucideIcon.vue'
import SuperTokens from 'supertokens-web-js'
import EmailVerification from 'supertokens-web-js/recipe/emailverification'
import Session from 'supertokens-web-js/recipe/session'
import { ensureSuperTokensInit } from '~/src/utils/auth'

// Ensure SuperTokens is initialized
ensureSuperTokensInit();

definePageMeta({ layout: false }) // Use a simple layout or no layout

const route = useRoute()
const router = useRouter()
const userEmail = ref('')
const resending = ref(false)
const emailSent = ref(false)
const resendError = ref('')

onMounted(async () => {
  userEmail.value = route.query.email || 'your email address'

  // --- REMOVED Automatic Verification Check on Load ---
  // This was causing a 500 error on the backend GET /auth/user/email/verify endpoint.
  // The page's main purpose is informational; the user verifies by clicking the link.
  // We keep the resend functionality.
  /*
  try {
    const sessionExists = await Session.doesSessionExist();
    console.log("[verify-email.vue] Checking session before isEmailVerified call...");
    console.log("[verify-email.vue] Session.doesSessionExist():", sessionExists);
    if (sessionExists) {
      const userId = await Session.getUserId();
      console.log("[verify-email.vue] Session User ID:", userId);
      
      // Attempting to check verification status
      const isVerified = await EmailVerification.isEmailVerified(); 
      if (isVerified) {
        console.log('Email already verified, redirecting to profile.');
        router.push('/profile');
      }
    } else {
      console.log("[verify-email.vue] No session detected on frontend.");
    }
  } catch (error) {
    console.error('Error checking verification status:', error);
  }
  */
  // --- END REMOVED Check ---
})

const resendVerificationEmail = async () => {
  resending.value = true
  resendError.value = ''
  emailSent.value = false
  try {
    const response = await EmailVerification.sendVerificationEmail()
    if (response.status === "OK") {
      emailSent.value = true
      setTimeout(() => { emailSent.value = false }, 5000) // Reset button after 5 seconds
    } else if (response.status === "EMAIL_ALREADY_VERIFIED_ERROR") {
      resendError.value = 'Your email is already verified.'
      // Optionally redirect if already verified
      setTimeout(() => router.push('/profile'), 2000)
    } else {
      resendError.value = 'Failed to resend verification email. Please try again.'
    }
  } catch (error) {
    console.error('Error resending verification email:', error)
    resendError.value = 'An error occurred. Please try again.'
  } finally {
    resending.value = false
  }
}
</script>

<style scoped>
/* Add any specific styles if needed */
</style> 