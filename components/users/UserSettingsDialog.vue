<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="w-full max-w-lg flex flex-col h-[80vh]">
      <DialogHeader>
        <DialogTitle>User Settings</DialogTitle>
      
      </DialogHeader>

      <ScrollArea class="flex-1" maxHeight="calc(80vh - 140px)">
        <div class="p-6 space-y-6">
          <!-- Profile Picture Section -->
          <div class="flex flex-col items-center mb-8 pb-4">
            <div class="relative mb-4">
              <div v-if="!profilePicture" class="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                <User class="h-16 w-16 text-gray-400" />
              </div>
              <img 
                v-else
                :src="profilePicture" 
                alt="Profile Picture"
                class="w-28 h-28 rounded-full object-cover border"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                class="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
                @click="triggerFileInput"
              >
                <Camera class="h-4 w-4" />
              </Button>
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
                  <CheckCircleIcon class="h-4 w-4 mr-1"/> Verified
                </span>
                <span v-else class="text-amber-600 flex items-center">
                  <AlertCircleIcon class="h-4 w-4 mr-1"/> Not Verified
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
          
          <!-- Action Buttons -->
          <div class="flex justify-center pt-4">
            <Button 
              variant="outline" 
              class="mx-auto"
              @click="logout"
            >
              <LogOutIcon class="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </ScrollArea>
      
      <!-- Custom Footer instead of DialogFooter -->
      <div class="px-6 py-4 border-t mt-4 flex justify-between w-full">
        <Button 
          variant="destructive" 
          size="sm"
          @click="confirmDeleteAccount"
        >
          <TrashIcon class="mr-2 h-4 w-4" />
          Delete Account
        </Button>
        
        <div class="flex space-x-2">
          <Button variant="outline" @click="$emit('update:open', false)">Cancel</Button>
          <Button type="button" @click="saveSettings">Save Changes</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Password Change Dialog - Separate from main dialog -->
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
import { ref, computed, onMounted, watch } from 'vue' // Add watch import here
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { TrashIcon, LogOutIcon, EditIcon, CheckCircleIcon, AlertCircleIcon, User, Camera } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useUserProfile } from '@/composables/useUserProfile'
import { changeUserPassword } from '@/src/utils/auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

const router = useRouter()
const fileInput = ref(null)

// Props
const props = defineProps({
  open: Boolean,
  userData: Object,
})

// Emits
const emit = defineEmits([
  'update:open',
  'refresh-user-data',
])

// Use the user profile composable
const { updateProfilePicture } = useUserProfile()

// Refs
const userNameEdit = ref('')
const userEmailEdit = ref('')
const showPasswordChange = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const userStats = ref(null)

// Computed props
const profilePicture = computed(() => {
  console.log('userData in profilePicture computed:', props.userData)
  
  if (!props.userData?.profile_picture) {
    console.log('No profile picture found')
    return null
  }
  
  // If the profile picture is a full URL, return it as is
  if (props.userData.profile_picture.startsWith('http')) {
    console.log('Using full URL:', props.userData.profile_picture)
    return props.userData.profile_picture
  }
  
  // Otherwise, prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const fullUrl = `${baseUrl}/${props.userData.profile_picture}`
  console.log('Constructed URL:', fullUrl)
  return fullUrl
})

// Format date helper function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)
}

// Watch for props change to update form values
watch(() => props.userData, (newUserData) => {
  if (newUserData) {
    userNameEdit.value = newUserData.name || ''
    userEmailEdit.value = newUserData.email || ''
    console.log('UserSettingsDialog: userData updated', newUserData.name, newUserData.email)
  }
}, { immediate: true })

// Also watch for dialog open state changes to reset editing state
watch(() => props.open, (isOpen) => {
  if (isOpen && props.userData) {
    // Reset form values when dialog is opened
    userNameEdit.value = props.userData.name || ''
    userEmailEdit.value = props.userData.email || ''
  }
})

// Computed property to check if passwords match
const passwordMismatch = computed(() => {
  return newPassword.value && confirmPassword.value && 
         newPassword.value !== confirmPassword.value
})

// Trigger file input for profile picture
const triggerFileInput = () => {
  fileInput.value.click()
}

// Handle profile picture upload
const handleProfilePictureUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  console.log('Uploading file:', file.name, file.type)
  
  try {
    // Use the updateProfilePicture method from the composable
    const result = await updateProfilePicture(file)
    console.log('Profile picture upload result:', result)
    
    // Update the user data with new profile picture
    if (props.userData) {
      props.userData.profile_picture = result
    }
    
    // Emit refresh event
    emit('refresh-user-data')
    
    // Dispatch global event for other components
    window.dispatchEvent(new CustomEvent('user-data-updated'))
    
    // Show success message
    console.log('Profile picture updated successfully')
  } catch (error) {
    console.error('Failed to upload profile picture:', error)
    alert('Failed to upload profile picture: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Save user settings
const saveSettings = async () => {
  try {
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')
    
    if (!userId || !token) {
      throw new Error('Authentication required')
    }
    
    // Check if email has changed
    const emailChanged = userEmailEdit.value !== props.userData?.email
    
    // Make API call to update user settings
    await axios.put(`/users/${userId}`, {
      name: userNameEdit.value,
      email: userEmailEdit.value
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (emailChanged) {
      // If email changed, show verification message
      alert('A verification email has been sent to your new email address. Please verify to complete the change.')
    }
    
    // Emit event to refresh parent data
    emit('refresh-user-data')
    
    // Close dialog
    emit('update:open', false)
    
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
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')
    
    if (!userId || !token) {
      throw new Error('Authentication required')
    }
    
    // Use the new changeUserPassword utility function
    await changeUserPassword(userId, currentPassword.value, newPassword.value)
    
    // Reset form and close dialog
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showPasswordChange.value = false
    
    // Close settings dialog too
    emit('update:open', false)
    
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

// Confirm account deletion
const confirmDeleteAccount = () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    deleteAccount()
  }
}

// Delete user account
const deleteAccount = async () => {
  try {
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')
    
    if (!userId || !token) {
      throw new Error('Authentication required')
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Make API call to delete account - use the singular form /user/:id
    await axios.delete(`/user/${userId}`, { headers });
    
    // Clear local storage and redirect
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    router.push('/auth')
  } catch (error) {
    console.error('Failed to delete account:', error)
    alert('Failed to delete account: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

// Log out user
const logout = () => {
  // Show confirmation dialog first
  if (confirm('Are you sure you want to log out?')) {
    // Clear user session or token
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    router.push('/auth')
    
    // Close the settings dialog
    emit('update:open', false)
  }
}

// Fetch user stats on mount
onMounted(async () => {
  try {
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')
    
    if (!userId || !token) {
      throw new Error('Authentication required')
    }
    
    const response = await axios.get(`/users/${userId}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    userStats.value = response.data
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
  }
})

// Resend verification email
const resendVerificationEmail = async () => {
  try {
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')
    
    if (!userId || !token) {
      throw new Error('Authentication required')
    }
    
    await axios.post(`/users/${userId}/resend-verification`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    alert('Verification email resent successfully')
  } catch (error) {
    console.error('Failed to resend verification email:', error)
    alert('Failed to resend verification email: ' + (error.response?.data?.error || 'Unknown error'))
  }
}
</script>