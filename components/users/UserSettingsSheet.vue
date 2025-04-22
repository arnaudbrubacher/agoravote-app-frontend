<template>
  <Sheet v-model:open="isOpen" side="right">
    <SheetContent class="w-full sm:max-w-md overflow-y-auto">
      <!-- Profile Section with UserCard -->
      <SheetHeader class="pb-2">
        <SheetTitle>Profile</SheetTitle>
      </SheetHeader>
      
      <!-- User Card using the existing component -->
      <div class="p-4 cursor-pointer hover:bg-accent/5 transition-colors rounded-lg" @click="navigateToProfile">
        <UserCard 
          :user="userData" 
          @click="navigateToProfile"
        />
      </div>
      
      <!-- Profile Actions -->
      <div class="px-4 pb-6 pt-2 flex justify-between">
        <Button 
          variant="destructive" 
          size="sm"
          @click="confirmDeleteAccount"
        >
          <Trash class="mr-2 h-4 w-4" />
          Delete Account
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          @click="logout"
          :disabled="isLoggingOut"
        >
          <LogOut class="mr-2 h-4 w-4" />
          <span v-if="isLoggingOut">Logging out...</span>
          <span v-else>Log Out</span>
        </Button>
      </div>
      
      <!-- User Settings Section -->
      <SheetHeader class="pb-4">
        <SheetTitle>Settings</SheetTitle>
      </SheetHeader>
      
      <div class="p-6 space-y-6">
        <!-- Profile Picture Section -->
        <div class="flex flex-col items-center mb-8">
          <div class="relative mb-4 group">
            <div v-if="!profilePictureUrl" class="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
              <User class="h-16 w-16 text-gray-400" />
            </div>
            <img 
              v-else
              :src="profilePictureUrl" 
              alt="Profile Picture"
              class="w-28 h-28 rounded-full object-cover"
            />
            <!-- Overlay for better UX -->
            <div 
              class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-all cursor-pointer"
              @click="triggerFileInput"
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
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="triggerFileInput"
          >
            Change Profile Picture
          </Button>
        </div>

        <!-- Personal Information Section -->
        <div class="space-y-4">
          
          <!-- Name Field -->
          <div class="space-y-2 pb-3">
            <Label for="name" class="text-sm font-medium">Name</Label>
            <Input
              id="name"
              v-model="userNameEdit"
              class="w-full"
              placeholder="Enter display name"
            />
          </div>

          <!-- Email Field -->
          <div class="space-y-2 pb-3">
            <Label for="email" class="text-sm font-medium">Email Address</Label>
            <Input
              id="email"
              v-model="userEmailEdit"
              class="w-full"
              placeholder="Enter email address"
            />
          </div>

          <!-- Email Verification Status -->
          <div v-if="userData?.email_verified !== undefined" class="space-y-2 pb-3">
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
                  @click="resendVerificationEmail"
                >
                  Resend Verification
                </Button>
              </span>
            </div>
          </div>

          <!-- Password Field -->
          <div class="space-y-2 pb-3">
            <Label class="text-sm font-medium">Password</Label>
            <div class="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="showPasswordChange = true"
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer with save actions -->
      <div class="px-6 py-4 mt-4">
        <!-- Primary Actions -->
        <div class="flex justify-between">
          <Button variant="outline" @click="closeSheet">Cancel</Button>
          <Button type="button" @click="saveSettings">Save Changes</Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Password Change Dialog -->
  <Dialog :open="showPasswordChange" @update:open="showPasswordChange = $event">
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
        <Button variant="outline" @click="showPasswordChange = false">Cancel</Button>
        <Button type="submit" @click="changePassword">Change Password</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { User, Camera, CheckCircle, AlertCircle, LogOut, Trash } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUserProfile } from '@/composables/useUserProfile'
import { changeUserPassword, deleteUserAccount as authDeleteUserAccount, signOut } from '@/src/utils/auth'
import axios from '~/src/utils/axios'
import UserCard from '@/components/users/UserCard.vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useAlert } from '@/composables/useAlert'
import { inject } from 'vue'

