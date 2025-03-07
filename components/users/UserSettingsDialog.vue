<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="w-full max-w-lg">
      <DialogHeader>
        <DialogTitle>User Settings</DialogTitle>
      
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6"> 
        <form @submit.prevent="saveSettings" class="space-y-6">
          <!-- Profile Picture Section -->
          <div class="flex flex-col items-center pb-6 border-b">
            <div class="relative mb-4">
              <div v-if="!profilePicture" class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <User class="h-10 w-10 text-gray-400" />
              </div>
              <img 
                v-else
                :src="profilePicture" 
                alt="Profile Picture"
                class="w-24 h-24 rounded-full object-cover border"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="absolute bottom-0 right-0 rounded-full bg-background border shadow-sm"
                @click="triggerFileInput"
              >
                <EditIcon class="h-4 w-4" />
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
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Name</p>
                <p class="font-medium">{{ userNameEdit }}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="editingName = !editingName"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingName" class="pb-4">
              <Input
                id="name"
                v-model="userNameEdit"
                class="w-full mb-2"
                placeholder="Enter display name"
              />
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="editingName = false">Cancel</Button>
                <Button type="button" size="sm" @click="saveUserName">Save</Button>
              </div>
            </div>

            <!-- Email Field -->
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Email Address</p>
                <p class="font-medium">{{ userEmailEdit }}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="editingEmail = !editingEmail"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingEmail" class="pb-4">
              <Input
                id="email"
                v-model="userEmailEdit"
                class="w-full mb-2"
                placeholder="Enter email address"
              />
              <p class="text-xs text-muted-foreground mb-2">
                Changing your email will require verification
              </p>
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="editingEmail = false">Cancel</Button>
                <Button type="button" size="sm" @click="saveUserEmail">Save</Button>
              </div>
            </div>

            <!-- Email Verification Status -->
            <div v-if="userData?.email_verified !== undefined" class="flex items-center pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Verification Status</p>
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
            </div>

            <!-- Password Field -->
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Password</p>
                <p class="font-medium">●●●●●●●●</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="showPasswordChange = true"
              >
                Change
              </Button>
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
        </form>
      </div>
      
      <!-- Custom Footer instead of DialogFooter -->
      <div class="px-6 pb-6 border-t pt-4 mt-4 flex justify-between w-full">
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
          <Button type="submit" @click="saveSettings">Save Changes</Button>
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
        <div class="grid gap-2">
          <Label for="current-password">Current Password</Label>
          <Input id="current-password" type="password" v-model="currentPassword" />
        </div>

        <div class="grid gap-2">
          <Label for="new-password">New Password</Label>
          <Input id="new-password" type="password" v-model="newPassword" />
        </div>

        <div class="grid gap-2">
          <Label for="confirm-password">Confirm New Password</Label>
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
import { TrashIcon, LogOutIcon, EditIcon, CheckCircleIcon, AlertCircleIcon, User } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useUserProfile } from '@/composables/useUserProfile'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

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
const editingName = ref(false)
const editingEmail = ref(false)
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
    // Reset editing states
    editingName.value = false
    editingEmail.value = false
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

// Save user name
const saveUserName = async () => {
  try {
    const userId = localStorage.getItem('userId')
    
    // Update user name
    await axios.put(`/users/${userId}`, {
      name: userNameEdit.value
    })
    
    // Update local user data
    if (props.userData) {
      props.userData.name = userNameEdit.value
    }
    
    // Hide editing UI
    editingName.value = false
    
    // Emit refresh event
    emit('refresh-user-data')
    
    // Dispatch global event for other components
    window.dispatchEvent(new CustomEvent('user-data-updated'))
    
    return true
  } catch (error) {
    console.error('Failed to update user name:', error)
    throw error
  }
}

// Save user email
const saveUserEmail = async () => {
  try {
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')
    
    console.log('Saving user email:', userEmailEdit.value)
    console.log('User ID:', userId)
    console.log('Token available:', !!token)
    
    if (!userId || !token) {
      throw new Error('Authentication required')
    }
    
    // Check if email has changed
    const emailChanged = userEmailEdit.value !== props.userData?.email
    
    if (emailChanged) {
      // Make API call to update user email
      console.log('Making PUT request to:', `/users/${userId}`)
      const response = await axios.put(`/users/${userId}`, {
        email: userEmailEdit.value
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Update user email response:', response.data)
      
      // Show verification message
      alert('A verification email has been sent to your new email address. Please verify to complete the change.')
    }
    
    // Exit edit mode
    editingEmail.value = false
    
    // Emit event to refresh parent data
    emit('refresh-user-data')
    
    // Show success message
    console.log('User email updated successfully')
  } catch (error) {
    console.error('Failed to update user email:', error)
    console.error('Error response:', error.response)
    alert('Failed to update user email: ' + (error.response?.data?.error || 'Unknown error'))
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
    return // Don't proceed if passwords don't match
  }
  
  try {
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')
    
    if (!userId || !token) {
      throw new Error('Authentication required')
    }
    
    // Make API call to change password
    await axios.put(`/users/${userId}/password`, {
      current_password: currentPassword.value,
      new_password: newPassword.value
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
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
    alert('Failed to change password: ' + (error.response?.data?.error || 'Unknown error'))
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