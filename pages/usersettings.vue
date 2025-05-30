<template>
  <div class="container mx-auto p-6">
    <div class="max-w-2xl mx-auto">
      <!-- Page Header with Back Button and Title -->
      <div class="flex items-center mb-6">
        <Settings class="mr-2 h-6 w-6" /> <h1 class="text-2xl font-semibold">Settings</h1>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <LucideIcon name="RefreshCw" size="8" class="h-8 w-8 animate-spin text-primary" />
        <span class="ml-2">Loading settings...</span>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 p-6 rounded-lg border border-red-200">
        <div class="flex items-center mb-4">
          <LucideIcon name="AlertCircle" size="6" class="h-6 w-6 text-red-500 mr-2" />
          <h2 class="text-lg font-semibold text-red-700">Error</h2>
        </div>
        <p class="text-red-600">{{ error }}</p>
        <Button 
          class="mt-4" 
          variant="outline" 
          @click="() => router.push('/auth')"
        >
          Return to Login
        </Button>
      </div>

      <!-- Settings Form -->
      <div v-else-if="userData" class="p-8">
        <!-- Add loading overlay for account deletion -->
        <div v-if="deleteLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <div class="flex items-center justify-center mb-4">
              <LucideIcon name="RefreshCw" size="8" class="h-8 w-8 animate-spin text-destructive" />
            </div>
            <div class="text-center">
              <h3 class="text-lg font-semibold mb-2">Deleting Account</h3>
              <p class="text-sm text-muted-foreground">
                Please wait while we delete your account and all associated data...
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <!-- Profile Picture Section -->
          <div class="flex flex-col items-center pb-8">
            <div class="relative mb-4 group">
              <div v-if="!profilePictureUrl" class="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                <User class="h-16 w-16 text-gray-400" />
              </div>
              <img 
                v-else
                :src="profilePictureUrl" 
                alt="Profile Picture"
                class="w-28 h-28 rounded-full object-cover border"
              />
              <!-- Overlay for better UX -->
              <div 
                class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-all cursor-pointer"
                @click="triggerFileInput"
                :class="{ 'pointer-events-none opacity-50': deleteLoading }"
              >
                <Camera class="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <input 
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleProfilePictureUpload"
              :disabled="deleteLoading"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              @click="triggerFileInput"
              class="flex items-center"
              :disabled="deleteLoading"
            >
              <Camera class="h-4 w-4 mr-2" />
              Change Profile Picture
            </Button>
          </div>

          <!-- Personal Information Section -->
          <div class="space-y-6" :class="{ 'opacity-50 pointer-events-none': deleteLoading }">
            
            <!-- Name Field -->
            <div class="space-y-2">
              <Label for="name" class="text-sm font-medium">Name</Label>
              <div class="flex items-center space-x-2">
                <Input
                  id="name"
                  v-model="userNameEdit"
                  class="flex-grow"
                  placeholder="Enter display name"
                  :disabled="deleteLoading"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  @click="saveSettings" 
                  :disabled="!isNameChanged || saveLoading || deleteLoading"
                  class="flex-shrink-0 border disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Save name"
                >
                  <Save class="h-5 w-5" />
                </Button>
              </div>
               <p v-if="saveLoading" class="text-xs text-muted-foreground">Saving name...</p>
            </div>

            <!-- Email Field -->
            <div class="space-y-2">
              <Label for="email" class="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                v-model="userEmailEdit"
                class="w-full"
                placeholder="Enter email address"
                :disabled="true" 
              />
               <p class="text-xs text-muted-foreground">Email cannot be changed directly. Contact support if needed.</p> 
            </div>

            <!-- Email Verification Status -->
            <div v-if="userData?.email_verified !== undefined" class="space-y-2">
              <Label class="text-sm font-medium">Verification Status</Label>
              <div class="flex items-center">
                <span v-if="userData.email_verified" class="text-green-600 flex items-center">
                  <CheckCircle class="h-4 w-4 mr-1"/> Verified
                </span>
                <span v-else class="text-amber-600 flex items-center">
                  <AlertCircle class="h-4 w-4 mr-1"/> Not Verified
                  <Button 
                    variant="link" 
                    class="text-xs pl-1 h-auto p-0"
                    @click="resendVerification"
                    :disabled="resendLoading || deleteLoading"
                  >
                    {{ resendLoading ? 'Sending...' : 'Resend Verification' }}
                  </Button>
                </span>
              </div>
            </div>

            <!-- Password Field -->
            <div class="space-y-2">
              <Label class="text-sm font-medium">Password</Label>
              <div class="mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="showPasswordChange = true"
                  :disabled="deleteLoading"
                >
                  Change Password
                </Button>
              </div>
            </div>
          </div>

          <!-- Actions Section -->
          <div class="pt-8 space-y-4">
             <div class="flex justify-start items-center">
               <Button 
                 variant="destructive" 
                 @click="confirmDeleteAccount"
                 :disabled="deleteLoading"
                 class="relative"
               >
                 <LucideIcon 
                   v-if="deleteLoading" 
                   name="RefreshCw" 
                   size="4" 
                   class="h-4 w-4 mr-2 animate-spin" 
                 />
                 <Trash v-else class="mr-2 h-4 w-4" />
                 {{ deleteLoading ? 'Deleting Account...' : 'Delete Account' }}
               </Button>
             </div>
             
             <!-- Warning message during deletion -->
             <div v-if="deleteLoading" class="bg-red-50 p-4 rounded-lg border border-red-200">
               <div class="flex items-start">
                 <AlertCircle class="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                 <div>
                   <p class="text-sm font-medium text-red-700">Account Deletion in Progress</p>
                   <p class="text-sm text-red-600 mt-1">
                     Please do not close this page or navigate away. This process may take a few moments.
                   </p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <!-- Password Change Dialog -->
      <Dialog :open="showPasswordChange && !deleteLoading" @update:open="showPasswordChange = $event">
        <DialogContent class="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password.
            </DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 py-4">
            <div class="space-y-2">
              <Label for="current-password" class="text-sm font-medium">Current Password</Label>
              <Input id="current-password" type="password" v-model="currentPassword" />
            </div>

            <div class="space-y-2">
              <Label for="new-password" class="text-sm font-medium">New Password</Label>
              <Input id="new-password" type="password" v-model="newPassword" />
            </div>

            <div class="space-y-2">
              <Label for="confirm-password" class="text-sm font-medium">Confirm New Password</Label>
              <Input id="confirm-password" type="password" v-model="confirmPassword" />
              <p v-if="passwordMismatch" class="text-xs text-destructive">
                Passwords do not match
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showPasswordChange = false" :disabled="deleteLoading">Cancel</Button>
            <Button type="submit" @click="changePasswordHandler" :disabled="changePasswordLoading || deleteLoading">
               <LucideIcon 
                 v-if="changePasswordLoading" 
                 name="RefreshCw" 
                 size="4" 
                 class="h-4 w-4 mr-2 animate-spin" 
               />
               {{ changePasswordLoading ? 'Changing...' : 'Change Password' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { User, Camera, CheckCircle, AlertCircle, LogOut, Trash, Save, Settings } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUserProfile } from '@/composables/useUserProfile'
import { changeUserPassword, deleteUserAccount as authDeleteUserAccount, signOut } from '@/src/utils/auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useAlert } from '@/composables/useAlert'
import LucideIcon from '@/components/LucideIcon.vue' // Assuming you have this component
import Session from 'supertokens-web-js/recipe/session'
import { useNuxtApp } from '#app'

definePageMeta({
  layout: 'app-layout',
  middleware: ['auth'] // Ensure user is authenticated
})

const router = useRouter()
const fileInput = ref(null)
const { alert, confirm } = useAlert()
const { $axiosInstance } = useNuxtApp()

// Debug: Check if axios instance is available
console.log('[UserSettings Page] $axiosInstance availability check:', !!$axiosInstance)
if (!$axiosInstance) {
  console.error('[UserSettings Page] $axiosInstance is undefined! This will cause errors in composables.')
}

const { 
  userData, 
  loading, 
  error, 
  fetchCurrentUserProfile, 
  updateProfilePicture,
  updateUserProfileDetails,
  resendVerificationEmail,
  posts, 
  loadingPosts, 
  fetchUserPosts,
  createNewUserPost,
  editUserPost,
  deleteUserPost
} = useUserProfile($axiosInstance) // PASS AXIOS INSTANCE

// Local state for form edits
const userNameEdit = ref('')
const userEmailEdit = ref('') // Keep email field for display, but disable editing

// Password change state
const showPasswordChange = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const changePasswordLoading = ref(false)

// Action loading states
const saveLoading = ref(false)
const deleteLoading = ref(false)
const resendLoading = ref(false)

// Computed property to track if the name has changed
const isNameChanged = computed(() => {
  return userData.value && userNameEdit.value !== (userData.value.name || '');
});

// Computed property to check if passwords match
const passwordMismatch = computed(() => {
  return newPassword.value && confirmPassword.value && 
         newPassword.value !== confirmPassword.value
})

// Computed property for profile picture URL
const profilePictureUrl = computed(() => {
  if (!userData.value?.profile_picture) return null
  if (userData.value.profile_picture.startsWith('http')) {
    return userData.value.profile_picture
  }
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl || 'http://localhost:8088'
  return `${baseUrl}/${userData.value.profile_picture}`
})

// Watch for userData changes to update form values
watch(userData, (newUserData) => {
  if (newUserData) {
    userNameEdit.value = newUserData.name || ''
    userEmailEdit.value = newUserData.email || '' // Update email display
  }
}, { immediate: true })


// Trigger file input for profile picture
const triggerFileInput = () => {
  fileInput.value.click()
}

// Handle profile picture upload
const handleProfilePictureUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    if (!userData.value?.id) {
      throw new Error('User data not available.')
    }
    await updateProfilePicture(userData.value.id, file) // Pass the user ID
    await fetchCurrentUserProfile() // Refresh data after upload
    window.dispatchEvent(new CustomEvent('user-data-updated')) // Notify other components
    alert('Profile picture updated successfully.', 'New profile picture')
  } catch (uploadError) {
    console.error('Failed to upload profile picture:', uploadError)
    alert('Failed to upload profile picture: ' + (uploadError.response?.data?.error || uploadError.message || 'Unknown error'))
  }
}