const router = useRouter()
const fileInput = ref(null)
const { confirm } = useAlert()
const alertDialog = inject('alertDialog')

// Props
const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  userData: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['update:open', 'refresh-user-data'])

// User settings form data
const userNameEdit = ref('')
const userEmailEdit = ref('')
const showPasswordChange = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Add loading state for logout
const isLoggingOut = ref(false)

// Use the user profile composable
const { updateProfilePicture } = useUserProfile()

// Computed property for two-way binding of open state
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// Computed property to check if passwords match
const passwordMismatch = computed(() => {
  return newPassword.value && confirmPassword.value && 
         newPassword.value !== confirmPassword.value
})

// Computed property for profile picture URL
const profilePictureUrl = computed(() => {
  if (!props.userData?.profile_picture) return null
  
  // If the profile picture is a full URL, return it as is
  if (props.userData.profile_picture.startsWith('http')) {
    return props.userData.profile_picture
  }
  
  // Otherwise, prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${baseUrl}/${props.userData.profile_picture}`
})

// Navigate to user profile
const navigateToProfile = () => {
  // Close the settings sheet
  closeSheet()
  
  // Navigate to the profile page
  router.push('/profile')
}

// Watch for userData changes to update form values
watch(() => props.userData, (newUserData) => {
  if (newUserData) {
    userNameEdit.value = newUserData.name || ''
    userEmailEdit.value = newUserData.email || ''
  }
}, { immediate: true })

// Watch for open state changes to reset form values
watch(() => props.open, (isOpen) => {
  if (isOpen && props.userData) {
    userNameEdit.value = props.userData.name || ''
    userEmailEdit.value = props.userData.email || ''
  }
})

// Close the sheet
const closeSheet = () => {
  isOpen.value = false
  
  // If there's an active alert dialog, close it too
  if (alertDialog && alertDialog.closeDialog) {
    alertDialog.closeDialog()
  }
}

// Trigger file input for profile picture
const triggerFileInput = () => {
  fileInput.value.click()
}

