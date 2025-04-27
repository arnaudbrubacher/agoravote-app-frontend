<template>
  <div class="mx-auto max-w-md">
    <Card class="mb-6">
       <CardHeader>
        <CardTitle class="text-center text-2xl">Accept Group Invitation</CardTitle>
      </CardHeader>
      <CardContent class="text-center text-sm text-gray-600 space-y-2">
         <p v-if="invitationEmail">To accept the invitation, please sign up or log in using the email address: <strong>{{ invitationEmail }}</strong></p>
         <p v-else>Loading invitation details...</p>
         <p>After signing in or signing up, your invitation will be automatically processed.</p>
         <p v-if="statusMessage" :class="statusMessageType === 'error' ? 'text-red-500' : 'text-green-500'">
           {{ statusMessage }}
         </p>
      </CardContent>
    </Card>

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
                 <!-- Removed Forgot Password link for simplicity on this specific flow -->
              </div>
              <div v-if="loginError" class="text-sm text-red-500 mb-2">
                {{ loginError }}
              </div>
              <Button type="submit" class="w-full" :disabled="isLoadingLogin">
                <span v-if="isLoadingLogin">Logging in...</span>
                <span v-else>Login & Accept Invitation</span>
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
            <form @submit.prevent="handleSignup" class="space-y-4">
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
                <span v-else>Signup & Accept Invitation</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, signup, isEmailVerified, sendVerificationEmail } from '~/src/utils/auth' // Import SuperTokens functions
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import axios from '~/src/utils/axios' // Use configured axios instance
import Session from 'supertokens-web-js/recipe/session' // Import Session recipe

definePageMeta({
  layout: 'auth-layout'
})

const router = useRouter()
const route = useRoute()
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
const invitationToken = ref(null)
const invitationEmail = ref('') // To store the email from the (potentially invalid) token info
const statusMessage = ref('')
const statusMessageType = ref('info') // 'info', 'success', 'error'


// Function to accept the invitation via backend API
const acceptInvitation = async (token) => {
  statusMessage.value = 'Processing invitation...'
  statusMessageType.value = 'info'
  try {
    console.log(`Attempting to accept invitation with token: ${token}`)
    const response = await axios.post('/member/accept-invitation', { token })
    console.log('Invitation acceptance response:', response.data)
    statusMessage.value = 'Invitation accepted successfully! Redirecting...'
    statusMessageType.value = 'success'

    // Always redirect to profile page after acceptance
    console.log("Redirecting to /profile after successful invitation acceptance.")
    router.push('/profile') 

    /* Original logic to redirect to group:
    // Redirect to the group page or a confirmation page
    // For now, redirecting to profile, ideally redirect to the specific group using response.data.groupId
    if (response.data.groupId) {
       router.push(`/group/${response.data.groupId}`)
    } else {
       console.warn("No groupId returned from accept-invitation endpoint. Redirecting to profile.")
       router.push('/profile') // Fallback redirect
    }
    */

  } catch (error) {
    console.error('Failed to accept invitation:', error.response ? error.response.data : error)
    loginError.value = '' // Clear general auth errors
    signupError.value = ''
    statusMessage.value = error.response?.data?.error || 'Failed to accept invitation. The link might be expired, invalid, or already used.'
    statusMessageType.value = 'error'

    // Handle specific errors if needed
    if (error.response?.data?.error === 'logged-in user does not match invitation email') {
        // Optionally logout the user or guide them
        statusMessage.value += ' Please log out and try again with the correct email.'
        // await Session.signOut(); // Consider if automatic logout is desired UX
    }
  }
}

// Modified login handler
const handleLogin = async () => {
  loginError.value = ''
  statusMessage.value = '' // Clear previous status
  isLoadingLogin.value = true
  try {
    await login(loginEmail.value, loginPassword.value)
    console.log('Login successful on accept page.')

    // Check email verification status *after* login
    const verificationResponse = await isEmailVerified()
    console.log('Login - Email verification status:', verificationResponse)

    if (!verificationResponse.isVerified) {
      // User exists but email not verified - Cannot accept invite yet
      loginError.value = 'Please verify your email first. Check your inbox or request a new verification email.'
      // Optionally, redirect to a dedicated verification prompt page or offer resend here
      // await sendVerificationEmail(); // Correct function name, but decided to redirect instead
       router.push({
        path: '/verify-email',
        query: { email: loginEmail.value, redirect: route.fullPath } // Redirect back here after verification
      })
       isLoadingLogin.value = false // Stop loading as we redirect
       return // Stop further execution
    }

    // Email is verified, proceed to accept invitation
    if (invitationToken.value) {
      await acceptInvitation(invitationToken.value)
    } else {
      statusMessage.value = 'Error: Invitation token missing.'
      statusMessageType.value = 'error'
    }

  } catch (error) {
    console.error('Login failed on accept page:', error)
    loginError.value = error.message || 'Login failed. Please check your credentials.'
  } finally {
     // Only set loading to false if acceptInvitation hasn't redirected
     if (!statusMessage.value.includes('Redirecting...')) {
       isLoadingLogin.value = false
     }
  }
}

