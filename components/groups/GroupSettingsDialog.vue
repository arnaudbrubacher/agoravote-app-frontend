<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Group Settings</DialogTitle>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-6">
          <!-- Group Picture Section -->
          <div class="flex flex-col items-center pb-6 border-b">
            <div class="relative mb-4">
              <div v-if="!group.picture && !previewImage" class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <Users class="h-10 w-10 text-gray-400" />
              </div>
              <img 
                v-else
                :src="previewImage || (group.picture && isFullUrl(group.picture) ? group.picture : `${apiBaseUrl}${group.picture}`)" 
                alt="Group Picture"
                class="w-24 h-24 rounded-full object-cover border"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="absolute bottom-0 right-0 rounded-full bg-background border shadow-sm"
                @click="$refs.fileInput.click()"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <input 
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              @click="$refs.fileInput.click()"
            >
              Change Group Picture
            </Button>
          </div>
          
          <!-- Group Information Section -->
          <div class="space-y-4">
            <!-- Group Name Field -->
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Name</p>
                <p class="font-medium">{{ formData.name }}</p>
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
                v-model="formData.name"
                class="w-full mb-2"
                placeholder="Enter group name"
                required
              />
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="cancelNameEdit">Cancel</Button>
                <Button type="button" size="sm" @click="saveName">Save</Button>
              </div>
            </div>

            <!-- Group Description Field -->
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Description</p>
                <p class="font-medium">{{ formData.description || 'No description' }}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="editingDescription = !editingDescription"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingDescription" class="pb-4">
              <Textarea
                id="description"
                v-model="formData.description"
                class="w-full mb-2"
                placeholder="Enter group description"
              />
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="cancelDescriptionEdit">Cancel</Button>
                <Button type="button" size="sm" @click="saveDescription">Save</Button>
              </div>
            </div>

            <!-- Group Privacy Field -->
            <div class="flex items-center justify-between pb-3 border-b">
              <div>
                <p class="text-xs text-muted-foreground mb-1">Privacy Setting</p>
                <p class="font-medium">{{ formData.isPublic ? 'Public' : 'Private' }}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="editingPrivacy = !editingPrivacy"
              >
                <EditIcon class="h-4 w-4" />
              </Button>
            </div>
            <div v-if="editingPrivacy" class="pb-4">
              <Select
                v-model="formData.isPublic"
                class="w-full mb-2"
              >
                <option :value="true">Public - Anyone can find this group</option>
                <option :value="false">Private - Only invited members can join</option>
              </Select>
              <div class="flex justify-end gap-2">
                <Button variant="outline" size="sm" @click="cancelPrivacyEdit">Cancel</Button>
                <Button type="button" size="sm" @click="savePrivacy">Save</Button>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              variant="destructive" 
              @click="handleDelete"
              class="flex-1 justify-center"
            >
              <LucideIcon name="Trash" size="4" class="mr-2 h-4 w-4" />
              Delete Group
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              @click="handleLeave"
              class="flex-1 justify-center"
            >
              <LucideIcon name="LogOut" size="4" class="mr-2 h-4 w-4" />
              Leave Group
            </Button>
          </div>
        </div>
      </div>
      
      <DialogFooter class="px-6 pb-6">
        <Button variant="outline" @click="$emit('close')">Cancel</Button>
        <Button type="button" @click="handleSubmit">Save All Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import LucideIcon from '@/components/LucideIcon.vue'
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Users, Camera } from 'lucide-vue-next'
import { EditIcon } from 'lucide-vue-next'
import axios from '~/src/utils/axios'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'submit', 'delete', 'leave'])
const fileInput = ref(null)
const previewImage = ref(null)
const selectedFile = ref(null)
const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080'

// Editing states
const editingName = ref(false)
const editingDescription = ref(false)
const editingPrivacy = ref(false)

const formData = ref({
  name: '',
  description: '',
  isPublic: true
})

// Check if a URL is a full URL or a relative path
const isFullUrl = (url) => {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
}

// Initialize form data
onMounted(() => {
  formData.value = {
    name: props.group.name || '',
    description: props.group.description || '',
    isPublic: !props.group.isPrivate // Convert from backend's isPrivate to frontend's isPublic
  }
  
  // Add event listener for group data updates
  window.addEventListener('group-data-updated', refreshFormData)
})