// Save user settings (only name for now)
const saveSettings = async () => {
  saveLoading.value = true
  try {
    if (!userData.value?.id || !userData.value?.email) { // Ensure email is also available for the payload
      throw new Error('User data (ID or Email) not available.')
    }

    // Construct the payload expected by updateUserProfileDetails
    const profileData = { 
      id: userData.value.id,
      email: userData.value.email, // Pass the existing email
      name: userNameEdit.value 
      // Add other fields here if your updateUserProfileDetails and backend expect them
    };
    
    // Call the correctly named function from the composable
    await updateUserProfileDetails(profileData);
    await fetchCurrentUserProfile(); // Re-fetch to update userData and reset isNameChanged implicitly
    
    window.dispatchEvent(new CustomEvent('user-data-updated')) // Notify other components
    alert('Settings updated successfully.')
    // Optionally navigate back or show success inline
    // router.push('/profile') 
  } catch (saveError) {
    console.error('Failed to update settings:', saveError)
    alert('Failed to update settings: ' + (saveError.response?.data?.error || saveError.message || 'Unknown error'))
  } finally {
    saveLoading.value = false
  }
}

// Change password handler
const changePasswordHandler = async () => {
  if (newPassword.value !== confirmPassword.value) {
    alert('Passwords do not match')
    return
  }
  if (!currentPassword.value || !newPassword.value) {
    alert('Please fill in all password fields')
    return
  }
  if (newPassword.value.length < 6) {
    alert('Password must be at least 6 characters long')
    return
  }
  
  changePasswordLoading.value = true
  try {
    if (!userData.value?.id) {
      throw new Error('User ID not available.')
    }
    
    console.log('=== FRONTEND DEBUG: Password Change Handler ===')
    console.log('Full userData.value:', userData.value)
    console.log('userData.value.id:', userData.value.id)
    console.log('typeof userData.value.id:', typeof userData.value.id)
    console.log('JSON.stringify(userData.value):', JSON.stringify(userData.value))
    console.log('About to call changeUserPassword with userId:', userData.value.id)
    console.log('=== END FRONTEND DEBUG ===')
    
    await changeUserPassword($axiosInstance, userData.value.id, currentPassword.value, newPassword.value) // Fixed parameter order and added userId
    
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showPasswordChange.value = false
    
    alert('Password changed successfully.')
  } catch (passError) {
    console.error('Failed to change password:', passError)
    const errorMessage = passError.response?.data?.error || passError.message || 'Unknown error'
    if (passError.response?.status === 401) {
        alert('Current password is incorrect.')
    } else {
        alert(`Failed to change password: ${errorMessage}`)
    }
  } finally {
    changePasswordLoading.value = false
  }
}