// Modified signup handler
const handleSignup = async () => {
  signupError.value = ''
  statusMessage.value = '' // Clear previous status
  if (signupPassword.value !== signupPasswordConfirm.value) {
    passwordError.value = true
    signupError.value = 'Passwords do not match.'
    return
  }
  passwordError.value = false
  isLoadingSignup.value = true
  try {
    const signupResult = await signup(signupName.value, signupEmail.value, signupPassword.value)
    console.log('Signup successful on accept page:', signupResult)

    // After successful signup, SuperTokens handles the session.
    // The user now needs to verify their email.
    // We cannot accept the invitation until the email is verified.
    // Redirect to a page instructing them to check their email, then come back or handle automatically.

    console.log('Signup successful, redirecting to email verification prompt.')
    // Redirect to check-email page, potentially passing the original invitation link or token
    // so they can return easily after verification.
    router.push({
        path: '/check-email', // Or '/verify-email' if you prefer that flow immediately
        query: { email: signupEmail.value, redirect: route.fullPath } // Pass email and redirect back to this page
    })

    // Don't attempt to accept invitation here - email verification is required first.

  } catch (error) {
    console.error('Signup failed on accept page:', error)
     if (error.message && error.message.includes('already exists')) {
      signupError.value = 'An account with this email already exists. Please log in instead.'
      activeTab.value = 'login' // Switch to login tab
      loginEmail.value = signupEmail.value // Pre-fill email
    } else {
      signupError.value = error.message || 'Signup failed. Please try again.'
    }
  } finally {
    isLoadingSignup.value = false // Stop loading as we redirect or show error
  }
}

// --- Fetch Invitation Email (Optional but good UX) ---
// Function to fetch basic (potentially unverified) info about the token
// WARNING: This endpoint MUST NOT return sensitive data and should only
//          be used for UX improvement (like showing the target email).
//          It should handle invalid/expired tokens gracefully.
//          Requires a new backend endpoint e.g., GET /member/invitation-info?token=...
// const fetchInvitationInfo = async (token) => {
//   try {
//     // const response = await axios.get(`/member/invitation-info?token=${token}`);
//     // invitationEmail.value = response.data.email;
//     // loginEmail.value = response.data.email; // Pre-fill login email
//     // signupEmail.value = response.data.email; // Pre-fill signup email
//     console.warn("fetchInvitationInfo needs a backend endpoint. Skipping for now.");
//      // Simulate fetching email from token if endpoint doesn't exist yet
//      // In a real scenario, you'd decode the JWT *if* it contained the email,
//      // but our current token is just a UUID. Backend lookup is necessary.
//      invitationEmail.value = "the invited email address"; // Placeholder
//
//   } catch (error) {
//     console.error('Failed to fetch invitation info:', error);
//     statusMessage.value = 'Could not retrieve invitation details. The link might be invalid or expired.';
//     statusMessageType.value = 'error';
//     invitationEmail.value = 'unknown'; // Indicate failure
//   }
// };

onMounted(async () => {
  invitationToken.value = route.query.token

  if (!invitationToken.value) {
    statusMessage.value = 'Error: No invitation token provided in the URL.'
    statusMessageType.value = 'error'
    return;
  }
  console.log(`Invitation token found: ${invitationToken.value}`)

  // --- Check if user is already logged in ---
  // If logged in, attempt to accept immediately.
  const isLoggedIn = await Session.doesSessionExist();
  if (isLoggedIn) {
      console.log("User is already logged in. Attempting to accept invitation directly.");
      // Check email verification status *before* attempting to accept
      const verificationResponse = await isEmailVerified();
      if (!verificationResponse.isVerified) {
          const userEmail = await Session.getUserId(); // Or fetch email via another SuperTokens method if needed
          statusMessage.value = "You are logged in, but your email is not verified. Please verify your email first.";
          statusMessageType.value = 'error';
          // Redirect to verification page, passing redirect info
          router.push({
              path: '/verify-email',
              // Pass necessary info like email if easily available, or let verify-email handle it
              query: { redirect: route.fullPath }
          });
          return; // Stop further processing
      }
      // User is logged in AND email is verified, proceed.
      await acceptInvitation(invitationToken.value);
  } else {
      // User is not logged in, show the forms.
      // Optionally fetch invitation email to display
      // await fetchInvitationInfo(invitationToken.value); // Uncomment when backend endpoint exists
       invitationEmail.value = "the invited email"; // Placeholder until backend endpoint exists
       loginEmail.value = invitationEmail.value; // Pre-fill if possible
       signupEmail.value = invitationEmail.value; // Pre-fill if possible
  }
});

</script>

<style>
/* Add any specific styles if needed */
</style> 