// Clean up event listeners when component is unmounted
onBeforeUnmount(() => {
  window.removeEventListener('group-data-updated', refreshFormData)
})

// Refresh form data when group data is updated
const refreshFormData = () => {
  formData.value = {
    name: props.group.name || '',
    description: props.group.description || '',
    isPublic: !props.group.isPrivate
  }
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  selectedFile.value = file
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const uploadGroupPicture = async () => {
  if (!selectedFile.value) return null
  
  try {
    const formData = new FormData()
    formData.append('picture', selectedFile.value)
    
    const response = await axios.post(`/groups/${props.group.id}/picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data.picture
  } catch (error) {
    console.error('Failed to upload group picture:', error)
    alert('Failed to upload group picture: ' + (error.response?.data?.error || 'Unknown error'))
    return null
  }
}

// Save individual fields
const saveName = async () => {
  try {
    const dataToSubmit = {
      name: formData.value.name
    }
    
    await updateGroupField(dataToSubmit)
    editingName.value = false
  } catch (error) {
    console.error('Failed to update group name:', error)
    alert('Failed to update group name: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const cancelNameEdit = () => {
  // Reset to original value
  formData.value.name = props.group.name || ''
  editingName.value = false
}

const saveDescription = async () => {
  try {
    const dataToSubmit = {
      description: formData.value.description
    }
    
    await updateGroupField(dataToSubmit)
    editingDescription.value = false
  } catch (error) {
    console.error('Failed to update group description:', error)
    alert('Failed to update group description: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const cancelDescriptionEdit = () => {
  // Reset to original value
  formData.value.description = props.group.description || ''
  editingDescription.value = false
}

const savePrivacy = async () => {
  try {
    const dataToSubmit = {
      isPrivate: !formData.value.isPublic
    }
    
    await updateGroupField(dataToSubmit)
    editingPrivacy.value = false
  } catch (error) {
    console.error('Failed to update group privacy:', error)
    alert('Failed to update group privacy: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const cancelPrivacyEdit = () => {
  // Reset to original value
  formData.value.isPublic = !props.group.isPrivate
  editingPrivacy.value = false
}

// Helper function to update a single field
const updateGroupField = async (fieldData) => {
  try {
    console.log('Updating group field:', fieldData)
    console.log('Group ID:', props.group.id)
    
    // Make direct API call instead of using emit
    const response = await axios.put(`/groups/${props.group.id}`, fieldData)
    
    // Update local data
    Object.assign(props.group, response.data)
    
    // Refresh form data to ensure all fields are up to date
    refreshFormData()
    
    // Dispatch global event for other components
    window.dispatchEvent(new CustomEvent('group-data-updated'))
    
    return response.data
  } catch (error) {
    console.error('Error updating group field:', error)
    throw error
  }
}

const handleSubmit = async () => {
  try {
    // First upload the picture if a new one was selected
    let picturePath = null
    if (selectedFile.value) {
      picturePath = await uploadGroupPicture()
    }
    
    // Prepare the data to submit
    const dataToSubmit = { ...formData.value }
    
    // Convert isPublic to isPrivate for the backend
    dataToSubmit.isPrivate = !dataToSubmit.isPublic
    delete dataToSubmit.isPublic
    
    // Add the picture path if a new one was uploaded
    if (picturePath) {
      dataToSubmit.picture = picturePath
    }
    
    console.log('Submitting group update:', dataToSubmit)
    console.log('Group ID:', props.group.id)
    
    // Make direct API call instead of using emit
    try {
      const response = await axios.put(`/groups/${props.group.id}`, dataToSubmit)
      
      // Update local data
      Object.assign(props.group, response.data)
      
      // Refresh form data to ensure all fields are up to date
      refreshFormData()
      
      // Dispatch global event for other components
      window.dispatchEvent(new CustomEvent('group-data-updated'))
      
      // Close dialog
      emit('close')
    } catch (error) {
      console.error('Failed to update group via direct API call:', error)
      
      // Fall back to emit if direct call fails
      emit('submit', dataToSubmit)
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    alert('Failed to save group settings: ' + (error.response?.data?.error || 'Unknown error'))
  }
}

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
    emit('delete')
  }
}

const handleLeave = () => {
  if (confirm('Are you sure you want to leave this group?')) {
    emit('leave')
  }
}
</script>