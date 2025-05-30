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
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, signup, isEmailVerified, sendVerificationEmail } from '~/src/utils/auth' // Import SuperTokens functions
import { getUserInfo } from 'supertokens-web-js/recipe/emailpassword';
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Session from 'supertokens-web-js/recipe/session' // Import Session recipe
import { useNuxtApp } from '#app'; // IMPORT useNuxtApp

definePageMeta({
  layout: 'auth-layout'
})

const { $axiosInstance } = useNuxtApp(); // GET AXIOS INSTANCE

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
const isCheckingAuth = ref(false)
const errorMessage = ref('')

// Function to accept the invitation via backend API
const acceptInvitation = async (token) => {
  statusMessage.value = 'Processing invitation...'
  statusMessageType.value = 'info'
  try {
    console.log(`Attempting to accept invitation with token: ${token}`)
    const response = await $axiosInstance.post('/api/member/accept-invitation', { token })
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

    // Email is verified. JUST redirect. Do NOT automatically accept.
    console.log("Login successful and email verified. Redirecting to profile...");
    await router.push('/profile'); // Redirect to profile, let user accept from sidebar

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
    const signupResult = await signup($axiosInstance, signupName.value, signupEmail.value, signupPassword.value)
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

// Function to fetch basic (potentially unverified) info about the token
const fetchInvitationInfo = async (token) => {
  statusMessage.value = 'Loading invitation details...'; // Show loading state
  statusMessageType.value = 'info';
  try {
    console.log(`Fetching invitation info for token: ${token}`);
    const response = await $axiosInstance.get(`/api/member/invitation-info?token=${token}`); // Call the new backend endpoint with /api prefix
    console.log('Invitation info response:', response.data);
    invitationEmail.value = response.data.email;
    loginEmail.value = response.data.email; // Pre-fill login email
    signupEmail.value = response.data.email; // Pre-fill signup email
    statusMessage.value = ''; // Clear loading message on success
  } catch (error) {
    console.error('Failed to fetch invitation info:', error.response ? error.response.data : error);
    statusMessage.value = error.response?.data?.error || 'Could not retrieve invitation details. The link might be invalid or expired.';
    statusMessageType.value = 'error';
    invitationEmail.value = ''; // Clear email on failure
  }
};

async function handlePostAuthRedirect() {
  console.log("handlePostAuthRedirect triggered");
  // This function assumes a session exists and invitationEmail.value is populated
  try {
    isCheckingAuth.value = true;

    // Get logged-in user info
    const userInfo = await getUserInfo();
    if (!userInfo) {
      // Should not happen if sessionExists check passed, but handle defensively
      console.error("Error: Session exists but could not get user info.");
      errorMessage.value = "Could not verify your session. Please try logging in again.";
      isCheckingAuth.value = false;
      return;
    }
    console.log("Logged in user info:", userInfo);
    console.log("Invitation intended for:", invitationEmail.value);

    // Compare logged-in user email with invitation email
    if (userInfo.email !== invitationEmail.value) {
      console.warn("Logged-in user does not match invitation email.");
      statusMessage.value = `This invitation is for ${invitationEmail.value}. You are logged in as ${userInfo.email}. Please log out and sign in with the correct account.`;
      statusMessageType.value = 'error';
      isCheckingAuth.value = false;
      return; // Stop execution
    }

    // Emails match, proceed with verification check
    console.log("Logged-in user matches invitation email. Checking verification status...");
    const verificationResponse = await isEmailVerified(); // Use our util/wrapper
    console.log("Is Email Verified:", verificationResponse);

    if (!verificationResponse || !verificationResponse.isVerified) { // Check response structure
      console.log("Email not verified, redirecting to verify email flow.");
      isCheckingAuth.value = false;
      // Redirect to verification (SuperTokens handles this)
      redirectToAuth({ redirectBack: false }); // Or navigate manually if needed
      return;
    }

    // If session exists and email is verified, redirect to profile
    console.log("Session exists and email verified. Redirecting to /profile");
    isCheckingAuth.value = false;
    await router.push('/profile'); 

    /* REMOVED: Automatic Acceptance Logic
    console.log("Attempting to accept invitation automatically...");
    await acceptInvitation();
    */

  } catch (err) {
    console.error("Error during post-auth redirect or invitation acceptance:", err);
    errorMessage.value = "An error occurred. Please try logging in again.";
    isCheckingAuth.value = false;
    // Optional: Redirect to login or show error message prominently
  }
}

// Lifecycle hook - Modified order
onMounted(async () => {
  console.log("accept-invitation mounted");
  invitationToken.value = route.query.token || null; // Get token from query params

  if (invitationToken.value) {
    console.log("Token found in URL:", invitationToken.value);
    
    // Fetch invitation info FIRST
    await fetchInvitationInfo(invitationToken.value);

    // Only proceed if fetching info was successful (invitationEmail is set)
    if (invitationEmail.value) {
      // Now check session state
      try {
        isCheckingAuth.value = true;
        const sessionExists = await Session.doesSessionExist(); // Direct SDK call
        console.log("Initial session check on mount:", sessionExists);
        if (sessionExists) {
           console.log("Session exists on mount, triggering post-auth check (with email comparison).");
           await handlePostAuthRedirect(); // Trigger check/redirect logic
        } else {
          console.log("No session on mount, user needs to login/signup.");
        }
      } catch (err) {
          console.error("Error checking session on mount:", err);
          errorMessage.value = "Could not verify session status. Please try logging in.";
      } finally {
          isCheckingAuth.value = false;
      }
    } else {
       // Error message was already set by fetchInvitationInfo failure
       console.log("Fetching invitation info failed, cannot proceed with session check.");
    }

  } else {
    errorMessage.value = 'Invalid invitation link: No token found.';
    console.log("No token found in URL.");
    statusMessage.value = 'Invalid or missing invitation token in the URL.';
    statusMessageType.value = 'error';
    // Optionally redirect to an error page or home
    // router.push('/error?message=invalid_token');
  }
});

</script>

<style>
/* Add any specific styles if needed */
</style> 