// Confirm account deletion
const confirmDeleteAccount = async () => {
  // Prevent deletion during other loading states
  if (deleteLoading.value || saveLoading.value || changePasswordLoading.value) {
    alert('Please wait for current operations to complete before deleting your account.')
    return
  }

 const confirmed = await confirm(
    'Are you sure you want to delete your account? This action is permanent and cannot be undone.\n\nThis will:\n• Delete all your personal data\n• Remove you from all groups\n• Delete all your posts and votes\n• Cancel any active subscriptions', 
    'Delete Account - Final Warning', 
    { actionText: 'Yes, Delete My Account Forever', cancelText: 'Cancel', variant: 'destructive' }
 )
  
 if (confirmed) {
    // Show immediate feedback that deletion is starting
    deleteLoading.value = true
    
    // Small delay to ensure UI updates before API call
    await new Promise(resolve => setTimeout(resolve, 100))
    
    deleteAccount()
  }
}

// Delete user account
const deleteAccount = async () => {
  try {
    console.log('Starting account deletion process...')
    
    // Backend delete should handle session invalidation via SuperTokens
    await authDeleteUserAccount($axiosInstance); 
    
    console.log('Account deletion successful, signing out...')

    // Frontend sign out as a fallback / cleanup
    await signOut(); 
    
    // Show success message briefly before redirect
    alert('Your account has been successfully deleted.')
    
    // Redirect to auth page with full refresh
    window.location.href = '/auth'; 

  } catch (delError) {
    console.error('Failed to delete account:', delError);
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error occurred'
    if (delError.response?.data?.error) {
      errorMessage = delError.response.data.error
    } else if (delError.message) {
      errorMessage = delError.message
    }
    
    // Check for specific error types
    if (delError.response?.status === 401) {
      errorMessage = 'Authentication failed. Please log in again and try deleting your account.'
    } else if (delError.response?.status === 403) {
      errorMessage = 'You do not have permission to delete this account.'
    } else if (delError.response?.status >= 500) {
      errorMessage = 'Server error occurred. Please try again later or contact support.'
    }
    
    alert(`Failed to delete account: ${errorMessage}`);
    console.error('Error details:', delError.response?.data || delError);
  } finally {
    deleteLoading.value = false;
  }
}

// Resend verification email handler
const resendVerification = async () => {
  resendLoading.value = true
  try {
    if (!userData.value?.id) {
      throw new Error('User data not available.')
    }
    await resendVerificationEmail() // Use the composable function
    alert('Verification email has been sent. Please check your inbox.')
  } catch (resendError) {
    console.error('Failed to resend verification email:', resendError)
    alert('Failed to resend verification email: ' + (resendError.response?.data?.error || resendError.message || 'Unknown error'))
  } finally {
    resendLoading.value = false
  }
}

// Fetch user data on component mount
onMounted(async () => {
  console.log('UserSettings page mounted, fetching profile...');
   try {
    const sessionExists = await Session.doesSessionExist();
    if (!sessionExists) {
      console.warn('No session found on settings page, redirecting to auth...');
      router.push('/auth');
      return;
    }
    await fetchCurrentUserProfile();
    console.log('User profile fetched:', userData.value);
  } catch (fetchError) {
     console.error('Error fetching profile on settings page:', fetchError);
     // Error handling is already within the composable, setting the `error` ref
  }
});

</script>

<style scoped>
/* Add any page-specific styles if needed */
</style> 