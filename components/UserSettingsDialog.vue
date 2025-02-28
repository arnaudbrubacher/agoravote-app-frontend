<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent @close="$emit('update:open', false)" class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>User Settings</DialogTitle>
        <DialogDescription>
          Manage your account settings and preferences.
        </DialogDescription>
      </DialogHeader>
      
      <div class="grid gap-4 py-4">
        <!-- Profile Picture Section -->
        <div class="grid gap-2">
          <Label for="picture">Profile Picture</Label>
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0">
              <div v-if="profilePicture" class="w-16 h-16 rounded-full overflow-hidden border">
                <img :src="profilePicture" alt="Profile" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <Button @click="triggerFileInput">
              Change Picture
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
        
        <!-- Name Field -->
        <div class="grid gap-2">
          <Label for="name">Display Name</Label>
          <Input id="name" v-model="userNameEdit" />
        </div>
        
        <!-- Email Field -->
        <div class="grid gap-2">
          <Label for="email">Email Address</Label>
          <Input id="email" v-model="userEmailEdit" />
          <p class="text-xs text-muted-foreground">
            Changing your email will require verification
          </p>
        </div>
        
        <!-- Password Section -->
        <div class="grid gap-2">
          <Label for="current-password">Password</Label>
          <div class="flex items-center justify-between">
            <span class="text-sm">●●●●●●●●</span>
            <Button variant="outline" size="sm" @click="showPasswordChange = true">
              Change Password
            </Button>
          </div>
        </div>
        
        <!-- Account Danger Zone -->
        <div class="border-t pt-4 mt-4">
          <h4 class="text-sm font-medium text-destructive mb-2">Danger Zone</h4>
          <Button 
            variant="destructive" 
            class="w-full" 
            @click="confirmDeleteAccount"
          >
            <TrashIcon class="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">Cancel</Button>
        <Button type="submit" @click="saveSettings">Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Password Change Dialog -->
  <Dialog :open="showPasswordChange" @update:open="showPasswordChange = $event">
    <DialogContent @close="showPasswordChange = false" class="sm:max-w-[425px]">
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '~/src/utils/axios'
import { TrashIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

// Computed props
const profilePicture = computed(() => props.userData?.profile_picture || null)

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
</script>