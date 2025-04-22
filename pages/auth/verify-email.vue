<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
      <div>
        <LucideIcon :name="statusIcon" class="mx-auto h-12 w-auto" :class="statusIconClass" />
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ statusTitle }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ statusMessage }}
        </p>
      </div>
      <div v-if="error" class="bg-red-50 p-4 rounded-md">
        <p class="text-red-700 text-center">{{ error }}</p>
      </div>
      <div class="mt-8 space-y-6">
        <Button 
          v-if="verificationStatus === 'success'"
          @click="handleSuccessRedirect"
          class="w-full"
        >
          {{ successButtonText }}
        </Button>
        <Button 
          v-else-if="verificationStatus === 'error'"
          @click="goToLogin"
          class="w-full"
        >
          Back to Login
        </Button>
        <div v-else class="flex justify-center">
          <LucideIcon name="Loader2" class="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// console.log('[VerifyEmail] SCRIPT SETUP EXECUTING!') // Keep commented/remove

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import LucideIcon from '@/components/LucideIcon.vue'
import EmailVerification from 'supertokens-web-js/recipe/emailverification'
import Session from 'supertokens-web-js/recipe/session'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const verificationStatus = ref('loading') // loading, success, error
const error = ref('')
const hasSessionAfterVerification = ref(false)

// Computed properties for UI
const statusIcon = computed(() => {
  switch (verificationStatus.value) {
    case 'success': return 'CheckCircle'
    case 'error': return 'AlertCircle'
    default: return 'Loader2'
  }
})

const statusIconClass = computed(() => {
  switch (verificationStatus.value) {
    case 'success': return 'text-green-500'
    case 'error': return 'text-red-500'
    default: return 'text-primary animate-spin'
  }
})

const statusTitle = computed(() => {
  switch (verificationStatus.value) {
    case 'success': return 'Email Verified!'
    case 'error': return 'Verification Failed'
    default: return 'Verifying Email...'
  }
})

const statusMessage = computed(() => {
  switch (verificationStatus.value) {
    case 'success': 
      return hasSessionAfterVerification.value 
        ? 'Your email has been successfully verified. You can now proceed to your profile.' 
        : 'Your email has been successfully verified. Please proceed to login.'
    case 'error': return 'We could not verify your email. The link may have expired or is invalid.'
    default: return 'Please wait while we verify your email address...'
  }
})

const successButtonText = computed(() => {
  return hasSessionAfterVerification.value ? 'Go to Profile' : 'Go to Login'
})

onMounted(async () => {
  // Restore original onMounted logic with detailed logs
  const token = route.query.token
  const tenantId = route.query.tenantId || 'public'

  console.log(`[VerifyEmail] Page mounted. Token: ${token ? 'present' : 'missing'}, TenantId: ${tenantId}`)

  if (!token) {
    verificationStatus.value = 'error'
    error.value = 'Verification token is missing'
    console.error('[VerifyEmail] Verification token is missing in URL query.')
    return
  }

  try {
    console.log('[VerifyEmail] Attempting to verify email...')
    // Call the SuperTokens verification endpoint
    const response = await EmailVerification.verifyEmail({
      token,
      tenantId
    })

    console.log('[VerifyEmail] Email verification API response:', JSON.stringify(response))

    if (response.status === 'OK') {
      console.log('[VerifyEmail] Verification successful (status OK).')
      verificationStatus.value = 'success'
      // Check if session exists AFTER successful verification
      console.log('[VerifyEmail] Checking session existence...')
      hasSessionAfterVerification.value = await Session.doesSessionExist()
      console.log('[VerifyEmail] Session exists after verification:', hasSessionAfterVerification.value)
    } else {
      console.error('[VerifyEmail] Verification failed. Status:', response.status)
      verificationStatus.value = 'error'
      error.value = 'Email verification failed: ' + response.status
    }
  } catch (err) {
    console.error('[VerifyEmail] Email verification error during API call:', err)
    verificationStatus.value = 'error'
    error.value = err.message || 'An unexpected error occurred during verification.'
  }
})

const handleSuccessRedirect = () => {
  if (hasSessionAfterVerification.value) {
    router.push('/profile')
  } else {
    router.push('/auth')
  }
}

const goToLogin = () => {
  router.push('/auth')
}
</script>

<style scoped>
/* Add any specific styles if needed */
</style> 