// Handle profile picture upload
const handleProfilePictureUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    // Use the updateProfilePicture method from the composable
    // Pass the userId from props
    const userId = props.userData?.id
    if (!userId) {
        console.error('User data not available. Cannot upload profile picture.')
        alert('User data not available. Cannot upload profile picture.')
        return
    }
    const result = await updateProfilePicture(userId, file)
    
    // Emit event to refresh user data in parent
    emit('refresh-user-data')
    
    // Dispatch global event for other components
    window.dispatchEvent(new CustomEvent('user-data-updated'))
  } catch (error) {
    console.error('Failed to upload profile picture:', error)
    alert('Failed to upload profile picture: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Add these helper functions at the beginning of your script setup
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

const removeLocalStorage = (key) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

// Save user settings
const saveSettings = async () => {
  try {
    const userId = props.userData?.id
    
    if (!userId) {
      throw new Error('User data not available. Cannot save settings.')
    }
    
    // Check if email has changed
    const emailChanged = userEmailEdit.value !== props.userData?.email
    
    // Make API call to update user settings
    await axios.put(`/users/${userId}`, {
      name: userNameEdit.value,
      email: userEmailEdit.value
    })
    
    if (emailChanged) {
      // If email changed, show verification message
      alert('A verification email has been sent to your new email address. Please verify to complete the change.')
    }
    
    // Emit event to refresh user data in parent
    emit('refresh-user-data')
    
    // Close sheet
    closeSheet()
    
    // Show success message
    console.log('Settings updated successfully')
  } catch (error) {
    console.error('Failed to update settings:', error)
    alert('Failed to update settings: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Change password
const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    alert('Passwords do not match')
    return
  }
  
  if (!currentPassword.value) {
    alert('Please enter your current password')
    return
  }
  
  if (!newPassword.value) {
    alert('Please enter a new password')
    return
  }
  
  // Simple password validation
  if (newPassword.value.length < 6) {
    alert('Password must be at least 6 characters long')
    return
  }
  
  try {
    const userId = props.userData?.id
    
    if (!userId) {
      throw new Error('User data not available. Cannot change password.')
    }
    
    // Use the changeUserPassword utility function
    await changeUserPassword(userId, currentPassword.value, newPassword.value)
    
    // Reset form and close dialog
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showPasswordChange.value = false
    
    // Close settings sheet too
    closeSheet()
    
    // Show success message
    alert('Password changed successfully')
  } catch (error) {
    console.error('Failed to change password:', error)
    
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status
      const errorMessage = error.response.data?.error || 'Unknown error'
      
      if (status === 401) {
        alert('Current password is incorrect')
      } else if (status === 400) {
        alert(`Failed to change password: ${errorMessage}`)
      } else {
        alert(`Failed to change password: ${errorMessage}`)
      }
    } else {
      alert('Failed to change password: Network error')
    }
  }
}

// Debug localStorage values
const debugLocalStorage = () => {
  if (typeof window === 'undefined') return;
  
  console.log('DEBUG: localStorage contents:');
  console.log('userId:', getLocalStorage('userId'));
  console.log('token:', getLocalStorage('token')?.substring(0, 20) + '...');
  
  // Try to decode the token
  try {
    const token = getLocalStorage('token');
    if (token) {
      // Use window.atob to decode the base64 part of the token
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(window.atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        console.log('Decoded token payload:', payload);
        console.log('Token user_id:', payload.user_id);
        console.log('Token expiration:', new Date(payload.exp * 1000).toLocaleString());
      }
    }
  } catch (error) {
    console.error('Error decoding token:', error);
  }
}

// Confirm account deletion
const confirmDeleteAccount = () => {
  // Debug localStorage values
  debugLocalStorage();
  
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    deleteAccount()
  }
}

// Delete user account
const deleteAccount = async () => {
  try {
    // 1. Call the utility function. This MUST be authenticated.
    await authDeleteUserAccount();

    // 2. Sign out frontend AFTER backend attempt.
    // Backend revocation should prevent refresh loops now.
    await signOut();

    // 3. Use window.location.href for a full page reload to clear any lingering state.
    // Redirect after delete attempt and sign out.
    window.location.href = '/auth';

  } catch (error) {
    console.error('Failed to delete account:', error)
    alert(`Failed to delete account: ${error.message || 'Unknown error'}`)
    console.error('Error details:', error.response?.data || error);
  }
}

// Extract user ID from JWT token
const extractUserIdFromToken = (token) => {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Invalid token format')
      return null
    }
    
    // Decode the payload part (second part) of the token
    const payload = JSON.parse(window.atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.user_id || null
  } catch (error) {
    console.error('Failed to extract user ID from token:', error)
    return null
  }
}

// Resend verification email
const resendVerificationEmail = async () => {
  try {
    const userId = props.userData?.id
    
    if (!userId) {
      throw new Error('User data not available. Cannot resend verification email.')
    }
    
    // Make API call to resend verification email
    await axios.post(`/users/${userId}/resend-verification`)
    
    // Show success message
    alert('Verification email has been sent. Please check your inbox.')
  } catch (error) {
    console.error('Failed to resend verification email:', error)
    alert('Failed to resend verification email: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Log out user
const logout = async () => {
  const confirmed = await confirm(
    'Are you sure you want to log out?',
    'Confirm Logout',
    { actionText: 'Yes, log out', cancelText: 'Cancel' }
  )
  
  if (confirmed) {
    isLoggingOut.value = true // Set loading state
    try {
      await signOut(); // Use the signOut utility from auth.js
      // Force navigation to auth page after successful sign out
      window.location.href = '/auth'; // Use window.location for a full refresh
    } catch(error) {
        console.error('Logout failed:', error);
        alert('Logout failed. Please try again.');
    } finally {
      isLoggingOut.value = false // Reset loading state
    }
  }
}
</script> 