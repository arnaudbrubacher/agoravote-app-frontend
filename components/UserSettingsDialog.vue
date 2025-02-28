<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="w-full max-w-lg">
      <DialogHeader>
        <DialogTitle>User Settings</DialogTitle>
        <DialogDescription>
          Manage your account settings and preferences.
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6">
        <form @submit.prevent="saveSettings" class="space-y-6">
          <!-- Profile Picture Section -->
          <div class="flex justify-center mb-8">
            <div class="relative">
              <div v-if="!profilePicture" class="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
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
                <EditIcon class="h-4 w-4" />
              </Button>
              <input 
                type="file" 
                ref="fileInput" 
                class="hidden"
                accept="image/*" 
                @change="handleProfilePictureUpload" 
              />
            </div>
          </div>

          <!-- User ID Field (Read-only) -->
          <div class="space-y-2">
            <Label class="text-sm text-muted-foreground">User ID</Label>
            <div class="px-3 py-2 text-sm font-medium bg-muted rounded">
              {{ userData?.id || 'Not available' }}
            </div>
          </div>

          <!-- Name Field -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="name" class="text-sm text-muted-foreground">Display Name</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="editingName = !editingName"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingName">
              <Input
                id="name"
                v-model="userNameEdit"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="Enter display name"
              />
            </div>
            <div v-else class="px-3 py-2 text-lg font-medium">
              {{ userNameEdit }}
            </div>
          </div>

          <!-- Email Field -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="email" class="text-sm text-muted-foreground">Email Address</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                @click="editingEmail = !editingEmail"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingEmail">
              <Input
                id="email"
                v-model="userEmailEdit"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="Enter email address"
              />
              <p class="text-xs text-muted-foreground">
                Changing your email will require verification
              </p>
            </div>
            <div v-else class="px-3 py-2 text-lg font-medium">
              {{ userEmailEdit }}
            </div>
          </div>

          <!-- Email Verified Status -->
          <div class="space-y-2" v-if="userData?.email_verified !== undefined">
            <Label class="text-sm text-muted-foreground">Email Verification Status</Label>
            <div class="px-3 py-2 flex items-center">
              <span v-if="userData.email_verified" class="text-green-600 flex items-center">
                <CheckCircleIcon class="h-5 w-5 mr-1"/> Verified
              </span>
              <span v-else class="text-amber-600 flex items-center">
                <AlertCircleIcon class="h-5 w-5 mr-1"/> Not Verified
                <Button 
                  variant="link" 
                  class="text-sm ml-2" 
                  @click="resendVerificationEmail"
                >
                  Resend Verification
                </Button>
              </span>
            </div>
          </div>

          <!-- Registration Date -->
          <div class="space-y-2" v-if="userData?.created_at">
            <Label class="text-sm text-muted-foreground">Account Created</Label>
            <div class="px-3 py-2 text-md">
              {{ formatDate(userData.created_at) }}
            </div>
          </div>
          
          <!-- Last Login -->
          <div class="space-y-2" v-if="userData?.last_login">
            <Label class="text-sm text-muted-foreground">Last Login</Label>
            <div class="px-3 py-2 text-md">
              {{ formatDate(userData.last_login) }}
            </div>
          </div>

          <!-- Password Section -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="current-password" class="text-sm text-muted-foreground">Password</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="showPasswordChange = true"
              >
                Change Password
              </Button>
            </div>
            <div class="px-3 py-2 text-lg font-medium">
              ●●●●●●●●
            </div>
          </div>

          <!-- User Role -->
          <div class="space-y-2" v-if="userData?.role">
            <Label class="text-sm text-muted-foreground">Role</Label>
            <div class="px-3 py-2 flex items-center">
              <Badge :variant="userData.role === 'admin' ? 'default' : 'secondary'">
                {{ userData.role.charAt(0).toUpperCase() + userData.role.slice(1) }}
              </Badge>
            </div>
          </div>

          <!-- Membership Stats -->
          <div class="space-y-2" v-if="userStats">
            <Label class="text-sm text-muted-foreground">Memberships</Label>
            <div class="bg-muted rounded-lg p-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span>Groups Joined:</span>
                <span class="font-medium">{{ userStats.groupsJoined || 0 }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Groups Owned:</span>
                <span class="font-medium">{{ userStats.groupsOwned || 0 }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Votes Created:</span>
                <span class="font-medium">{{ userStats.votesCreated || 0 }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Votes Participated In:</span>
                <span class="font-medium">{{ userStats.votesParticipated || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Log Out Button -->
          <Button 
            variant="outline" 
            class="w-full mt-4" 
            @click="logout"
          >
            <LogOutIcon class="mr-2 h-4 w-4" />
            Log Out
          </Button>

          <!-- Delete Account Button -->
          <Button 
            variant="destructive" 
            class="w-full mt-4" 
            @click="confirmDeleteAccount"
          >
            <TrashIcon class="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </form>
      </div>

      <DialogFooter class="px-6 pb-6">
        <Button variant="outline" @click="$emit('update:open', false)">Cancel</Button>
        <Button type="submit" @click="saveSettings">Save Changes</Button>
      </DialogFooter>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { TrashIcon, LogOutIcon, EditIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge' // Updated import path
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
const profilePicture = computed(() => props.userData?.profile_picture || null)

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
if (props.userData) {
  userNameEdit.value = props.userData.name || ''
  userEmailEdit.value = props.userData.email || ''
}

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
  
  try {
    // Create form data
    const formData = new FormData()
    formData.append('profile_picture', file)
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')
    
    if (!userId || !token) {
      throw new Error('Authentication required')
    }
    
    // Upload the file
    const response = await axios.post(`/users/${userId}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    })
    
    // Emit event to refresh parent data
    emit('refresh-user-data')
    
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
    
    // Make API call to delete account
    await axios.delete(`/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
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
  // Clear user session or token
  localStorage.removeItem('token')
  router.push('/auth')
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