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
          @click="goToProfile"
          class="w-full"
        >
          Go to Profile
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import LucideIcon from '@/components/LucideIcon.vue'
import EmailVerification from 'supertokens-web-js/recipe/emailverification'
import { ensureSuperTokensInit } from '~/src/utils/auth'

// Ensure SuperTokens is initialized
ensureSuperTokensInit();

definePageMeta({ layout: false }) // Use a simple layout or no layout

const route = useRoute()
const router = useRouter()
const verificationStatus = ref('loading') // loading, success, error
const error = ref('')

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
    case 'success': return 'Your email has been successfully verified. You can now access all features of the application.'
    case 'error': return 'We could not verify your email. The link may have expired or is invalid.'
    default: return 'Please wait while we verify your email address...'
  }
})

onMounted(async () => {
  // Extract token and tenantId from URL
  const token = route.query.token
  const tenantId = route.query.tenantId || 'public'

  if (!token) {
    verificationStatus.value = 'error'
    error.value = 'Verification token is missing'
    return
  }

  try {
    // Call the SuperTokens verification endpoint
    const response = await EmailVerification.verifyEmail({
      token,
      tenantId
    })

    console.log('Email verification response:', response)

    if (response.status === 'OK') {
      verificationStatus.value = 'success'
    } else {
      verificationStatus.value = 'error'
      error.value = 'Email verification failed: ' + response.status
    }
  } catch (err) {
    console.error('Email verification error:', err)
    verificationStatus.value = 'error'
    error.value = err.message || 'An unexpected error occurred'
  }
})

const goToProfile = () => {
  router.push('/profile')
}

const goToLogin = () => {
  router.push('/auth')
}
</script>

<style scoped>
/* Add any specific styles if needed */
</style> 